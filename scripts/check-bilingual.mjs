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
import { existsSync, readFileSync } from 'node:fs';

import { sha } from './check-drift.mjs';

// 짝 파일은 ko/en 이름에 .md 또는 .mdx 확장자를 가진다(허브 문서는 컴포넌트를 쓰려고 .mdx).
const BILINGUAL_RE = /src\/content\/.+\/(ko|en)(\.mdx?)$/;

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
    const ext = m[2];
    const other = lang === 'ko' ? 'en' : 'ko';
    const sibling = fp.replace(/\/(ko|en)(\.mdx?)$/, `/${other}${ext}`);
    // ko 가 SSOT 라 방향에 따라 할 일이 다르다. ko 를 고쳤으면 en 을 따라오게 해야 하고,
    // en 만 고친 거라면(= drift 수정) ko 는 건드리지 않는 게 맞다.
    const context =
      lang === 'ko'
        ? `방금 ko${ext} 를 수정했습니다: ${fp}\n` +
          `ko 가 SSOT 이므로 짝 파일 ${sibling} 도 이 변경에 맞춰 갱신해야 합니다. ` +
          `아직 반영하지 않았다면 지금 en${ext} 를 수정하세요.`
        : `방금 en${ext} 를 수정했습니다: ${fp}\n` +
          `ko 가 SSOT 이므로 ${sibling} 는 건드리지 마세요. ` +
          `en 만 바뀐 커밋은 drift 검사를 통과해야 짝 동기화 검사도 함께 풀립니다 — ` +
          `작업이 끝나면 \`node scripts/check-drift.mjs --worktree\` 로 검증하세요.`;
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

/*
 * "짝을 함께 고쳐라"는 결국 drift 를 막으려는 대리 규칙이다. drift 가 직접 검증됐다면
 * 그 대리 규칙은 필요 없다 — ko 를 SSOT 로 en 만 고치는 게 정상 워크플로이기 때문이다
 * (/fix-drift). 그래서 한쪽만 바뀐 변경도 check-drift.mjs 가 **바로 그 바이트 쌍**에
 * 대해 의미 검사를 통과시킨 기록이 있으면 통과시킨다. 캐시가 없거나 내용이 한 바이트라도
 * 다르면 해시가 어긋나 그대로 막힌다.
 */
function driftVerified(dir, ext) {
  const gitDir = git('rev-parse --absolute-git-dir').trim();
  if (!gitDir) return false;
  let entry;
  try {
    entry = JSON.parse(readFileSync(`${gitDir}/ko-en-drift-cache.json`, 'utf8'))[dir];
  } catch {
    return false;
  }
  if (!entry?.semantic) return false;

  const read = (p) => {
    if (mode === 'staged') return git(`show :${p}`);
    return existsSync(p) ? readFileSync(p, 'utf8') : '';
  };
  const ko = read(`${dir}/ko${ext}`);
  const en = read(`${dir}/en${ext}`);
  return !!ko && !!en && entry.ko === sha(ko) && entry.en === sha(en);
}

const violations = [];
const seenDir = new Set();
for (const f of changed) {
  const slash = f.lastIndexOf('/');
  const dir = f.slice(0, slash);
  if (seenDir.has(dir)) continue;
  const base = f.slice(slash + 1);
  const [, lang, ext] = base.match(/^(ko|en)(\.mdx?)$/) ?? [];
  if (!lang) continue;
  const other = `${lang === 'ko' ? 'en' : 'ko'}${ext}`;
  const sibling = `${dir}/${other}`;
  if (!changed.has(sibling)) {
    seenDir.add(dir);
    if (driftVerified(dir, ext)) continue;
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
  process.stderr.write(
    '\n  한쪽만 고치는 게 맞다면(ko 는 SSOT 이므로 en 만 손보는 drift 수정 등)\n' +
      '  drift 검사를 통과시키면 됩니다 — 그 기록이 이 검사도 함께 풀어줍니다:\n' +
      '    node scripts/check-drift.mjs --worktree\n\n',
  );
  process.exit(2);
}
process.exit(0);
