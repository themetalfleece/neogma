import type { WhereParamsI } from '../../Queries/Where';
import type { GenericConfiguration } from '../shared.types';

// Re-export FindContext from findMany since they share the same context
export type { FindContext } from '../findMany/findMany.types';

export interface FindOneParams<Properties> extends GenericConfiguration {
  where?: WhereParamsI;
  order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
  plain?: boolean;
  throwIfNotFound?: boolean;
}
