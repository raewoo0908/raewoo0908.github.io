# `/routine-review` 구현 계획

작성일 2026-08-03 · **상태: 실행 완료** (`4f2a71d` 엔진 · `c4eebfb` CLI · `9ba6e42` 커맨드)
· 설계는 [`../specs/2026-08-03-routine-review-command-design.md`](../specs/2026-08-03-routine-review-command-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** routine 이 올린 `claude/bilingual-check-*` 브랜치를 워크트리로 받아 고치고 main 에 병합·배포하기까지를 `/routine-review` 한 번으로 만든다.

**Architecture:** 새 판정 로직을 만들지 않는다. `check-drift.mjs` 가 이미 export 하는 `analyze()` 를 그대로 재사용해 블록 정렬 진단 도구 하나(`drift-blocks.mjs`)를 얹고, 나머지는 전부 슬래시 커맨드 마크다운에 담는다. 커맨드는 2026-08-03 에 손으로 완주한 절차를 그대로 옮기되, 그때 조용히 틀렸던 지점마다 가드를 박는다.

**Tech Stack:** Node 빌트인만(`node:child_process`, `node:fs`, `node:url`), `node --test`, Claude Code 슬래시 커맨드 마크다운.

## Context

매주 월요일 routine 이 `claude/bilingual-check-<날짜>` 브랜치에 이중언어 점검 리포트를 올린다. 2026-08-03 에 그 리포트를 받아 배포까지 한 번 손으로 완주했고, 설계는 `docs/superpowers/specs/2026-08-03-routine-review-command-design.md` 에 승인된 채로 있다.

문제는 절차 길이가 아니라 **판단이 필요한 지점이 숨어 있고, 모르면 조용히 틀린다**는 것이었다.

- 리포트의 사실 지적 3건이 오진이었다 — 그대로 고쳤으면 멀쩡한 글에 오류를 심었다.
- 구조 위반이 있으면 `check-drift.mjs` 가 LLM 을 아예 안 부른다. 그래서 4개 폴더가 한 번도 의미 검사를 받은 적 없는 상태로 통과해 있었고, 구조를 고치자 첫 판정 15건이 쏟아져 커밋이 두 번 막혔다.
- `check-drift.mjs --worktree` 가 미커밋 초안까지 유료로 훑어 돈이 샜고, `git add src/content` 가 그 초안을 스테이징했다.
- `블록 수가 다릅니다 — ko 145개 / en 146개` 만으로는 어느 블록인지 알 수 없어, 145개를 눈으로 셀 뻔했다.

이 계획은 그 교훈들을 재현 가능한 형태로 고정한다.

## Global Constraints

- 모든 산출물의 주석·출력·문서는 **한국어**. 기존 `scripts/*.mjs` 와 `.claude/commands/fix-drift.md` 의 톤을 따른다.
- `scripts/*.mjs` 는 **node 빌트인만** import 한다. 워크트리에서 `npm install` 없이 도는 것이 전제다(검증됨).
- `drift-blocks.mjs` 는 **게이트가 아니라 진단 도구**다 — LLM 을 부르지 않고(공짜), **항상 exit 0**.
- 판정 로직을 새로 만들지 않는다. `check-drift.mjs` 의 `analyze()` 를 재사용해야 진단과 게이트가 어긋나지 않는다.
- `ko` 가 SSOT. 어떤 산출물도 en 을 기준으로 ko 를 고치라고 말하지 않는다.
- `npm test` = `node --test scripts/*.test.mjs` — 새 테스트 파일은 자동으로 잡힌다. 별도 등록 불필요.
- 커밋 메시지는 이 저장소 관행대로 `feat(...)`/`docs(...)` + 한국어 요지.

## File Structure

| 경로 | 책임 |
| --- | --- |
| `scripts/drift-blocks.mjs` (신규) | ko/en 블록 종류 시퀀스를 LCS 로 정렬해 **어느 블록이 한쪽에만 있는지** + **코드블록 줄 수가 어디서 갈리는지**를 함께 출력. `--vs-head` 로 HEAD 대비 비교. |
| `scripts/drift-blocks.test.mjs` (신규) | 위 도구의 회귀 테스트. LLM 없음. |
| `.claude/commands/routine-review.md` (신규) | 슬래시 커맨드. 스펙 ①~⑦ + 체크포인트 2개를 실행 절차로. |
| `CLAUDE.md` (수정) | 핵심 파일 표에 `drift-blocks.mjs` 한 줄, drift 절의 "직접 돌리기" 코드블록에 한 줄. |

순수 함수(`alignKinds`/`diagnose`/`formatReport`/`resolvePair`)와 CLI(`main`)를 한 파일 안에서 분리한다. 파일이 200줄을 넘지 않으므로 나눌 이유가 없고, 테스트는 순수 함수를 직접 import 한다.

---

### Task 1: `drift-blocks.mjs` 진단 엔진 (LCS 정렬 + 코드블록 줄 수)

**Files:**
- Create: `scripts/drift-blocks.mjs`
- Create: `scripts/drift-blocks.test.mjs`
- Read-only 참조: `scripts/check-drift.mjs:156-263` (`analyze`), `scripts/check-drift.test.mjs` (테스트 톤)

**Interfaces:**
- Consumes: `analyze(src)` from `./check-drift.mjs` → `{ blocks: [{kind, line, text, codeLines?}], kinds: string[], … }`
- Produces:
  - `alignKinds(koKinds: string[], enKinds: string[]) -> Array<{ko: number|null, en: number|null}>`
  - `diagnose(koSrc: string, enSrc: string) -> { koCount: number, enCount: number, only: Array<{side:'ko'|'en', kind, line, excerpt}>, codeLines: Array<{ordinal, koLine, enLine, koLines, enLines}> }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`scripts/drift-blocks.test.mjs`:

```js
/*
 * drift-blocks.mjs 테스트 — node --test scripts/*.test.mjs
 *
 * 진단 도구이므로 "무엇이 어긋났는지 정확히 짚는가"만 본다. LLM 은 부르지 않는다.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

// resolvePair 는 Task 2 에서 추가한다. ESM 은 없는 export 를 import 하면 링크 단계에서
// SyntaxError 를 내므로, 그때 이 줄에 이름을 더한다.
import { alignKinds, diagnose, formatReport } from './drift-blocks.mjs';

const SCRIPT = path.resolve(import.meta.dirname, 'drift-blocks.mjs');
const FM = (t) => `---\ntitle: "${t}"\n---\n\n`;

test('LCS 정렬은 한쪽에만 있는 블록을 그 자리에 남긴다', () => {
  assert.deepEqual(alignKinds(['para', 'code:js'], ['para', 'list', 'code:js']), [
    { ko: 0, en: 0 },
    { ko: null, en: 1 },
    { ko: 1, en: 2 },
  ]);
});

test('ko 가 리스트 앞 빈 줄을 빠뜨리면 en 에만 있는 list 로 잡힌다', () => {
  const ko = `${FM('가')}문단입니다\n- 목록 항목\n`;
  const en = `${FM('A')}A paragraph\n\n- list item\n`;
  const d = diagnose(ko, en);
  assert.equal(d.koCount, 1);
  assert.equal(d.enCount, 2);
  assert.equal(d.only.length, 1);
  assert.equal(d.only[0].side, 'en');
  assert.equal(d.only[0].kind, 'list');
  assert.equal(d.only[0].line, 7); // frontmatter 4줄 뒤 본문 기준 절대 행번호
  assert.match(d.only[0].excerpt, /list item/);
});

test('구조가 같으면 정렬 일치를 찍는다', () => {
  const ko = `${FM('가')}## 제목\n\n문단\n\n\`\`\`python\nx = 1\n\`\`\`\n`;
  const en = `${FM('A')}## Title\n\nA paragraph\n\n\`\`\`python\nx = 1\n\`\`\`\n`;
  const d = diagnose(ko, en);
  assert.deepEqual(d.only, []);
  assert.deepEqual(d.codeLines, []);
  assert.match(formatReport('demo', d), /정렬 일치/);
});

test('코드블록 줄 수가 갈리면 ko 기준 몇 번째인지와 함께 경고한다', () => {
  const ko = `${FM('가')}\`\`\`js\na\n\`\`\`\n\n문단\n\n\`\`\`js\nb\n\`\`\`\n`;
  const en = `${FM('A')}\`\`\`js\na\n\`\`\`\n\nparagraph\n\n\`\`\`js\nb\nc\n\`\`\`\n`;
  const d = diagnose(ko, en);
  assert.deepEqual(d.only, []);
  assert.equal(d.codeLines.length, 1);
  assert.equal(d.codeLines[0].ordinal, 2);
  assert.equal(d.codeLines[0].koLines, 1);
  assert.equal(d.codeLines[0].enLines, 2);
  assert.match(formatReport('demo', d), /⚠ 2번째 코드블록/);
});

test('정렬 어긋남과 코드블록 줄 수를 한 번에 뽑는다', () => {
  // compareStructure 는 앞 검사에서 막히면 뒤까지 못 간다. 이 도구는 둘을 함께 준다.
  const ko = `${FM('가')}문단입니다\n- 목록 항목\n\n\`\`\`js\na\n\`\`\`\n`;
  const en = `${FM('A')}A paragraph\n\n- list item\n\n\`\`\`js\na\nb\n\`\`\`\n`;
  const d = diagnose(ko, en);
  assert.equal(d.only.length, 1);
  assert.equal(d.codeLines.length, 1);
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../scripts/drift-blocks.mjs'`

- [ ] **Step 3: 엔진을 구현한다**

`scripts/drift-blocks.mjs` (이 태스크 범위는 헤더 + 순수 함수까지. CLI 는 Task 2):

```js
#!/usr/bin/env node
/*
 * ko/en 블록 정렬 진단.
 *
 * check-drift.mjs 는 "블록 수가 다릅니다 — ko 145개 / en 146개" 까지만 알려주고
 * 어느 블록인지는 말하지 않는다. 145개를 눈으로 세는 건 불가능하다. 그 간극을 메운다.
 *
 * 판정 로직을 새로 만들지 않는다 — check-drift.mjs 의 analyze() 를 그대로 쓴다.
 * 같은 파서를 써야 진단과 게이트가 어긋나지 않는다.
 *
 * 게이트가 아니라 진단 도구다. LLM 을 부르지 않아 공짜이고, 무엇이 나오든 exit 0 이다.
 *
 *   node scripts/drift-blocks.mjs <글폴더> [<글폴더>…] [--vs-head]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { analyze } from './check-drift.mjs';

const EXCERPT = 60;

/**
 * 두 블록 종류 시퀀스를 LCS 로 정렬한다.
 * 짝이 맞으면 {ko, en} 둘 다 채워지고, 한쪽에만 있으면 반대쪽이 null 이다.
 */
export function alignKinds(koKinds, enKinds) {
  const n = koKinds.length;
  const m = enKinds.length;
  // dp[i][j] = koKinds[i..] 와 enKinds[j..] 의 최장 공통 부분수열 길이
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        koKinds[i] === enKinds[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (koKinds[i] === enKinds[j]) out.push({ ko: i++, en: j++ });
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ ko: i++, en: null });
    else out.push({ ko: null, en: j++ });
  }
  while (i < n) out.push({ ko: i++, en: null });
  while (j < m) out.push({ ko: null, en: j++ });
  return out;
}

