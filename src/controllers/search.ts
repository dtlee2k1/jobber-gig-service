import { NextFunction, Request, Response } from 'express';
import { IPaginateProps, ISearchResult, ISellerGig } from '@dtlee2k1/jobber-shared';
import { gigsSearch } from '@gig/services/search.service';
import { sortBy } from 'lodash';
import { StatusCodes } from 'http-status-codes';

export async function searchGigs(req: Request, res: Response, _next: NextFunction) {
  const { from, size, type } = req.params;

  let resultHits: ISellerGig[] = [];
  const paginate: IPaginateProps = { from, size: parseInt(size), type };

  const gigs: ISearchResult = await gigsSearch(
    `${req.query.query}`,
    paginate,
    `${req.query.delivery_time}`,
    parseInt(`${req.query.minprice}`),
    parseInt(`${req.query.maxprice}`)
  );

  for (const gig of gigs.hits) {
    resultHits.push(gig._source as ISellerGig);
  }

  if (type === 'backward') {
    resultHits = sortBy(resultHits, ['sortId']);
  }

  res.status(StatusCodes.OK).json({
    message: 'Search gigs results',
    total: gigs.total,
    gigs: resultHits
  });
}
