#!/usr/bin/env node
/*
 * ko.md / en.md 짝 동기화 검사 (양방향).
 *
 * src/content 아래의 글은 같은 폴더에 ko.md·en.md 짝으로 저장된다.
 * 짝 중 "한쪽만" 이번 변경 집합에 들어오면 위반으로 보고한다.
 *   - <dir>/ko.md 변경 + <dir>/en.md 미변경 → 위반
 *   - <dir>/en.md 변경 + <dir>/ko.md 미변경 → 위반
 * "짝"은 같은 폴더의 반대 언어 파일만 가리킨다(폴더가 다르면 짝이 아님).
 * 변경 집합에 들어오지 않은 폴더의 짝은 애초에 검사하지 않는다(오탐 없음).
 *
 * 모드:
 *   --staged       스테이징된 변경 검사. 위반 시 exit 2 (git pre-commit → 커밋 중단).
 *   --worktree     작업 트리 변경 검사. 위반 시 exit 2 (Claude Stop 훅 → 턴 종료 차단).
 *   --posttooluse  Claude PostToolUse 훅. 방금 편집한 파일의 짝을 갱신하라는
 *                  안내를 additionalContext(JSON)로 출력하고 항상 exit 0(비차단).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BILINGUAL_RE = /src\/content\/.+\/(ko|en)\.md$/;

function readStdinJson() {
  if (process.stdin.isTTY) return {};
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

// ── PostToolUse: 편집한 파일의 짝 갱신 안내(비차단) ──────────────────────────
if (process.argv.includes('--posttooluse')) {
  const payload = readStdinJson();
  const fp = payload?.tool_input?.file_path || '';
  const m = fp.match(BILINGUAL_RE);
  if (m) {
    const lang = m[1];
    const other = lang === 'ko' ? 'en' : 'ko';
    const sibling = fp.replace(/\/(ko|en)\.md$/, `/${other}.md`);
    const context =
      `방금 ${lang}.md 를 수정했습니다: ${fp}\n` +
      `ko/en 동기화 규칙에 따라 짝 파일 ${sibling} 도 같은 내용에 맞춰 갱신해야 합니다. ` +
      `아직 반영하지 않았다면 지금 ${other}.md 를 수정하세요.`;
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context },
      }),
    );
  }
  process.exit(0);
}

// ── staged / worktree: 짝 동기화 강제 검사 ──────────────────────────────────
const mode = process.argv.includes('--staged') ? 'staged' : 'worktree';

// Claude Stop 훅 재진입 시 무한 루프 방지: stop_hook_active면 조용히 통과.
if (mode === 'worktree') {
  const payload = readStdinJson();
  if (payload.stop_hook_active) process.exit(0);
}

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf8' });
  } catch {
    return '';
  }
}

let files = [];
if (mode === 'staged') {
  files = git('diff --cached --name-only').split('\n');
} else {
  files = [
    ...git('diff --name-only HEAD').split('\n'),
    ...git('ls-files --others --exclude-standard').split('\n'),
  ];
}

const changed = new Set(files.map((f) => f.trim()).filter((f) => BILINGUAL_RE.test(f)));

const violations = [];
const seenDir = new Set();
for (const f of changed) {
  const slash = f.lastIndexOf('/');
  const dir = f.slice(0, slash);
  if (seenDir.has(dir)) continue;
  const base = f.slice(slash + 1);
  const isKo = base === 'ko.md';
  const other = isKo ? 'en.md' : 'ko.md';
  const sibling = `${dir}/${other}`;
  if (!changed.has(sibling)) {
    seenDir.add(dir);
    violations.push({ dir, base, other, sibling });
  }
}

if (violations.length > 0) {
  process.stderr.write('\n✗ ko/en 짝 동기화 위반 — 짝 파일을 함께 수정해야 합니다:\n');
  for (const v of violations) {
    process.stderr.write(
      `  - ${v.dir}/ : ${v.base} 는 변경됐지만 ${v.other} 는 그대로입니다\n` +
        `      → ${v.sibling} 도 같은 내용에 맞춰 수정하세요\n`,
    );
  }
  process.stderr.write('\n');
  process.exit(2);
}
process.exit(0);