function excerpt(text) {
  const one = text.replace(/\r?\n/g, ' ⏎ ').replace(/\s+/g, ' ').trim();
  return one.length > EXCERPT ? `${one.slice(0, EXCERPT)}…` : one;
}

/** ko/en 원문 → 한쪽에만 있는 블록 + 코드블록 줄 수 차이. */
export function diagnose(koSrc, enSrc) {
  const ko = analyze(koSrc);
  const en = analyze(enSrc);

  const only = [];
  const codeLines = [];
  let codeOrdinal = 0; // ko 기준 몇 번째 코드블록인가

  for (const p of alignKinds(ko.kinds, en.kinds)) {
    const koBlk = p.ko === null ? null : ko.blocks[p.ko];
    const enBlk = p.en === null ? null : en.blocks[p.en];
    if (koBlk?.kind.startsWith('code:')) codeOrdinal++;

    if (koBlk && enBlk) {
      // LCS 는 kind 가 같을 때만 짝지으므로 한쪽이 코드면 반대쪽도 같은 코드다.
      if (koBlk.kind.startsWith('code:') && koBlk.codeLines !== enBlk.codeLines) {
        codeLines.push({
          ordinal: codeOrdinal,
          koLine: koBlk.line,
          enLine: enBlk.line,
          koLines: koBlk.codeLines,
          enLines: enBlk.codeLines,
        });
      }
      continue;
    }

    const blk = koBlk ?? enBlk;
    only.push({
      side: koBlk ? 'ko' : 'en',
      kind: blk.kind,
      line: blk.line,
      excerpt: excerpt(blk.text),
    });
  }

  return { koCount: ko.kinds.length, enCount: en.kinds.length, only, codeLines };
}

