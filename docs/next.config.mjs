import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

export default withMDX({
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/docs/:path*.md',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
});
