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
        koKinds[i] === enKinds[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
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
