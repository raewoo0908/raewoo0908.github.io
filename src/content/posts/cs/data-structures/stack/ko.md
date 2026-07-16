---
title: 스택(Stack) 정리
date: 2026-07-14
description: LIFO 자료구조인 스택의 개념과 기본 연산 정리. (중첩 카테고리 cs / data-structures 예시)
tags: [cs, 자료구조]
---

## 스택이란

**스택(Stack)** 은 **LIFO**(Last In, First Out) 구조의 자료구조입니다. 가장 나중에 넣은 값이 가장 먼저 나옵니다. 📚

이 글은 `posts/cs/data-structures/` 처럼 **카테고리 안의 하위 카테고리**에 놓인 예시입니다. 상단 Posts 메뉴에서 `cs → data-structures` 로 펼쳐지는지 확인해 보세요.

## 기본 연산

| 연산 | 설명 |
| --- | --- |
| `push` | 맨 위에 값 추가 |
| `pop` | 맨 위 값 제거 후 반환 |
| `peek` | 맨 위 값 확인 |

```python
stack = []
stack.append(1)   # push
stack.append(2)
print(stack.pop())  # 2 (마지막에 넣은 값)
```
