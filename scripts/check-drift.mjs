#!/usr/bin/env node
/*
 * ko(SSOT) ↔ en drift 검사 — 2단계 게이트.
 *
 * ko.md 를 유일한 진실 공급원으로 보고, en.md 가 그걸 따라가지 못한 지점을 찾는다.
 * check-bilingual.mjs 가 "둘 다 손댔느냐"만 보는 것과 달리, 이쪽은 "내용이 실제로
 * 맞느냐"를 본다.
 *
 *   게이트 1  스테이징(또는 작업트리)에 ko/en 짝이 없으면 아무 일도 안 한다.
 *   게이트 2  (ko해시, en해시) 쌍이 캐시에 통과 기록이면 건너뛴다.
 *   1단계    구조 검사 — 결정적·수 ms·무료. 위반이면 LLM 을 부르지 않고 즉시 차단.
 *   2단계    의미 검사 — claude -p 로 본문 전체를 대조. 위반이면 차단.
 *
 * 판정 결과는 <git-dir>/ko-en-drift.json 에 덮어쓴다(이력을 쌓지 않는다).
 * 통과하면 그 파일을 지운다 — 파일의 존재 자체가 "지금 막혀 있다"는 신호다.
 * 통과한 해시 쌍은 <git-dir>/ko-en-drift-cache.json 에 폴더를 키로 누적한다.
 *
 * 모드:
 *   --staged    스테이징된 짝 검사(git pre-commit). 위반 시 exit 2.
 *   --worktree  작업 트리의 짝 검사. 위반 시 exit 2.
 *   --dir <p>   그 폴더 하나만 디스크에서 읽어 검사(슬래시 명령·디버깅용).
 *   --structure-only  LLM 을 부르지 않고 구조 검사만.
 *
 * 환경변수:
 *   SKIP_DRIFT=1        의미 검사(2단계)만 건너뛴다. 구조 검사는 그대로 돈다.
 *   DRIFT_MODEL=…       판정 모델(기본 claude-opus-5).
 *   DRIFT_TIMEOUT_MS=…  claude 호출 타임아웃(기본 180000).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// check-bilingual.mjs 와 같은 짝 규칙. 허브 문서는 컴포넌트를 쓰려고 .mdx 다.
const BILINGUAL_RE = /^src\/content\/.+\/(ko|en)(\.mdx?)$/;

// 어떤 kind 를 커밋 차단 사유로 볼지. 기준을 낮추고 싶으면 여기만 줄인다.
//   missing  ko 에 있는 내용이 en 에 없음
//   extra    en 에만 있고 ko 에 대응이 없음
//   diverged 양쪽에 다 있지만 의미·강도·수사가 달라짐
const BLOCK_KINDS = new Set(['missing', 'extra', 'diverged']);

const MODEL = process.env.DRIFT_MODEL || 'claude-opus-5';
const TIMEOUT_MS = Number(process.env.DRIFT_TIMEOUT_MS || 180_000);

// 같은 폴더가 연속 이 횟수만큼 의미 검사에 막히면, 더 돌려도 수렴하지 않는다고 보고
// 남은 건을 경고로만 알린 뒤 통과시킨다. LLM 판정은 en 을 고칠 때마다 비교 대상이
// 바뀌므로 원리상 수렴이 보장되지 않는다 — 무한 재판정으로 돈이 새는 걸 막는 상한이다.
// 구조 검사는 결정적이라 진동하지 않으므로 이 유예의 대상이 아니다.
const MAX_ROUNDS = Number(process.env.DRIFT_MAX_ROUNDS || 3);

// 문단 길이비가 이 배수 이상 중앙값에서 벗어나면 LLM 에 "여길 특히 보라"고 힌트를 준다.
// 차단 사유는 아니다 — 한국어가 같은 뜻을 더 짧게 쓰는 성질이 있어 절대값은 의미가 없다.
const RATIO_OUTLIER = 1.6;

// ── 마크다운 구조 추출 ──────────────────────────────────────────────────────

export function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*\r?\n?/);
  if (!m) return { fm: {}, body: src, bodyStartLine: 1 };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):[^\S\r\n]*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return {
    fm,
    body: src.slice(m[0].length),
    bodyStartLine: m[0].replace(/\r?\n$/, '').split(/\r?\n/).length + 1,
  };
}

function classify(first) {
  const h = first.match(/^(#{1,6})\s/);
  if (h) return `heading:${h[1].length}`;
  if (/^>/.test(first)) return 'callout';
  if (/^\|/.test(first)) return 'table';
  if (/^\s*([-*+]|\d+[.)])\s/.test(first)) return 'list';
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(first)) return 'hr';
  if (/^!\[/.test(first)) return 'image';
  return 'para';
}

/** 이미지 경로에서 언어 접미사를 떼어 ko/en 이 같은 값을 갖게 만든다. */
export function normalizeImage(p) {
  return p.replace(/\.(ko|en)(\.[A-Za-z0-9]+)$/, '$2');
}

