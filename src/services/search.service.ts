/* eslint-disable quotes */
import { elasticSearchClient } from '@gig/elasticsearch';
import { IHitsTotal, IPaginateProps, IQueryList } from '@dtlee2k1/jobber-shared';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

export async function gigsSearchBySellerId(sellerId: string, active: boolean) {
  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    query: {
      bool: {
        must: [
          {
            query_string: {
              fields: ['sellerId'],
              query: sellerId
            }
          },
          {
            term: {
              active
            }
          }
        ]
      }
    }
  });
  const total: IHitsTotal = result.hits.total as IHitsTotal;

  return {
    total: total.value,
    hits: result.hits.hits
  };
}

export async function gigsSearch(searchQuery: string, paginate: IPaginateProps, deliveryTime?: string, min?: number, max?: number) {
  const { from, size, type } = paginate;

  const queryList: IQueryList[] = [
    {
      query_string: {
        fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories'],
        query: `*${searchQuery}*`
      }
    },
    {
      term: {
        active: true
      }
    }
  ];

  // Filter by Delivery time
  if (deliveryTime !== 'undefined') {
    queryList.push({
      query_string: {
        fields: ['expectedDelivery'],
        query: `*${deliveryTime}*`
      }
    });
  }

  // Filter by range of prices
  if (!isNaN(parseInt(`${min}`)) && !isNaN(parseInt(`${max}`))) {
    queryList.push({
      range: {
        price: {
          gte: min,
          lte: max
        }
      }
    });
  }

  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size,
    query: {
      bool: {
        must: [...queryList]
      }
    },
    sort: [
      {
        sortId: type === 'forward' ? 'asc' : 'desc'
      }
    ],
    ...(from !== '0' && { search_after: [from] })
  });
  const total: IHitsTotal = result.hits.total as IHitsTotal;

  return {
    total: total.value,
    hits: result.hits.hits
  };
}

export async function gigsSearchByCategories(searchQuery: string) {
  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size: 10,
    query: {
      bool: {
        must: [
          {
            query_string: {
              fields: ['categories'],
              query: `*${searchQuery}*`
            }
          },
          {
            term: {
              active: true
            }
          }
        ]
      }
    }
  });
  const total: IHitsTotal = result.hits.total as IHitsTotal;

  return {
    total: total.value,
    hits: result.hits.hits
  };
}

export async function getMoreSearchLikeThis(gigId: string) {
  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size: 5,
    query: {
      more_like_this: {
        fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories'],
        like: [
          {
            _index: 'gigs',
            _id: gigId
          }
        ]
      }
    }
  });
  const total: IHitsTotal = result.hits.total as IHitsTotal;

  return {
    total: total.value,
    hits: result.hits.hits
  };
}

export async function getTopRatedGigsByCategory(searchQuery: string) {
  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size: 10,
    query: {
      bool: {
        filter: {
          script: {
            script: {
              source: "doc['ratingSum'].value != 0 && (doc['ratingSum'].value / doc['ratingsCount'].value === params['threshold'])",
              lang: 'painless',
              params: {
                threshold: 5
              }
            }
          }
        },
        must: [
          {
            query_string: {
              fields: ['categories'],
              query: `*${searchQuery}*`
            }
          }
        ]
      }
    }
  });
  const total: IHitsTotal = result.hits.total as IHitsTotal;

  return {
    total: total.value,
    hits: result.hits.hits
  };
}
