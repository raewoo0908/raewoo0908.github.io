---
title: Stack — Notes
date: 2026-07-14
description: Concepts and basic operations of the LIFO data structure, the stack. (Nested category cs / data-structures example)
tags: [cs, data-structures]
---

## What is a Stack

A **stack** is a **LIFO** (Last In, First Out) data structure. The most recently pushed value is the first to come out. 📚

This post lives inside a **nested category** like `posts/cs/data-structures/`. Check whether the top Posts menu expands as `cs → data-structures`.

## Basic Operations

| Operation | Description |
| --- | --- |
| `push` | Add a value on top |
| `pop` | Remove and return the top value |
| `peek` | Look at the top value |

```python
stack = []
stack.append(1)   # push
stack.append(2)
print(stack.pop())  # 2 (the last value pushed)
```