// ── i18n-intentional 마커 ───────────────────────────────────────────────────
// ko/en 이 서로 달라야 "맞는" 지점(예: 한/영 포트폴리오가 별도 문서라 링크가 다름)을
// 작성자가 표시해 구조 검사에서 빼는 장치.
//
//   - 포트폴리오: [Notion](…) <!-- i18n-intentional(links): 사유 -->   ← 그 줄만
//   <!-- i18n-intentional(links): 사유 -->                            ← 다음 블록 전체
//
// 괄호를 생략하면 모든 범위를 덮는다. 범위 이름을 틀리면 조용히 무시하지 않고 막는다
// — "표시해뒀으니 됐겠지" 하고 넘어갔는데 실은 안 먹는 상황이 제일 나쁘다.
// 마커는 ko·en 양쪽에 다 있어야 한다. 한쪽만 빼면 반대쪽 링크가 홀로 남아 어차피 걸린다.
const INTENTIONAL_SCOPES = ['links', 'images'];
const INTENTIONAL_RE = /<!--\s*i18n-intentional\b\s*(?:\(([^)]*)\))?\s*:?([\s\S]*?)-->/g;

function parseIntentional(text) {
  const found = [];
  for (const m of text.matchAll(INTENTIONAL_RE)) {
    const named = (m[1] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    found.push({
      index: m.index,
      scopes: named.length ? named : [...INTENTIONAL_SCOPES],
      unknown: named.filter((s) => !INTENTIONAL_SCOPES.includes(s)),
      note: (m[2] || '').trim().replace(/\s+/g, ' '),
    });
  }
  return found;
}

function countNewlines(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  return n;
}

// keep(matchIndex) 가 false 인 매치는 버린다 — 마커가 덮은 줄을 빼는 통로다.
function collectLinks(text, keep) {
  const out = [];
  // 인라인 링크 [텍스트](주소) — 앞의 ! 가 붙은 이미지는 제외
  for (const m of text.matchAll(/(?<!!)\[[^\]]*\]\(\s*<?([^)\s>]+)/g)) if (keep(m.index)) out.push(m[1]);
  // 꺾쇠 자동 링크 <https://…>
  for (const m of text.matchAll(/<((?:https?|mailto):[^>\s]+)>/g)) if (keep(m.index)) out.push(m[1]);
  // 참조식 정의 [ref]: 주소
  for (const m of text.matchAll(/^\[[^\]]+\]:\s*(\S+)/gm)) if (keep(m.index)) out.push(m[1]);
  return out;
}

function collectImages(text, keep) {
  const out = [];
  for (const m of text.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>"]+)/g)) {
    if (keep(m.index)) out.push(normalizeImage(m[1]));
  }
  return out;
}

function tableShape(text) {
  const rows = text.split(/\r?\n/).filter((l) => /^\s*\|/.test(l));
  const cols = rows.length
    ? rows[0].replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').length
    : 0;
  // 구분선(|---|---|)은 행으로 세지 않는다
  const body = rows.filter((l) => !/^\s*\|[\s:|-]+\|?\s*$/.test(l));
  return { rows: body.length, cols };
}

