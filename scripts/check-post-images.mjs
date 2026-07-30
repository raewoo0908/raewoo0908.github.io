#!/usr/bin/env node
/*
 * 게시글 이미지 규칙 검사 (전체 콘텐츠 트리 대상, 구조 불변식).
 *
 * 규칙:
 *  1) 언어별 이미지는 <글폴더>/image/ 아래 <이름>.ko.<ext> / <이름>.en.<ext> "짝"으로 둔다.
 *     한쪽만 있으면 위반.
 *  2) ko.md 는 .en. 이미지를, en.md 는 .ko. 이미지를 참조하면 안 된다(언어 교차 참조 금지).
 *     → en 문서에서 한국어 이미지가 렌더되는 사고를 막는다.
 *  3) 문서가 참조하는 "상대경로" 이미지는 실제로 존재해야 한다(오타 방지).
 *
 * 언어 접미사(.ko./.en.)가 없는 이미지는 언어중립으로 보고 위 규칙에서 제외한다
 * (예: /images/sample.svg 처럼 양쪽 문서가 같이 쓰는 이미지).
 *
 * 모드:
 *   --staged     git pre-commit 용. 위반 시 exit 2 → 커밋 중단.
 *   --worktree   Claude Stop 훅 용. 위반 시 exit 2 → 턴 종료 차단.
 *                stop_hook_active 재진입 시 조용히 통과(무한 루프 방지).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src', 'content');

// Claude Stop 훅 재진입 루프 방지
if (process.argv.includes('--worktree') && !process.stdin.isTTY) {
  try {
    const payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
    if (payload.stop_hook_active) process.exit(0);
  } catch {
    /* stdin 없음 → 그대로 검사 진행 */
  }
}

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const rel = (p) => relative(ROOT, p);

const files = existsSync(CONTENT) ? walk(CONTENT) : [];
const violations = [];

// ── 규칙 1: image/ 하위 언어쌍(.ko./.en.) 존재 ──────────────────────────────
const LANG_IMG_RE = /\/image\/.+\.(ko|en)\.[^./]+$/;
for (const f of files) {
  if (!LANG_IMG_RE.test(f)) continue;
  const lang = /\.ko\.[^./]+$/.test(f) ? 'ko' : 'en';
  const other = lang === 'ko' ? 'en' : 'ko';
  const counterpart = f.replace(/\.(ko|en)\.([^./]+)$/, `.${other}.$2`);
  if (!existsSync(counterpart)) {
    violations.push(
      `이미지 언어쌍 누락: ${rel(f)}\n` +
        `      → 짝 이미지 ${rel(counterpart)} 도 같은 구조로 만들어야 합니다`,
    );
  }
}

// ── 규칙 2·3: 문서(ko.md/en.md, ko.mdx/en.mdx)의 이미지 참조 검사 ───────────
for (const f of files) {
  const bm = f.match(/\/(ko|en)\.mdx?$/);
  if (!bm) continue;
  const lang = bm[1];
  const wrong = lang === 'ko' ? '.en.' : '.ko.';
  const right = lang === 'ko' ? '.ko.' : '.en.';
  const content = readFileSync(f, 'utf8');

  const refs = [];
  for (const mm of content.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)/g)) refs.push(mm[1]);
  for (const mm of content.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) refs.push(mm[1]);

  for (const url of refs) {
    if (url.includes(wrong)) {
      violations.push(
        `${rel(f)} (${lang}.md) 가 반대 언어 이미지를 참조합니다: ${url}\n` +
          `      → ${right} 버전으로 바꾸세요`,
      );
    }
    if (!/^(https?:|data:|\/)/.test(url)) {
      const abs = resolve(dirname(f), url);
      if (!existsSync(abs)) {
        violations.push(`${rel(f)} 가 존재하지 않는 이미지를 참조합니다: ${url}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write('\n✗ 게시글 이미지 규칙 위반:\n');
  for (const v of violations) process.stderr.write(`  - ${v}\n`);
  process.stderr.write(
    '\n규칙: 언어별 이미지는 <글폴더>/image/ 에 <이름>.ko.<ext> / <이름>.en.<ext> 짝으로 두고,\n' +
      '      ko.md 는 .ko. 이미지를, en.md 는 .en. 이미지를 참조하세요.\n\n',
  );
  process.exit(2);
}
process.exit(0);
