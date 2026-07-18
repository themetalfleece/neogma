import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  return {
    url: `${page.url}.md`,
  };
}
