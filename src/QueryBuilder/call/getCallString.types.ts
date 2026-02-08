/** CALL subquery parameter */
export type CallI = {
  /** CALL subquery - wraps the content in CALL { ... } */
  call: string;
};

export type GetCallStringCall = CallI['call'];
