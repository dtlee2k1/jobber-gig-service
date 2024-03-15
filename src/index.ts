import express from 'express';
import { start } from '@gig/server';
import envConfig from '@gig/config';
import { databaseConnection } from '@gig/database';
import { redisConnect } from '@gig/redis/redis.connection';

function init() {
  envConfig.cloudinaryConfig();
  const app = express();
  databaseConnection();
  start(app);
  redisConnect();
}

init();
