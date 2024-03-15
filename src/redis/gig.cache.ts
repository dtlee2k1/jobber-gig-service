import { winstonLogger } from '@dtlee2k1/jobber-shared';
import envConfig from '@gig/config';
import { client } from '@gig/redis/redis.connection';

const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'gigCache', 'debug');

export async function getUserSelectedGigCategory(key: string) {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
    const response: string = (await client.GET(key)) as string;
    return response;
  } catch (error) {
    logger.log('error', 'GigService GigCache getUserSelectedGigCategory() method error:', error);
    return '';
  }
}
