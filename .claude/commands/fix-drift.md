---
description: pre-commit 이 막은 ko/en drift 리포트를 읽어 en 을 ko(SSOT)에 맞춘다
allowed-tools: Bash(node scripts/check-drift.mjs:*), Bash(git rev-parse:*), Bash(cat:*), Read, Edit
argument-hint: "[글 폴더 경로 — 생략하면 리포트에 담긴 전부]"
---

`ko.md` 를 유일한 진실 공급원(SSOT)으로 두고 `en.md` 를 맞춘다. **`ko.md` 는 고치지 않는다.**

## 1. 리포트 읽기

`.git/ko-en-drift.json` 을 읽는다. 경로는 `git rev-parse --absolute-git-dir` 로 구한다.

- 파일이 **없으면** 지금 막혀 있는 게 아니다. 검사를 직접 돌려 판정을 만든다:
  `node scripts/check-drift.mjs --worktree`
  그래도 아무것도 안 나오면 "현재 drift 없음"이라고 알리고 끝낸다.
- 인자로 폴더가 주어졌으면 그 폴더만 다룬다.

리포트 구조:

```jsonc
{ "pairs": [ {
    "dir": "src/content/posts/…",
    "structural": [ { "kind": "links|images|table-shape|code-lines|block-kind|block-count|frontmatter", "why": "…" } ],
    "semantic":   [ { "kind": "missing|extra|diverged", "koLine": 239, "enLine": 239,
                      "ko": "…", "en": "…", "why": "…", "fix": "…" } ] } ] }
```

## 2. 고치기

리포트에 있는 건별로 `en.md` 만 수정한다. **리포트를 다시 판정하지 말 것** — 훅이 커밋을 막은 근거와 고치는 내용이 어긋나면 안 된다. 다만 적용 전에 해당 줄을 실제로 읽어 리포트의 발췌와 맞는지 확인한다(줄 번호는 앞선 수정으로 밀릴 수 있다).

종류별로:

- `missing` — ko 에 있는 내용을 en 에 되살린다. 새로 쓰지 말고 **ko 의 해당 대목을 번역**한다.
- `extra` — ko 에 대응이 없는 en 내용을 지운다. ko 에 추가하는 쪽으로 해결하지 않는다(ko 가 SSOT).
- `diverged` — ko 의 강도·범위·문장 유형·강조에 en 을 맞춘다. 영어를 더 세거나 더 약하게 만들지 말고 ko 와 같은 세기로 옮긴다.
- `structural` — 링크·이미지·표·코드블록·frontmatter 를 ko 와 맞춘다. 이미지는 `.ko.`/`.en.` 접미사만 다른 게 정상이다.

번역으로서 자연스러움은 유지한다. 어순이나 관용구까지 한국어를 그대로 흉내 낼 필요는 없다 — 맞춰야 하는 건 **내용·강도·구조**다.

## 3. 재검사

고친 폴더마다 다시 돌린다:

```
node scripts/check-drift.mjs --dir <폴더>
```

통과하면 `.git/ko-en-drift.json` 이 사라지고 exit 0 이 된다. 남은 건이 있으면 다시 2번으로 간다.
**단 같은 폴더로 3라운드를 넘기지 말 것** — 그때는 남은 건을 사용자에게 보여주고 판단을 받는다.
호출 1회에 약 $0.6 이 드니 무한 반복은 금물이다.

## 4. 보고

무엇을 고쳤는지 종류별로 묶어 한국어로 요약한다. 커밋·푸시는 **사용자가 요청할 때만** 한다.
