# ko/en 이중언어 점검 리포트 — 2026-09-21

## 요약

`src/content/` 아래 **ko.md/en.md(+ko.mdx/en.mdx) 짝 15개**를 전수 점검했습니다. (`src/content/pages/cv`는 아직 다듬는 중인 draft 문서라 이번 점검에서 제외 — 맨 아래 참고.)

| 폴더 | 글 수 | 드리프트/미번역 | 표현 지적 | 사실점검(claude/*) | 기타(원문 자체 이슈) |
| --- | --- | --- | --- | --- | --- |
| pages (home) | 1 | 0 | 0 | - | - |
| posts/ai (limitation-of-linear-decision-boundary-and-MLP, logistic-regression) | 2 | **1건 심각**(코드블록 미번역) | 4(경미) | - | 2건(ko 오탈자 4개 포함), 확인 못함 2건 |
| posts/claude (hook, intro-automation, loop, routine, worktree) | 5 | 서식 차이 1건(경미, routine) | 2(경미, routine) | **1건 확인됨**(hook 이벤트 개수) | - |
| posts/git (worktree) | 1 | 0 | 0 | 해당 없음 | - |
| posts/python (01, 02, 03) | 3 | 서식 차이 1건(경미, 01) | 0 | - | 1건(03, ko/en 공통 편집 오류) |
| projects/relu-soft (01, 02) | 2 | 0 | 0 | - | - |
| experiences/code-it | 1 | 0 | 0 | - | - |
| **합계** | **15** | **1건 심각 + 경미 2건** | **6건(경미)** | **1건** | **3건** |

- **가장 심각한 발견**: `posts/ai/limitation-of-linear-decision-boundary-and-MLP`의 `en.md`에 파이썬 코드블록 주석과 `print()` 문자열 16곳 이상이 **번역되지 않고 한국어 그대로** 남아 있습니다. 영어 독자가 그대로 보게 되는 실질적 결함이라 우선 수정을 권장합니다.
- `posts/claude/hook`에서 "훅 이벤트가 실제로는 31종"이라는 서술을 공식 문서와 대조한 결과, 공식 문서(`https://code.claude.com/docs/en/hooks`)는 `PreModelSwitch`·`PostModelSwitch`를 포함해 **33개** 이벤트를 나열하고 있어 개수 서술을 보강할 필요가 있습니다(아래 상세 참고 — 두 번 독립적으로 공식 문서를 조회해 재확인).
- 구조적 위반(헤딩 개수·순서, 표, 코드블록 실행 로직, 이미지 언어쌍 참조)은 모든 글에서 **이상 없음** — pre-commit 훅이 이미 강제하고 있어 예상된 결과입니다.
- 그 외는 경미한 표현 다듬기 제안, 서식(빈 줄) 차이, ko 원문 자체의 오탈자/편집 오류(en에도 동일하게 있으나 번역 드리프트는 아님) 수준입니다.

---

## src/content/posts/ai/limitation-of-linear-decision-boundary-and-MLP (ko.md / en.md)

### 번역 드리프트 — en.md 코드블록 미번역 (심각)

`en.md`의 파이썬 코드블록(`<details>` 안의 실습 코드 2곳 + 5.3절 ReLU 코드 1곳)에 있는 `#` 주석과 `print()` 문자열이 한국어 그대로 남아 있습니다. 직접 grep으로 재확인한 결과 최소 16곳입니다.

- `en.md` 254~300행 (3장 공간변환 콜아웃 안 `<details>` 코드), 496~543행 (§5.2 MLP: XOR, 위와 동일한 코드 반복)
  ```
  > # MLP + step function으로 XOR 풀기
  > # 1. hiddne layer: 공간을 구부림
  > # (1,0) 또는 (0,1)이라면 그 자리에 두고, (0,0) 또는 (1,1)이라면 (0,0)으로 이동시킴.
  > # 노드 1: (1,0) 데이터만 찾아내는 필터 (x1 - x2 >= 0.5)
  > # 노드 2: (0,1) 데이터만 찾아내는 필터 (-x1 + x2 >= 0.5)
  > # 각 노드에 행렬 곱셈(@) 연산 후 계단 함수(>= 0) 적용
  > # 각 노드의 결과: 새로운 2차원 공간 좌표
  > # 2. 출력층 (Output Layer): 변환된 공간에서 선 긋기
  > # 변환된 공간에서 두 특성(x1, x2) 중 하나라도 1이면 1
  > # OR 게이트
  > # 변환된 공간(new_space_x)에 최종 선형 연산 후 계단 함수 적용
  > # 3. 결과 확인
  > print("1. 원본 공간의 데이터:\n", ...)
  > print("\n2. 계단 함수를 거쳐 새롭게 재배치된 공간 (h1, h2):\n", ...)
  > print("\n3. 최종 예측값:", ...)
  > print(f"4. 최종 정확도: {final_accuracy * 100}%")
  ```
- `en.md` 545~587행 (§5.3 ReLU: XOR)
  ```
  self.hidden = nn.Linear(2, 16) # 입력 데이터 차원 2, 출력 데이터 차원이 16인 선형변홤을 수행하는 Fully Connected Layer를 생성
  self.output = nn.Linear(16, 1) # 출력은 차원은 1이 되어야함.
  self.relu = nn.ReLU() # 이렇게 간단하게 모듈을 불러올 수도 있음.
  # TODO 1: hidden_value에 ReLU 적용
  # activated_value = torch.clamp(hidden_value, 0)          # OPTION 2: clamp() 함수를 쓸 수도 있음. 0보다 작은 값은 전부 0으로 잘라버림.
  # activated_value = hidden_value * (hidden_value >= 0)    # OPTION 3: 논리연산 값을 원래 값에 곱해버리면 음수는 0이 곱해져서 0이 되어버림.
  print("forward에 ReLU를 넣고 p04_ready를 True로 바꾸면 준비된 loop가 실행됨")
  ```

**제안**: 위 코드블록들의 주석·print 문자열을 영어로 번역합니다. 실행 코드 자체(변수·값)는 ko/en이 이미 동일하므로 그대로 두면 됩니다.

(참고: `p03_trials` 튜플 라벨 "후보 A"/"후보 B"와 그 실제 실행 결과를 그대로 보여주는 인용구는 실습 기록 성격이 강해 지적에서 제외했습니다.)

### 표현 점검 — ko.md 오탈자·비문 4건

1. 340행: `"...0점은 맞은 학생이나 59점을 만은 학생이나 똑같이 F를 주는..."` → `"...0점을 맞은 학생이나 59점을 받은 학생이나..."` ("0점은 맞은"의 조사 오류, "만은"은 "받은"의 오타)
2. 455행: `"...압도적 우승을 자치한 이후입니다."` → `"...압도적 우승을 차지한 이후입니다."` ("자치한"은 "차지한"의 오타)
3. 554행(코드 주석): `"선형변홤"` → `"선형변환"` (오타)
4. 555행(코드 주석): `"출력은 차원은 1이 되어야함."` → `"출력 차원은 1이 되어야 함."` (조사 중복)

en.md는 위 오탈자들을 번역하면서 자연스럽게 의역되어 있어(예: "압도적 우승을 자치한" → "won by an overwhelming margin") en.md 자체에는 영향이 없습니다.

### 수학·ML 사실 점검

수식·계산(AND/XOR 공간변환, 시그모이드 미분 최댓값 0.25, non-zero-centered 지그재그 등)은 직접 검산했고 전부 일치합니다.

- **확인 못함**: "ReLU는 1969년 후쿠시마 쿠니히코 교수가 처음 논문에서 발표"라는 서술 — 문헌마다 기원 주장이 엇갈려 확인하지 못했습니다. 오류로 단정하지 않습니다.
- **확인 못함**: "기존 활성화 함수보다 학습 속도가 6배나 빠르면서"라는 서술 — AlexNet 논문의 "6배"가 ILSVRC 우승 당시 비교 수치인지, 별도의 CIFAR-10 소형 실험 수치인지 확인하지 못했습니다. 오류로 단정하지 않습니다.

---

## src/content/posts/ai/logistic-regression (ko.md / en.md)

### 번역 드리프트

이상 없음 — 헤딩·표(알고리즘 비교, GridSearchCV 파라미터)·이미지·KaTeX 수식·코드블록 주석 모두 완전히 대응합니다(코드 주석도 전부 영어로 번역되어 있음).

### 표현 점검 (경미, 필수 수정 아님)

1. en.md 403행: `"the larger the error, the **honestly** larger the gradient"` — ko "기울기도 **정직하게** 커집니다"의 직역으로 다소 어색. 제안: `"the larger the error, the proportionally larger the gradient"`
2. en.md 64행: `"very finely matched to the actual data distribution (well-calibrated)"` — 제안: `"very well calibrated against the true data distribution"`
3. en.md 56행: `"you have to prove arithmetically ..."` — 제안: `"you have to demonstrate numerically ..."`

### 수학·ML 사실 점검

로지스틱 회귀 파이프라인, 베르누이 우도, BCE 유도·그래디언트, 결정경계, 오즈비 해석, GridSearchCV 조합 수(2×6×2×5=120), solver별 penalty 지원 여부는 모두 직접 검산해 정확함을 확인했습니다.

- **확인 필요(원문 자체, ko/en 동일 — 번역 드리프트 아님)**: ko/en 공통 64행 부근 "트리 기반 앙상블 모델들은 예측 확률이 0이나 1 근처로 극단적으로 쏠린다"는 서술이 일반적으로 알려진 방향과 반대일 가능성이 있습니다. 캘리브레이션 문헌(Niculescu-Mizil & Caruana, 2005 등)에서는 랜덤포레스트·부스팅 트리가 오히려 확률을 0.5 쪽으로 당겨 과소자신감을 보인다는 결과가 자주 인용됩니다. 100% 확신은 아니라 "확인 못함" 수준으로 남기며, 저자가 재검토하면 좋겠습니다.
- (참고, 사실 오류는 아님) `## 4. 코드로 활용하는 법`의 `LogisticRegression(penalty=[...], solver=[...], ...)` 코드가 GridSearchCV 파라미터 그리드처럼 보이지만 실제 `LogisticRegression()` 생성자에 리스트를 그대로 넣으면 실행 오류가 납니다. 옵션을 한눈에 보여주려는 의도적 문서화 스타일로 보이나, 코드를 그대로 복사해 실행할 독자에게는 혼란을 줄 수 있습니다. ko/en 동일하므로 번역 드리프트는 아닙니다.

---

## src/content/posts/claude/hook (ko.md / en.md)

### 번역 드리프트 / 표현

이상 없음 — 헤딩·표(종료코드, 환경변수, matcher, hook 타입)·이미지 언어쌍·코드블록(JSON/bash) 모두 완전히 대응하며, en.md에 미번역 한국어 없음. 표현도 양쪽 다 자연스럽습니다.

### Claude Code 사실 점검

**⚠️ "이벤트 31종" 서술 — 공식 문서와 차이 있음 (확인됨)**

- ko.md 187·189·191행 / en.md 대응 위치: `"## 📖 이벤트 31종 지도"`, `"개요 글에서는 대표적인 네 개만 소개했지만, 실제로는 31종입니다."`
- 글에 나열된 이벤트를 직접 세어보면 6개 그룹(도구 6 + 프롬프트·표시 3 + 세션 수명 8 + 턴 종료·알림 3 + 서브에이전트·태스크 5 + 컨텍스트·워크트리·MCP 6) = **정확히 31개**로, 글 안에서는 자기 일관적입니다.
- 다만 공식 문서(`https://code.claude.com/docs/en/hooks`)를 **리딩 프롬프트 없이 두 번 독립적으로 조회**해 이벤트 표를 그대로 받아본 결과, 공식 문서는 아래 **33개**를 나열하고 있습니다(글의 31개 + `PreModelSwitch`, `PostModelSwitch` 2개):
  `SessionStart, Setup, UserPromptSubmit, UserPromptExpansion, PreToolUse, PermissionRequest, PermissionDenied, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, MessageDisplay, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, InstructionsLoaded, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, Elicitation, ElicitationResult, SessionEnd`
- **제안**: "실제로는 31종입니다"를 "실제로는 33종입니다(모델 전환 관련 `PreModelSwitch`/`PostModelSwitch` 포함)"로 갱신하거나, 표에 두 이벤트를 추가하는 방향을 권합니다. ko.md를 먼저 고치고 en.md를 그에 맞춰 수정해야 합니다.
- 그 외 종료코드 동작, timeout 기본값(command·http·mcp_tool 600초/prompt 30초/agent 60초/UserPromptSubmit 30초/MessageDisplay 10초), 환경변수 7종, hook 타입 5종(`command`/`http`/`mcp_tool`/`prompt`/`agent`), `stop_hook_active` 재진입 플래그는 모두 공식 문서와 **일치 확인됨**.

---

## src/content/posts/claude/intro-automation-hook-loop-routine (ko.md / en.md)

이상 없음. 헤딩·표(자동화 비교, hook 이벤트 예시 4종, routine 트리거 3종)·이미지 8쌍·JSON 코드블록 모두 대응. "대표적인 이벤트는 네 가지, 실제로는 더 있음"이라는 서술도 정확한 표현(과장 없음)으로 확인됨.

## src/content/posts/claude/loop (ko.md / en.md)

이상 없음. 헤딩·표(hook vs /loop, 입력 모드 3종, cron 매핑 3종, 멈추는 법 4종)·이미지 12쌍 모두 대응. `i18n-intentional` 마커가 붙은 목차 앵커 차이도 정상 처리됨.

**Claude Code 사실 점검 — 모두 확인됨**: `/loop` 간격 단위(초·분·시·일)와 최소 단위 1분(30s→1m 올림), Notification/PreToolUse 등 이벤트 예시, cron 매핑 표(`Nm`→`*/N * * * *`, `Nh`→`0 */N * * * *`, `Nd`→`0 0 */N * * *`), 지터(최대 30분, 1시간 미만 간격은 절반까지), 7일 자동 만료, `CLAUDE_CODE_DISABLE_CRON` 환경변수, `Monitor`/`CronCreate`/`CronDelete`/`ScheduleWakeup` 도구명 — 모두 공식 문서와 일치.

---

## src/content/posts/claude/routine (ko.md / en.md)

### 서식 차이 (경미, 내용 아님)

- ko.md 239행 뒤 / en.md 240~241행: en.md의 코드블록 앞에 빈 줄이 하나 더 있어 전체 줄 수가 474줄(ko) vs 475줄(en)로 차이 납니다. 렌더링에는 영향 없는 순수 서식 차이이나, 통일하려면 ko.md에도 빈 줄을 하나 추가하면 됩니다.

### 표현 점검 (경미, 선택사항)

1. en.md 155행: `"The prompt is 80% of a routine."` — 제안: `"The prompt is 80% of the work in a routine."`
2. ko.md 293행: `"웹훅이 정답입니다"` — "정답"이 다소 단정적. 제안: `"웹훅이 올바른 선택입니다"` (선택사항)

### Claude Code 사실 점검 — 모두 확인됨

routine 정의(프롬프트·저장소·커넥터 세트), 트리거 다중 첨부, cron 최소 간격 1시간, stagger(부하 분산을 위한 오프셋, routine마다 일정), 클라우드 세션 자율 실행(승인창 없음), 로컬 `claude mcp add` 플러그인이 routine 커넥터 목록에 안 뜨는 점, 커넥터 기본 전체 포함, 초록불이 인프라 성공만 의미한다는 점, 기본 네트워크 정책 Trusted, `claude/` 브랜치 push 관련 4가지 거부 조건, routine 일일 실행 상한과 1회성 실행 제외, `/schedule` 미노출 조건 3가지 — 모두 공식 문서(`https://code.claude.com/docs/en/routines` 등)와 대조해 확인됨. 네트워크 기본 허용목록의 구체적 도메인 예시는 문서에 전체 목록이 나열되어 있지 않아 일부는 확인 못함으로 남기되, 오류의 근거로 삼지 않았습니다.

---

## src/content/posts/claude/worktree (ko.md / en.md)

이상 없음. 헤딩 26개·표 4개·이미지 3쌍·코드블록(git log 한국어 커밋 메시지는 실습 기록이라 정상) 모두 대응.

**Claude Code 사실 점검 — 모두 확인됨**: `-w`/`--worktree` 플래그, `worktree.baseRef` 기본값 `"fresh"` 및 가능한 값(`fresh`/`head`), 원격 없을 때 로컬 `HEAD` 폴백, 24시간 fetch 주기(최대 5초 캡), `.worktreeinclude`(`.gitignore` 문법), `.claude/worktrees/<name>/` 경로, `worktree-<name>` 브랜치명, `EnterWorktree`/`ExitWorktree` 도구, `-p` 헤드리스 모드에서 정리 미실행, `cleanupPeriodDays` 설정, subagent frontmatter `isolation: worktree`, PR 번호(`#1234`)/URL로 워크트리 생성, worktree 재사용 리셋 조건 — 모두 공식 문서와 일치 확인됨. `CLAUDE_BASE` 파일과 lock 파일의 정확한 내용 형식은 문서에 명시되어 있지 않아 확인 못함으로 남기되, 오류로 보지 않았습니다.

---

## src/content/posts/git/worktree (ko.md / en.md)

이상 없음. 헤딩·ASCII 다이어그램 코드블록 4개·콜아웃 2개·이미지(언어중립) 모두 대응. 표현도 양쪽 자연스러움.

---

## src/content/posts/python/01-everything-is-an-object (ko.md / en.md)

### 서식 차이 (경미, 내용 아님)

ko 931줄 vs en 935줄 차이는 두 지점(인터닝 콜아웃 직후, `is` 비교 경고 콜아웃 앞)에서 en.md에 빈 줄이 하나씩 더 있는 순수 서식 차이입니다. CommonMark 기준 렌더링에는 영향 없습니다. 실제 콘텐츠(헤딩 22개, 코드펜스 102개, 이미지 14쌍)는 완전히 대응하며, en.md에 남은 한글은 모두 의도된 예시 데이터(`"가"`, `"가나"`, 출처명 `[tistory: 잉여 개발자]` 등)뿐입니다.

### 표현·기술 사실 점검

이상 없음. `PyObject`/`PyVarObject` 크기, 정수 digit 30비트, `sys.getsizeof` 수치, 작은 정수 캐시(-5~256), `str` 크기 공식, `list` 오버할당 수열, `__slots__` 절약률(42%) 등을 모두 재계산해 일치 확인. "int가 3.12에서 PyVarObject를 벗어났다"는 서술은 본문에 근거 링크가 있고 개연성은 있으나 CPython 소스를 직접 대조하지 않아 확인 못함으로 남깁니다.

## src/content/posts/python/02-variables-are-name-tags (ko.md / en.md)

이상 없음. 헤딩 8개·코드펜스 22개·이미지 7쌍·표 21행 모두 대응, 참고자료 URL 목록 완전 동일. `STORE_NAME`/`LOAD_NAME` vs `STORE_FAST`/`LOAD_FAST` 구분, `FrameLocalsProxy`(PEP 667, 3.13) 등 기술 서술에서 오류를 찾지 못했습니다.

## src/content/posts/python/03-the-inside-story-of-if (ko.md / en.md)

### 번역 드리프트 / 표현

이상 없음. 헤딩 24개·코드펜스 70개·이미지 5쌍·표 6행 모두 대응, en.md에 미번역 한글 없음(전수 스캔 0건).

### 원문(ko, SSOT) 자체의 편집 오류 — ko/en 공통, 번역 드리프트 아님

- ko.md 195행(en.md 대응 위치 동일): 소제목 `### 판정은 6단계로 결정됩니다` 바로 아래 번호 목록이 실제로는 **1~7번, 7개 항목**입니다(직접 재확인).
  ```
  1. `Py_True`면 → 참
  2. `Py_False`면 → 거짓
  3. `Py_None`이면 → 거짓
  4. nb_bool 슬롯 → ...
  5. mp_length 슬롯 → ...
  6. sq_length 슬롯 → ...
  7. 아무것도 없으면 → return 1, 무조건 참
  ```
- **제안**: 소제목을 "7단계로 결정됩니다"로 바꾸거나, 7번 항목을 번호 목록에서 빼고 "그리고 그중 아무것도 없으면 무조건 참입니다" 같은 별도 문장으로 처리해 앞의 여섯 항목만 번호를 매기는 방법이 있습니다. ko를 먼저 고치고 en도 그에 맞춰 수정해야 합니다.

기술 사실 점검(TO_BOOL 3.13 신규 명령어, `PyObject_IsTrue` 순서, `__bool__`/`__len__`이 각각 `nb_bool`/`mp_length`·`sq_length`에 연결되는 점, 상수 조건문 컴파일 타임 폴딩 등)은 오류를 찾지 못했습니다.

---

## src/content/projects/relu-soft/west-side-barbell-club/01-about-conjugate (ko.md / en.md)

이상 없음.

## src/content/projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol (ko.md / en.md)

이상 없음.

## src/content/pages/home (ko.md / en.md)

이상 없음.

## src/content/experiences/code-it/code-it (ko.mdx / en.mdx)

이상 없음. `DocLinks` 컴포넌트 props(`collection`/`under`/`tag`/`order`/`variant`)와 import 경로도 ko/en 양쪽 동일하게 정상.

---

## 제외 사항

`src/content/pages/cv/`는 아직 다듬는 중인 문서(`draft: true`)라 이번 점검에서 완전히 제외했습니다(읽지 않음, 집계에서도 제외).

---

## Discord 알림

환경변수 `DISCORD_WEBHOOK_URL`이 설정되어 있어 위 요약을 Discord로 전송했습니다.