/** 한 짝의 진단 결과를 사람이 읽는 줄들로. */
export function formatReport(label, d) {
  const lines = [`${label}   ko ${d.koCount}블록 / en ${d.enCount}블록`];
  if (d.only.length === 0 && d.codeLines.length === 0) {
    lines.push('  정렬 일치');
    return lines.join('\n');
  }
  for (const o of d.only) {
    lines.push(`  ${o.side} 에만  ${o.kind}@${o.side}:${o.line}   ${o.excerpt}`);
  }
  // 정렬과 코드블록 줄 수를 함께 뽑는다 — compareStructure 는 앞 검사에서 막히면
  // 뒤까지 못 가서, 정렬을 고치고 다시 돌려야 이게 드러난다. 왕복을 없앤다.
  for (const c of d.codeLines) {
    lines.push(
      `  ⚠ ${c.ordinal}번째 코드블록  ko:${c.koLine}(${c.koLines}줄) / en:${c.enLine}(${c.enLines}줄)`,
    );
  }
  return lines.join('\n');
}
```

`resolvePair` 와 `main` 은 Task 2 에서 채운다. Task 1 의 테스트는 그것들을 import 하지 않는다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm test`
Expected: PASS — 새 5개 포함 전부 통과. 기존 `check-drift.test.mjs`·`check-bilingual.test.mjs` 도 그대로 통과해야 한다.

