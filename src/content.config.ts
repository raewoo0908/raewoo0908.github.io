import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 한/영 글이 공유하는 frontmatter 스키마.
 * 각 글은 <카테고리>/.../<slug>/ 폴더 안에 ko.md, en.md 두 파일로 존재하며,
 * 두 파일 각각이 이 스키마로 검증된다(title 등은 해당 언어값).
 */
const bilingualSchema = z.object({
  title: z.string(),
  date: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  description: z.string().optional(),
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const makeCollection = (dir: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: `./src/content/${dir}` }),
    schema: bilingualSchema,
  });

const posts = makeCollection('posts');
const projects = makeCollection('projects');
const experiences = makeCollection('experiences');

// 홈/CV 같은 단일 페이지. 폴더당 ko.md, en.md 짝.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { posts, projects, experiences, pages };
