/**
 * 커스텀 이미지 이모지 `:이름:` 문법의 단일 소스.
 *
 * 이 모듈은 순수 JS다. remark 플러그인(astro.config가 Node에서 로드)과 Astro
 * 컴포넌트(Vite 모듈 그래프) 양쪽에서 같은 규칙을 써야 하는데, 전자는
 * `import.meta.glob`을, 후자는 `node:fs`를 쓸 수 없기 때문이다. 그래서 "토큰을
 * 어떻게 읽을 것인가"만 여기 두고, "파일을 어떻게 찾을 것인가"는 각자 맡는다.
 */

/** 이모지 원본을 두는 곳(프로젝트 루트 기준). public/ 이 아니라 src/ 여야 Astro가 최적화한다. */
export const EMOJI_DIR = 'src/assets/emoji';

/**
 * 최적화 목표 높이(px).
 * 이모지가 가장 크게 뜨는 자리는 글 제목(--text-3xl = 18px × 1.2⁴ ≈ 37px)이고,
 * 레티나 3배를 감안해 여유를 둔 값이다. tokens.css의 글자 크기를 크게 올리면
 * 이 값도 같이 올려야 한다.
 */
export const EMOJI_HEIGHT = 128;

/** 최적화(리사이즈 + webp 변환) 대상. */
export const RASTER_EXT = ['png', 'jpg', 'jpeg', 'webp'];

/** svg는 이미 벡터라 변환하지 않고 그대로 통과시킨다. */
export const EMOJI_EXT = [...RASTER_EXT, 'svg'];

/**
 * 명시적으로 거부하는 확장자.
 * 애니메이션 GIF는 리사이즈하면 첫 프레임만 남아 "조용히 정지 이미지가 되는"
 * 사고가 난다. 조용히 깨지느니 빌드를 세운다.
 */
export const REJECTED_EXT = ['gif'];

/** 이모지 이름: 영소문자로 시작, 끝은 영숫자, 2~32자. */
const NAME_SOURCE = '[a-z][a-z0-9_-]{0,30}[a-z0-9]';

/**
 * `:이름:` 토큰.
 *
 * 앞뒤로 `[A-Za-z0-9_:]`가 붙으면 매치하지 않는다. 그래서 `10:30:00`,
 * `ratio 3:2:1`, `https://…`, CSS의 `a:hover:focus` 같은 자연스러운 콜론
 * 표현은 건드리지 않는다. 한글은 단어 문자가 아니므로 `:claude:입니다`처럼
 * 조사가 바로 붙는 건 정상 동작한다.
 */
function tokenRe() {
  return new RegExp(`(?<![\\w:]):(${NAME_SOURCE}):(?![\\w:])`, 'g');
}

/**
 * 문자열을 텍스트 구간과 이모지 구간으로 쪼갠다.
 * @param {string} text
 * @returns {Array<{type: 'text' | 'emoji', value: string}>}
 */
export function splitEmoji(text) {
  /** @type {Array<{type: 'text' | 'emoji', value: string}>} */
  const parts = [];
  const re = tokenRe();
  let last = 0;
  for (let m; (m = re.exec(text)) !== null; ) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
    parts.push({ type: 'emoji', value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

/**
 * 블록 맨 앞에 온 이모지 바로 뒤의 공백 하나를 없앤다.
 *
 * `## :sample: 헤딩` 을 그대로 두면 Astro가 만드는 heading id가 남은 공백 때문에
 * `#-헤딩` 처럼 하이픈으로 시작해버린다. 공백을 걷어내고 간격은 CSS
 * (`.c-emoji:first-child`)가 맡게 하면 앵커가 `#헤딩` 으로 깔끔해진다.
 *
 * @param {Array<{type: 'text' | 'emoji', value: string}>} parts
 */
export function dropSpaceAfterLead(parts) {
  if (parts.length < 2 || parts[0].type !== 'emoji' || parts[1].type !== 'text') return parts;
  const trimmed = parts[1].value.replace(/^[ \t]/, '');
  if (trimmed === parts[1].value) return parts;
  return [parts[0], { type: 'text', value: trimmed }, ...parts.slice(2)];
}

/**
 * 토큰이 하나라도 있는지.
 * @param {string} text
 */
export function hasEmoji(text) {
  return tokenRe().test(text);
}

/**
 * 토큰을 걷어내고 순수 텍스트만 남긴다.
 * `<title>`·og:title·meta description처럼 이미지를 넣을 수 없는 자리에 쓴다.
 * @param {string} text
 */
export function stripEmoji(text) {
  return text
    .replace(tokenRe(), '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 오타 후보 찾기(레벤슈타인 거리). 빌드 에러 메시지를 쓸모 있게 만들려고 쓴다.
 * @param {string} name
 * @param {Iterable<string>} candidates
 * @returns {string | undefined}
 */
export function suggestName(name, candidates) {
  let best;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = editDistance(name, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  // 거리가 이름 길이의 절반을 넘으면 "비슷하다"고 하기 어렵다.
  return best !== undefined && bestDistance <= Math.max(1, Math.floor(name.length / 2))
    ? best
    : undefined;
}

/**
 * @param {string} a
 * @param {string} b
 */
function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * 파일 목록 → 이름 맵. 중복 이름과 거부 확장자를 여기서 한 번에 검사한다.
 * remark 플러그인(readdir)과 Astro 컴포넌트(import.meta.glob)가 공유한다.
 *
 * @template T
 * @param {Array<{name: string, ext: string, label: string, value: T}>} files
 * @returns {Map<string, {ext: string, value: T, label: string}>}
 */
export function buildRegistry(files) {
  /** @type {Map<string, {ext: string, value: T, label: string}>} */
  const registry = new Map();
  for (const file of files) {
    if (REJECTED_EXT.includes(file.ext)) {
      throw new Error(
        `커스텀 이모지로 .${file.ext} 는 쓸 수 없습니다: ${file.label}\n` +
          `  애니메이션이 리사이즈 과정에서 첫 프레임만 남아 조용히 깨집니다.\n` +
          `  ${EMOJI_EXT.map((e) => `.${e}`).join(', ')} 중 하나로 바꿔 주세요.`,
      );
    }
    if (!EMOJI_EXT.includes(file.ext)) continue;
    const existing = registry.get(file.name);
    if (existing) {
      throw new Error(
        `커스텀 이모지 이름이 중복됩니다: :${file.name}:\n` +
          `  ${existing.label}\n  ${file.label}\n` +
          `  확장자만 다른 같은 이름은 둘 수 없습니다. 하나를 지우거나 이름을 바꿔 주세요.`,
      );
    }
    registry.set(file.name, { ext: file.ext, value: file.value, label: file.label });
  }
  return registry;
}

/**
 * 등록되지 않은 이름을 만났을 때 던질 에러.
 * @param {string} name
 * @param {Iterable<string>} known
 * @param {string} where
 */
export function unknownEmojiError(name, known, where) {
  const suggestion = suggestName(name, known);
  return new Error(
    `등록되지 않은 커스텀 이모지입니다: :${name}: (${where})\n` +
      (suggestion ? `  혹시 :${suggestion}: 인가요?\n` : '') +
      `  ${EMOJI_DIR}/${name}.png 처럼 파일을 두면 :${name}: 으로 쓸 수 있습니다.\n` +
      `  콜론 표기를 그대로 보여주려면 인라인 코드(\`:${name}:\`)로 감싸세요.`,
  );
}