- [ ] **Step 5: 커밋**

```bash
git add scripts/drift-blocks.mjs scripts/drift-blocks.test.mjs
git commit -m "feat(scripts): ko/en 블록 정렬 진단 엔진"
```

---

### Task 2: `drift-blocks.mjs` CLI — 짝 해석과 `--vs-head`

**Files:**
- Modify: `scripts/drift-blocks.mjs` (Task 1 결과에 이어붙인다)
- Modify: `scripts/drift-blocks.test.mjs` (테스트 추가)

**Interfaces:**
- Consumes: Task 1 의 `diagnose`, `formatReport`
- Produces:
  - `resolvePair(dir: string, read?: (p: string) => string|null) -> { ext: '.md'|'.mdx', ko: string, en: string } | null`
  - CLI: `node scripts/drift-blocks.mjs <dir> [<dir>…] [--vs-head]`, 항상 exit 0

- [ ] **Step 1: 실패하는 테스트를 쓴다**

먼저 import 줄에 `resolvePair` 를 더한다:

```js
import { alignKinds, diagnose, formatReport, resolvePair } from './drift-blocks.mjs';
```

그리고 `scripts/drift-blocks.test.mjs` 끝에 추가:

```js
test('.mdx 짝도 찾는다', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'drift-blocks-'));
  try {
    writeFileSync(path.join(dir, 'ko.mdx'), `${FM('가')}문단\n`);
    writeFileSync(path.join(dir, 'en.mdx'), `${FM('A')}paragraph\n`);
    const pair = resolvePair(dir);
    assert.equal(pair.ext, '.mdx');
    assert.deepEqual(diagnose(pair.ko, pair.en).only, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('짝이 없으면 null 을 준다', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'drift-blocks-'));
  try {
    writeFileSync(path.join(dir, 'ko.md'), `${FM('가')}문단\n`);
    assert.equal(resolvePair(dir), null); // en 이 없다 — check-bilingual 의 몫이다
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('어긋난 짝을 넣어도 exit 0 이다 — 게이트가 아니라 진단 도구다', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'drift-blocks-'));
  try {
    writeFileSync(path.join(dir, 'ko.md'), `${FM('가')}문단입니다\n- 목록 항목\n`);
    writeFileSync(path.join(dir, 'en.md'), `${FM('A')}A paragraph\n\n- list item\n`);
    // execFileSync 는 exit 코드가 0 이 아니면 던진다 — 통과 자체가 exit 0 의 증명이다.
    const out = execFileSync('node', [SCRIPT, dir], { encoding: 'utf8' });
    assert.match(out, /en 에만/);
    assert.match(out, /ko 1블록 \/ en 2블록/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test`
