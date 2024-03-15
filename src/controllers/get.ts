import { ISellerGig } from '@dtlee2k1/jobber-shared';
import { getGigById, getSellerGigs, getSellerPausedGigs } from '@gig/services/gig.service';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function gigById(req: Request, res: Response, _next: NextFunction) {
  const gig: ISellerGig = await getGigById(req.params.gigId);
  res.status(StatusCodes.OK).json({
    message: 'Get gig by id',
    gig
  });
}

export async function sellerGigs(req: Request, res: Response, _next: NextFunction) {
  const gigs: ISellerGig[] = await getSellerGigs(req.params.sellerId);
  res.status(StatusCodes.OK).json({
    message: 'Seller gigs',
    gigs
  });
}

export async function sellerInactiveGigs(req: Request, res: Response, _next: NextFunction) {
  const gigs: ISellerGig[] = await getSellerPausedGigs(req.params.sellerId);
  res.status(StatusCodes.OK).json({
    message: 'Seller gigs',
    gigs
  });
}
