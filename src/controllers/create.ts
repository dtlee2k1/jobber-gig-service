import { ISellerGig, uploadImages } from '@dtlee2k1/jobber-shared';
import { getDocumentCount } from '@gig/elasticsearch';
import { BadRequestError } from '@gig/error-handler';
import { gigCreateSchema } from '@gig/schemes/gig';
import { createGig } from '@gig/services/gig.service';
import { UploadApiResponse } from 'cloudinary';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function gig(req: Request, res: Response, _next: NextFunction) {
  const { error } = await Promise.resolve(gigCreateSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Create gig() method error');
  }

  const uploadResult: UploadApiResponse = (await uploadImages(req.body.coverImage)) as UploadApiResponse;
  if (!uploadResult.public_id) {
    throw new BadRequestError('File upload error. Try again', 'Create gig() method error');
  }

  const count: number = await getDocumentCount('gigs');
  const gig: ISellerGig = {
    sellerId: req.body.sellerId,
    username: req.currentUser!.username,
    email: req.currentUser!.email,
    profilePicture: req.body.profilePicture,
    title: req.body.title,
    description: req.body.description,
    categories: req.body.categories,
    subCategories: req.body.subCategories,
    tags: req.body.tags,
    price: req.body.price,
    expectedDelivery: req.body.expectedDelivery,
    basicTitle: req.body.basicTitle,
    basicDescription: req.body.basicDescription,
    coverImage: `${uploadResult?.secure_url}`,
    sortId: count + 1
  };

  const createdGig: ISellerGig = await createGig(gig);

  res.status(StatusCodes.CREATED).json({
    message: 'Gig created successfully',
    gig: createdGig
  });
}