/** 마크다운 원문 → 블록 목록 + 구조 지표. */
export function analyze(src) {
  const { fm, body, bodyStartLine } = parseFrontmatter(src);
  const raw = body.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < raw.length) {
    if (raw[i].trim() === '') {
      i++;
      continue;
    }
    const fence = raw[i].match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (fence) {
      const char = fence[1][0];
      const lang = fence[2].trim().split(/\s+/)[0] || '';
      const start = i;
      i++;
      const closer = new RegExp(`^\\s*\\${char}{3,}\\s*$`);
      while (i < raw.length && !closer.test(raw[i])) i++;
      const inner = raw.slice(start + 1, i);
      i++; // 닫는 펜스 소비
      blocks.push({
        kind: `code:${lang}`,
        line: bodyStartLine + start,
        text: inner.join('\n'),
        codeLines: inner.length,
      });
      continue;
    }
    const start = i;
    while (i < raw.length && raw[i].trim() !== '') {
      if (i > start && /^\s*(`{3,}|~{3,})/.test(raw[i])) break;
      i++;
    }
    const chunk = raw.slice(start, i);
    blocks.push({
      kind: classify(chunk[0]),
      line: bodyStartLine + start,
      text: chunk.join('\n'),
    });
  }

  // 마커가 덮는 행을 모은다. 단독 주석 블록이면 다음 블록 전체, 아니면 마커가 놓인 그 줄.
  const covered = new Map(); // 절대 행번호 → Set(범위)
  const intentional = [];
  const unknownScopes = [];
  const cover = (line, scopes) => {
    let set = covered.get(line);
    if (!set) covered.set(line, (set = new Set()));
    for (const s of scopes) set.add(s);
  };
  const coverBlock = (blk, scopes) => {
    if (!blk) return;
    const lines = blk.text.split('\n').length;
    for (let j = 0; j < lines; j++) cover(blk.line + j, scopes);
  };

  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    if (b.kind.startsWith('code:')) continue; // 코드 안의 주석은 마커가 아니다
    const marks = parseIntentional(b.text);
    if (marks.length === 0) continue;

    for (const mk of marks) {
      unknownScopes.push(...mk.unknown);
      intentional.push({
        line: b.line + countNewlines(b.text.slice(0, mk.index)),
        scopes: mk.scopes,
        note: mk.note,
      });
    }

    if (b.text.replace(INTENTIONAL_RE, '').trim() === '') {
      // 주석만 있는 블록 → 다음 블록 전체를 덮는다. 자기 자신도 덮어 주석 안의 URL 이
      // 집계되지 않게 한다.
      const scopes = [...new Set(marks.flatMap((mk) => mk.scopes))];
      coverBlock(b, scopes);
      coverBlock(blocks[bi + 1], scopes);
    } else {
      for (const mk of marks) cover(b.line + countNewlines(b.text.slice(0, mk.index)), mk.scopes);
    }
  }

  const prose = blocks.filter((b) => !b.kind.startsWith('code:'));
  const proseText = prose.map((b) => b.text).join('\n');
  // proseText 의 n번째 줄 → 원문 절대 행번호. 블록을 \n 하나로 이어붙였으므로 1:1 이다.
  const proseLineAt = [];
  for (const b of prose) {
    const lines = b.text.split('\n').length;
    for (let j = 0; j < lines; j++) proseLineAt.push(b.line + j);
  }
  const nlBefore = new Int32Array(proseText.length + 1);
  for (let i = 0; i < proseText.length; i++) {
    nlBefore[i + 1] = nlBefore[i] + (proseText.charCodeAt(i) === 10 ? 1 : 0);
  }
  const keep = (scope) => (idx) => !covered.get(proseLineAt[nlBefore[idx]])?.has(scope);

  return {
    fm,
    blocks,
    kinds: blocks.map((b) => b.kind),
    links: collectLinks(proseText, keep('links')),
    images: collectImages(proseText, keep('images')),
    tables: blocks.filter((b) => b.kind === 'table').map((b) => tableShape(b.text)),
    intentional,
    unknownScopes: [...new Set(unknownScopes)],
  };
}

// ── 1단계: 구조 검사(결정적) ────────────────────────────────────────────────

function multisetDiff(a, b) {
  const count = new Map();
  for (const x of a) count.set(x, (count.get(x) || 0) + 1);
  for (const x of b) count.set(x, (count.get(x) || 0) - 1);
  const onlyKo = [];
  const onlyEn = [];
  for (const [k, n] of count) {
    for (let i = 0; i < n; i++) onlyKo.push(k);
    for (let i = 0; i < -n; i++) onlyEn.push(k);
  }
  return { onlyKo, onlyEn };
}

/** ko/en 구조 비교. 하드 위반(차단)과 소프트 힌트(LLM 전달)를 나눠 돌려준다. */
export function compareStructure(ko, en) {
  const hard = [];
  const hints = [];

  // 마커 범위 이름 오타는 즉시 막는다 — 안 먹는 줄 모르고 지나가면 검사 자체가 무의미해진다.
  const badScopes = [...new Set([...(ko.unknownScopes ?? []), ...(en.unknownScopes ?? [])])];
  if (badScopes.length) {
    hard.push({
      kind: 'intentional-scope',
      why:
        `i18n-intentional 의 범위 이름을 모르겠습니다 — ${badScopes.join(', ')}. ` +
        `쓸 수 있는 값: ${INTENTIONAL_SCOPES.join(', ')} (괄호를 생략하면 전부)`,
    });
  }

  for (const key of ['date', 'tags', 'draft']) {
    const a = ko.fm[key] ?? '';
    const b = en.fm[key] ?? '';
    if (a !== b) {
      hard.push({
        kind: 'frontmatter',
        why: `frontmatter \`${key}\` 가 다릅니다 — ko: ${a || '(없음)'} / en: ${b || '(없음)'}`,
      });
    }
  }

  if (ko.kinds.length !== en.kinds.length) {
    hard.push({
      kind: 'block-count',
      why: `블록 수가 다릅니다 — ko ${ko.kinds.length}개 / en ${en.kinds.length}개`,
    });
  }

  const n = Math.min(ko.kinds.length, en.kinds.length);
  for (let i = 0; i < n; i++) {
    if (ko.kinds[i] !== en.kinds[i]) {
      hard.push({
        kind: 'block-kind',
        koLine: ko.blocks[i].line,
        enLine: en.blocks[i].line,
        why: `${i + 1}번째 블록 종류가 갈립니다 — ko: ${ko.kinds[i]} / en: ${en.kinds[i]}`,
      });
      break; // 한 번 어긋나면 뒤는 전부 밀리므로 첫 지점만 보고한다
    }
  }

  if (!hard.some((h) => h.kind === 'block-kind' || h.kind === 'block-count')) {
    for (let i = 0; i < n; i++) {
      const a = ko.blocks[i];
      const b = en.blocks[i];
      if (a.kind.startsWith('code:') && a.codeLines !== b.codeLines) {
        hard.push({
          kind: 'code-lines',
          koLine: a.line,
          enLine: b.line,
          why: `코드블록 줄 수가 다릅니다 — ko ${a.codeLines}줄 / en ${b.codeLines}줄`,
        });
      }
    }
    for (let i = 0; i < Math.min(ko.tables.length, en.tables.length); i++) {
      const a = ko.tables[i];
      const b = en.tables[i];
      if (a.rows !== b.rows || a.cols !== b.cols) {
        hard.push({
          kind: 'table-shape',
          why: `${i + 1}번째 표 크기가 다릅니다 — ko ${a.rows}행×${a.cols}열 / en ${b.rows}행×${b.cols}열`,
        });
      }
    }
  }

  const linkDiff = multisetDiff(ko.links, en.links);
  if (linkDiff.onlyKo.length || linkDiff.onlyEn.length) {
    hard.push({
      kind: 'links',
      why:
        `링크 주소 집합이 다릅니다 — ` +
        `ko 에만: ${linkDiff.onlyKo.join(', ') || '(없음)'} / ` +
        `en 에만: ${linkDiff.onlyEn.join(', ') || '(없음)'}`,
    });
  }

  const imgDiff = multisetDiff(ko.images, en.images);
  if (imgDiff.onlyKo.length || imgDiff.onlyEn.length) {
    hard.push({
      kind: 'images',
      why:
        `이미지가 다릅니다(언어 접미사 제외) — ` +
        `ko 에만: ${imgDiff.onlyKo.join(', ') || '(없음)'} / ` +
        `en 에만: ${imgDiff.onlyEn.join(', ') || '(없음)'}`,
    });
  }

  // 소프트 힌트: 같은 자리 산문 블록의 ko:en 길이비가 중앙값에서 크게 벗어난 곳.
  if (ko.kinds.length === en.kinds.length) {
    const pairs = [];
    for (let i = 0; i < n; i++) {
      if (!['para', 'callout', 'list'].includes(ko.blocks[i].kind)) continue;
      const koText = ko.blocks[i].text;
      const enText = en.blocks[i].text;
      // 양쪽이 같은 텍스트인 블록(원문 그대로 인용한 영어 문장 등)은 비율이 1.0 으로
      // 고정돼 늘 이상치로 잡힌다. 번역 대상이 아니므로 아예 뺀다.
      if (koText === enText) continue;
      const a = koText.length;
      const b = enText.length;
      if (a < 40 || b < 40) continue; // 짧은 블록은 비율이 요동쳐 의미가 없다
      pairs.push({ i, ratio: b / a });
    }
    if (pairs.length >= 4) {
      const sorted = [...pairs].map((p) => p.ratio).sort((x, y) => x - y);
      const median = sorted[Math.floor(sorted.length / 2)];
      for (const p of pairs) {
        const dev = p.ratio / median;
        if (dev > RATIO_OUTLIER || dev < 1 / RATIO_OUTLIER) {
          hints.push({
            koLine: ko.blocks[p.i].line,
            enLine: en.blocks[p.i].line,
            note:
              dev < 1
                ? 'en 이 ko 대비 유난히 짧습니다 — 내용이 빠졌을 수 있습니다'
                : 'en 이 ko 대비 유난히 깁니다 — ko 에 없는 내용이 붙었을 수 있습니다',
          });
        }
      }
    }
  }

  return { hard, hints };
}

