import { checkHealth } from '@gig/controllers/health';
import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/gig-health', checkHealth);

export default healthRouter;
