import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeDocDate from './src/lib/rehype-doc-date.mjs';
import remarkImageEmoji from './src/lib/remark-image-emoji.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://raewoo0908.github.io',
  base: '/',
  integrations: [mdx(), sitemap()],
  markdown: {
    // `:이름:` 을 커스텀 이미지 이모지로 변환. remark 단계여야 Astro의 이미지
    // 최적화(리사이즈·webp·해시 URL)를 그대로 얻는다 — 자세한 이유는 플러그인 주석.
    remarkPlugins: [remarkImageEmoji],
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
