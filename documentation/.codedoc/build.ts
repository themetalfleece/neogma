import { build } from '@codedoc/core';

import { config } from './config';
import { content } from './content';
import { installTheme$ } from './content/theme';

build(config, content, installTheme$, {
  resolve: {
    modules: ['.codedoc/node_modules']
  },
  resolveLoader: {
    modules: ['.codedoc/node_modules']
  }
});
