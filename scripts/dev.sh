#!/usr/bin/env bash
#
# 개발 서버를 "언제 실행해도 같은 자리에, 깨끗하게" 띄운다.
#
# 왜 필요한가 —
#   1. Astro 7 의 dev 서버는 터미널이 아닌 곳에서 실행되면 백그라운드 데몬으로
#      남는다. 껐다고 생각한 서버가 계속 살아 있다가 다음 실행 때 포트를 뺏는다.
#   2. 포트가 막혀 있으면 astro 는 조용히 4322, 4323 … 으로 옮겨간다. 그러면
#      사람과 Claude가 서로 다른 주소를 보게 되고, 화면이 안 바뀐다며 헤맨다.
#   3. dev 서버가 떠 있는 채로 `npm run build` 를 돌리면 두 프로세스가 콘텐츠
#      스토어를 동시에 다시 쓴다. 운이 나쁘면 본문이 통째로 빈 페이지가 조용히
#      만들어진다 — 에러도 안 난다.
#
# 그래서 이 스크립트는 매번 이렇게 한다.
#   ① `astro dev stop` 으로 데몬을 정식으로 내린다
#   ② 그래도 남은 이 프로젝트의 astro 프로세스(preview 포함)를 정리한다
#      — 명령줄 경로로 판별하므로 다른 프로젝트의 서버는 건드리지 않는다
#   ③ 포트가 비었는지 확인한다. 남의 프로그램이 잡고 있으면 조용히 옮기지 않고
#      누가 잡고 있는지 알려주고 멈춘다
#   ④ `--force` 로 콘텐츠 레이어 캐시를 비우고 정해진 포트에 띄운다
#
# 사용법:  npm run dev            (기본 포트 4321)
#          npm run dev -- 4500    (포트 지정)
#          npm run dev:stop       (내리기)
#          npm run dev:status     (떠 있는지 확인)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-${PORT:-4321}}"
ASTRO="$ROOT/node_modules/.bin/astro"

cd "$ROOT"

if [ ! -x "$ASTRO" ]; then
  echo "✗ astro 를 찾을 수 없습니다: $ASTRO" >&2
  echo "  먼저 'npm install' 을 실행하세요." >&2
  exit 1
fi

# ── ① 데몬을 정식으로 내린다 ────────────────────────────────────────────────
"$ASTRO" dev stop >/dev/null 2>&1 || true

# ── ② 남은 프로세스 정리 ────────────────────────────────────────────────────
# 명령줄에 이 프로젝트 경로가 들어 있는 것만 고른다. 다른 저장소에서 돌고 있는
# astro 서버는 경로가 달라 걸리지 않는다.
stop_pid() {
  local pid=$1
  kill "$pid" 2>/dev/null || return 0
  local i=0
  while [ $i -lt 20 ]; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 0.1
    i=$((i + 1))
  done
  kill -9 "$pid" 2>/dev/null || true
  sleep 0.2
}

stopped=0
while read -r pid; do
  [ -n "$pid" ] || continue
  stop_pid "$pid"
  stopped=$((stopped + 1))
done <<EOF
$(pgrep -f "$ROOT/node_modules/.*astro" 2>/dev/null || true)
EOF

# `[ … ] && echo` 로 쓰면 안 된다 — 조건이 거짓일 때 그 자체가 실패로 잡혀
# `set -e` 가 스크립트를 조용히 끝내버린다(정리할 게 없는 정상 상황에서 터진다).
if [ "$stopped" -gt 0 ]; then
  echo "· 남아 있던 이 프로젝트의 astro 프로세스 ${stopped}개를 정리했습니다"
fi

# ── ③ 포트 확보 ─────────────────────────────────────────────────────────────
# `lsof -sTCP:LISTEN` 은 macOS 의 lsof 에서 조용히 빈 결과를 내놓는다(플래그가
# 먹지 않는다). 그래서 상태 열을 직접 보고 LISTEN 인 것만 고른다.
# 끝의 `|| true` 를 빼면 안 된다 — 포트가 비어 있을 때 lsof 가 exit 1 을 내고,
# `pipefail` 때문에 그게 스크립트 전체를 죽인다(정상 상황에서 터진다).
holders="$(lsof -nP -iTCP:"$PORT" 2>/dev/null | awk '$NF == "(LISTEN)" { print $2 }' | sort -u || true)"
if [ -n "$holders" ]; then
  echo "✗ 포트 $PORT 를 다른 프로그램이 잡고 있습니다:" >&2
  # shellcheck disable=SC2086
  ps -o pid=,command= -p $holders 2>/dev/null | sed 's/^/    /' >&2
  echo "  이 프로젝트의 서버가 아니라 건드리지 않았습니다." >&2
  echo "  해당 프로그램을 끄거나, 다른 포트로 띄우세요:  npm run dev -- $((PORT + 1))" >&2
  exit 1
fi

# ── ④ 실행 ──────────────────────────────────────────────────────────────────
# --force 는 콘텐츠 레이어 캐시를 비운다. 앞선 빌드나 파싱 실패가 남긴 상한
# 렌더 결과(본문이 빈 페이지 등)를 들고 시작하지 않게 하는 게 목적이다.
echo "· http://localhost:$PORT 에서 띄웁니다"
if [ -t 1 ]; then
  echo "  (Ctrl+C 로 종료)"
else
  echo "  (백그라운드로 뜹니다 — 종료: npm run dev:stop)"
fi
echo

exec "$ASTRO" dev --port "$PORT" --force
