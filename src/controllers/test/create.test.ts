/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import * as gigService from '@gig/services/gig.service';
import { sellerGig, authUserPayload, gigMockRequest, gigMockResponse } from '@gig/controllers/test/mocks/gig.mock';
import * as helper from '@dtlee2k1/jobber-shared';
import { gig as createGig } from '@gig/controllers/create';
import { gigCreateSchema } from '@gig/schemes/gig';
import { BadRequestError } from '@gig/error-handler';

jest.mock('@gig/services/gig.service');
jest.mock('@gig/elasticsearch');
jest.mock('@gig/schemes/gig');
jest.mock('@dtlee2k1/jobber-shared');
jest.mock('@gig/error-handler');

describe('Gig Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create gig method', () => {
    it('should throw an error for invalid schema data', async () => {
      const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
      const res: Response = gigMockResponse();
      const next = jest.fn();

      jest.spyOn(gigCreateSchema, 'validate').mockImplementation((): any =>
        Promise.resolve({
          error: {
            name: 'ValidationError',
            isJoi: true,
            details: [{ message: 'This is an error message' }]
          }
        })
      );

      createGig(req, res, next).catch(() => {
        expect(BadRequestError).toHaveBeenCalledWith('This is an error message', 'Create gig() method error');
      });
    });

    it('should throw file upload error', () => {
      const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
      const res: Response = gigMockResponse();
      const next = jest.fn();

      jest.spyOn(gigCreateSchema, 'validate').mockImplementation((): any => Promise.resolve({ error: {} }));
      jest.spyOn(helper, 'uploadImages').mockImplementation((): any => Promise.resolve({ public_id: '' }));

      createGig(req, res, next).catch(() => {
        expect(BadRequestError).toHaveBeenCalledWith('File upload error. Try again', 'Create gig() method error');
      });
    });

    it('should create a new gig and return the correct response', async () => {
      const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
      const res: Response = gigMockResponse();
      const next = jest.fn();

      jest.spyOn(gigCreateSchema, 'validate').mockImplementation((): any => Promise.resolve({ error: {} }));
      jest.spyOn(helper, 'uploadImages').mockImplementation((): any => Promise.resolve({ public_id: '123456' }));
      jest.spyOn(gigService, 'createGig').mockResolvedValue(sellerGig);

      await createGig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Gig created successfully',
        gig: sellerGig
      });
    });
  });
});
