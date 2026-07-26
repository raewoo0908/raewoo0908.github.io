/**
 * 마크다운 heading 목록(Astro `render()`가 주는 평평한 배열)을 계층 트리로 변환한다.
 * 인라인 목차(PostToc)와 우측 네비(DocToc)가 같은 트리를 공유한다.
 */

/** Astro `render()`가 돌려주는 heading 형태. */
export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface TocNode {
  depth: number;
  slug: string;
  text: string;
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
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) stack.pop();

    if (stack.length > 0) stack[stack.length - 1].children.push(node);
    else roots.push(node);

    stack.push(node);
  }

  return roots;
}

/** 트리 전체 항목 수(자식 포함). 목차를 보여줄지 판단하는 데 쓴다. */
export function countTocNodes(nodes: TocNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countTocNodes(node.children), 0);
}
