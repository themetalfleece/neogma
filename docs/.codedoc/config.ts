import { DefaultConfig, configuration } from '@codedoc/core';

import { theme } from './theme';

export const config = /*#__PURE__*/configuration({
  theme, // --> add the theme. modify `./theme.ts` for chaning the theme.
  page: {
    title: {
      base: 'Neogma Documentation' // --> the base title of your doc pages
    },
    favicon: '/favicon.ico'
  },
  src: {
    base: './md'
  },
  dest: {
    html: '.',
    namespace: '/neogma',
  },
  misc: {
    github: {
      repo: 'neogma',
      user: 'themetalfleece',
      action: 'Star',
    }
  }
});
