/*
 * check-drift.mjs 구조 검사 테스트 — node --test scripts/
 *
 * 회귀 픽스처는 실제 커밋에서 가져온다:
 *   fca7f6f  파이썬 2편이 처음 들어온 커밋 (en 이 ko 대비 drift 있는 상태)
 *   HEAD     drift 를 고친 뒤
 * LLM 은 부르지 않는다 — 결정적인 부분만 검증한다.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  analyze,
  buildPrompt,
  compareStructure,
  normalizeImage,
  parseFrontmatter,
} from './check-drift.mjs';

const POST = 'src/content/posts/python/02-variables-are-name-tags';
const show = (rev, f) => execFileSync('git', ['show', `${rev}:${POST}/${f}`], { encoding: 'utf8' });
const check = (koSrc, enSrc) => compareStructure(analyze(koSrc), analyze(enSrc));

test('frontmatter 를 본문과 분리하고 키를 읽는다', () => {
  const { fm, body } = parseFrontmatter('---\ntitle: "가"\ndraft: true\n---\n\n본문\n');
  assert.equal(fm.draft, 'true');
  assert.equal(fm.title, '"가"');
  assert.equal(body.trim(), '본문');
});

test('frontmatter 가 없으면 전체가 본문이다', () => {
  const { fm, body, bodyStartLine } = parseFrontmatter('# 제목\n');
  assert.deepEqual(fm, {});
  assert.equal(body, '# 제목\n');
  assert.equal(bodyStartLine, 1);
});

test('이미지 경로에서 언어 접미사만 떼어낸다', () => {
  assert.equal(normalizeImage('./image/hero.ko.svg'), './image/hero.svg');
  assert.equal(normalizeImage('./image/hero.en.svg'), './image/hero.svg');
  assert.equal(normalizeImage('./image/Python-2.png'), './image/Python-2.png');
});

test('블록 종류를 구분한다', () => {
  const a = analyze('## 제목\n\n문단\n\n```python\nx = 1\n```\n\n> 콜아웃\n\n- 목록\n');
  assert.deepEqual(a.kinds, ['heading:2', 'para', 'code:python', 'callout', 'list']);
});

test('코드블록 안의 # 는 헤딩으로 세지 않는다', () => {
  const a = analyze('```python\n# 주석입니다\nx = 1\n```\n');
  assert.deepEqual(a.kinds, ['code:python']);
  assert.equal(a.blocks[0].codeLines, 2);
});

test('실제 글: drift 를 고친 뒤에는 구조도 힌트도 깨끗하다', () => {
  const { hard, hints } = check(show('HEAD', 'ko.md'), show('HEAD', 'en.md'));
  assert.deepEqual(hard, []);
  assert.deepEqual(hints, []);
});

test('실제 글: 고치기 전에는 en 에만 있던 문장을 길이비 힌트가 짚는다', () => {
  const { hard, hints } = check(show('fca7f6f', 'ko.md'), show('fca7f6f', 'en.md'));
  // 블록 경계는 안 깨졌으므로 하드 위반은 없다 — 이 사례는 힌트 + LLM 의 몫이다.
  assert.deepEqual(hard, []);
  assert.equal(hints.length, 1);
  assert.equal(hints[0].koLine, 38);
  assert.match(hints[0].note, /유난히 깁니다/);
});

test('en 에서 링크가 빠지면 하드 위반이다', () => {
  const ko = '본문 [문서](https://a.example) 와 [피이피](https://b.example)\n';
  const en = 'Body [doc](https://a.example)\n';
  const { hard } = check(ko, en);
  assert.equal(hard.length, 1);
  assert.equal(hard[0].kind, 'links');
  assert.match(hard[0].why, /b\.example/);
});

test('en 에서 이미지가 빠지면 하드 위반이다', () => {
  const ko = '![설명](./image/hero.ko.svg)\n\n문단입니다\n';
  const en = '문단입니다\n';
  const { hard } = check(ko, en);
  assert.ok(hard.some((h) => h.kind === 'block-count'));
  assert.ok(hard.some((h) => h.kind === 'images'));
});

test('같은 이미지를 ko/en 판으로 각각 참조하면 위반이 아니다', () => {
  const { hard } = check('![가](./image/hero.ko.svg)\n', '![a](./image/hero.en.svg)\n');
  assert.deepEqual(hard, []);
});

test('표에서 행이 빠지면 하드 위반이다', () => {
  const ko = '| 가 | 나 |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n';
  const en = '| a | b |\n| --- | --- |\n| 1 | 2 |\n';
  const { hard } = check(ko, en);
  assert.equal(hard.length, 1);
  assert.equal(hard[0].kind, 'table-shape');
  // 행 수는 헤더를 포함하고 구분선(|---|)만 뺀다 — ko 헤더+2 / en 헤더+1
  assert.match(hard[0].why, /ko 3행×2열 \/ en 2행×2열/);
});

test('코드블록 줄 수가 다르면 하드 위반이다', () => {
  const ko = '```python\nx = 1\ny = 2\n```\n';
  const en = '```python\nx = 1\n```\n';
  const { hard } = check(ko, en);
  assert.equal(hard.length, 1);
  assert.equal(hard[0].kind, 'code-lines');
});

test('코드 주석만 번역된 코드블록은 위반이 아니다', () => {
  const ko = '```python\nx = 1   # 하나를 붙인다\n```\n';
  const en = '```python\nx = 1   # bind one\n```\n';
  assert.deepEqual(check(ko, en).hard, []);
});

test('date · draft 가 어긋나면 하드 위반이다', () => {
  const ko = '---\ntitle: "가"\ndate: 2026-07-31\ndraft: true\n---\n\n본문\n';
  const en = '---\ntitle: "A"\ndate: 2026-08-01\ndraft: false\n---\n\nBody\n';
  const { hard } = check(ko, en);
  assert.equal(hard.filter((h) => h.kind === 'frontmatter').length, 2);
});

test('title · description 이 다른 건 번역이므로 위반이 아니다', () => {
  const ko = '---\ntitle: "가"\ndescription: "설명"\ndate: 2026-07-31\n---\n\n본문\n';
  const en = '---\ntitle: "A"\ndescription: "Desc"\ndate: 2026-07-31\n---\n\nBody\n';
  assert.deepEqual(check(ko, en).hard, []);
});

test('헤딩 레벨이 갈리면 첫 지점만 보고한다', () => {
  const ko = '## 가\n\n본문\n\n## 나\n\n본문\n';
  const en = '### a\n\nbody\n\n### b\n\nbody\n';
  const { hard } = check(ko, en);
  assert.equal(hard.filter((h) => h.kind === 'block-kind').length, 1);
});

// ── i18n-intentional 마커(의도된 ko/en 차이) ────────────────────────────────
// ko/en 이 다른 것이 맞는 지점(예: 한/영 포트폴리오가 별도 문서라 링크가 다름)을
// 작성자가 표시해두면 구조 검사에서 그 지점만 빠진다. 표시 안 한 곳은 그대로 잡힌다.

const CONTACT = (portfolio, mark) =>
  [
    '## 연락처',
    '',
    '- GitHub: [g](https://github.com/raewoo0908)',
    `- 포트폴리오: [n](${portfolio})${mark ? ` ${mark}` : ''}`,
  ].join('\n');

test('줄 끝 마커는 그 줄의 링크만 비교에서 뺀다', () => {
  const ko = CONTACT('https://notion.example/ko', '<!-- i18n-intentional(links): 한/영 포트폴리오가 별도 문서 -->');
  const en = CONTACT('https://notion.example/en', '<!-- i18n-intentional(links): separate ko/en portfolios -->');
  assert.deepEqual(check(ko, en).hard, []);
});

test('마커가 붙지 않은 같은 블록의 다른 링크는 그대로 잡는다', () => {
  const mark = '<!-- i18n-intentional(links) -->';
  const ko = CONTACT('https://notion.example/ko', mark).replace('github.com/raewoo0908', 'github.com/ko');
  const en = CONTACT('https://notion.example/en', mark).replace('github.com/raewoo0908', 'github.com/en');
  const { hard } = check(ko, en);
  assert.equal(hard.length, 1);
  assert.equal(hard[0].kind, 'links');
  assert.match(hard[0].why, /github\.com\/ko/);
  assert.match(hard[0].why, /github\.com\/en/);
  // 마커가 붙은 포트폴리오 링크는 보고에 끼면 안 된다
  assert.doesNotMatch(hard[0].why, /notion\.example/);
});

test('단독 주석 블록 마커는 다음 블록 전체에 적용된다', () => {
  const doc = (a, b) =>
    ['<!-- i18n-intentional(links): 아래 목록의 링크는 언어별로 다릅니다 -->', '', `- [x](${a})`, `- [y](${b})`].join('\n');
  assert.deepEqual(check(doc('https://a.example/ko', 'https://b.example/ko'), doc('https://a.example/en', 'https://b.example/en')).hard, []);
});

test('여러 줄에 걸친 단독 주석 블록도 마커로 인식한다', () => {
  const doc = (url) =>
    [
      '<!-- i18n-intentional(links): 아래 링크는 언어별로 다른 문서를 가리킵니다.',
      '     의도된 설계이므로 같게 맞추지 마세요. -->',
      '',
      `- [x](${url})`,
    ].join('\n');
  assert.deepEqual(check(doc('https://a.example/ko'), doc('https://a.example/en')).hard, []);
});

test('괄호를 생략한 마커는 links·images 를 모두 덮는다', () => {
  const doc = (lang) =>
    `- [x](https://a.example/${lang}) ![그림](./image/only-${lang}.png) <!-- i18n-intentional: 언어별 자료 -->`;
  assert.deepEqual(check(doc('ko'), doc('en')).hard, []);
});

test('(images) 마커는 링크 차이까지 봐주지는 않는다', () => {
  const doc = (lang) => `- [x](https://a.example/${lang}) <!-- i18n-intentional(images) -->`;
  const { hard } = check(doc('ko'), doc('en'));
  assert.equal(hard.length, 1);
  assert.equal(hard[0].kind, 'links');
});

test('마커가 한쪽에만 있으면 여전히 막는다', () => {
  const ko = `- [x](https://a.example/ko) <!-- i18n-intentional(links) -->`;
  const en = `- [x](https://a.example/en)`;
  assert.ok(check(ko, en).hard.some((h) => h.kind === 'links'));
});

test('범위 이름 오타는 조용히 무시하지 않고 막는다', () => {
  const doc = `- [x](https://a.example) <!-- i18n-intentional(link) -->`;
  const { hard } = check(doc, doc);
  assert.equal(hard.length, 1);
  assert.equal(hard[0].kind, 'intentional-scope');
  assert.match(hard[0].why, /link/);
  assert.match(hard[0].why, /links, images/); // 쓸 수 있는 값을 알려준다
});

test('analyze 가 마커의 위치와 사유를 남긴다', () => {
  const a = analyze('---\ntitle: "가"\n---\n\n- [x](https://a.example) <!-- i18n-intentional(links): 별도 문서입니다 -->\n');
  assert.equal(a.intentional.length, 1);
  assert.equal(a.intentional[0].line, 5);
  assert.deepEqual(a.intentional[0].scopes, ['links']);
  assert.equal(a.intentional[0].note, '별도 문서입니다');
});

test('의도된 차이는 의미 검사 프롬프트에도 실린다', () => {
  const prompt = buildPrompt('ko 본문', 'en body', [], [
    { line: 5, scopes: ['links'], note: '별도 문서입니다' },
  ]);
  assert.match(prompt, /의도된 차이/);
  assert.match(prompt, /ko 5행/);
  assert.match(prompt, /별도 문서입니다/);
});

test('마커가 없으면 프롬프트에 그 절이 생기지 않는다', () => {
  assert.doesNotMatch(buildPrompt('ko', 'en', [], []), /의도된 차이/);
});

test('실제 CV: 포트폴리오 링크가 달라도 구조 검사를 통과한다', () => {
  const read = (f) => readFileSync(path.join(import.meta.dirname, '..', 'src/content/pages/cv', f), 'utf8');
  const { hard } = check(read('ko.md'), read('en.md'));
  assert.deepEqual(hard, []);
});

// ── 라운드 상한(유예) ────────────────────────────────────────────────────────
// attempts 가 상한이면 LLM 을 부르기 **전에** 갈라지므로 아래 테스트는 모두 무료·결정적이다.

const SCRIPT = path.resolve(import.meta.dirname, 'check-drift.mjs');
const DEMO = 'src/content/posts/demo';

function makeRepo({ koBody, enBody, cache }) {
  const repo = mkdtempSync(path.join(tmpdir(), 'drift-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'test');
  mkdirSync(path.join(repo, DEMO), { recursive: true });
  writeFileSync(path.join(repo, DEMO, 'ko.md'), koBody);
  writeFileSync(path.join(repo, DEMO, 'en.md'), enBody);
  git('add', '-A');
  if (cache) {
    writeFileSync(path.join(repo, '.git', 'ko-en-drift-cache.json'), JSON.stringify({ [DEMO]: cache }));
  }
  return repo;
}

const runStaged = (repo) =>
  spawnSync(process.execPath, [SCRIPT, '--staged'], { cwd: repo, encoding: 'utf8' });
const cacheOf = (repo) =>
  JSON.parse(readFileSync(path.join(repo, '.git', 'ko-en-drift-cache.json'), 'utf8'))[DEMO];

const KO = '---\ndate: 2026-08-02\n---\n\n본문입니다\n';
const EN = '---\ndate: 2026-08-02\n---\n\nThis is the body\n';

test('연속 차단이 상한에 닿으면 LLM 을 부르지 않고 경고만 하고 통과시킨다', (t) => {
  const repo = makeRepo({
    koBody: KO,
    enBody: EN,
    cache: {
      attempts: 3,
      lastFindings: [{ kind: 'diverged', koLine: 5, enLine: 5, why: '강도가 다릅니다' }],
    },
  });
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  const res = runStaged(repo);
  assert.equal(res.status, 0);
  assert.match(res.stderr, /3회 연속 막혀서 이번엔 통과시킵니다/);
  assert.match(res.stderr, /강도가 다릅니다/); // 남은 건을 그대로 보여준다
  assert.equal(cacheOf(repo).waived, true);
  assert.equal(cacheOf(repo).semantic, true); // 통과로 기록돼 다음 커밋은 캐시 적중
});

test('상한에 닿아도 구조 위반은 유예하지 않는다', (t) => {
  const repo = makeRepo({
    koBody: KO.replace('본문입니다', '본문 [가](https://a.example) [나](https://b.example)'),
    enBody: EN.replace('This is the body', 'Body [a](https://a.example)'),
    cache: { attempts: 3, lastFindings: [] },
  });
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  const res = runStaged(repo);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /링크 주소 집합이 다릅니다/);
});

test('DRIFT_MAX_ROUNDS 로 상한을 올리면 유예하지 않는다', (t) => {
  const repo = makeRepo({ koBody: KO, enBody: EN, cache: { attempts: 3, lastFindings: [] } });
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  // 상한을 올렸으니 유예 대신 실제 판정으로 가야 한다. SKIP_DRIFT 로 LLM 만 막아
  // "유예 경로로 빠지지 않았다"는 것만 확인한다.
  const res = spawnSync(process.execPath, [SCRIPT, '--staged'], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, DRIFT_MAX_ROUNDS: '99', SKIP_DRIFT: '1' },
  });
  assert.equal(res.status, 0);
  assert.doesNotMatch(res.stderr, /연속 막혀서/);
  assert.equal(cacheOf(repo).waived, undefined);
});

test('통과하면 attempts 가 사라져 카운터가 리셋된다', (t) => {
  const repo = makeRepo({ koBody: KO, enBody: EN, cache: { attempts: 2, lastFindings: [] } });
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  const res = spawnSync(process.execPath, [SCRIPT, '--staged'], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, SKIP_DRIFT: '1' },
  });
  assert.equal(res.status, 0);
  assert.equal(cacheOf(repo).attempts, undefined);
});
