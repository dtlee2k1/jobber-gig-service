import { winstonLogger } from '@dtlee2k1/jobber-shared';
import envConfig from '@gig/config';
import mongoose from 'mongoose';

const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'gigDatabaseServer', 'debug');

export async function databaseConnection() {
  try {
    await mongoose.connect(`${envConfig.DATABASE_URL}`);
    logger.info('GigService MongoDB database connection has been established successfully.');
  } catch (error) {
    logger.error('GigService - Unable to connect to database.');
    logger.log({ level: 'error', message: `GigService databaseConnection() method error: ${error}` });
  }
}
