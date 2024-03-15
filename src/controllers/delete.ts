import { deleteGig } from '@gig/services/gig.service';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function gig(req: Request, res: Response, _next: NextFunction) {
  await deleteGig(req.params.gigId, req.params.sellerId);
  res.status(StatusCodes.OK).json({ message: 'Gig deleted successfully' });
}
