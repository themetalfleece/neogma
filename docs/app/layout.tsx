import { Provider } from '@/components/provider';
import type { ReactNode } from 'react';
import './global.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Neogma - Neo4j OGM for TypeScript',
  description:
    'A fully type-safe Object-Graph-Mapping framework for Neo4j and TypeScript. Define models with decorators, build queries with a fluent API, and manage relationships automatically.',
  alternates: {
    types: {
      'text/plain': [{ url: '/llms.txt', title: 'llms.txt' }],
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