Expected: FAIL — `SyntaxError: The requested module './drift-blocks.mjs' does not provide an export named 'resolvePair'`

- [ ] **Step 3: CLI 를 구현한다**

`scripts/drift-blocks.mjs` 끝에 추가:

```js
// ── 짝 해석 ─────────────────────────────────────────────────────────────────

const EXTS = ['.md', '.mdx'];
const fromDisk = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);

/** 글 폴더에서 ko/en 짝을 찾는다. read 를 바꾸면 HEAD 시점도 같은 코드로 읽는다. */
export function resolvePair(dir, read = fromDisk) {
  for (const ext of EXTS) {
    const ko = read(`${dir}/ko${ext}`);
    const en = read(`${dir}/en${ext}`);
    if (ko != null && en != null) return { ext, ko, en };
  }
  return null;
}

function showAtHead(p) {
  try {
    return execFileSync('git', ['show', `HEAD:${p}`], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null; // HEAD 에 없는 새 글
  }
}

// ── 실행 ────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);
  const vsHead = argv.includes('--vs-head');
  const dirs = argv.filter((a) => !a.startsWith('--')).map((d) => d.replace(/\/+$/, ''));

  if (dirs.length === 0) {
    console.error('사용법: node scripts/drift-blocks.mjs <글폴더> [<글폴더>…] [--vs-head]');
    process.exit(0); // 진단 도구는 어떤 경우에도 0 이다
  }

  for (const dir of dirs) {
    const now = resolvePair(dir);
    if (!now) {
      console.log(`${dir}   ko/en 짝을 찾지 못했습니다 (.md·.mdx 둘 다 없음)`);
      continue;
    }
    if (vsHead) {
      // 구조 위반을 마주쳤을 때의 첫 질문은 "내가 깨뜨렸나, 원래 그랬나" 다.
      const head = resolvePair(dir, showAtHead);
      console.log(
        head
          ? formatReport(`[HEAD] ${dir}`, diagnose(head.ko, head.en))
          : `[HEAD] ${dir}   HEAD 에 이 짝이 없습니다 (새로 추가된 글)`,
      );
    }
    console.log(formatReport(vsHead ? `[현재] ${dir}` : dir, diagnose(now.ko, now.en)));
  }
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm test`
Expected: PASS — 전부 통과.

- [ ] **Step 5: 실제 글로 손검증**

```bash
node scripts/drift-blocks.mjs src/content/posts/claude/routine --vs-head
node scripts/check-drift.mjs --worktree --structure-only   # 무료. 구조 검사만
```

두 번째 명령이 `블록 수가 다릅니다` / `블록 종류가 갈립니다` 로 짚은 폴더를 `drift-blocks.mjs` 에 넣었을 때 **같은 폴더에서 어긋남이 나와야 한다.** 안 나오면 두 도구가 다른 파서를 보고 있다는 뜻이므로 멈추고 원인을 찾는다.

- [ ] **Step 6: 커밋**

```bash
git add scripts/drift-blocks.mjs scripts/drift-blocks.test.mjs
git commit -m "feat(scripts): drift-blocks CLI 와 --vs-head 비교"
```

---

### Task 3: `/routine-review` 슬래시 커맨드

**Files:**
- Create: `.claude/commands/routine-review.md`
- Modify: `CLAUDE.md` (핵심 파일 표 + drift 절의 "직접 돌리기" 코드블록)
- 참조: `docs/superpowers/specs/2026-08-03-routine-review-command-design.md`, `.claude/commands/fix-drift.md`

**Interfaces:**
- Consumes: `node scripts/drift-blocks.mjs <폴더>… [--vs-head]`, `node scripts/check-drift.mjs --dir <폴더>`
- Produces: `/routine-review [브랜치명] [--except <글폴더>...]`

- [ ] **Step 1: 프론트매터를 쓴다**

```yaml
---
description: routine 이 올린 ko/en 점검 브랜치를 워크트리로 받아 고치고 main 에 병합·배포한다
argument-hint: "[브랜치명 — 생략하면 origin 의 최신 claude/*] [--except <글폴더>...]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git fetch:*), Bash(git ls-remote:*), Bash(git worktree:*), Bash(node scripts/drift-blocks.mjs:*), Bash(node scripts/check-drift.mjs:*), Read, Edit, Glob, Grep, WebFetch
---
```

