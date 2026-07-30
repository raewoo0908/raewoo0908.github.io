/**
 * rehype 플러그인: 본문 링크를 새 탭에서 열리게 한다.
 *
 * 읽던 글을 잃지 않고 링크를 따라갈 수 있게, 페이지를 옮기는 링크는 새 탭으로 보낸다.
 * href 모양만 보고 판정한다:
 *
 *   https://github.com/…   → 외부 사이트 → target=_blank rel="noopener noreferrer"
 *   /posts/claude/hook     → 이 블로그의 다른 글 → target=_blank rel="noopener"
 *   #함정-모음             → 같은 페이지 안 이동 → 건드리지 않음(목차·본문 앵커)
 *   mailto: · tel:         → 새 탭이 의미 없음 → 건드리지 않음
 *
 * `rel` 을 붙이는 이유: target=_blank 로 열린 탭은 window.opener 로 원본 페이지를
 * 조작할 수 있다. noopener 가 그 통로를 끊는다. 외부 링크엔 noreferrer 까지 붙여
 * 리퍼러를 넘기지 않는다(이 블로그엔 애널리틱스가 없어 잃을 데이터가 없다).
 *
 * **적용 범위는 마크다운/MDX 본문뿐이다.** 상단 네비·우측 목차(DocToc)·인라인
 * 목차(PostToc)·DocLinks 목록은 Astro 컴포넌트라 이 파이프라인을 지나가지 않아
 * 자동으로 제외된다 — 별도 예외 처리가 필요 없다.
 *
 * 새 탭 표시(↗)는 CSS 가 `.prose a[target="_blank"]` 로 붙인다(global.css).
 */

/** 이 스킴들은 새 탭 개념이 없거나(mailto·tel) 페이지 이동이 아니다(javascript). */
const SKIP_SCHEME = /^(mailto|tel|sms|javascript):/i;

/** 이 href 가 다른 페이지로 나가는 링크인가? 아니면 어떤 rel 이 필요한가? */
function relFor(href) {
  if (typeof href !== 'string' || href === '') return null;
  if (href.startsWith('#')) return null; // 같은 페이지 앵커
  if (SKIP_SCHEME.test(href)) return null;
  if (/^(https?:)?\/\//i.test(href)) return 'noopener noreferrer'; // 외부(프로토콜 상대 포함)
  if (href.startsWith('/')) return 'noopener'; // 사이트 내부 절대경로
  if (href.startsWith('./') || href.startsWith('../')) return 'noopener'; // 사이트 내부 상대경로
  return null; // 그 밖(알 수 없는 스킴 등)은 손대지 않는다
}

function walk(node) {
  if (!node || !Array.isArray(node.children)) return;

  for (const child of node.children) {
    if (!child || child.type !== 'element') continue;

    if (child.tagName === 'a') {
      const props = (child.properties = child.properties || {});
      // 글쓴이가 직접 target 을 지정했다면 그 뜻을 존중한다.
      if (props.target === undefined) {
        const rel = relFor(props.href);
        if (rel !== null) {
          props.target = '_blank';
          if (props.rel === undefined) props.rel = rel;
        }
      }
    }

    walk(child);
  }
}

export default function rehypeLinkTarget() {
  return (tree) => walk(tree);
}
