/*
 * check-bilingual.mjs 의 drift 예외 동작 테스트 — node --test scripts/*.test.mjs
 *
 * "짝을 함께 고쳐라"는 drift 를 막으려는 대리 규칙이므로, drift 가 직접 검증된
 * 바이트 쌍이면 한쪽만 바뀐 변경도 통과해야 한다. 임시 git 저장소를 만들어
 * 실제 스크립트를 --staged 로 돌려 확인한다(LLM 은 부르지 않는다).
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { sha } from './check-drift.mjs';

const SCRIPT = path.resolve(import.meta.dirname, 'check-bilingual.mjs');
const POST = 'src/content/posts/demo';
const KO = '---\ntitle: "가"\n---\n\n본문입니다\n';
const EN = '---\ntitle: "A"\n---\n\nThis is the body\n';

function makeRepo() {
  const repo = mkdtempSync(path.join(tmpdir(), 'bilingual-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'test');
  mkdirSync(path.join(repo, POST), { recursive: true });
  writeFileSync(path.join(repo, POST, 'ko.md'), KO);
  writeFileSync(path.join(repo, POST, 'en.md'), EN);
  git('add', '-A');
  git('commit', '-qm', 'init');
  return { repo, git };
}

/** en.md 만 바꿔 스테이징한다. */
function stageEnOnly(repo, git, body) {
  writeFileSync(path.join(repo, POST, 'en.md'), body);
  git('add', `${POST}/en.md`);
}

function writeCache(repo, { ko, en, semantic = true }) {
  writeFileSync(
    path.join(repo, '.git', 'ko-en-drift-cache.json'),
    JSON.stringify({ [POST]: { ko: sha(ko), en: sha(en), semantic } }),
  );
}

const run = (repo) =>
  spawnSync(process.execPath, [SCRIPT, '--staged'], { cwd: repo, encoding: 'utf8' });

test('짝 중 한쪽만 바뀌면 기본적으로 막는다', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  stageEnOnly(repo, git, EN + '\nAn added line\n');
  const res = run(repo);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /짝 동기화 위반/);
});

test('en 만 바뀌어 막히면 ko 를 건드리지 말라고 안내한다', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  stageEnOnly(repo, git, EN + '\nAn added line\n');
  const { stderr } = run(repo);
  assert.match(stderr, /ko 는 SSOT 이니 건드리지 마세요/);
  assert.match(stderr, /check-drift\.mjs --worktree/);
});

test('ko 만 바뀌어 막히면 en 을 갱신하라고 안내한다', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeFileSync(path.join(repo, POST, 'ko.md'), KO + '\n덧붙임\n');
  git('add', `${POST}/ko.md`);
  const { status, stderr } = run(repo);
  assert.equal(status, 2);
  assert.match(stderr, /ko 가 SSOT 입니다.+en\.md 을 이 변경에 맞춰 갱신하세요/);
  assert.doesNotMatch(stderr, /건드리지 마세요/); // en 쪽 안내가 새어나오면 안 된다
});

test('ko 만 바뀌어도 검사 자체는 짝을 잡는다 — 막는 주체가 다를 뿐', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  // ko 에만 링크를 넣고 ko 만 스테이징 → drift 검사를 직접 돌리면 인덱스의 en 과 비교해 잡아낸다.
  writeFileSync(path.join(repo, POST, 'ko.md'), KO.replace('본문입니다', '본문 [문서](https://a.example)'));
  git('add', `${POST}/ko.md`);
  const res = spawnSync(
    process.execPath,
    [path.resolve(import.meta.dirname, 'check-drift.mjs'), '--staged', '--structure-only'],
    { cwd: repo, encoding: 'utf8' },
  );
  assert.equal(res.status, 2);
  assert.match(res.stderr, /링크 주소 집합이 다릅니다/);
});

test('그 바이트 쌍으로 drift 검사를 통과한 기록이 있으면 en 단독 변경을 허용한다', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const fixed = EN.replace('This is the body', 'This is **the body**');
  stageEnOnly(repo, git, fixed);
  writeCache(repo, { ko: KO, en: fixed });
  assert.equal(run(repo).status, 0);
});

test('캐시의 en 해시가 스테이징 내용과 다르면 허용하지 않는다', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const fixed = EN.replace('This is the body', 'This is **the body**');
  stageEnOnly(repo, git, fixed);
  writeCache(repo, { ko: KO, en: 'en 이 그 사이 또 바뀐 경우' });
  assert.equal(run(repo).status, 2);
});

test('캐시의 ko 해시가 현재 ko 와 다르면 허용하지 않는다', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const fixed = EN.replace('This is the body', 'This is **the body**');
  stageEnOnly(repo, git, fixed);
  writeCache(repo, { ko: 'ko 가 그 사이 바뀐 경우', en: fixed });
  assert.equal(run(repo).status, 2);
});

test('구조 검사만 통과한 기록(semantic:false)으로는 허용하지 않는다', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const fixed = EN.replace('This is the body', 'This is **the body**');
  stageEnOnly(repo, git, fixed);
  writeCache(repo, { ko: KO, en: fixed, semantic: false });
  assert.equal(run(repo).status, 2);
});

test('짝을 둘 다 바꾸면 캐시 없이도 통과한다', (t) => {
  const { repo, git } = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeFileSync(path.join(repo, POST, 'ko.md'), KO + '\n덧붙임\n');
  writeFileSync(path.join(repo, POST, 'en.md'), EN + '\nAddendum\n');
  git('add', '-A');
  assert.equal(run(repo).status, 0);
});
