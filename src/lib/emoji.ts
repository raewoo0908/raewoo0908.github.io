/**
 * 커스텀 이미지 이모지 — 문자열 → HTML 경로.
 *
 * 마크다운 본문은 remark 플러그인(remark-image-emoji.mjs)이 처리하지만, 글 제목
 * (frontmatter `title`)과 목차 텍스트는 마크다운 파이프라인을 타지 않는 그냥
 * 문자열이다. 그쪽을 여기서 담당한다.
 *
 * 두 경로 모두 결국 Astro의 같은 이미지 서비스(getImage)를 거치므로, 같은
 * 이모지는 같은 최적화 산출물을 공유한다.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import {
  EMOJI_HEIGHT,
  buildRegistry,
  dropSpaceAfterLead,
  splitEmoji,
  unknownEmojiError,
} from './emoji-syntax.mjs';

export { hasEmoji, stripEmoji } from './emoji-syntax.mjs';

/**
 * 이모지 원본. remark 플러그인 쪽은 node:fs로 같은 폴더를 읽는다
 * (그쪽은 Vite 모듈 그래프 밖이라 import.meta.glob을 쓸 수 없다).
 * 거부 대상인 gif도 일부러 포함시킨다 — 조용히 "없는 이름"이 되는 대신
 * buildRegistry가 이유를 설명하며 빌드를 세우게 하려고.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/emoji/*.{png,jpg,jpeg,webp,svg,gif}',
  { eager: true },
);

/** 최적화 산출물. width/height는 로드 전 자리를 잡아둘 용도(CSS가 실제 크기를 정한다). */
export interface EmojiAsset {
  src: string;
  width: number;
  height: number;
}

export type EmojiUrls = Map<string, EmojiAsset>;

let cache: Promise<EmojiUrls> | null = null;

/** 이름 → 최적화된 자산. 모듈 레벨 캐시라 페이지마다 다시 계산하지 않는다. */
export function getEmojiUrls(): Promise<EmojiUrls> {
  cache ??= build();
  return cache;
}

async function build(): Promise<EmojiUrls> {
  const files = Object.entries(modules).map(([path, mod]) => {
    const fileName = path.slice(path.lastIndexOf('/') + 1);
    const dot = fileName.lastIndexOf('.');
    return {
      name: fileName.slice(0, dot),
      ext: fileName.slice(dot + 1).toLowerCase(),
      label: path.replace(/^\//, ''),
      value: mod.default,
    };
  });

  const registry = buildRegistry(files);
  const urls: EmojiUrls = new Map();
  for (const [name, { value }] of registry) {
    // remark 플러그인이 본문에서 일으키는 호출과 **똑같은 옵션**이어야 한다.
    // 옵션이 다르면 같은 아이콘인데 URL이 갈라져 브라우저가 두 번 받는다.
    // (png는 Astro 기본값이 알아서 webp로 내보낸다 — format을 따로 주지 않는 이유다.)
    const optimized = await getImage({ src: value, height: EMOJI_HEIGHT });
    urls.set(name, {
      src: optimized.src,
      width: Number(optimized.attributes.width ?? value.width),
      height: Number(optimized.attributes.height ?? EMOJI_HEIGHT),
    });
  }
  return urls;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/**
 * `:이름:` 이 섞인 문자열을 HTML로 만든다.
 *
 * 결과는 `set:html`로 렌더되므로 Astro의 자동 이스케이프가 걸리지 않는다.
 * 그래서 텍스트 구간을 여기서 직접 이스케이프한다.
 *
 * @param where 에러 메시지에 찍을 위치(예: 글 제목, 목차)
 */
export function renderEmojiHtml(text: string, urls: EmojiUrls, where = '제목'): string {
  // 제목·목차는 언제나 블록의 맨 앞이므로, 본문 헤딩과 같은 간격 규칙을 적용한다.
  return dropSpaceAfterLead(splitEmoji(text))
    .map((part) => {
      if (part.type === 'text') return escapeHtml(part.value);
      const asset = urls.get(part.value);
      if (!asset) throw unknownEmojiError(part.value, urls.keys(), where);
      return (
        `<img class="c-emoji" src="${escapeHtml(asset.src)}" alt="${escapeHtml(part.value)}"` +
        ` width="${asset.width}" height="${asset.height}" decoding="async" loading="eager">`
      );
    })
    .join('');
}