`allowed-tools` 는 **읽기·진단만** 미리 연다. `git merge`·`git commit`·`git push`·`gh` 는 일부러 빼서 매번 확인을 받게 한다 — 되돌리기 어려운 것들이고, 커맨드가 체크포인트에서 멈추는 설계와 결이 같다.

- [ ] **Step 2: 본문을 쓴다**

스펙의 ①~⑦ 을 아래 골격으로 옮긴다. 각 절 아래에 **반드시 들어가야 하는 문장**을 함께 적는다 — 이게 빠지면 커맨드가 스펙과 다른 물건이 된다.

````markdown
`$ARGUMENTS` 를 해석한다. 첫 비플래그 인자가 브랜치명, `--except` 뒤의 값들이 손대지 말 글 폴더다.
`--except` 값은 `src/content/` 접두를 생략할 수 있다(`pages/cv` = `src/content/pages/cv`).

## 1. 작업 워크트리 확보

브랜치를 안 줬으면 `git ls-remote --heads origin 'refs/heads/claude/*'` 로 최신 것을 골라 **확인을 받는다.**

```bash
git fetch origin
git worktree add .claude/worktrees/<브랜치 마지막 세그먼트> <브랜치>
cd .claude/worktrees/<브랜치 마지막 세그먼트>
git merge main
```

- **원본 저장소(`~/GithubBlog`)는 `main` 에 그대로 둔다.** 사용자의 dev 서버도 편집 중인 파일도 건드리면 안 된다.
- 머지 방향은 **main → 브랜치**다. 반대로 하면 검증 안 된 내용이 main 에 섞인다.
- `npm install` 은 하지 않는다. 검사 스크립트는 전부 node 빌트인만 쓴다.

## 2. 리포트 파악

`docs/reports/bilingual-check-*.md` 를 읽어 **글 폴더별로** 항목을 쪼갠다. `--except` 폴더는 여기서 뺀다.
리포트가 없거나 지적이 0건이면 그 사실만 알리고 끝낸다. **브랜치를 억지로 main 에 병합하지 않는다.**

## 3. 사실 재검증 — 고치기 전에 반드시

리포트의 **사실 지적만** 확인한다. 표현·오타는 대상이 아니다.

- 공식 문서는 WebFetch 로 **원문을 읽는다.** 리포트의 요약을 믿지 않는다.
- 실행으로 확인되는 건 실행한다.
- **리포트의 전제 자체를 의심한다.** 코드를 읽으면 전제가 틀린 경우가 있다.
- **"문서에서 확인 불가"는 오류의 근거가 아니다.** 부재의 증거일 뿐이다.

## 체크포인트 ① — 승인 없이 4번으로 가지 않는다

표로 제시한다: 통과한 사실 지적(무엇으로 확인했는지) / **탈락한 건과 이유** / 글별 수정 계획과 배정할 모델.

## 4. 수정 — 글마다 서브에이전트 (병렬)

글 수와 무관하게 **항상** 서브에이전트를 쓴다. 손이 많이 가면 Opus, 오타·표기 위주면 Sonnet.

각 에이전트에게 그 글의 리포트 발췌 + 3번에서 살아남은 사실 + 아래 제약을 준다:

- 담당 폴더 밖 금지 — 다른 에이전트가 동시에 돌고 있다
- 미커밋 WIP 폴더는 열지도 말 것
- **`ko` 가 SSOT. ko 는 오타·비문·명시된 사실 수정만. 그 이상 고치고 싶으면 고치지 말고 보고할 것**
- ko 내용이 바뀌면 en 에도 반영할 것
- 헤딩 개수·표 행/열·코드블록·이미지 참조 수를 ko/en 일치시킬 것
- 이미지는 `ko.md` 가 `.ko.`, `en.md` 가 `.en.`
- **줄 번호를 믿지 말고 문자열로 찾을 것** — 앞선 수정으로 밀린다
- 헤딩을 바꾸면 앵커가 바뀐다. **그 헤딩으로 오는 링크를 먼저 확인할 것**
- SVG 에 항목이 늘면 좌표를 재배치하고 ko/en 기하를 동일하게 유지할 것
- 커밋·브랜치 변경 금지. 유료 `npm run drift` 금지
- 보고는 항목별 `[고침] / [안 고침 — 이유]`

