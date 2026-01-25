import { NeogmaConstraintError } from '../../Errors';
import {
  isDeleteWithIdentifier,
  isDeleteWithLiteral,
} from '../QueryBuilder.types';
import type { GetDeleteStringDelete } from './getDeleteString.types';

export const getDeleteString = (dlt: GetDeleteStringDelete): string => {
  if (typeof dlt === 'string') {
    return `DELETE ${dlt}`;
  }

  if (isDeleteWithIdentifier(dlt)) {
    const identifiers = Array.isArray(dlt.identifiers)
      ? dlt.identifiers
      : [dlt.identifiers];

    return `${dlt.detach ? 'DETACH ' : ''}DELETE ${identifiers.join(', ')}`;
  }

  if (isDeleteWithLiteral(dlt)) {
    return `${dlt.detach ? 'DETACH ' : ''}DELETE ${dlt.literal}`;
  }

  throw new NeogmaConstraintError('invalid delete configuration');
};