// ── 2단계: 의미 검사(claude -p) ─────────────────────────────────────────────

function numbered(src) {
  return src
    .split(/\r?\n/)
    .map((l, i) => `${String(i + 1).padStart(4)}| ${l}`)
    .join('\n');
}

export function buildPrompt(koSrc, enSrc, hints, intentional = []) {
  // 구조 검사에서 뺀 지점은 의미 검사에서도 빼야 한다 — 안 그러면 같은 차이를
  // LLM 이 diverged 로 다시 잡아 결국 막힌다.
  const intentionalBlock = intentional.length
    ? `\n## 의도된 차이 — 보고하지 마세요\n작성자가 ko/en 이 서로 달라야 맞다고 표시해둔 지점입니다.\n` +
      intentional.map((x) => `- ko ${x.line}행: ${x.note || '(사유 없음)'}`).join('\n') +
      '\n'
    : '';

  const hintBlock = hints.length
    ? `\n## 구조 검사가 남긴 힌트\n아래 지점은 기계적으로 봤을 때 분량이 어긋납니다. 특히 주의해서 보세요(그 자체가 drift 라는 뜻은 아닙니다).\n` +
      hints.map((h) => `- ko ${h.koLine}행 ↔ en ${h.enLine}행: ${h.note}`).join('\n') +
      '\n'
    : '';

  return `같은 글의 한국어 원문(ko)과 영어 번역(en)입니다. **한국어가 유일한 진실 공급원(SSOT)** 입니다.
en 이 ko 를 따라가지 못한 지점(drift)을 찾으세요. ko 를 고칠 생각은 하지 마세요.

## drift 로 보고할 것
- \`missing\`  — ko 에 있는 내용이 en 에 없음. 문장·절·괄호 설명·예시·볼드 강조 무엇이든.
- \`extra\`    — en 에만 있고 ko 에 대응이 없는 내용.
- \`diverged\` — 양쪽에 다 있지만 의미·강도·범위·수사가 달라진 것.
  예: ko "좀 달라집니다" ↔ en "collapses completely" (강도)
      ko 가 질문형인데 en 은 평서문 (문장 유형)
      ko 에만 볼드나 괄호 라벨이 있음 (강조)
      ko 는 "공식 문서"인데 en 은 "the execution model chapter" (범위)

## drift 가 아닌 것 — 절대 보고하지 마세요
- 어순 차이, 관사(a/the), 단수/복수, 시제 관용
- 한국어 관용구를 영어 관용구로 옮긴 자연스러운 등가 표현
- 존댓말·문체처럼 언어 자체의 성질에서 오는 차이
- 코드블록 안의 **코드** (주석의 번역은 정상이고, 코드가 같으면 보고하지 않습니다)
- 고유명사·기술용어를 원문 그대로 둔 것

**의심스러우면 보고하지 마세요.** 확신이 있을 때만 보고합니다. 번역이 자연스럽다는 이유로
보고하면 안 됩니다. 이 판정은 커밋을 막으므로 오탐의 대가가 큽니다.
${intentionalBlock}${hintBlock}
## 출력 형식
JSON 배열 **하나만** 출력하세요. 설명도, 마크다운 코드펜스도 붙이지 마세요.

[{"kind":"missing|extra|diverged","koLine":<정수>,"enLine":<정수>,
  "ko":"<ko 발췌, 40자 이내>","en":"<en 발췌, 40자 이내. 없으면 빈 문자열>",
  "why":"<무엇이 어긋났는지 한국어 한 문장>",
  "fix":"<en 을 어떻게 고쳐야 하는지 한국어 한 문장>"}]

drift 가 없으면 \`[]\` 만 출력하세요.
행 번호는 아래 본문 왼쪽에 붙은 번호를 그대로 쓰세요.

## ko (SSOT)
${numbered(koSrc)}

## en
${numbered(enSrc)}
`;
}

