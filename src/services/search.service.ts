import { elasticSearchClient } from '@gig/elasticsearch';
import { IHitsTotal, IQueryList } from '@dtlee2k1/jobber-shared';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

export async function gigsSearchBySellerId(sellerId: string, active: boolean) {
  const queryList: IQueryList[] = [
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
  ];

  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    query: {
      bool: {
        must: [...queryList]
      }
    }
  });
  const total: IHitsTotal = result.hits.total as IHitsTotal;

  return {
    total: total.value,
    hits: result.hits.hits
  };
}
