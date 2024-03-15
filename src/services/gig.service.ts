import { IRatingTypes, IReviewMessageDetails, ISearchResult, ISellerGig } from '@dtlee2k1/jobber-shared';
import { addDataToIndex, deleteIndexedData, getIndexedData, updateIndexedData } from '@gig/elasticsearch';
import { GigModel } from '@gig/models/gig.schema';
import { publishDirectMessage } from '@gig/queues/gig.producer';
import { gigChannel } from '@gig/server';
import { gigsSearchBySellerId } from '@gig/services/search.service';

export async function getGigById(gigId: string) {
  const gig: ISellerGig = await getIndexedData('gigs', gigId);
  return gig;
}

export async function getSellerGigs(sellerId: string) {
  const resultHits: ISellerGig[] = [];

  const gigs: ISearchResult = await gigsSearchBySellerId(sellerId, true);

  for (const gig of gigs.hits) {
    resultHits.push(gig._source as ISellerGig);
  }

  return resultHits;
}

export async function getSellerPausedGigs(sellerId: string) {
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await gigsSearchBySellerId(sellerId, false);

  for (const gig of gigs.hits) {
    resultHits.push(gig._source as ISellerGig);
  }

  return resultHits;
}

export async function createGig(gig: ISellerGig) {
  // Create a new gig document and store in mongoDB
  const createdGig: ISellerGig = await GigModel.create(gig);
  if (createdGig) {
    const data: ISellerGig = createdGig.toJSON?.() as ISellerGig;
    await publishDirectMessage(
      gigChannel,
      'jobber-seller-update',
      'user-seller',
      JSON.stringify({ type: 'update-gig-count', gigSellerId: data.sellerId, count: 1 }),
      'Gig details sent to users service'
    );
    // Also create a new gig document and store in ElasticSearch
    await addDataToIndex('gigs', `${createdGig._id}`, data);
  }
  return createdGig;
}

export async function updateGig(gigId: string, gigData: ISellerGig) {
  // Update gig document from MongoDB
  const updatedGig: ISellerGig = (await GigModel.findOneAndUpdate(
    { _id: gigId },
    {
      $set: {
        title: gigData.title,
        description: gigData.description,
        categories: gigData.categories,
        subCategories: gigData.subCategories,
        tags: gigData.tags,
        price: gigData.price,
        coverImage: gigData.coverImage,
        expectedDelivery: gigData.expectedDelivery,
        basicTitle: gigData.basicTitle,
        basicDescription: gigData.basicDescription
      }
    },
    { new: true }
  ).exec()) as ISellerGig;

  if (updatedGig) {
    const data: ISellerGig = updatedGig.toJSON?.() as ISellerGig;
    // Update gig document from Elasticsearch
    await updateIndexedData('gigs', gigId, data);
  }
  return updatedGig;
}

export async function updateActiveGigProp(gigId: string, activeGig: boolean) {
  const updatedGig: ISellerGig = (await GigModel.findOneAndUpdate(
    { _id: gigId },
    { $set: { active: activeGig } },
    { new: true }
  ).exec()) as ISellerGig;

  if (updatedGig) {
    const data: ISellerGig = updatedGig.toJSON?.() as ISellerGig;
    await updateIndexedData('gigs', gigId, data);
  }
  return updatedGig;
}

export async function deleteGig(gigId: string, sellerId: string) {
  await GigModel.deleteOne({ _id: gigId }).exec();

  await publishDirectMessage(
    gigChannel,
    'jobber-seller-update',
    'user-seller',
    JSON.stringify({ type: 'update-gig-count', gigSellerId: sellerId, count: -1 }),
    'Gig details sent to users service'
  );
  await deleteIndexedData('gigs', gigId);
}

export async function updateGigReview(data: IReviewMessageDetails) {
  const ratingTypes: IRatingTypes = {
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five'
  };
  const ratingKey = ratingTypes[`${data.rating}`];

  const updatedGig = await GigModel.findOneAndUpdate(
    { _id: data.gigId },
    {
      $inc: {
        ratingsCount: 1,
        ratingSum: data.rating,
        [`ratingCategories.[${ratingKey}].value`]: data.rating,
        [`ratingCategories.[${ratingKey}].count`]: 1
      }
    },
    { new: true, upsert: true }
  ).exec();

  if (updatedGig) {
    const data: IReviewMessageDetails = updatedGig.toJSON?.() as IReviewMessageDetails;
    await updateIndexedData('gigs', `${updatedGig._id}`, data);
  }
}
