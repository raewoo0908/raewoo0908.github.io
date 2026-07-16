export const LOCALES = ['ko', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** 상단 고정 네비 + UI 문구 (한/영 동시 보유, 토글로 전환) */
export const UI = {
  home: { ko: '홈', en: 'Home' },
  cv: { ko: 'CV', en: 'CV' },
  projects: { ko: '프로젝트', en: 'Projects' },
  experiences: { ko: '경험', en: 'Experiences' },
  posts: { ko: '글', en: 'Posts' },
  // 토글 버튼에 보이는 '전환 대상' 라벨: ko 활성 → 'EN' 노출, en 활성 → '한국어' 노출
  switchTo: { ko: 'EN', en: '한국어' },
  translationMissing: {
    ko: '이 글의 한국어 버전이 아직 없습니다.',
    en: 'The English version of this post is not available yet.',
  },
  readMore: { ko: '자세히 보기', en: 'Read more' },
  all: { ko: '전체', en: 'All' },
  categories: { ko: '카테고리', en: 'Categories' },
  recent: { ko: '최근 글', en: 'Recent posts' },
  noContent: { ko: '아직 콘텐츠가 없습니다.', en: 'No content yet.' },
  backToList: { ko: '목록으로', en: 'Back to list' },
} as const;

/** 폴더명을 사람이 읽기 좋은 라벨로 (예: 'data-structures' → 'Data structures') */
export function humanize(segment: string): string {
  const spaced = segment.replace(/[-_]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