/** claude -p 호출. 실패하면 null 을 돌려준다(fail-open). */
export function askClaude(prompt) {
  const res = spawnSync(
    'claude',
    [
      '-p',
      '--model',
      MODEL,
      '--output-format',
      'json',
      '--allowed-tools',
      '',
      '--strict-mcp-config',
      '--setting-sources',
      '',
    ],
    { input: prompt, encoding: 'utf8', timeout: TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 },
  );

  if (res.error) return { error: `claude 실행 실패: ${res.error.message}` };
  if (res.status !== 0) return { error: `claude 가 ${res.status} 로 끝났습니다: ${(res.stderr || '').slice(0, 300)}` };

  let envelope;
  try {
    envelope = JSON.parse(res.stdout);
  } catch {
    return { error: 'claude 출력을 JSON 으로 읽지 못했습니다' };
  }
  if (envelope.is_error) return { error: `claude 판정 실패: ${String(envelope.result).slice(0, 300)}` };

  const text = String(envelope.result ?? '').trim();
  const body = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start === -1 || end === -1) return { error: `판정 결과에서 JSON 배열을 찾지 못했습니다: ${body.slice(0, 200)}` };
  try {
    const findings = JSON.parse(body.slice(start, end + 1));
    return { findings: Array.isArray(findings) ? findings : [], cost: envelope.total_cost_usd };
  } catch {
    return { error: `판정 JSON 파싱 실패: ${body.slice(0, 200)}` };
  }
}

