/**
 * remark 플러그인: 마크다운 이미지의 "제목 슬롯"을 폭 지정으로 쓴다.
 *
 * 작성 규약:
 *   ![칸쥬게이트 메소드 책 커버](./image/book-cover.png "w=320")   → 320px 폭
 *   ![주간 구조](./image/weekly-structure.ko.svg "w=60%")          → 본문 폭의 60%
 *
 * 왜 제목 슬롯인가 —
 * 마크다운 문법을 깨지 않는 유일한 빈자리다. alt 는 스크린리더가 읽으니 크기
 * 정보로 오염시킬 수 없고, 인라인 `<img width>` 는 이 프로젝트에서 못 쓴다
 * (본문에 직접 쓴 HTML은 Astro 이미지 파이프라인을 타지 않아 상대경로가 깨진다).
 * 소비한 제목은 지워서 툴팁으로 "w=320"이 새어 나가지 않게 한다.
 *
 * 왜 rehype가 아니라 remark인가 —
 * remark-image-emoji.mjs 와 같은 이유다. 사용자 remark 플러그인은 Astro의
 * `remarkCollectImages` 보다 먼저 돌기 때문에, 여기서 심은 속성이
 * rehypeImages → getImage 까지 그대로 전달된다:
 *
 *   이 플러그인 → remarkCollectImages → rehypeImages(__ASTRO_IMAGE_) → getImage
 *
 * 그래서 **px 지정은 실제 리사이즈까지 일으킨다** — `width: 320` 이 getImage로
 * 넘어가 320px 짜리 파일이 새로 만들어지고, height 는 원본 비율로 계산돼
 * 속성에 함께 박힌다(astro/dist/assets/services/service.js 의 getHTMLAttributes).
 * 2MB 짜리 원본을 넣어도 320px 로 줄여 내보내는 이유다.
 * 퍼센트는 최종 픽셀을 빌드 시점에 알 수 없으므로 CSS(width)로만 처리한다.
 *
 * 규칙:
 *   - 값이 유효하지 않으면 **빌드를 세운다**(오타를 조용히 넘기지 않는다).
 *   - `w=` 로 시작하지 않는 제목은 손대지 않고 툴팁으로 남긴다.
 *   - 폭을 지정한 이미지는 `c-img-sized` 클래스를 달아 CSS가 가운데로 모은다
 *     (className 은 rehypeImages 가 보존해주는 속성이다).
 */

/** `w=320` `w=320px` `w=60%` — 공백은 관대하게 받는다. */
const SIZE_RE = /^w\s*=\s*(\d+(?:\.\d+)?)\s*(px|%)?$/i;
/** "폭을 지정하려던 것"으로 보이는 제목 — 형식이 틀리면 빌드를 세운다. */
const LOOKS_LIKE_SIZE = /^w\s*=/i;

const CLASS = 'c-img-sized';

/** mdast 를 훑어 image 노드를 모은다(transitive 의존성 없이 직접 순회). */
function collectImages(node, out) {
  if (node.type === 'image') out.push(node);
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) collectImages(child, out);
}

export default function remarkImageSize() {
  return function transformer(tree, file) {
    const path = typeof file?.path === 'string' ? file.path : '(unknown file)';

    const images = [];
    collectImages(tree, images);

    for (const node of images) {
      const title = typeof node.title === 'string' ? node.title.trim() : '';
      if (!title || !LOOKS_LIKE_SIZE.test(title)) continue;

      const match = title.match(SIZE_RE);
      const value = match ? Number(match[1]) : NaN;
      if (!match || !(value > 0)) {
        throw new Error(
          `이미지 폭 지정을 알아볼 수 없습니다: "${title}"\n` +
            `  파일: ${path}\n` +
            `  이미지: ${node.url}\n` +
            `  형식: ![설명](경로 "w=320")  또는  ![설명](경로 "w=60%")`,
        );
      }

      const unit = (match[2] ?? 'px').toLowerCase();

      node.title = null; // 툴팁으로 새어 나가지 않게 지운다
      node.data ??= {};
      const props = (node.data.hProperties ??= {});
      props.className = [...(props.className ?? []), CLASS];

      if (unit === 'px') {
        // getImage 로 넘어가 실제 리사이즈를 일으킨다(height 는 원본 비율로 계산됨).
        props.width = Math.round(value);
      } else {
        props.style = [props.style, `width: ${value}%`].filter(Boolean).join('; ');
      }
    }
  };
}
