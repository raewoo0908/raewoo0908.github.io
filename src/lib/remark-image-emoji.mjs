/**
 * remark 플러그인: 마크다운 본문의 `:이름:` 을 커스텀 이미지 이모지로 바꾼다.
 *
 * 왜 rehype가 아니라 remark인가 —
 * Astro는 사용자 remark 플러그인을 `remarkCollectImages` 보다 **먼저** 돌린다
 * (@astrojs/markdown-remark/dist/index.js 의 :57 → :60). 그래서 여기서 mdast에
 * `image` 노드를 심어두면 Astro는 그걸 "글쓴이가 직접 쓴 상대경로 이미지"와
 * 완전히 똑같이 취급한다:
 *
 *   이 플러그인 → remarkCollectImages → rehypeImages(__ASTRO_IMAGE_)
 *                                            ↓
 *                          getImage({ ...props, src })   (astro/dist/content/runtime.js:337)
 *
 * 즉 `height: EMOJI_HEIGHT` 가 그대로 getImage로 전달되어 **리사이즈·포맷 변환·
 * 해시 URL이 공짜로 따라온다.** 다운받은 원본을 그대로 넣어도 되는 이유다.
 * (rehype 단계에서 심으면 이미 수집이 끝난 뒤라 최적화 대상이 되지 못한다.)
 *
 * 부수 임무: 헤딩의 "치환 전 원문"을 문서 순서대로 모아 frontmatter에 실어
 * 보낸다. 목차가 아이콘을 그리려면 이게 필요하다 — 자세한 사연은 아래 참조.
 */
import { readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EMOJI_DIR,
  EMOJI_HEIGHT,
  buildRegistry,
  dropSpaceAfterLead,
  splitEmoji,
  unknownEmojiError,
} from './emoji-syntax.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EMOJI_ROOT = join(ROOT, EMOJI_DIR);

/** @type {Map<string, {ext: string, value: string, label: string}> | null} */
let cached = null;

/** `src/assets/emoji/` 를 훑어 이름 → 파일 맵을 만든다(프로세스당 1회). */
function registry() {
  if (cached) return cached;

  /** @type {Array<{name: string, ext: string, label: string, value: string}>} */
  const files = [];
  let entries;
  try {
    entries = readdirSync(EMOJI_ROOT, { withFileTypes: true });
  } catch {
    entries = []; // 폴더가 아직 없으면 빈 레지스트리
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(/^(.+)\.([^.]+)$/);
    if (!match) continue;
    files.push({
      name: match[1],
      ext: match[2].toLowerCase(),
      label: `${EMOJI_DIR}/${entry.name}`,
      value: entry.name,
    });
  }

  cached = buildRegistry(files);
  return cached;
}

/** 마크다운 파일에서 이모지 파일까지의 상대경로(항상 `/` 구분자). */
function relativeUrl(fromFile, fileName) {
  const url = relative(dirname(fromFile), join(EMOJI_ROOT, fileName)).split(sep).join('/');
  return url.startsWith('.') ? url : `./${url}`;
}

/** 헤딩 안의 글자만 모은다(치환 전 원문 확보용). */
function headingText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (!Array.isArray(node.children)) return '';
  return node.children.map(headingText).join('');
}

/** 문서 순서대로 헤딩을 모은다. Astro의 rehypeHeadingIds와 같은 순서다. */
function collectHeadings(node, out) {
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) {
    if (child.type === 'heading') out.push(child);
    collectHeadings(child, out);
  }
}

export default function remarkImageEmoji() {
  return function transformer(tree, file) {
    const path = typeof file?.path === 'string' ? file.path : undefined;
    const known = registry();

    // ── 1. 치환 전에 헤딩 원문을 확보한다 ─────────────────────────────────
    //
    // Astro가 목차용 heading 텍스트를 모을 때 element 노드를 건너뛴다
    // (@astrojs/markdown-remark/dist/rehype-collect-headings.js:20-22). 이모지가
    // <img>로 바뀌고 나면 headings[].text 에서 흔적도 없이 사라진다는 뜻이다.
    // 그래서 원문을 frontmatter에 실어 보낸다 — Astro는 플러그인이 쓴
    // file.data.astro.frontmatter 를 render()의 remarkPluginFrontmatter 로
    // 돌려준다(markdown-remark/dist/index.js:103 → astro/dist/content/runtime.js:406).
    //
    // 인덱스로 맞춘다: Astro의 rehypeHeadingIds는 이 플러그인 다음에
    // (index.js:77 → :81) 같은 트리를 같은 순서로 훑으므로 i번째끼리 대응한다.
    const headings = [];
    collectHeadings(tree, headings);
    const rawHeadings = headings.map(headingText);

    // ── 2. 텍스트 노드의 토큰을 image 노드로 치환 ────────────────────────
    //
    // `code`/`inlineCode` 는 노드 타입 자체가 달라 자동으로 제외된다.
    // 그래서 인라인 코드가 곧 이스케이프 수단이 된다: `` `:foo:` ``
    let replaced = 0;

    const walk = (node) => {
      if (!Array.isArray(node.children)) return;

      const next = [];
      for (const [index, child] of node.children.entries()) {
        if (child.type !== 'text') {
          walk(child);
          next.push(child);
          continue;
        }

        let parts = splitEmoji(child.value);
        if (parts.length === 1 && parts[0].type === 'text') {
          next.push(child);
          continue;
        }
        // 헤딩 맨 앞 이모지는 뒤 공백을 걷어낸다 → heading id가 하이픈으로 시작하지 않는다.
        if (node.type === 'heading' && index === 0) parts = dropSpaceAfterLead(parts);

        for (const part of parts) {
          if (part.type === 'text') {
            next.push({ type: 'text', value: part.value });
            continue;
          }

          const found = known.get(part.value);
          if (!found) {
            throw unknownEmojiError(part.value, known.keys(), path ?? '(unknown file)');
          }
          if (!path) {
            // 파일 경로가 없으면 상대경로를 만들 수 없다(정상 빌드에서는 없는 상황).
            next.push({ type: 'text', value: `:${part.value}:` });
            continue;
          }

          replaced++;
          next.push({
            type: 'image',
            url: relativeUrl(path, found.value),
            title: null,
            alt: part.value,
            data: {
              hProperties: {
                // className 은 rehypeImages 가 보존해주는 속성이다
                // (HAST_PRESERVED_PROPERTIES). height 는 getImage 로 넘어가
                // 실제 리사이즈를 일으킨다.
                className: ['c-emoji'],
                height: EMOJI_HEIGHT,
                decoding: 'async',
                // 아이콘은 1KB 남짓이고 글자 사이에 끼어 있어서, 지연 로딩하면
                // 스크롤할 때 글자가 밀렸다 돌아오는 게 보인다.
                loading: 'eager',
              },
            },
          });
        }
      }
      node.children = next;
    };

    walk(tree);

    // ── 3. 헤딩에 이모지가 있었을 때만 원문을 실어 보낸다 ────────────────
    if (replaced > 0 && rawHeadings.some((text) => text.includes(':'))) {
      file.data ??= {};
      file.data.astro ??= {};
      file.data.astro.frontmatter ??= {};
      file.data.astro.frontmatter.__emojiHeadings = rawHeadings;
    }
  };
}
