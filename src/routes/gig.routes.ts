import { gig as createGig } from '@gig/controllers/create';
import { gig as deleteGig } from '@gig/controllers/delete';
import { gigById, gigsByCategory, moreGigsLikeThis, sellerGigs, sellerInactiveGigs, topRatedGigsByCategory } from '@gig/controllers/get';
import { searchGigs } from '@gig/controllers/search';
import { gigUpdateActive, gig as updateGig } from '@gig/controllers/update';
import { Router } from 'express';

const gigRouter = Router();

gigRouter.get('/:gigId', gigById);

gigRouter.get('/seller/:sellerId', sellerGigs);

gigRouter.get('/seller/pause/:sellerId', sellerInactiveGigs);

gigRouter.get('/search/:from/:size/:type', searchGigs);

gigRouter.get('/top/:username', topRatedGigsByCategory);

gigRouter.get('/category/:username', gigsByCategory);

gigRouter.get('/similar/:gigId', moreGigsLikeThis);

gigRouter.post('/create', createGig);

gigRouter.put('/:gigId', updateGig);

gigRouter.put('/active/:gigId', gigUpdateActive);

gigRouter.delete('/:gigId/:sellerId', deleteGig);

export default gigRouter;
