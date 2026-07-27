/**
 * 마크다운 heading 목록(Astro `render()`가 주는 평평한 배열)을 계층 트리로 변환한다.
 * 인라인 목차(PostToc)와 우측 네비(DocToc)가 같은 트리를 공유한다.
 */

/** Astro `render()`가 돌려주는 heading 형태. */
export interface Heading {
  depth: number;
  slug: string;
  text: string;
  /**
   * 커스텀 이모지가 살아있는 원문(`:claude: Hook이란?`).
   *
   * Astro가 주는 `text`에는 이모지가 없다 — 헤딩 텍스트를 모을 때 element 노드를
   * 건너뛰기 때문에, 이미지로 바뀐 이모지는 흔적도 남지 않는다. 그래서 remark
   * 플러그인이 치환 전 원문을 따로 실어 보내고, 페이지가 여기에 채워 넣는다.
   */
  raw?: string;
}

export interface TocNode {
  depth: number;
  slug: string;
  text: string;
  /** 이모지가 살아있는 원문. 있으면 TocList가 이쪽을 HTML로 렌더한다. */
  raw?: string;
  children: TocNode[];
}

export interface TocOptions {
  /** 포함할 가장 얕은 depth (기본 2 = H2). */
  min?: number;
  /** 포함할 가장 깊은 depth (기본 3 = H3). */
  max?: number;
}

/** ` %% 날짜` 는 rehype-doc-date 용 표기이므로 목차 텍스트에서 걷어낸다. */
function cleanText(text: string): string {
  const idx = text.lastIndexOf(' %% ');
  return (idx === -1 ? text : text.slice(0, idx)).trim();
}

/**
 * 평평한 heading 배열 → 중첩 트리.
 *
 * H2 없이 H3로 시작하는 등 레벨을 건너뛴 글에서도 깨지지 않는다. 직전 heading보다
 * 깊으면 자식으로, 같거나 얕으면 스택을 되감아 알맞은 부모(없으면 루트)에 붙인다.
 */
export function buildTocTree(headings: Heading[], options: TocOptions = {}): TocNode[] {
  const { min = 2, max = 3 } = options;

  const roots: TocNode[] = [];
  const stack: TocNode[] = [];

  for (const heading of headings) {
    if (!heading.slug) continue;
    if (heading.depth < min || heading.depth > max) continue;

    const node: TocNode = {
      depth: heading.depth,
      slug: heading.slug,
      text: cleanText(heading.text),
      raw: heading.raw === undefined ? undefined : cleanText(heading.raw),
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) stack.pop();

    if (stack.length > 0) stack[stack.length - 1].children.push(node);
    else roots.push(node);

    stack.push(node);
  }

  return roots;
}

/**
 * Astro가 준 heading 배열에, remark 플러그인이 실어 보낸 "치환 전 원문"을 붙인다.
 *
 * 인덱스로 맞춘다 — Astro의 rehypeHeadingIds는 remark-image-emoji 다음에 같은
 * 트리를 같은 순서로 훑으므로 i번째끼리 대응한다. 다만 이건 Astro 내부 순회
 * 순서에 기대는 것이라, 개수가 어긋나면 조용히 엉뚱한 제목을 붙이는 대신
 * 이모지 없이 폴백하고 경고를 남긴다.
 */
export function withRawHeadings(headings: Heading[], raw: unknown, label: string): Heading[] {
  if (!Array.isArray(raw)) return headings;
  if (raw.length !== headings.length) {
    console.warn(
      `[emoji] 목차 원문 개수가 맞지 않아 커스텀 이모지를 건너뜁니다 ` +
        `(${label}: heading ${headings.length}개 vs 원문 ${raw.length}개)`,
    );
    return headings;
  }
  return headings.map((heading, i) =>
    typeof raw[i] === 'string' ? { ...heading, raw: raw[i] as string } : heading,
  );
}

/** 트리 전체 항목 수(자식 포함). 목차를 보여줄지 판단하는 데 쓴다. */
export function countTocNodes(nodes: TocNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countTocNodes(node.children), 0);
}