// ── 실행 ────────────────────────────────────────────────────────────────────

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch {
    return '';
  }
}

/** 캐시 키로 쓰는 내용 해시. check-bilingual.mjs 가 같은 함수를 써야 판정이 일치한다. */
export const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

function readJson(p, fallback) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

/** 검사 대상 짝을 { dir, ext, ko, en } 목록으로 모은다. */
function collectPairs(mode, dirArg) {
  if (mode === 'dir') {
    for (const ext of ['.md', '.mdx']) {
      const ko = `${dirArg}/ko${ext}`;
      const en = `${dirArg}/en${ext}`;
      if (existsSync(ko) && existsSync(en)) {
        return [{ dir: dirArg, ext, ko: readFileSync(ko, 'utf8'), en: readFileSync(en, 'utf8') }];
      }
    }
    return [];
  }

  const files =
    mode === 'staged'
      ? git(['diff', '--cached', '--name-only']).split('\n')
      : [
          ...git(['diff', '--name-only', 'HEAD']).split('\n'),
          ...git(['ls-files', '--others', '--exclude-standard']).split('\n'),
        ];

  const dirs = new Map();
  for (const f of files.map((x) => x.trim())) {
    const m = f.match(BILINGUAL_RE);
    if (!m) continue;
    dirs.set(f.slice(0, f.lastIndexOf('/')), m[2]);
  }

  const pairs = [];
  for (const [dir, ext] of dirs) {
    // 스테이징 모드에서는 인덱스의 내용을 본다 — 작업 트리에 더 얹은 변경은 이번 커밋과 무관하다.
    const read = (p) =>
      mode === 'staged' ? git(['show', `:${p}`]) : existsSync(p) ? readFileSync(p, 'utf8') : '';
    const ko = read(`${dir}/ko${ext}`);
    const en = read(`${dir}/en${ext}`);
    if (!ko || !en) continue; // 짝이 없는 건 check-bilingual.mjs 가 잡는다
    pairs.push({ dir, ext, ko, en });
  }
  return pairs;
}

