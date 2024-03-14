import http from 'http';

import 'express-async-errors';

import { Application, NextFunction, Request, Response, json, urlencoded } from 'express';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import { verify } from 'jsonwebtoken';
import compression from 'compression';
import { Channel } from 'amqplib';
import { IAuthPayload, verifyGatewayRequest, winstonLogger } from '@dtlee2k1/jobber-shared';
import envConfig from '@gig/config';
import { CustomError, IErrorResponse } from '@gig/error-handler';
import { checkConnection, createIndex } from '@gig/elasticsearch';
import { createConnection } from '@gig/queues/connection';
import healthRouter from '@gig/routes/health.routes';
import gigRouter from '@gig/routes/gig.routes';

const SERVER_PORT = 4004;
const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'GigService', 'debug');

export let gigChannel: Channel;

export function start(app: Application) {
  securityMiddleware(app);
  standardMiddleware(app);
  routesMiddleware(app);
  startQueues();
  startElasticSearch();
  errorHandler(app);
  startServer(app);
}

function securityMiddleware(app: Application) {
  app.set('trust proxy', 1);
  app.use(hpp());
  app.use(helmet());
  app.use(
    cors({
      origin: envConfig.API_GATEWAY_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })
  );

  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const payload: IAuthPayload = verify(token, envConfig.JWT_TOKEN!) as IAuthPayload;
      req.currentUser = payload;
    }
    next();
  });
}

function standardMiddleware(app: Application) {
  app.use(compression());
  app.use(urlencoded({ extended: true }));
  app.use(json());
}

function routesMiddleware(app: Application) {
  const BASE_PATH = '/api/v1/gig';
  app.use(healthRouter);
  app.use(BASE_PATH, verifyGatewayRequest, gigRouter);
}

async function startQueues() {
  gigChannel = (await createConnection()) as Channel;
}

async function startElasticSearch() {
  await checkConnection();
  await createIndex('gigs');
}

function errorHandler(app: Application) {
  app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
    logger.log({ level: 'error', message: `GigService ${error.comingFrom}: ${error}` });

    if (error instanceof CustomError) {
      res.status(error.statusCode).json(error.serializeErrors());
    }
    next();
  });
}

function startServer(app: Application) {
  try {
    const httpServer = new http.Server(app);
    startHttpServer(httpServer);
  } catch (error) {
    logger.log('error', 'GigService startServer() error method:', error);
  }
}

async function startHttpServer(httpServer: http.Server) {
  try {
    logger.info(`Gig server has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      logger.info(`Gig server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    logger.log('error', 'GigService startServer() error method:', error);
  }
}
