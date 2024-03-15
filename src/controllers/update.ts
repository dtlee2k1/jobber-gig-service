import { ISellerGig, isDataURL, uploadImages } from '@dtlee2k1/jobber-shared';
import { BadRequestError } from '@gig/error-handler';
import { gigUpdateSchema } from '@gig/schemes/gig';
import { updateActiveGigProp, updateGig } from '@gig/services/gig.service';
import { UploadApiResponse } from 'cloudinary';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function gig(req: Request, res: Response, _next: NextFunction) {
  const { error } = await Promise.resolve(gigUpdateSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Update gig() method error');
  }

  const isDataUrl = isDataURL(req.body.coverImage);
  let coverImage = '';
  if (isDataUrl) {
    const uploadResult: UploadApiResponse = (await uploadImages(req.body.coverImage)) as UploadApiResponse;
    if (!uploadResult.public_id) {
      throw new BadRequestError('File upload error. Try again', 'Update gig() method error');
    }
    coverImage = uploadResult?.secure_url;
  } else {
    coverImage = req.body.coverImage;
  }

  const gig: ISellerGig = {
    title: req.body.title,
    description: req.body.description,
    categories: req.body.categories,
    subCategories: req.body.subCategories,
    tags: req.body.tags,
    price: req.body.price,
    expectedDelivery: req.body.expectedDelivery,
    basicTitle: req.body.basicTitle,
    basicDescription: req.body.basicDescription,
    coverImage
  };

  const updatedGig: ISellerGig = await updateGig(req.params.gigId, gig);

  res.status(StatusCodes.OK).json({
    message: 'Gig updated successfully',
    gig: updatedGig
  });
}

export async function gigUpdateActive(req: Request, res: Response, _next: NextFunction) {
  const updatedGig: ISellerGig = await updateActiveGigProp(req.params.gigId, req.body.active);
  res.status(StatusCodes.OK).json({ message: 'Gig updated successfully', gig: updatedGig });
}