function main() {
  const argv = process.argv.slice(2);
  const mode = argv.includes('--dir') ? 'dir' : argv.includes('--worktree') ? 'worktree' : 'staged';
  const dirArg = argv.includes('--dir') ? argv[argv.indexOf('--dir') + 1]?.replace(/\/+$/, '') : null;
  const structureOnly = argv.includes('--structure-only');

  const gitDir = git(['rev-parse', '--absolute-git-dir']).trim();
  if (!gitDir) process.exit(0);
  const reportPath = `${gitDir}/ko-en-drift.json`;
  const cachePath = `${gitDir}/ko-en-drift-cache.json`;

  const pairs = collectPairs(mode, dirArg);
  if (pairs.length === 0) process.exit(0);

  const cache = readJson(cachePath, {});
  const report = { generatedAt: new Date().toISOString(), mode, pairs: [] };
  const warnings = [];
  const waived = [];
  let blocked = false;
  let totalCost = 0;

  for (const pair of pairs) {
    const koHash = sha(pair.ko);
    const enHash = sha(pair.en);
    const cached = cache[pair.dir];
    if (mode !== 'dir' && cached?.ko === koHash && cached?.en === enHash) continue;

    const koDoc = analyze(pair.ko);
    const { hard, hints } = compareStructure(koDoc, analyze(pair.en));
    const rounds = cached?.attempts || 0;
    const pass = (extra) => {
      cache[pair.dir] = { ko: koHash, en: enHash, at: report.generatedAt, ...extra };
    };

    let semantic = [];
    if (hard.length > 0) {
      // 구조가 이미 어긋났으면 LLM 을 부르지 않는다 — 어차피 고치고 다시 와야 한다.
      // 결정적인 검사라 재시도로 결과가 바뀌지 않으므로 유예도 하지 않는다.
      blocked = true;
    } else if (structureOnly || process.env.SKIP_DRIFT === '1') {
      pass({ semantic: false });
    } else if (rounds >= MAX_ROUNDS) {
      // 상한에 닿았다. LLM 을 다시 부르지 않고(=$0) 직전에 남아 있던 건을 경고로 알린다.
      waived.push({ dir: pair.dir, rounds, findings: cached?.lastFindings || [] });
      pass({ semantic: true, waived: true, waivedFindings: cached?.lastFindings || [] });
    } else {
      const res = askClaude(buildPrompt(pair.ko, pair.en, hints, koDoc.intentional));
      if (res.error) {
        // fail-open: 오프라인·인증 만료로 커밋을 못 하게 만들지 않는다.
        warnings.push(`${pair.dir}: 의미 검사를 건너뜁니다 (${res.error})`);
      } else {
        totalCost += res.cost || 0;
        semantic = (res.findings || []).filter((f) => BLOCK_KINDS.has(f.kind));
        if (semantic.length > 0) {
          blocked = true;
          // 통과 해시는 남기지 않는다 — 라운드 수와 마지막 판정만 이어붙인다.
          cache[pair.dir] = {
            attempts: rounds + 1,
            at: report.generatedAt,
            lastFindings: semantic,
          };
        } else {
          pass({ semantic: true }); // 통과하면 attempts 가 사라져 카운터가 리셋된다
        }
      }
    }

    if (hard.length || semantic.length) {
      report.pairs.push({ dir: pair.dir, ext: pair.ext, structural: hard, semantic });
    }
  }

  writeFileSync(cachePath, JSON.stringify(cache, null, 2));

  for (const w of warnings) process.stderr.write(`⚠ ${w}\n`);

  for (const w of waived) {
    const lines = [
      `\n⚠ ko/en drift — ${w.dir}/ 는 ${w.rounds}회 연속 막혀서 이번엔 통과시킵니다.\n`,
      `  판정을 더 돌려도 수렴하지 않는 국면이라 보고 LLM 을 부르지 않았습니다($0).\n`,
    ];
    if (w.findings.length) {
      lines.push('  마지막 판정에 남아 있던 건:\n');
      for (const f of w.findings) {
        lines.push(`    [${f.kind}] ko ${f.koLine}행 ↔ en ${f.enLine}행 — ${f.why}\n`);
      }
    }
    lines.push(
      '  → 그대로 두려면 이대로 커밋하면 됩니다(이 내용이 배포됩니다).\n' +
        '  → 계속 잡고 싶으면 check-drift.mjs 의 BLOCK_KINDS 에서 diverged 를 빼거나\n' +
        '     DRIFT_MAX_ROUNDS 를 올려 다시 시도하세요.\n',
    );
    process.stderr.write(lines.join(''));
  }

  if (!blocked) {
    if (existsSync(reportPath)) rmSync(reportPath);
    if (totalCost) process.stderr.write(`✓ ko/en drift 검사 통과 ($${totalCost.toFixed(3)})\n`);
    process.exit(0);
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const out = [];
  out.push('\n✗ ko/en drift — ko.md 기준으로 en.md 가 어긋났습니다:\n');
  for (const p of report.pairs) {
    out.push(`  ${p.dir}/\n`);
    for (const h of p.structural) {
      const at = h.koLine ? ` (ko ${h.koLine}행 ↔ en ${h.enLine}행)` : '';
      out.push(`    [구조] ${h.why}${at}\n`);
    }
    for (const s of p.semantic) {
      out.push(`    [${s.kind}] ko ${s.koLine}행 ↔ en ${s.enLine}행 — ${s.why}\n`);
      if (s.ko) out.push(`        ko: ${s.ko}\n`);
      if (s.en) out.push(`        en: ${s.en}\n`);
    }
  }
  out.push(`\n  판정 결과: ${reportPath}${totalCost ? ` ($${totalCost.toFixed(3)})` : ''}\n`);
  const rounds = report.pairs
    .map((p) => cache[p.dir]?.attempts)
    .filter((n) => typeof n === 'number');
  if (rounds.length) {
    const worst = Math.max(...rounds);
    out.push(
      `  라운드 ${worst}/${MAX_ROUNDS} — ${MAX_ROUNDS}회에 닿으면 남은 건을 경고로만 알리고 통과시킵니다.\n`,
    );
  }
  out.push('  → Claude 세션에서 /fix-drift 를 실행하면 이 리포트를 읽어 en 을 고칩니다.\n');
  out.push('  → 이번만 넘기려면 SKIP_DRIFT=1 git commit … (구조 검사는 그대로 돕니다)\n\n');
  process.stderr.write(out.join(''));
  process.exit(2);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
