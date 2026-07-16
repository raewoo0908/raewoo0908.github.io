/**
 * rehype 플러그인: 마크다운 줄 끝의 ` %% <날짜>` 를 오른쪽 정렬 날짜로 변환한다.
 *
 * 작성 규약:
 *   - **백엔드 팀장** — 블록체인 피트니스 플랫폼 %% 2025.07 ~ 2026.06
 *
 * 변환 결과(hast): 헤더(설명)와 날짜를 flex 한 줄(span.doc-row)로 감싼다.
 *   <li class="has-doc-date">
 *     <span class="doc-row">
 *       <span class="doc-entry"><strong>백엔드 팀장</strong> — 블록체인 …</span>
 *       <span class="doc-date">2025.07 ~ 2026.06</span>
 *     </span>
 *   </li>
 *
 * CSS(.doc-row { display:flex; justify-content:space-between })가 설명은 왼쪽,
 * 날짜는 오른쪽에 둔다. 날짜가 그 줄(row)에 묶이므로 긴 설명이 다음 항목으로
 * 새지 않는다(float 방식의 오버플로우 문제 해결). 학력처럼 중첩 목록(ul/ol)이
 * 딸린 li에서는 중첩 목록을 row 밖으로 유지해 원래대로 아래에 렌더한다.
 *
 * 규칙:
 *   - `%%` 는 마크다운/smartypants에 의미가 없어 안전한 구분자다.
 *   - 날짜는 굵게/링크 없이 순수 텍스트로 줄 맨 끝에 둔다(마지막 텍스트 노드를 처리).
 */

const DELIM = ' %% ';
const BLOCK = /^(li|h[1-6]|p)$/;
const LIST = /^(ul|ol)$/;

/** 요소에 클래스를 추가한다. */
function addClass(node, className) {
  node.properties = node.properties || {};
  const cls = node.properties.className;
  if (Array.isArray(cls)) {
    if (!cls.includes(className)) cls.push(className);
  } else if (typeof cls === 'string' && cls.length > 0) {
    node.properties.className = cls.split(/\s+/).concat(className);
  } else {
    node.properties.className = [className];
  }
}

function el(tagName, className, children) {
  return { type: 'element', tagName, properties: { className: [className] }, children };
}

/** 블록(li·h1~6·p)에서 ` %% 날짜` 를 찾아 doc-row 구조로 재구성한다. */
function processBlock(block) {
  const children = block.children;

  // 중첩 목록(ul/ol)은 헤더 라인과 분리해 뒤에 그대로 둔다.
  let splitIdx = children.findIndex((c) => c.type === 'element' && LIST.test(c.tagName));
  if (splitIdx === -1) splitIdx = children.length;
  const header = children.slice(0, splitIdx);
  const trailing = children.slice(splitIdx);

  // 헤더의 마지막 텍스트 노드에서 구분자를 찾아 날짜를 분리한다.
  let date = null;
  for (let i = header.length - 1; i >= 0; i--) {
    const c = header[i];
    if (c.type === 'text' && c.value.includes(DELIM)) {
      const idx = c.value.lastIndexOf(DELIM);
      date = c.value.slice(idx + DELIM.length).trim();
      c.value = c.value.slice(0, idx).replace(/\s+$/, '');
      if (c.value === '') header.splice(i, 1);
      break;
    }
  }
  if (date === null || date === '') return; // 구분자 없음 → 변경하지 않음

  const row = el('span', 'doc-row', [
    el('span', 'doc-entry', header),
    el('span', 'doc-date', [{ type: 'text', value: date }]),
  ]);
  block.children = [row, ...trailing];
  addClass(block, 'has-doc-date');
}

function walk(node) {
  if (!node || !Array.isArray(node.children)) return;

  if (node.type === 'element' && BLOCK.test(node.tagName)) {
    const hasDelim = node.children.some((c) => c.type === 'text' && c.value.includes(DELIM));
    if (hasDelim) processBlock(node);
  }

  for (const child of node.children) {
    if (child && child.type === 'element') walk(child);
  }
}

export default function rehypeDocDate() {
  return (tree) => walk(tree);
}
