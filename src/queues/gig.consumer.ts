import { winstonLogger } from '@dtlee2k1/jobber-shared';
import envConfig from '@gig/config';
import { createConnection } from '@gig/queues/connection';
import { updateGigReview } from '@gig/services/gig.service';
import { Channel, ConsumeMessage } from 'amqplib';

const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'gigServiceConsumer', 'debug');

export async function consumeGigDirectMessage(channel: Channel) {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'jobber-update-gig';
    const routingKey = 'update-gig';
    const queueName = 'gig-update-queue';

    await channel.assertExchange(exchangeName, 'direct');
    const jobberQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);

    channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
      const { gigReview } = JSON.parse(msg!.content.toString());
      await updateGigReview(JSON.parse(gigReview));

      channel.ack(msg!);
    });
  } catch (error) {
    logger.log({ level: 'error', message: `UsersService UserConsumer consumeGigDirectMessage() method error: ${error}` });
  }
}

export async function consumeSeedDirectMessages(channel: Channel) {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'jobber-seed-gig';
    const routingKey = 'receive-sellers';
    const queueName = 'seed-gig-queue';

    await channel.assertExchange(exchangeName, 'direct');
    const jobberQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);

    channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
      // Use seed data function
      channel.ack(msg!);
    });
  } catch (error) {
    logger.log({ level: 'error', message: `UsersService UserConsumer consumeGigDirectMessage() method error: ${error}` });
  }
}
