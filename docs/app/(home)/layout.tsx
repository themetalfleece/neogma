import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';
import { layoutSharedConfig } from '@/lib/layout.shared';

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...layoutSharedConfig}>{children}</HomeLayout>;
}
