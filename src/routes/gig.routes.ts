import { gig as createGig } from '@gig/controllers/create';
import { gig as deleteGig } from '@gig/controllers/delete';
import { gigById, sellerGigs, sellerInactiveGigs } from '@gig/controllers/get';
import { gigUpdateActive, gig as updateGig } from '@gig/controllers/update';
import { Router } from 'express';

const gigRouter = Router();

gigRouter.get('/:gigId', gigById);

gigRouter.get('/seller/:sellerId', sellerGigs);

gigRouter.get('/seller/pause/:sellerId', sellerInactiveGigs);

gigRouter.post('/create', createGig);

gigRouter.put('/:gigId', updateGig);

gigRouter.put('/active/:gigId', gigUpdateActive);

gigRouter.delete('/:gigId/:sellerId', deleteGig);

export default gigRouter;
