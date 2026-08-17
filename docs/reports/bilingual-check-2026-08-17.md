# ko/en 이중언어 점검 리포트 — 2026-08-17

## 요약

`src/content/` 아래 **ko.md/en.md 짝 12개**를 점검했습니다(`src/content/pages/cv/`는 제외 — 사유는 맨 아래 참고).

| 카테고리 | 점검한 글 수 | 발견 항목 수 |
| --- | --- | --- |
| `posts/claude` | 5 | 8 |
| `posts/git` | 1 | 3 |
| `posts/python` | 3 | 4 |
| `projects/relu-soft` | 2 | 0 |
| `pages/home` | 1 | 0 |
| **합계** | **12** | **15** |

가장 눈여겨볼 항목은 `posts/claude/worktree`와 `posts/claude/routine`, `posts/claude/hook` — 공식 문서(`code.claude.com/docs/en/`)와 직접 대조해 확인한 사실 오류입니다(아래 각 항목에 대조한 원문을 함께 남겼습니다).

---

## posts/claude/hook

- **파일**: `src/content/posts/claude/hook/en.md:649`
  **인용**: > [Mastering Claude Code — Ch01 Deep Dive (lecture slides, Korean)](...)
  **문제**: 참고자료 목록의 마지막 링크에 en.md에만 `(lecture slides, Korean)`라는 부연이 추가돼 있습니다. ko.md(같은 줄)에는 이 부연이 없고, `i18n-intentional` 마커도 없습니다.
  **제안**: en.md에서 `(lecture slides, Korean)`을 빼서 ko.md와 맞추거나, 의도된 추가라면 양쪽에 `<!-- i18n-intentional -->` 마커를 답니다.

