import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { layoutSharedConfig, docsLinks } from '@/lib/layout.shared';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...layoutSharedConfig}
      links={docsLinks}
    >
      {children}
    </DocsLayout>
  );
}
