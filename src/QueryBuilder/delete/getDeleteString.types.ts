/** deletes the given identifiers */
export type DeleteByIdentifierI = {
  /** identifiers to be deleted */
  identifiers: string | string[];
  /** detach delete */
  detach?: boolean;
};

/** deletes by using the given literal */
export type DeleteLiteralI = {
  /** delete literal */
  literal: string;
  /** detach delete */
  detach?: boolean;
};

/** DELETE parameter */
export type DeleteI = {
  /** DELETE parameter */
  delete: string | DeleteByIdentifierI | DeleteLiteralI;
};

export type GetDeleteStringDelete = DeleteI['delete'];