## 5. 구조 정렬 — 6번보다 먼저

```bash
node scripts/drift-blocks.mjs <폴더1> <폴더2> … --vs-head
```

**구조 위반이 있으면 의미 검사가 아예 안 돈다.** 안 고치고 6번에 가면 통과한 것처럼 보이다가
나중에 구조가 풀리는 순간 첫 판정이 쏟아진다.

- `--vs-head` 로 "내가 깨뜨렸나, 원래 그랬나"를 먼저 가린다.
- 대개는 **ko 가 빈 줄을 빠뜨려 두 블록이 붙은 것**이다. 빈 줄을 넣어도 렌더 결과는 안 바뀐다.
- 목차 앵커 불일치는 **고칠 수 있는 게 아니다.** 마커로 면제하되 **ko·en 양쪽에** 넣는다:
  `<!-- i18n-intentional(links): 목차 앵커는 헤딩 텍스트에서 나오므로 한/영이 다를 수밖에 없습니다 -->`
  범위는 `links`·`images` 뿐이고, 이름을 틀리면 조용히 무시되지 않고 막힌다.

## 6. drift 수렴

```bash
node scripts/check-drift.mjs --dir <폴더>
```

**`--worktree` 를 쓰지 않는다.** 이 모드는 설계상 미커밋 초안까지 훑어 유료 검사를 돌린다.

- 라운드마다 새 건이 나오는 건 **정상**이다 — en 을 고치면 그 자체가 새 비교 대상이 된다.
- 호출 1회 약 $0.5. 누적 비용을 라운드마다 보고한다.
- `DRIFT_MAX_ROUNDS`(기본 3) 에 닿으면 스크립트가 유예로 전환해 **그대로 배포된다.** 닿기 전에 체크포인트 ② 로 올린다.
- 출력에서 `의미 검사를 건너뜁니다` 를 **명시적으로 찾는다.** fail-open 은 통과처럼 보이지만 검증된 게 아니다.

## 체크포인트 ②

`git diff --stat` + 카테고리별 요약 / **리포트 밖 발견**(고친 것·못 고친 것 나눠서) / 누적 비용 /
**미결**(유예로 넘어간 건, fail-open 으로 건너뛴 폴더) / 되돌리기 어려운 것(URL 변경 등)은 따로 묻는다.

## 7. 커밋·병합·배포

**작업 워크트리에서**

1. 스테이징은 **리포트가 짚은 폴더만 명시적으로.** `git add src/content` 는 미커밋 초안까지 쓸어담는다.
2. 커밋 — 카테고리별로 무엇을 왜 고쳤는지. 유예로 남은 건이 있으면 함께 남긴다.
3. `git push origin <브랜치>`

**원본 저장소에서** (워크트리에서는 main 을 체크아웃할 수 없다)

4. `git fetch origin` → 5. `git merge --ff-only <브랜치>` → 6. `git push origin main` → 7. `gh run watch`

**라이브 점검** — 새 내용이 있는지와 **옛 내용이 사라졌는지를 둘 다** 본다. SVG 는 해시 URL 을 따라가 파일 안까지 확인한다.
`draft: true` 인 글이 프로덕션에서 404 인 건 정상이다(dev 에서는 보여서 배포 실패로 오해하기 쉽다).

**워크트리 정리** — 사용자가 승인하면 `git worktree remove`. 거부했거나 실패로 멈췄으면 **남긴다.**

## 막혔을 때

- **3번에서 사실 지적이 전부 탈락** — 정상이다. 표현·오타·drift 는 남아 있으므로 4번으로 간다.
- **체크포인트 거부** — 수정을 작업 트리에 그대로 두고 멈춘다. 되돌리지 않는다.
- **`merge --ff-only` 실패** — 작업하는 사이 누가 main 에 커밋했다. **강제로 밀지 않는다.** 1번으로 돌아가 main 을 다시 당기고 6번을 다시 통과시킨다.
- **pre-commit 이 막을 때** — 정상 동작이다. `SKIP_DRIFT=1`·`--no-verify` 는 **사용자가 명시적으로 지시할 때만.**
- **글 폴더를 rename 했을 때** — ① 인바운드 링크 전부 갱신, ② 공개 URL 이 바뀌므로 체크포인트에서 먼저 승인, ③ drift 캐시의 옛 경로 항목을 지운다(남은 `attempts` 가 나중에 유예를 앞당긴다).
- **렌더 확인이 필요할 때** — 작업 워크트리에서 `npm install` 후 **`npm run dev -- 4322`**. **4321 은 쓰지 않는다**(사용자 서버). 끝나면 `npm run dev:stop`. `npm run build` 는 쓰지 않는다.
````

