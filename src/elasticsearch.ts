import { ISellerGig, winstonLogger } from '@dtlee2k1/jobber-shared';
import { Client } from '@elastic/elasticsearch';
import { GetResponse } from '@elastic/elasticsearch/lib/api/types';
import envConfig from '@gig/config';

const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'gigElasticSearchServer', 'debug');

const elasticSearchClient = new Client({
  node: `${envConfig.ELASTIC_SEARCH_URL}`
});

async function checkConnection() {
  let isConnected = false;
  while (!isConnected) {
    logger.info('GigService connecting to ElasticSearch...');
    try {
      const health = await elasticSearchClient.cluster.health({});
      logger.info(`GigService Elasticsearch health status - ${health.status}`);
      isConnected = true;
    } catch (error) {
      logger.error('Connection to ElasticSearch failed. Retrying ...');
      logger.log({ level: 'error', message: `GigService checkConnection() method error: ${error}` });
    }
  }
}

async function checkIfIndexExist(indexName: string) {
  const result = await elasticSearchClient.indices.exists({ index: indexName });
  return result;
}

async function createIndex(indexName: string) {
  try {
    const result = await checkIfIndexExist(indexName);
    if (result) {
      logger.info(`Index '${indexName}' already exist`);
    } else {
      await elasticSearchClient.indices.create({ index: indexName });
      await elasticSearchClient.indices.refresh({ index: indexName });
      logger.info(`Created index ${indexName}`);
    }
  } catch (error) {
    logger.error(`An error occurred while creating the index ${indexName}`);
    logger.log({ level: 'error', message: `GigService createIndex() method error: ${error}` });
  }
}

async function getIndexedData(indexName: string, gigId: string) {
  try {
    const result: GetResponse = await elasticSearchClient.get({ index: indexName, id: gigId });
    return result._source as ISellerGig;
  } catch (error) {
    logger.log({ level: 'error', message: `GigService elasticsearch getIndexedData() method error: ${error}` });
    return {} as ISellerGig;
  }
}

async function addDataToIndex(indexName: string, gigId: string, gigDocument: unknown) {
  try {
    await elasticSearchClient.index({
      index: indexName,
      id: gigId,
      document: gigDocument
    });
  } catch (error) {
    logger.log({ level: 'error', message: `GigService elasticsearch addDataToIndex() method error: ${error}` });
  }
}

async function updateIndexedData(indexName: string, gigId: string, gigDocument: unknown) {
  try {
    await elasticSearchClient.update({
      index: indexName,
      id: gigId,
      doc: gigDocument
    });
  } catch (error) {
    logger.log({ level: 'error', message: `GigService elasticsearch updateIndexedData() method error: ${error}` });
  }
}

async function deleteIndexedData(indexName: string, gigId: string, gigDocument: unknown) {
  try {
    await elasticSearchClient.delete({
      index: indexName,
      id: gigId
    });
  } catch (error) {
    logger.log({ level: 'error', message: `GigService elasticsearch deleteIndexedData() method error: ${error}` });
  }
}

export { elasticSearchClient, checkConnection, createIndex, getIndexedData, addDataToIndex, updateIndexedData, deleteIndexedData };
