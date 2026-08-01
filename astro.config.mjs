import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeDocDate from './src/lib/rehype-doc-date.mjs';
import rehypeLinkTarget from './src/lib/rehype-link-target.mjs';
import remarkImageEmoji from './src/lib/remark-image-emoji.mjs';
import remarkImageSize from './src/lib/remark-image-size.mjs';

/**
 * dev 전용: `/_image` 응답의 캐시 수명을 1년 → 5분으로 줄인다.
 *
 * Astro의 이미지 엔드포인트는 응답에 `max-age=31536000`(1년)을 하드코딩해 붙인다.
 * 프로덕션은 파일명에 내용 해시가 박히므로(`/_astro/foo.<hash>.webp`) 원본을 고치면
 * URL이 바뀌어 안전하다. 그런데 **dev의 `/_image?href=…` URL에는 내용 해시가 없어**
 * 원본 SVG를 고쳐도 URL이 그대로다 → 브라우저가 1년짜리 캐시를 재사용해 옛 그림을
 * 계속 보여준다(하드 리로드·새 탭도 안 먹힘). 그래서 dev에서만 짧게 덮어쓴다.
 *
 * Astro 7에는 이 헤더를 바꾸는 설정이 없어(값이 소스에 상수로 박혀 있다) 미들웨어로
 * 가로챈다. dev 서버는 `res.writeHead(status, headers)`로 헤더를 한 번에 쓰므로
 * `writeHead`를 감싸고, Astro의 `/_image` 핸들러보다 먼저 실행되도록 미들웨어를
 * 스택 맨 앞으로 옮긴다. `apply: 'serve'`라 프로덕션 빌드에는 아예 포함되지 않는다.
 */
const DEV_IMAGE_MAX_AGE = 300; // 5분

function devImageCacheControl() {
  return {
    name: 'dev-image-cache-control',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/_image')) return next();

        const writeHead = res.writeHead.bind(res);
        res.writeHead = (status, ...rest) => {
          const headers = rest.find(
            (arg) => arg && typeof arg === 'object' && !Array.isArray(arg),
          );
          if (headers) {
            // 대소문자가 어떻든 기존 값을 걷어내고 다시 심는다.
            for (const key of Object.keys(headers)) {
              if (key.toLowerCase() === 'cache-control') delete headers[key];
            }
            headers['cache-control'] = `public, max-age=${DEV_IMAGE_MAX_AGE}`;
          }
          return writeHead(status, ...rest);
        };

        next();
      });

      // 방금 등록한 미들웨어를 스택 맨 앞으로. 뒤에 있으면 Astro가 이미 응답을
      // 써버린 뒤라 헤더를 가로챌 기회가 없다.
      server.middlewares.stack.unshift(server.middlewares.stack.pop());
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://raewoo0908.github.io',
  base: '/',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [devImageCacheControl()],
  },
  markdown: {
    // `:이름:` 을 커스텀 이미지 이모지로 변환. remark 단계여야 Astro의 이미지
    // 최적화(리사이즈·webp·해시 URL)를 그대로 얻는다 — 자세한 이유는 플러그인 주석.
    // 이어서 이미지 제목 슬롯(`"w=320"`)을 폭 지정으로 소비한다(같은 이유로 remark).
    remarkPlugins: [remarkImageEmoji, remarkImageSize],
    // 줄 끝 ` %% <날짜>` 를 오른쪽 정렬 날짜(span.doc-date)로 변환.
    // 이어서 본문 링크(외부·다른 글)를 새 탭으로 보낸다 — 목차 앵커는 그대로 둔다.
    rehypePlugins: [rehypeDocDate, rehypeLinkTarget],
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