- **파일**: `src/content/posts/claude/hook/ko.md:59, 62, 375, 589-596` (en.md 동일 라인)
  **인용**: > **2** | 차단 | **stdout은 통째로 무시**하고, stderr를 Claude에게 전달합니다 / "종료코드 2일 때 stdout은 읽지도 않습니다."
  **문제**: **공식 문서로 확인 — 오류.** [`code.claude.com/docs/en/hooks`](https://code.claude.com/docs/en/hooks) "Exit code 2" 섹션 원문: *"Exit 2 means a blocking error. On events that can block, exit 2 blocks whether or not you print JSON... **Claude Code still reads any valid JSON output on stdout.** ... The blocking message is the reason from your JSON's blocking decision when it makes one, and your stderr text otherwise."* 즉 종료코드 2에서도 stdout이 유효한 JSON이면 실제로 읽어 그 안의 차단 사유를 쓰고, stderr는 JSON이 없거나 무효할 때만 쓰는 대안입니다. "stdout은 통째로 무시"·"읽지도 않습니다"는 이와 직접 모순됩니다. (글의 `console.log`로 일반 텍스트를 찍는 예시 자체의 결론 — 그 경우 stderr가 쓰인다 — 은 맞습니다. 유효한 JSON이 아니기 때문입니다. 문제는 이걸 "종료코드 2에서 stdout은 항상 무시"라는 일반 법칙으로 과잉 일반화한 서술입니다.)
  **제안**: "유효한 JSON을 stdout에 출력하면 Claude Code가 이를 읽어 차단 사유로 쓰고, JSON이 없거나 무효할 때만 stderr 텍스트를 씁니다"로 정정. 표의 "stdout은 통째로 무시"도 조건부 표현으로 고칠 것. ko.md·en.md 양쪽 다 동일하게 틀려 있어 둘 다 수정 필요.

## posts/claude/intro-automation-hook-loop-routine

이상 없음 (헤딩·표·코드블록·이미지·참고자료 전수 일치, 한글 잔존 없음. Hook 이벤트 이름·`/loop` 3가지 모드·7일 만료·routine 트리거 3종·"연구 프리뷰" 등 확인 가능한 서술은 공식 문서와 대조해 모두 일치. 다만 "자동화 방법 세 가지"라는 글의 틀은 데스크톱 예약 작업 같은 문서상 별도 항목을 세지 않은 편집상의 선택으로, 사실 오류는 아님.)

## posts/claude/loop

이상 없음 (번역 정합성·표현·팩트체크 모두 통과. 이미지 SVG에 한글 잔존 없음 확인.)

## posts/claude/routine

- **파일**: `src/content/posts/claude/routine/ko.md:68, 82` (en.md 동일 라인)
  **인용**: > ⚠️ **CLI `/schedule`로는 예약(cron) 트리거만 만들 수 있습니다.** API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다.
  **문제**: **공식 문서로 확인 — 오류.** [`code.claude.com/docs/en/routines`](https://code.claude.com/docs/en/routines) 원문: *"You can add a GitHub trigger from the web or from the CLI. The CLI path requires Claude Code v2.1.225 or later."* — GitHub 트리거는 CLI에서도 추가할 수 있습니다(`/schedule add a GitHub trigger to my nightly review for pull requests opened in acme/webapp` 형태). 웹 UI가 필수인 건 **API 트리거뿐**입니다(문서: *"API triggers are added to an existing routine from the web. The CLI cannot currently create or revoke tokens."* — 이 부분은 글의 서술과 일치).
  **제안**: "API 트리거는 웹 UI에서만, GitHub 트리거는 웹 UI 또는 CLI(v2.1.225+)에서 추가할 수 있습니다"로 API/GitHub를 분리해 정정. 표의 CLI 행("예약 트리거만")도 함께 수정. ko/en 둘 다 동일 오류라 양쪽 다 수정 필요.

- **파일**: `src/content/posts/claude/routine/ko.md:58, 240`
  **인용**: > 접근 가능한 Github 저장소... / 제 Github repository에도...
  **문제**: "Github"는 대소문자 표기 오류(같은 문서 다른 곳에서는 "GitHub"로 정확히 표기). en.md는 두 곳 모두 정확히 "GitHub"로 번역돼 있어 en에는 이 오타가 없습니다.
  **제안**: ko.md 두 곳 모두 "GitHub"로 수정.

- **파일**: `src/content/posts/claude/routine/ko.md:92` (en.md:92)
  **인용**: `"name": "블로그 ko/en 주간 점검",` (ko) vs `"name": "Weekly ko/en check",` (en)
  **문제**: JSON 예시 코드블록 안의 실제 데이터 값(주석이 아님)이 언어별로 다릅니다. 이 글의 다른 코드/터미널 출력은 실제 값 그대로 양쪽에 유지되는데 이 필드만 다릅니다.
  **제안**: 실제로 만든 routine의 이름이라면 ko/en 어느 쪽이든 원문 그대로 유지하거나, 의도적으로 번역해 보여주려는 것이면 `<!-- i18n-intentional -->` 마커를 달아 검사에서 제외.

- **파일**: `src/content/posts/claude/routine/ko.md:221-250, 354-393` (en.md 동일 구조 221-251, 355-394)
  **인용**: > "돌려본 결과" 섹션이 이미 브랜치 push 성공(커밋 해시 `d8ccf2f`, `git diff --stat` 결과)을 보여준 뒤, 곧이어 "나머지 함정들" 섹션에서 같은 실행이 실은 403으로 push가 막혔었다고 서술
  **문제**: 시간 순서가 뒤바뀐 것처럼 읽혀 독자가 혼란스러울 수 있습니다. ko/en 둘 다 동일하게 존재해 번역 drift는 아니고 ko.md(SSOT) 자체의 서술 구조 이슈입니다.
  **제안**: "돌려본 결과"의 성공 로그를 "고치고 나면" 이후로 옮기거나, "(권한 문제를 고친 뒤의 최종 결과입니다)" 같은 안내를 덧붙여 시간 순서를 명확히 할 것.

## posts/claude/worktree

- **파일**: `src/content/posts/claude/worktree/ko.md:330` / `en.md:330`
  **인용**: > 막히는 건 세 가지입니다. / "Three things get blocked."
  **문제**: **공식 문서로 확인 — 오류.** [`code.claude.com/docs/en/worktrees`](https://code.claude.com/docs/en/worktrees) "How Claude Code enforces isolation": *"Claude Code applies **four** checks: **File edits** ... **Command working directory** ... **Git redirects** ... **Command shape**: Claude Code blocks a Bash or Monitor command it can't verify stays inside the worktree. The block applies even when the command runs no git at all. Claude Code refuses shell constructs it can't statically trace, such as brace expansion and heredocs with unquoted delimiters."* 이 글은 네 번째 항목(정적으로 추적 불가능한 셸 구문 자체를 막는 검사, git 사용 여부와 무관하게 적용)을 아예 다루지 않고 "세 가지"라 단정합니다.
  **제안**: "네 가지"로 고치고 네 번째 항목(Command shape)을 추가. ko.md·en.md 둘 다 동일 오류라 양쪽 수정 필요.

- **파일**: `src/content/posts/claude/worktree/ko.md:549` / `en.md:549`
  **인용**: > **워크트리 안에서 `claude --resume` 하지 마세요.** 재개는 **메인 체크아웃에서** 실행해야 합니다. / "**Don't run `claude --resume` from inside a worktree.** Resume from **the main checkout**."
  **문제**: **공식 문서로 확인 — 오류(정반대).** 같은 문서 "Resume a worktree session": *"Claude Code re-enters a worktree it created with git under `.claude/worktrees/` **even when you launch from inside it**."* 즉 `-w`로 만든(`.claude/worktrees/` 아래) 워크트리는 그 안에서 `--resume`해도 정상 재진입합니다. 재진입이 거부되는 경우는 *"a launch from a subdirectory of a worktree you created with `git worktree add` declines"* — `git worktree add`로 **직접(수동으로) 만든** 워크트리에 한정됩니다. 이 글은 이 구분 없이 "워크트리 안에서는 무조건 하지 말라"고 일반화하고 있어, 글이 주로 다루는 `-w` 워크트리에 대해서는 문서와 정반대입니다.
  **제안**: `-w`로 만든 워크트리는 내부에서 `--resume`해도 정상 동작한다는 점을 반영하고, 재진입 거부는 `git worktree add`로 별도 경로에 수동 생성한 워크트리에 한정된다고 범위를 좁혀 서술. ko.md·en.md 둘 다 수정 필요.

## posts/git/worktree

- **파일**: `src/content/posts/git/worktree/ko.md:12`
  **인용**: > 이 뿐만 아니라, `.env` 등 환경변수 파일도...
  **문제**: 띄어쓰기 오류. "이뿐"은 붙여 쓰는 것이 표준입니다.
  **제안**: "이뿐만 아니라"로 수정 (en.md는 "On top of that"으로 이미 자연스럽게 번역돼 있어 en은 손댈 필요 없음).

- **파일**: `src/content/posts/git/worktree/ko.md:10`
  **인용**: > 기능개발 하는 중에 코드리뷰를 해야 하는 상황이 빈번히 나왔습니다.
  **문제**: "기능개발"은 붙여 쓴 비표준 표기. "기능"과 "개발"은 띄어 쓰는 것이 표준입니다.
  **제안**: "기능 개발 하는 중에"로 수정.

- **파일**: `src/content/posts/git/worktree/ko.md:34` (en.md:34 동일)
  **인용**: > Github에서는 기본적으로 main 브랜치를 제공합니다. 즉 git init으로 초기화한 프로젝트에서 첫 번째 커밋을 남기면, 그 커밋에는 main이라는 이름표가 저절로 붙는 거죠.
  **문제**: 사실관계가 다소 부정확할 수 있습니다. "main" 기본 브랜치는 GitHub이 웹에서 새 저장소를 만들 때의 관례이지, `git init` 자체의 하드코딩된 기본값은 아닙니다(git 자체는 `init.defaultBranch` 설정이 없으면 전통적으로 "master"를 씀. 다만 최근 다수 배포판/설치 스크립트가 이를 "main"으로 재설정해두는 경우가 흔함). ko/en 양쪽에 동일하게 있는 원문(SSOT) 이슈라 번역 drift는 아닙니다.
  **제안**: "로컬 `git init` 환경에 따라 다르지만(주로 GitHub이 만드는 새 저장소는 기본적으로 main을 씁니다)" 정도로 뉘앙스 조정. 글의 핵심 논지(브랜치=포인터)에는 영향 없는 지엽적 사실이라 우선순위는 낮음.

## posts/python/01-everything-is-an-object

- **파일**: `src/content/posts/python/01-everything-is-an-object/ko.md:912` (en.md:916)
  **인용**: > [PEP 468 — Preserving the order of `**kwargs`](https://peps.python.org/pep-0468/) — 딕셔너리 순서 보장이 언어 명세가 된 경위
  **문제**: **문서에서 확인 불가 — 자신 있는 팩트체크는 아님 (담당 에이전트도 확신도가 낮다고 표시함).** PEP 468은 함수 호출 시 `**kwargs`로 모이는 인자 순서 보존에 한정된 제안이고, "일반 딕셔너리 전체의 삽입 순서 보장이 언어 명세가 됐다"는 설명의 근거로는 Python 3.7 릴리스 노트 쪽이 더 정확할 수 있습니다. ko/en 모두 동일한 설명이라 번역 drift는 아닙니다.
  **제안**: 필요시 재확인 후, 이 항목의 설명을 "`**kwargs` 순서 보존을 다룬 PEP" 정도로 좁히거나, 딕셔너리 전체 순서 보장 설명은 "What's New in Python 3.7" 링크 쪽에 붙이는 것을 검토. 우선순위 낮음(참고자료 캡션 수준).

## posts/python/02-variables-are-name-tags

- **파일**: `src/content/posts/python/02-variables-are-name-tags/en.md:26`
  **인용**: > "Make a four-byte box on the stack and write the bit pattern `00000101` into it."
  **문제**: ko.md는 이 문장을 평서형("스택에 4바이트짜리 상자를 만들고... 써넣습니다")으로 서술하는데 en.md만 명령문(imperative, "Make a ... box")으로 번역돼 독자에게 지시하는 문장처럼 읽힙니다. 바로 다음 문단의 Python 설명("There is no box anywhere...")은 정상적으로 평서문이라 같은 문서 안에서 어조가 어긋납니다.
  **제안**: "It makes a four-byte box on the stack and writes the bit pattern `00000101` into it."처럼 평서문으로 바꿔 앞뒤 문단과 어조를 맞춥니다.

## posts/python/03-the-inside-story-of-if

- **파일**: `src/content/posts/python/03-the-inside-story-of-if/ko.md:195` (en.md:195)
  **인용**: > ### 판정은 6단계로 결정됩니다
  **문제**: 소제목은 "6단계"라 하지만 바로 아래 번호 목록은 1번부터 7번까지 총 7개 항목(`Py_True`/`Py_False`/`Py_None`/`nb_bool`/`mp_length`/`sq_length`/기본값 `return 1`)입니다. en.md도 "The decision is over in six steps"로 동일하게 번역돼 같은 불일치가 그대로 전이됨.
  **제안**: 소제목을 "7단계"로 바꾸거나, 마지막 "아무것도 없으면 → return 1" 항목을 번호 없는 기본값(fallback)으로 표기해 "6단계 판정 + 기본값" 구조로 명확히 할 것. ko/en 둘 다 함께 수정.

- **파일**: `src/content/posts/python/03-the-inside-story-of-if/ko.md:445-446`
  **인용**: > - 음수면 안되고,\n- 8바이트 부호 있는 정수(`Py_ssize_t`)의 상한인 `2**63 - 1`을 넘는 수는 안되고,
  **문제**: "안되고"는 붙여 쓰면 다른 뜻(일이 뜻대로 되지 않다)이 됩니다. "허용되지 않는다"는 뜻이면 "안 되고"로 띄어 써야 합니다(같은 글 412행 "안 됩니다"와도 표기가 어긋남).
  **제안**: "음수면 안 되고," / "...넘는 수는 안 되고,"로 띄어쓰기 수정.

## projects/relu-soft/west-side-barbell-club/01-about-conjugate

이상 없음 (헤딩 11개·표·코드/인용 블록·이미지 참조 전수 일치, 한글 잔존 없음, ME/DE·accommodating resistance 등 용어와 수치 표 정확히 대응.)

## projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol

이상 없음 (draft: true 상태지만 정상 점검 — 헤딩·인용·표·이미지 참조 전수 일치, 한글 잔존 없음, 자연스러운 번역.)

## pages/home

이상 없음 (구조·표현·항목 대응 전수 일치.)

---

## 제외 안내

`src/content/pages/cv/`는 이번 점검에서 제외했습니다(`draft: true`, 작성 중인 문서).

## Discord 알림

`DISCORD_WEBHOOK_URL` 설정 확인 — 요약을 Discord로 전송했습니다.
