import { winstonLogger } from '@dtlee2k1/jobber-shared';
import envConfig from '@gig/config';
import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;
const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'gigRedisConnection', 'debug');
const client: RedisClient = createClient({ url: `${envConfig.REDIS_HOST}` });

async function redisConnect() {
  try {
    await client.connect();
    logger.info(`GigService Redis Connection: ${await client.ping()}`);
    cacheError();
  } catch (error) {
    logger.log('error', 'GigService redisConnect() method error:', error);
  }
}

function cacheError() {
  client.on('error', (error: unknown) => {
    logger.error(error);
  });
}

export { redisConnect, client };
