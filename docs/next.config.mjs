import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

export default withMDX({
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/docs/latest',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/docs/latest/:path+',
        destination: '/docs/v2.0/:path+',
      },
      {
        source: '/docs/:path*.md',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
});
