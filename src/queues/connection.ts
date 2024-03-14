import envConfig from '@gig/config';
import { winstonLogger } from '@dtlee2k1/jobber-shared';
import amqplib, { Channel, Connection } from 'amqplib';

const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'gigQueueConnection', 'debug');

export async function createConnection() {
  try {
    const connection: Connection = await amqplib.connect(`${envConfig.RABBITMQ_ENDPOINT}`);
    const channel: Channel = await connection.createChannel();

    logger.info('Gig server connected to queue successfully');
    closeConnection(channel, connection);
    return channel;
  } catch (error) {
    logger.log({ level: 'error', message: `GigService createConnection() method error: ${error}` });
    return undefined;
  }
}

function closeConnection(channel: Channel, connection: Connection) {
  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });
}
