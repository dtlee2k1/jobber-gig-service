import { IRatingTypes, IReviewMessageDetails, ISellerDocument, ISellerGig } from '@dtlee2k1/jobber-shared';
import { faker } from '@faker-js/faker';
import { addDataToIndex, deleteIndexedData, getIndexedData, updateIndexedData } from '@gig/elasticsearch';
import { GigModel } from '@gig/models/gig.schema';
import { publishDirectMessage } from '@gig/queues/gig.producer';
import { gigChannel } from '@gig/server';
import { sample } from 'lodash';

export async function getGigById(gigId: string) {
  const gig: ISellerGig = await getIndexedData('gigs', gigId);
  return gig;
}

export async function getSellerGigs(sellerId: string) {
  const gigs: ISellerGig[] = await GigModel.find({ sellerId, active: true }).exec();
  return gigs;
}

export async function getSellerPausedGigs(sellerId: string) {
  const gigs: ISellerGig[] = await GigModel.find({ sellerId, active: false }).exec();
  return gigs;
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
  await deleteIndexedData('gigs', gigId);

  await publishDirectMessage(
    gigChannel,
    'jobber-seller-update',
    'user-seller',
    JSON.stringify({ type: 'update-gig-count', gigSellerId: sellerId, count: -1 }),
    'Gig details sent to users service'
  );
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
        [`ratingCategories.${ratingKey}.value`]: data.rating,
        [`ratingCategories.${ratingKey}.count`]: 1
      }
    },
    { new: true, upsert: true }
  ).exec();

  if (updatedGig) {
    const data: IReviewMessageDetails = updatedGig.toJSON?.() as IReviewMessageDetails;
    await updateIndexedData('gigs', `${updatedGig._id}`, data);
  }
}

export async function seedData(sellers: ISellerDocument[], count: string) {
  const categories: string[] = [
    'Graphics & Design',
    'Digital Marketing',
    'Writing & Translation',
    'Video & Animation',
    'Music & Audio',
    'Programming & Tech',
    'Data',
    'Business'
  ];
  const expectedDelivery: string[] = ['1 Day Delivery', '2 Days Delivery', '3 Days Delivery', '4 Days Delivery', '5 Days Delivery'];
  const randomRatings = [
    { sum: 20, count: 4 },
    { sum: 10, count: 2 },
    { sum: 20, count: 4 },
    { sum: 15, count: 3 },
    { sum: 5, count: 1 }
  ];

  for (let i = 0; i < sellers.length; i++) {
    const sellerDoc: ISellerDocument = sellers[i];
    const title = `I will ${faker.word.words(5)}`;
    const basicTitle = faker.commerce.productName();
    const basicDescription = faker.commerce.productDescription();
    const rating = sample(randomRatings);

    const gig: ISellerGig = {
      profilePicture: sellerDoc.profilePicture,
      sellerId: sellerDoc._id,
      email: sellerDoc.email,
      username: sellerDoc.username,
      title: title.length <= 80 ? title : title.slice(0, 80),
      basicTitle: basicTitle.length <= 40 ? basicTitle : basicTitle.slice(0, 40),
      basicDescription: basicDescription.length <= 100 ? basicDescription : basicDescription.slice(0, 100),
      categories: `${sample(categories)}`,
      subCategories: [faker.commerce.department(), faker.commerce.department(), faker.commerce.department()],
      description: faker.lorem.sentences({ min: 2, max: 4 }),
      tags: [faker.commerce.product(), faker.commerce.product(), faker.commerce.product(), faker.commerce.product()],
      price: parseInt(faker.commerce.price({ min: 20, max: 30, dec: 0 })),
      coverImage: faker.image.urlPicsumPhotos(),
      expectedDelivery: `${sample(expectedDelivery)}`,
      sortId: parseInt(count, 10) + i + 1,
      ratingsCount: (i + 1) % 4 === 0 ? rating!['count'] : 0,
      ratingSum: (i + 1) % 4 === 0 ? rating!['sum'] : 0
    };

    console.log(`***SEEDING GIG*** - ${i + 1} of ${count}`);
    await createGig(gig);
  }
}
