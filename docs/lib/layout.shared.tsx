import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { NpmIcon } from '@/components/icons';

const iconLinks: BaseLayoutProps['links'] = [
  {
    type: 'icon',
    label: 'npm',
    icon: <NpmIcon />,
    text: 'npm',
    url: 'https://www.npmjs.com/package/neogma',
    external: true,
  },
];

export const layoutSharedConfig: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <img src="/favicon.ico" alt="" width={24} height={24} />
        Neogma
      </>
    ),
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
    ...iconLinks,
  ],
  githubUrl: 'https://github.com/themetalfleece/neogma',
};

/** Links for the DocsLayout sidebar (excludes the Documentation nav link) */
export const docsLinks = iconLinks;
