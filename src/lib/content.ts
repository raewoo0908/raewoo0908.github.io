import { getCollection, type CollectionEntry } from 'astro:content';
import { LOCALES, isLocale, type Locale } from './i18n';

export type BilingualCollection = 'posts' | 'projects' | 'experiences';
export type BilingualEntry = CollectionEntry<BilingualCollection>;

export interface BilingualDoc {
  /** 언어중립 경로 (예: 'algorithms/hello'). URL 및 그룹 키로 사용 — 로케일이 포함되지 않는다. */
  path: string;
  segments: string[];
  /** 글 폴더명 (마지막 세그먼트) */
  slug: string;
  /** 카테고리 경로 세그먼트 (slug 제외) */
  categorySegments: string[];
  categoryPath: string;
  entries: Partial<Record<Locale, BilingualEntry>>;
  title: Record<Locale, string | undefined>;
  description: Record<Locale, string | undefined>;
  date?: Date;
  draft: boolean;
  cover?: string;
  tags: string[];
}

/**
 * 한 컬렉션의 ko.md/en.md 파일들을 폴더 단위로 묶어 언어중립 문서 목록으로 반환한다.
 * 예) 'algorithms/hello/ko' + 'algorithms/hello/en' → path 'algorithms/hello' 하나의 BilingualDoc.
 * PROD 빌드에서는 draft 문서를 제외하고, 최신 날짜순으로 정렬한다.
 */
export async function getBilingualDocs(collection: BilingualCollection): Promise<BilingualDoc[]> {
  const raw = await getCollection(collection);
  const groups = new Map<string, { path: string; segments: string[]; entries: Partial<Record<Locale, BilingualEntry>> }>();

  for (const entry of raw) {
    const parts = entry.id.split('/');
    const lang = parts[parts.length - 1];
    if (!isLocale(lang)) continue; // ko/en 으로 끝나는 파일만 유효
    const segments = parts.slice(0, -1);
    if (segments.length === 0) continue;
    const path = segments.join('/');

    const group = groups.get(path) ?? { path, segments, entries: {} };
    group.entries[lang] = entry;
    groups.set(path, group);
  }

  let docs: BilingualDoc[] = [...groups.values()].map(({ path, segments, entries }) => {
    const ko = entries.ko;
    const en = entries.en;
    return {
      path,
      segments,
      slug: segments[segments.length - 1],
      categorySegments: segments.slice(0, -1),
      categoryPath: segments.slice(0, -1).join('/'),
      entries,
      title: { ko: ko?.data.title, en: en?.data.title },
      description: { ko: ko?.data.description, en: en?.data.description },
      date: ko?.data.date ?? en?.data.date,
      draft: ko?.data.draft ?? en?.data.draft ?? false,
      cover: ko?.data.cover ?? en?.data.cover,
      tags: ko?.data.tags?.length ? ko.data.tags : (en?.data.tags ?? []),
    };
  });

  if (import.meta.env.PROD) docs = docs.filter((doc) => !doc.draft);
  docs.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  return docs;
}

/** 로케일별 표시용 제목(없으면 반대 언어로 폴백). */
export function pickTitle(doc: BilingualDoc, locale: Locale): string {
  const other: Locale = locale === 'ko' ? 'en' : 'ko';
  return doc.title[locale] ?? doc.title[other] ?? doc.slug;
}

/** 단일 페이지(home, cv 등)의 ko/en 엔트리를 라이브 객체로 가져온다(render 가능). */
export async function getPageEntries(name: string) {
  const all = await getCollection('pages');
  return {
    ko: all.find((entry) => entry.id === `${name}/ko`),
    en: all.find((entry) => entry.id === `${name}/en`),
  };
}

export { LOCALES };
