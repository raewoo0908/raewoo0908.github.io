---
title: Image Classifier
date: 2026-05-20
description: A CNN-based image classification toy project. (Projects second category "ml" example)
tags: [python, pytorch, ml]
---

## Overview

A toy project that classifies images with a simple CNN. Used to check whether an additional `ml` category shows up in the Projects menu. 🧠

- Framework: **PyTorch**
- Dataset: CIFAR-10
- Result: ~85% test accuracy

```python
import torch.nn as nn

model = nn.Sequential(
    nn.Conv2d(3, 32, 3, padding=1),
    nn.ReLU(),
    nn.MaxPool2d(2),
)
```
