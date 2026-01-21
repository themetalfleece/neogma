import { NeogmaConstraintError } from '../../../Errors';
import { isRemoveLabels, isRemoveProperties } from '../QueryBuilder.types';
import { GetRemoveStringRemove } from './getRemoveString.types';

export const getRemoveString = (remove: GetRemoveStringRemove): string => {
  if (typeof remove === 'string') {
    return `REMOVE ${remove}`;
  }

  if (isRemoveProperties(remove)) {
    const properties = Array.isArray(remove.properties)
      ? remove.properties
      : [remove.properties];
    const propertiesWithIdentifier = properties.map(
      (p) => `${remove.identifier}.${p}`,
    );
    return `REMOVE ${propertiesWithIdentifier.join(', ')}`;
  }

  if (isRemoveLabels(remove)) {
    const labels = Array.isArray(remove.labels)
      ? remove.labels
      : [remove.labels];
    return `REMOVE ${remove.identifier}:${labels.join(':')}`;
  }

  throw new NeogmaConstraintError('invalid remove configuration');
};
