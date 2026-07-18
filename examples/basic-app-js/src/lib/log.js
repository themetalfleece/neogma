/** @param {string} title */
const section = (title) => {
  console.log(`\n──── ${title} ────`);
};

/** @param {...unknown} args */
const log = (...args) => {
  console.log('  ', ...args);
};

module.exports = { section, log };