- [ ] **Step 3: `CLAUDE.md` 에 반영한다**

핵심 파일 표에서 `scripts/check-drift.mjs + .claude/commands/fix-drift.md` 행 **바로 아래**에 추가:

```markdown
| `scripts/drift-blocks.mjs` | ko/en 블록 정렬 진단 — "몇 번째 블록이 한쪽에만 있는지"를 줄 번호와 함께. 무료·`exit 0` |
| `.claude/commands/routine-review.md` | routine 브랜치를 워크트리로 받아 고치고 main 에 병합·배포하는 전 과정 |
```

drift 절의 "직접 돌리기 · 넘기기" 코드블록에 한 줄 추가:

```bash
node scripts/drift-blocks.mjs <글폴더> --vs-head  # 블록 수가 갈릴 때 어디인지 (무료)
```

- [ ] **Step 4: 커맨드가 로드되는지 확인한다**

Run: `npm test && npx astro check`
Expected: 테스트 통과, astro check 에 새 에러 없음(마크다운·스크립트만 건드렸으므로 무영향).

`/routine-review` 를 세션에서 타이핑해 `description` 과 `argument-hint` 가 뜨는지 본다. 안 뜨면 `/hooks` 를 한 번 열거나 세션을 재시작한다.

- [ ] **Step 5: 커밋**

```bash
git add .claude/commands/routine-review.md CLAUDE.md
git commit -m "feat(commands): /routine-review — routine 브랜치를 받아 배포까지"
```

- [ ] **Step 6: 계획 문서를 저장소에 남긴다**

이 계획을 `docs/superpowers/plans/2026-08-03-routine-review-command.md` 로 복사해 커밋한다(스펙과 짝을 이룬다).

```bash
git add docs/superpowers/plans/2026-08-03-routine-review-command.md
git commit -m "docs(plan): /routine-review 구현 계획"
```

---

## Verification

1. **단위** — `npm test`. 새 8개 + 기존 전부 통과.
2. **두 도구의 일치** — `node scripts/check-drift.mjs --worktree --structure-only`(무료) 가 짚은 폴더를 `node scripts/drift-blocks.mjs <그 폴더> --vs-head` 에 넣어, 같은 폴더에서 어긋남이 나오는지 본다. 안 나오면 파서가 갈린 것이다.
3. **`--vs-head`** — 아무 글 폴더에서 `ko.md` 의 리스트 앞 빈 줄을 일부러 지우고 `--vs-head` 를 돌려, `[HEAD]` 는 `정렬 일치` 인데 `[현재]` 만 어긋나는지 확인한 뒤 `git checkout` 으로 되돌린다.
4. **exit 0** — `node scripts/drift-blocks.mjs <어긋난 폴더>; echo $?` → `0`.
5. **커맨드** — `/routine-review` 가 자동완성에 뜨고 `argument-hint` 가 보이는지. 실제 실행은 다음 routine 리포트가 올 때.

## 확정한 판단

- **`allowed-tools` 는 읽기·진단만 연다.** `merge`·`commit`·`push`·`gh` 는 매번 확인을 받는다 — 되돌리기 어렵고, 체크포인트 설계와 결이 같다.
- **`drift-blocks.mjs` 는 폴더를 여러 개 받는다.** 스펙은 하나지만 5단계가 "폴더마다" 돌리므로 2줄로 왕복을 없앤다.
- **`package.json` 에 스크립트를 추가하지 않는다.** 커맨드가 `node scripts/…` 를 직접 부른다.
- **코드블록 번호는 "ko 기준 n번째"** 로 센다. 한쪽에만 있는 코드블록이 있으면 양쪽 번호가 갈리므로 기준을 못박아야 한다.
