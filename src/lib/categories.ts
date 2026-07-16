import type { BilingualDoc } from './content';
import { humanize } from './i18n';

export interface CategoryNode {
  name: string;
  /** 전체 카테고리 경로 (예: 'algorithms/graph') */
  path: string;
  label: string;
  depth: number;
  children: CategoryNode[];
  /** 이 카테고리 바로 아래 글 수 */
  directCount: number;
  /** 하위 카테고리 포함 전체 글 수 */
  totalCount: number;
}

/** 문서들의 카테고리 세그먼트로부터 중첩 트리를 만든다(폴더만 추가하면 자동 반영). */
export function buildCategoryTree(docs: BilingualDoc[]): CategoryNode[] {
  const roots: CategoryNode[] = [];
  const byPath = new Map<string, CategoryNode>();

  const ensure = (segments: string[]): CategoryNode | null => {
    if (segments.length === 0) return null;
    const path = segments.join('/');
    const existing = byPath.get(path);
    if (existing) return existing;
    const name = segments[segments.length - 1];
    const node: CategoryNode = {
      name,
      path,
      label: humanize(name),
      depth: segments.length,
      children: [],
      directCount: 0,
      totalCount: 0,
    };
    byPath.set(path, node);
    const parent = ensure(segments.slice(0, -1));
    if (parent) parent.children.push(node);
    else roots.push(node);
    return node;
  };

  for (const doc of docs) {
    const cats = doc.categorySegments;
    for (let i = 1; i <= cats.length; i++) {
      const node = ensure(cats.slice(0, i));
      if (node) node.totalCount += 1;
    }
    if (cats.length) {
      byPath.get(cats.join('/'))!.directCount += 1;
    }
  }

  const sortRec = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

/** 카테고리 리스팅 페이지를 생성할 모든 카테고리 경로(조상 포함). */
export function getCategoryPaths(docs: BilingualDoc[]): string[] {
  const set = new Set<string>();
  for (const doc of docs) {
    const cats = doc.categorySegments;
    for (let i = 1; i <= cats.length; i++) set.add(cats.slice(0, i).join('/'));
  }
  return [...set];
}

/** 특정 카테고리 경로에 속한 글들(하위 카테고리 포함). */
export function docsInCategory(docs: BilingualDoc[], categoryPath: string): BilingualDoc[] {
  const prefix = `${categoryPath}/`;
  return docs.filter((d) => d.categoryPath === categoryPath || d.categoryPath.startsWith(prefix));
}
