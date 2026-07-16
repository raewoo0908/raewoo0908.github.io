---
title: 이미지 분류기
date: 2026-05-20
description: CNN 기반 이미지 분류 토이 프로젝트. (Projects 두 번째 카테고리 ml 예시)
tags: [python, pytorch, ml]
---

## 개요

간단한 CNN으로 이미지를 분류하는 토이 프로젝트입니다. Projects 메뉴에 `ml` 카테고리가 추가로 보이는지 확인용 예시입니다. 🧠

- 프레임워크: **PyTorch**
- 데이터셋: CIFAR-10
- 결과: 테스트 정확도 약 85%

```python
import torch.nn as nn

model = nn.Sequential(
    nn.Conv2d(3, 32, 3, padding=1),
    nn.ReLU(),
    nn.MaxPool2d(2),
)
```
