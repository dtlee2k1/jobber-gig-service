import express from 'express';
import { start } from '@gig/server';
import envConfig from '@gig/config';
import { databaseConnection } from '@gig/database';

function init() {
  envConfig.cloudinaryConfig();
  const app = express();
  databaseConnection();
  start(app);
}

init();
