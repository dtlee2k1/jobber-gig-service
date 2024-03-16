import { ISearchResult, ISellerGig } from '@dtlee2k1/jobber-shared';
import { getUserSelectedGigCategory } from '@gig/redis/gig.cache';
import { getGigById, getSellerGigs, getSellerPausedGigs } from '@gig/services/gig.service';
import { getMoreGigsLikeThis, getTopRatedGigsByCategory, gigsSearchByCategories } from '@gig/services/search.service';
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

export async function topRatedGigsByCategory(req: Request, res: Response, _next: NextFunction) {
  const category = await getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await getTopRatedGigsByCategory(category);

  for (const gig of gigs.hits) {
    resultHits.push(gig._source as ISellerGig);
  }

  res.status(StatusCodes.OK).json({
    message: 'Search top gigs results',
    gigs: resultHits
  });
}

export async function gigsByCategory(req: Request, res: Response, _next: NextFunction) {
  const category = await getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await gigsSearchByCategories(category);

  for (const gig of gigs.hits) {
    resultHits.push(gig._source as ISellerGig);
  }

  res.status(StatusCodes.OK).json({
    message: 'Search gigs category results',
    gigs: resultHits
  });
}

export async function moreGigsLikeThis(req: Request, res: Response, _next: NextFunction) {
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await getMoreGigsLikeThis(req.params.gigId);

  for (const gig of gigs.hits) {
    resultHits.push(gig._source as ISellerGig);
  }

  res.status(StatusCodes.OK).json({
    message: 'Similar gigs results',
    gigs: resultHits
  });
}
