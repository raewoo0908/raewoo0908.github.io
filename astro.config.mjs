import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeDocDate from './src/lib/rehype-doc-date.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://raewoo0908.github.io',
  base: '/',
  integrations: [mdx(), sitemap()],
  markdown: {
    // 줄 끝 ` %% <날짜>` 를 오른쪽 정렬 날짜(span.doc-date)로 변환.
    rehypePlugins: [rehypeDocDate],
    shikiConfig: {
      // 밝은 흰 바탕에 어울리는 라이트 테마. 긴 줄은 가로 스크롤.
      theme: 'github-light',
      wrap: false,
      transformers: [
        {
          // <pre>에 data-language를 심어 클라이언트 스크립트가 언어 라벨을 표시.
          pre(node) {
            node.properties['data-language'] = this.options.lang ?? 'text';
          },
        },
      ],
    },
  },
});
