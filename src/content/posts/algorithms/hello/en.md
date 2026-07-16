---
title: First Post — A Tour of Markdown Features ✍️
date: 2026-07-16
description: An example post showing the markdown, code, and image features available on this blog.
tags: [markdown, getting-started]
---

## Welcome 👋

This post is an **example** of the features you can use freely on the blog.
Emojis 😀, **bold**, *italic*, and `inline code` all work naturally.

> 💡 Press the 🌐 button in the top right to switch straight to the Korean version of this post. The URL stays the same.

## Code Snippets

Syntax highlighting and a copy button are included by default.

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet('raewoo0908'));
```

You can also drop code inline like `const x = 42;`.

## Lists and Tables

- Apple 🍎
- Banana 🍌
- Cherry 🍒

| Language | Extension |
| --- | --- |
| TypeScript | `.ts` |
| Python | `.py` |

## Images

![Sample image](/images/sample.svg)

Put images in the `public/` folder and reference them with an absolute path, or place them next to the post and use a relative path.

## Wrapping Up

To write a new post, create a folder at `src/content/posts/<category>/<name>/`
and add `ko.md` and `en.md`. Just adding a folder makes the category appear in the top menu automatically. 🎉
