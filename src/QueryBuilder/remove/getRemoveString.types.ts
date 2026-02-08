/** removes properties of an identifier */
export type RemovePropertiesI = {
  /** identifier whose properties will be removed */
  identifier: string;
  /** properties to remove */
  properties: string | string[];
};

/** removes labels of an identifier */
export type RemoveLabelsI = {
  /** identifier whose labels will be removed */
  identifier: string;
  /** labels to remove */
  labels: string | string[];
};

// REMOVE parameter
export type RemoveI = {
  // REMOVE parameter
  remove: string | RemovePropertiesI | RemoveLabelsI; // TODO also array of Properties|Labels
};

export type GetRemoveStringRemove = RemoveI['remove'];
