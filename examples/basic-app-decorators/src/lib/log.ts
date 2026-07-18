export const section = (title: string): void => {
  console.log(`\n──── ${title} ────`);
};

export const log = (...args: unknown[]): void => {
  console.log('  ', ...args);
};
