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

import { alignKinds, diagnose, formatReport, resolvePair } from './drift-blocks.mjs';

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
