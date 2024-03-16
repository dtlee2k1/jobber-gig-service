import { publishDirectMessage } from '@gig/queues/gig.producer';
import { gigChannel } from '@gig/server';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function seedGig(req: Request, res: Response, _next: NextFunction) {
  const { count } = req.params;
  await publishDirectMessage(
    gigChannel,
    'jobber-gig',
    'get-sellers',
    JSON.stringify({ type: 'getSellers', count }),
    'Gig seed message sent to users service'
  );

  res.status(StatusCodes.CREATED).json({
    message: 'Gig created successfully'
  });
}
