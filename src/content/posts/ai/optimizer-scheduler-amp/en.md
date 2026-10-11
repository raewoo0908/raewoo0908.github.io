---
title: ":ai: Dissecting One Training Iteration: Optimizer · LR Scheduler · AMP"
date: 2026-10-10T23:00:00+09:00
description: "Going through the training loop of an SSD300 transfer-learning notebook line by line: how the optimizer and LR scheduler split the work, the Warmup → Cosine schedule, how AMP (autocast + GradScaler) works and what to watch out for, and the point where the two topics collide."
tags: [AI, DeepLearning, PyTorch, Optimizer, LRScheduler, Warmup, CosineAnnealing, AMP, MixedPrecision, GradScaler]
draft: true
---

## 0. Introduction

In Codeit Mission 7, I transfer-learned a COCO-pretrained SSD300 to detect dog and cat faces. While fixing the baseline notebook I was handed, I found code like this.

> 📌 **NOTE**
>
> This post is based on the training code of the Mission 7 experiment notebook ([`experiment.ipynb`](https://github.com/raewoo0908/codeit_face_obj_detection)) and the source of the installed PyTorch 2.13.0. The story of replacing the classification head is covered separately in the [SSD classification head replacement](/posts/ai/ssd-classification-head-replacement) post.

The baseline created a `StepLR` scheduler and then never called `scheduler.step()` anywhere in the training loop. So for all 30 epochs, <u>**the learning rate stayed fixed at its initial value of 1e-3**</u>. No error, no warning. A scheduler is not something that "just runs once you create it."

That raises a question.

> 🤔 **What exactly do the optimizer and the scheduler each do, such that training ran just fine without ever calling the scheduler?**

While answering that question, we'll also look at <u>**AMP (Automatic Mixed Precision)**</u>, which lives in the same training loop. At the end we'll cover the point where the two collide: <u>**"even when GradScaler skips optimizer.step(), scheduler.step() is still called."**</u> That warning actually showed up in my notebook's output.

> 📌 **Summary**
>
> 1. The optimizer **updates the parameters** with gradients; the scheduler **changes just one number**, `optimizer.param_groups[i]["lr"]`. That's why training still runs without calling the scheduler (only the LR stays fixed).
> 2. Pass only `requires_grad=True` parameters to the optimizer. PyTorch SGD skips parameters whose grad is `None`, but if a grad is left as a zero tensor, even frozen parameters move through weight decay and momentum.
> 3. Implement Warmup → Cosine with a single `LambdaLR` and step it **every iteration**. Stepping every epoch turns a 1-epoch warmup into "a single stair step."
> 4. fp16 has a narrow range ($2^{-24}$ to 65504), so small gradients become 0. **GradScaler** scales the loss up before backward, scales it back (unscale), and if there's an inf/NaN, skips that step and lowers the scale.
> 5. AMP caveats: enable it only on CUDA and keep one code path with `enabled=` / cast evaluation outputs back with `.float()` / `unscale_` before clipping / save the **scaler state** in checkpoints too.
> 6. Even if GradScaler skips a step, the scheduler moves forward one notch. Skipping on the first iteration triggers a warning; skipping later passes silently. With this setup, the impact is negligible.

## 1. How Do the Optimizer and the Scheduler Split the Work?

### 1.1. The optimizer changes parameters; the scheduler changes one number

One iteration of a training loop looks roughly like this.

```python
loss = model(images, targets)   # 1. forward + loss
optimizer.zero_grad()           # 2. clear previous gradients
loss.backward()                 # 3. compute gradients (fill p.grad)
optimizer.step()                # 4. update parameters
scheduler.step()                # 5. set the LR for the next iteration
```

Of these, only step 4, `optimizer.step()`, actually changes the model. For SGD, it computes the following for each parameter $\theta$.

- $g$: this iteration's gradient (`p.grad`)
- $\lambda$: weight decay, $\mu$: momentum, $\eta$: learning rate
- $v$: momentum buffer (state the optimizer keeps separately for each parameter)

$$
\begin{aligned}
g &\leftarrow g + \lambda\theta \\
v &\leftarrow \mu v + g \\
\theta &\leftarrow \theta - \eta v
\end{aligned}
$$

So what does the scheduler do? <u>**The scheduler changes only the $\eta$ in this formula.**</u> Look at `LRScheduler._update_lr` in the PyTorch source (`torch/optim/lr_scheduler.py`) and that really is all it does.

```python
def _update_lr(self, epoch=None):
    with _enable_get_lr_call(self):
        if epoch is None:
            self.last_epoch += 1          # bump the internal counter by one
            values = self.get_lr()        # compute the LR for that counter
    ...
    for param_group, lr in zip(self.optimizer.param_groups, values, strict=True):
        _update_param_group_val(param_group, "lr", lr)   # overwrite the optimizer's "lr" value
```

Let's check it directly.

```python
import torch
from torch import nn

model = nn.Linear(2, 1)
optimizer = torch.optim.SGD(model.parameters(), lr=2e-3, momentum=0.9, weight_decay=5e-4)
scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lambda step: 0.5 ** step)

print("right after creation lr =", optimizer.param_groups[0]["lr"])
model(torch.ones(1, 2)).sum().backward()
optimizer.step()
scheduler.step()
print("after one step       lr =", optimizer.param_groups[0]["lr"])
print("values the scheduler doesn't touch:",
      {k: v for k, v in optimizer.param_groups[0].items() if k in ("momentum", "weight_decay")})
print("optimizer.state keys:", list(next(iter(optimizer.state.values())).keys()))
```

```text
right after creation lr = 0.002
after one step       lr = 0.001
values the scheduler doesn't touch: {'momentum': 0.9, 'weight_decay': 0.0005}
optimizer.state keys: ['momentum_buffer']
```

Only `lr` changed from 0.002 to 0.001; momentum, weight decay, and the momentum buffer are managed by the optimizer independently of the scheduler.

Now we can answer the opening question. <u>**If you never call the scheduler, `param_groups[0]["lr"]` simply stays at its initial value, and the optimizer keeps updating parameters with that LR.**</u> That's why training "ran just fine," and also why there was no warning at all.

> 💡 **The scheduler is the optimizer's assistant**
>
> As an analogy, the optimizer is the driver and the scheduler is the navigation system in the passenger seat telling it "slow down now." Even without turning on the navigation (= never calling `step()`), the car still drives. It just keeps going at the speed it started with all the way to the end.

### 1.2. Why pass only `requires_grad=True` parameters?

This experiment used <u>**Feature Extraction (FE)**</u>: freeze the backbone and train only the head. Out of 23,879,570 parameters in total, only 935,634 (about 3.9%) are trained. The notebook builds the optimizer like this.

```python
def build_optimizer(model: nn.Module, train: TrainConfig) -> torch.optim.Optimizer:
    """Pass only the trainable parameters to SGD."""
    trainable = [p for p in model.parameters() if p.requires_grad]
    return torch.optim.SGD(trainable, lr=train.learning_rate, momentum=train.momentum,
                           weight_decay=train.weight_decay)
```

The notebook notes that this "prevents weight decay from being applied to frozen parameters and avoids creating unnecessary optimizer state." But is that really so? I deliberately passed all parameters, frozen ones included, to check.

```python
import torch
from torch import nn

torch.manual_seed(0)
backbone, head = nn.Linear(4, 4), nn.Linear(4, 2)
backbone.requires_grad_(False)          # freeze the backbone
model = nn.Sequential(backbone, head)

# deliberately pass every parameter, frozen ones included, to the optimizer
optimizer = torch.optim.SGD(model.parameters(), lr=0.1, momentum=0.9, weight_decay=5e-4)
before = backbone.weight.clone()

model(torch.randn(8, 4)).sum().backward()
print("backbone.weight.grad:", backbone.weight.grad)
optimizer.step()
print("① grad=None        → backbone changed?", not torch.equal(before, backbone.weight),
      "| momentum state created?", backbone.weight in optimizer.state)

backbone.weight.grad = torch.zeros_like(backbone.weight)   # what if grad is 0 instead of None?
optimizer.step()
print("② grad=zero tensor → backbone changed?", not torch.equal(before, backbone.weight),
      "| change:", (before - backbone.weight).abs().max().item())
```

```text
backbone.weight.grad: None
① grad=None        → backbone changed? False | momentum state created? False
② grad=zero tensor → backbone changed? True | change: 2.3871660232543945e-05
```

The answer is half and half.

- **①** Frozen parameters still have `grad` equal to `None` after backward, and PyTorch's SGD <u>**skips parameters whose grad is `None` entirely.**</u> No weight decay, no momentum buffer. In other words, in this case passing everything gives the same result.
- **②** But if grad is a <u>**tensor filled with zeros**</u> rather than `None`, it's a different story. Even with a zero gradient, the weight decay term $\lambda\theta$ is added, so <u>**the backbone you believed was frozen slowly shrinks.**</u>

A grad gets left as a zero tensor when you use `zero_grad(set_to_none=False)`, or when you freeze parameters that were being trained partway through. The current notebook uses `zero_grad(set_to_none=True)`, so it doesn't hit ②, but <u>**passing only the trainable parameters removes the need to reason about those conditions at all.**</u> It also has the benefit of making "what this optimizer trains" explicit in the code.

> 🤔 **Then what happens to the optimizer when the backbone is unfrozen in Phase 2?**
>
> An optimizer that was given only the trainable parameters doesn't know about parameters unfrozen later. To keep training with the same optimizer, you'd have to add them separately with `optimizer.add_param_group()`. This notebook runs Phase 2 (full fine-tuning) by **building the model and optimizer from scratch**, so it didn't have this problem.

## 2. Let's Build a Warmup → Cosine Schedule with `LambdaLR`

### 2.1. Why warmup and cosine?

Fixing the LR as the baseline did falls short in two ways.

1. **Early in training**: the newly created classification head is randomly initialized, so the gradients in the first few iterations can be large and unstable. Using a large LR from the very start can send parameters flying off somewhere odd. So we add a <u>**warmup**</u> that starts with a small LR and gradually raises it to the target LR. Goyal et al. (2017) used this for large-batch training and describe it like this.

   > *develop a new warmup scheme that overcomes optimization challenges early in training.*

2. **Late in training**: keeping a large LR near the optimum makes you keep circling around it. So the LR has to come down gradually, and instead of `StepLR`, which drops it in abrupt stairs, I used <u>**cosine decay**</u>, which lowers it smoothly to 0 along a cosine curve. Cosine decay became widespread through the SGDR paper (Loshchilov & Hutter, 2016).

$$
\eta_t = \eta_{min} + \frac{1}{2}(\eta_{max} - \eta_{min})\left(1 + \cos\left(\frac{T_{cur}}{T_{i}}\pi\right)\right)
$$

- $T_{cur}$: number of steps elapsed in the decay phase so far, $T_i$: total number of steps in the decay phase
- When $T_{cur} = 0$, $\cos 0 = 1$, giving $\eta_{max}$; when $T_{cur} = T_i$, $\cos\pi = -1$, giving $\eta_{min}$

In other words, it's an S-shaped curve that descends slowly at first, quickly in the middle, and slowly again at the end. This notebook set $\eta_{min} = 0$.

### 2.2. The notebook's implementation: one factor function + `LambdaLR`

`LambdaLR` is a scheduler where you only pass <u>**"a function that takes the step number and returns the factor to multiply the initial LR by."**</u> Looking at the source, `get_lr()` really just computes `base_lr * lmbda(self.last_epoch)`.

```python
def warmup_cosine_factor(step: int, warmup_steps: int, total_steps: int, warmup_start_factor: float) -> float:
    """LR factor at step (0-based): linear warmup followed by cosine decay."""
    if step < warmup_steps:
        return warmup_start_factor + (1.0 - warmup_start_factor) * step / warmup_steps
    progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
    return 0.5 * (1.0 + math.cos(math.pi * min(1.0, progress)))


def build_warmup_cosine_scheduler(optimizer, steps_per_epoch: int, train: TrainConfig):
    """Warmup + cosine scheduler stepped per iteration."""
    warmup_steps = train.warmup_epochs * steps_per_epoch
    total_steps = train.max_epochs * steps_per_epoch
    return torch.optim.lr_scheduler.LambdaLR(
        optimizer, lambda step: warmup_cosine_factor(step, warmup_steps, total_steps, train.warmup_start_factor))
```

The settings (`TrainConfig`) are as follows.

| Item | Value |
| --- | --- |
| `learning_rate` | 2e-3 |
| `warmup_epochs` | 1 |
| `warmup_start_factor` | 0.1 (warmup starting LR = 2e-4) |
| `max_epochs` | 30 |
| train images / batch size | 2,571 images / 16 |

### 2.3. Let's compute it by hand

First, the step counts.

- Iterations per epoch: $\lceil 2571 / 16 \rceil = \lceil 160.69 \rceil = 161$ (matches the `0/161` in the notebook's progress bar)
- `warmup_steps` $= 1 \times 161 = 161$
- `total_steps` $= 30 \times 161 = 4830$

Now let's compute the factor at a few steps.

1. **step 0 (start of training)**: within warmup, so

   $$0.1 + 0.9 \times \frac{0}{161} = 0.1 \quad\rightarrow\quad \text{LR} = 2\text{e-}4$$

2. **step 80 (middle of warmup)**:

   $$0.1 + 0.9 \times \frac{80}{161} = 0.1 + 0.4472 = 0.5472 \quad\rightarrow\quad \text{LR} \approx 1.094\text{e-}3$$

3. **step 161 (end of warmup, start of cosine)**: `step < warmup_steps` becomes false, so it switches to the cosine formula.

   $$\text{progress} = \frac{161 - 161}{4830 - 161} = 0 \quad\rightarrow\quad 0.5 \times (1 + \cos 0) = 1.0 \quad\rightarrow\quad \text{LR} = 2\text{e-}3$$

4. **step 2495 (middle of cosine)**:

   $$\text{progress} = \frac{2495 - 161}{4669} = 0.4999 \quad\rightarrow\quad 0.5 \times (1 + \cos(0.4999\pi)) \approx 0.5002 \quad\rightarrow\quad \text{LR} \approx 1.0\text{e-}3$$

5. **step 4829 (last iteration)**: progress $\approx 1$, so the factor is $0.0$ and the LR is effectively 0.

It connects to exactly 1.0 at the end of warmup and is exactly half at the middle of cosine. Whether this calculation matches the actual training can be checked against `lr_at_start`, which the notebook recorded every epoch. Epoch $e$ starts at step $(e-1) \times 161$.

| epoch | starting step | hand-computed LR | notebook `lr_at_start` |
| --- | --- | --- | --- |
| 1 | 0 | 0.000200 | 0.0002 |
| 2 | 161 | 0.002000 | 0.0020 |
| 16 | 2415 | 0.001054 | 0.0011 |
| 30 | 4669 | 0.000006 | 0.0000 |

Comparing all 30 epochs, every value matched to four decimal places.

### 2.4. Why step every iteration instead of every epoch?

The example in the official PyTorch docs calls `scheduler.step()` outside the epoch loop. This notebook, however, calls it **inside `train_one_epoch`, every iteration**. Why?

<u><strong><em>Seeing is believing!</em></strong></u> I plotted the LR when stepping the same factor function in both ways.

![Comparison of three LR schedules — baseline (fixed 1e-3), stepped per epoch, stepped per iteration; the right panel zooms into the first 2 epochs](./image/lr-schedule.en.png)

Look at the zoomed-in graph on the right.

- **Blue line (per iteration)**: during the 161 iterations of the first epoch, it rises diagonally from 2e-4 to 2e-3.
- **Orange line (per epoch)**: it stays at 2e-4 for the whole first epoch, then the moment epoch 1 ends, it <u>**jumps tenfold to 2e-3.**</u>

Warmup is the idea of "raising the LR gradually," but if the warmup is 1 epoch and you step every epoch, <u>**the warmup collapses into a single stair step.**</u> That's no different from not warming up at all. In the left graph too, the orange cosine becomes a 30-step staircase. So the shorter the warmup, the more you need per-iteration stepping. The dotted line is the baseline's fixed LR.

> 📌 **NOTE: Plot the LR before training**
>
> The notebook has `plot_lr_schedule`, which draws the schedule before training. The baseline's bug gave no signal even after training finished. The habit of **checking the schedule visually before training starts** prevents silent bugs like that.

<details>
<summary>Plot code</summary>

```python
import math

import matplotlib.pyplot as plt
import numpy as np


def factor(step, warmup_steps, total_steps, start=0.1):
    if step < warmup_steps:
        return start + (1.0 - start) * step / warmup_steps
    progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
    return 0.5 * (1.0 + math.cos(math.pi * min(1.0, progress)))


SPE, EPOCHS, LR = 161, 30, 2e-3      # 2,571 images / batch 16 = 161 iterations
steps = np.arange(SPE * EPOCHS)
per_iter = [LR * factor(s, SPE, SPE * EPOCHS) for s in steps]
per_epoch = [LR * factor(s // SPE, 1, EPOCHS) for s in steps]   # same function stepped per epoch

fig, axes = plt.subplots(1, 2, figsize=(11, 3.4), gridspec_kw={"width_ratios": [3, 2]})
for ax, xmax, title in [(axes[0], EPOCHS, "All 30 epochs"), (axes[1], 2, "First 2 epochs (warmup)")]:
    ax.plot(steps / SPE, [1e-3] * len(steps), color="gray", ls=":", label="baseline: scheduler.step() never called (fixed 1e-3)")
    ax.plot(steps / SPE, per_epoch, color="tab:orange", label="stepped per epoch")
    ax.plot(steps / SPE, per_iter, color="tab:blue", label="stepped per iteration (notebook)")
    ax.set_xlim(0, xmax)
    ax.set_xlabel("epoch")
    ax.set_ylabel("learning rate")
    ax.set_title(title)
    ax.grid(alpha=0.3)
axes[0].legend(fontsize=8, loc="upper right")
plt.tight_layout()
plt.show()
```

</details>

## 3. What Is AMP, and What Does It Protect?

So far the story was about "what LR to use." Now let's look at another mechanism in the same training loop: AMP.

> 🤔 **What is AMP (Automatic Mixed Precision)?**
>
> A training approach that **automatically picks** float32 (fp32) or float16 (fp16) for each operation and mixes them. In PyTorch it consists of two tools: `torch.autocast` and `torch.amp.GradScaler`.

### 3.1. What does fp16 speed up, and what does it put at risk?

- **Intuitively:**

  If fp32 is a big notebook that can hold about seven significant digits, fp16 is a small sticky note that holds only about three. The sticky note is light (half the memory) and quick to write on (the GPU's fp16 units), but <u>**if you try to write a very small number, there isn't enough room and you end up writing 0.**</u>

- **Rigorously:**

  fp16 has 1 sign bit, 5 exponent bits, and 10 mantissa bits. Let's check its representable range directly.

  ```python
  import torch

  f16, f32 = torch.finfo(torch.float16), torch.finfo(torch.float32)
  print("fp16 max", f16.max, "| smallest normal", f16.tiny, "| eps", f16.eps)
  print("fp32 max", f32.max, "| smallest normal", f32.tiny, "| eps", f32.eps)
  print("1e-8       → fp16:", torch.tensor(1e-8).half().item())
  print("1e-8×65536 → fp16:", torch.tensor(1e-8 * 65536).half().item())
  print("70000      → fp16:", torch.tensor(70000.).half().item())
  print("1 + 1e-4  (fp16):", (torch.tensor(1.0).half() + torch.tensor(1e-4).half()).item())
  ```

  ```text
  fp16 max 65504.0 | smallest normal 6.103515625e-05 | eps 0.0009765625
  fp32 max 3.4028234663852886e+38 | smallest normal 1.1754943508222875e-38 | eps 1.1920928955078125e-07
  1e-8       → fp16: 0.0
  1e-8×65536 → fp16: 0.0006551742553710938
  70000      → fp16: inf
  1 + 1e-4  (fp16): 1.0
  ```

  - **Range**: fp16's maximum is 65504. Anything larger becomes `inf` (<u>**overflow**</u>).
  - **The small end**: normal numbers go down to $2^{-14} \approx 6.1\text{e-}5$, and even counting subnormals, only down to $2^{-24} \approx 6.0\text{e-}8$. Anything smaller becomes 0 (<u>**underflow**</u>). `1e-8` turning into `0.0` is an example.
  - **Precision**: eps is about 0.001, so `1 + 1e-4` just becomes `1`.

![fp16 representable range on a log2 scale — below 2^-24 is underflow, above 65504 is overflow; multiplying a 2^-30 gradient by 65536 moves it to 2^-14](./image/fp16-range.en.png)

The figure above lays out magnitudes on a $\log_2$ scale. The blue region is what fp16 represents properly, and the red region on the left is where values turn into 0.

The problem is that <u>**gradients are mostly very small values**</u>. And the textbook example of this problem happens to be SSD, the very model used here. The Mixed Precision Training paper (Micikevicius et al., 2017) collected the distribution of activation gradients while training Multibox SSD in fp32, and wrote:

> *Note that much of the FP16 representable range was left unused, while many values were below the minimum representable range and became zeros.*

The upper part of the fp16 range sits empty, while values at the lower end fall out of range and become 0. In fact, this SSD diverged when trained in fp16 as is.

| Model | fp32 baseline | Mixed Precision, no loss scaling | Mixed Precision, with loss scaling |
| --- | --- | --- | --- |
| Faster R-CNN | 69.1% | 68.6% | 69.7% |
| Multibox SSD | 76.9% | **diverges** | 77.1% |

*(Pascal VOC 2007 test mAP, Table 2 of the paper)*

<!-- TODO: figure — capture of the paper's Figure 3 (Multibox SSD activation gradient histogram) -->

The fix is simple. Like the arrow in the figure above, <u>**multiply all gradients by a large number to push them up into the fp16 range.**</u> Even a $2^{-30}$ gradient survives as $2^{-14}$ after multiplying by $2^{16} = 65536$. The paper reports that for SSD, scaling by just 8× (exponent +3) was enough to recover fp32 accuracy. This is exactly the principle behind GradScaler, which we'll see next.

### 3.2. autocast: picking a dtype per operation

That said, doing every operation in fp16 is risky. Operations that add up many small values, like sums or losses, or that use exponentials and logarithms, are vulnerable to precision loss. So `torch.autocast` <u>**chooses a dtype per type of operation.**</u> Summarizing the CUDA lists from the PyTorch docs:

| Ops cast to fp16 | Ops cast to fp32 |
| --- | --- |
| `matmul`, `linear`, `conv1d/2d/3d`, `bmm`, `addmm` … | `softmax`, `log_softmax`, `cross_entropy`, `smooth_l1_loss`, `sum`, `exp`, `log` … |

Notice that both functions used by the SSD loss are in this list? torchvision SSD's `compute_loss` uses `smooth_l1_loss` for box regression and `cross_entropy` for classification. I checked with CPU autocast (run on a Mac without CUDA).

```python
import torch
import torch.nn.functional as F

x = torch.randn(4, 8)                      # float32 input
w = torch.randn(8, 3)
target = torch.tensor([0, 1, 2, 0])

with torch.autocast(device_type="cpu", dtype=torch.float16):
    logits = x @ w                                                     # matmul
    feature = F.conv2d(torch.randn(1, 3, 8, 8), torch.randn(4, 3, 3, 3))  # conv
    cls_loss = F.cross_entropy(logits, target)                         # SSD classification loss
    reg_loss = F.smooth_l1_loss(logits, torch.zeros_like(logits))      # SSD box regression loss

print("input x       :", x.dtype)
print("matmul        :", logits.dtype)
print("conv2d        :", feature.dtype)
print("cross_entropy :", cls_loss.dtype)
print("smooth_l1_loss:", reg_loss.dtype)
```

```text
input x       : torch.float32
matmul        : torch.float16
conv2d        : torch.float16
cross_entropy : torch.float32
smooth_l1_loss: torch.float32
```

The input is fp32, but the compute-heavy matmul and conv ran in fp16 while the losses ran in fp32. It's essentially <u>**heavy ops done fast, sensitive ops done accurately.**</u>

> 📌 **NOTE: The lists differ slightly per device**
>
> autocast's op lists are defined separately for each device (CUDA/CPU). For example, on the same Mac CPU, `softmax` stayed in fp16 (it's fp32 in the CUDA list). So check the lists for your actual training environment in the [PyTorch AMP docs](https://docs.pytorch.org/docs/stable/amp.html).

The docs also specify where to apply autocast.

> *autocast should wrap only the forward pass(es) of your network, including the loss computation(s).*
>
> *Backward ops run in the same type that autocast used for corresponding forward ops.*

Wrap only the forward pass and the loss, and call backward outside. Backward automatically runs in the same dtype as forward. The notebook does exactly that.

### 3.3. GradScaler: scale up, scale back, skip if broken

`GradScaler` is the implementation of section 3.1's "multiply the gradients by a large number." If you multiply the **loss** by a scale $S$ before backward, the chain rule makes every gradient $S$ times larger as well.

$$
\frac{\partial (S \cdot L)}{\partial \theta} = S \cdot \frac{\partial L}{\partial \theta}
$$

In the training loop it's three lines.

```python
scaler.scale(loss).backward()   # 1. backward on loss × S → gradients are S times larger too
scaler.step(optimizer)          # 2. gradients ÷ S, check inf/NaN, call optimizer.step() if clean
scaler.update()                 # 3. adjust S for the next iteration
```

Let's trace exactly what each line does through the `torch/amp/grad_scaler.py` source.

1. **`scale(loss)`**: multiplies the loss by the current scale. The initial scale is `init_scale=2.0**16`, i.e., 65536.

2. **`step(optimizer)`**: first calls `unscale_` to divide the gradients by $S$, recording in `found_inf` whether any inf or NaN appeared along the way. Then comes the key part.

   ```python
   def _maybe_opt_step(self, optimizer, optimizer_state, *args, **kwargs):
       retval = None
       if not sum(v.item() for v in optimizer_state["found_inf_per_device"].values()):
           retval = optimizer.step(*args, **kwargs)
       return retval
   ```

   <u>**It calls `optimizer.step()` only when there isn't a single inf/NaN.**</u> If there's even one, it skips this iteration's parameter update entirely. That keeps broken gradients from wrecking the parameters.

3. **`update()`**: if this step was skipped, it multiplies the scale by `backoff_factor=0.5`, halving it. Conversely, if `growth_interval=2000` consecutive steps go by without a skip, it multiplies by `growth_factor=2.0`, doubling it.

In other words, GradScaler is <u>**a mechanism that feels its way, every iteration, toward "the largest scale that doesn't overflow."**</u> A larger scale means less underflow but more risk of overflow.

<!-- TODO: figure — GradScaler flow diagram (scale → backward → unscale & inf check → step or skip → update: ×0.5 / ×2 every 2000 steps) -->

> 🤔 **Isn't an initial scale of 65536 too large?**
>
> It is. And PyTorch knows it. The `GradScaler` docstring says:
>
> > *The scale factor often causes infs/NaNs to appear in gradients for the first few iterations as its value calibrates. `scaler.step` will skip the underlying `optimizer.step()` for these iterations.*
>
> The strategy is to start large on purpose and halve it whenever an overflow happens, until it finds the right value. The judgment is that starting large and skipping a few times is cheaper than starting small and losing gradients to underflow. <u>**This "skip the first few iterations" is the protagonist of section 5.**</u>

## 4. Things to Watch Out for When Using AMP

### 4.1. Enable it only on CUDA, and keep one code path with `enabled=`

The notebook sets `use_amp=True`, but actually turns it on only on CUDA.

```python
use_amp = train.use_amp and device.type == "cuda"
scaler = torch.amp.GradScaler("cuda", enabled=use_amp)
...
with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=use_amp):
    loss_dict = model(images, targets)
```

The experiment environment was a Colab T4 GPU, and the speedup from fp16 comes from the GPU's fp16 units. I hadn't validated AMP on the Mac (MPS) or CPU, so I chose to turn it off there.

The important point here is that <u>**with `enabled=False`, autocast and GradScaler do nothing.**</u> Looking at the source, the `step()` of a GradScaler with `enabled=False` simply calls `optimizer.step()`, and `scale` and `update` do nothing. So without any `if use_amp:` branch, <u>**the same code runs on both the Colab GPU and my local Mac.**</u>

### 4.2. If you use autocast in evaluation too, cast outputs back with `.float()`

Evaluation (`predict`) also uses autocast for faster inference. In exchange, it adds `.float()` when pulling out the outputs.

```python
with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=use_amp):
    outputs = model(images)
predictions += [{"boxes": o["boxes"].float().cpu(), "scores": o["scores"].float().cpu(),
                 "labels": o["labels"].cpu()} for o in outputs]
```

I checked on CPU whether SSD outputs coming out of autocast really are fp16.

```python
import torch
from torchvision.models.detection import ssd300_vgg16

model = ssd300_vgg16(weights=None, weights_backbone=None, num_classes=3).eval()
with torch.no_grad(), torch.autocast(device_type="cpu", dtype=torch.float16):
    outputs = model([torch.rand(3, 400, 300)])
print({key: value.dtype for key, value in outputs[0].items()})
```

```text
{'boxes': torch.float16, 'scores': torch.float16, 'labels': torch.int64}
```

Boxes and scores came out as fp16 (on CUDA, `softmax` is in the fp32 list, so the dtype of scores may differ). Passing these straight to the metric computation raises two issues.

- **Box coordinate resolution**: in the 256–512 range, fp16 can only represent steps of $256 \times 2^{-10} = 0.25$. Since the longest side of the cached images is 448 px, coordinates get rounded to 0.25 px increments.
- **Score resolution**: there are only 1024 fp16 values between 0.5 and 1.0. AP is computed by sorting predictions by score, so if values clump together, the ranking becomes coarse.

So <u>**the outputs are cast to the same dtype as the fp32 GT before computing metrics.**</u> I didn't separately measure how much this rounding would actually have changed this mAP. But there's no reason to compute metrics in fp16, so I took the safe option.

### 4.3. If you use gradient clipping, `unscale_` first

This notebook didn't use gradient clipping, but if you do, the order matters. Right after `scale(loss).backward()`, the gradients are $S$ times larger, so calling `clip_grad_norm_(max_norm=1.0)` as is would <u>**clip against values 65536 times too large.**</u> The PyTorch AMP examples page warns about this too.

> *If you attempted to clip without unscaling, the gradients' norm/maximum magnitude would also be scaled*

So you first scale them back with `unscale_`, then clip.

```python
scaler.scale(loss).backward()
scaler.unscale_(optimizer)                                    # gradients ÷ S (inf check happens here too)
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm)  # now clip against the original magnitude
scaler.step(optimizer)                                        # already unscaled, so no second division
scaler.update()
```

If you called `unscale_` yourself, `step()` won't divide again. In the source, `step()` calls `unscale_` only when the state is still not unscaled (`OptState.READY`), and calling `unscale_` twice in one iteration raises a `RuntimeError`.

### 4.4. Save the scaler state in checkpoints too

Since Colab can disconnect at any time, the notebook writes a resume checkpoint every 3 epochs. Along with the model, optimizer, and scheduler, it also includes <u>**the scaler's `state_dict`**</u>.

```python
checkpoints.save_resume({
    "model": model.state_dict(), "optimizer": optimizer.state_dict(),
    "scheduler": scheduler.state_dict(), "scaler": scaler.state_dict(),
    ...
})
# when resuming
scaler.load_state_dict(state["scaler"])
```

The scaler state is only five values: `scale`, `growth_factor`, `backoff_factor`, `growth_interval`, and `_growth_tracker`. What happens if you leave it out? I resumed from the same checkpoint with and without the scaler state.

```python
import copy

import torch
from torch import nn

torch.manual_seed(0)
model = nn.Linear(8, 3)
x = torch.randn(4, 8) * 3
optimizer = torch.optim.SGD(model.parameters(), lr=2e-3, momentum=0.9)


def train(scaler, n_iters, tag):
    skipped = 0
    for _ in range(n_iters):
        before = model.weight.detach().clone()
        with torch.autocast(device_type="cpu", dtype=torch.float16):
            loss = model(x).float().pow(2).mean()
        optimizer.zero_grad(set_to_none=True)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        skipped += torch.equal(before, model.weight)
    print(f"{tag}: skipped {skipped} of {n_iters} iterations, scale afterwards = {scaler.get_scale():.0f}")


scaler = torch.amp.GradScaler("cpu")
train(scaler, 10, "initial training            ")
checkpoint = copy.deepcopy({"model": model.state_dict(), "optimizer": optimizer.state_dict(),
                            "scaler": scaler.state_dict()})   # same effect as writing it with torch.save

for tag, load_scaler in [("resume without scaler state", False), ("resume with scaler state   ", True)]:
    model.load_state_dict(checkpoint["model"])           # start from the same checkpoint
    optimizer.load_state_dict(checkpoint["optimizer"])
    resumed = torch.amp.GradScaler("cpu")
    if load_scaler:
        resumed.load_state_dict(checkpoint["scaler"])
    print(f"  scale right before {tag.strip()} = {resumed.get_scale():.0f}")
    train(resumed, 10, tag)
```

```text
initial training            : skipped 3 of 10 iterations, scale afterwards = 8192
  scale right before resume without scaler state = 65536
resume without scaler state: skipped 1 of 10 iterations, scale afterwards = 32768
  scale right before resume with scaler state = 8192
resume with scaler state   : skipped 0 of 10 iterations, scale afterwards = 8192
```

Resuming without the scaler state <u>**sends the scale back to its initial 65536, and it starts feeling its way again.**</u> Meanwhile, it skips iterations again. Restoring the state together lets it continue right from the 8192 it had already found. With a toy model the difference is a single skip, but it's a loss repeated every time you resume.

> 💡 **Resuming on CPU doesn't break**
>
> A scaler with `enabled=False` returns an empty dict `{}` from `state_dict()`, and `load_state_dict()` does nothing. So even if you load a checkpoint saved on GPU onto a Mac with AMP off, the same code runs without errors.

## 5. Where the Two Topics Collide: Even When GradScaler Skips, the Scheduler Advances

Now let's put the scheduler from sections 1–2 and the GradScaler from sections 3–4 in one loop. The notebook's training loop looks like this.

```python
scaler.scale(loss).backward()
scaler.step(optimizer)      # skips optimizer.step() on inf/NaN
scaler.update()
scheduler.step()            # but this is called unconditionally
```

Doesn't something look off? `scaler.step()` can skip the optimizer, but `scheduler.step()` is called <u>**unconditionally every iteration**</u>. And in fact, this warning appeared in the first epoch of FE training (the exact same one showed up in FT training).

```text
UserWarning: Detected call of `lr_scheduler.step()` before `optimizer.step()`. In PyTorch 1.1.0 and later, you should call them in the opposite order: `optimizer.step()` before `lr_scheduler.step()`.  Failure to do this will result in PyTorch skipping the first value of the learning rate schedule. See more details at https://pytorch.org/docs/stable/optim.html#how-to-adjust-learning-rate
  scheduler.step()
```

The code clearly runs `optimizer.step()` → `scheduler.step()` in that order, so why does it say "the order is reversed"?

### 5.1. How does the warning detect the "order"?

Looking at `LRScheduler.__init__`, when a scheduler is created it <u>**wraps the optimizer's `step` method**</u> so that each call leaves a mark.

```python
@wraps(func)
def wrapper(*args, **kwargs):
    opt = opt_ref()
    opt._opt_called = True     # mark that optimizer.step() has been called at least once
    return func.__get__(opt, opt.__class__)(*args, **kwargs)
```

Then `step()` checks for that mark.

```python
if self._step_count == 1:
    ...
    # Just check if there were two first lr_scheduler.step() calls before optimizer.step()
    elif not getattr(self.optimizer, "_opt_called", False):
        warnings.warn("Detected call of `lr_scheduler.step()` before `optimizer.step()`. ...")
```

In other words, this warning doesn't read the order in the code; it checks <u>**"whether `optimizer.step()` actually ran at least once by the time of the first `scheduler.step()`."**</u> `_step_count` becomes 1 when the constructor performs its single initial step, so this check happens only at the first `scheduler.step()` in the training loop.

Now the puzzle fits together. On the first iteration, the scale of 65536 makes the gradients overflow → GradScaler skips `optimizer.step()` → `_opt_called` isn't set yet → warning at the first `scheduler.step()`. <u>**The code order was correct; the first optimizer step just never executed.**</u>

### 5.2. Let's reproduce it

Even without CUDA, you can create the same situation with CPU autocast + `GradScaler("cpu")`. I used the same factor function as the notebook, but shrank it to a 4-step warmup and 10 steps total.

```python
import math
import warnings

import torch
from torch import nn

warnings.simplefilter("always")
torch.manual_seed(0)


def warmup_cosine_factor(step, warmup_steps, total_steps, warmup_start_factor):
    if step < warmup_steps:
        return warmup_start_factor + (1.0 - warmup_start_factor) * step / warmup_steps
    progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
    return 0.5 * (1.0 + math.cos(math.pi * min(1.0, progress)))


model = nn.Linear(8, 3)
x = torch.randn(4, 8) * 3       # input with large outputs, hence large gradients
optimizer = torch.optim.SGD(model.parameters(), lr=2e-3, momentum=0.9)
scheduler = torch.optim.lr_scheduler.LambdaLR(
    optimizer, lambda s: warmup_cosine_factor(s, warmup_steps=4, total_steps=10, warmup_start_factor=0.1))
scaler = torch.amp.GradScaler("cpu")   # init_scale = 2**16 = 65536

for it in range(6):
    before = model.weight.detach().clone()
    lr_used = optimizer.param_groups[0]["lr"]
    scale_used = scaler.get_scale()
    with torch.autocast(device_type="cpu", dtype=torch.float16):
        loss = model(x).float().pow(2).mean()
    optimizer.zero_grad(set_to_none=True)
    scaler.scale(loss).backward()
    with warnings.catch_warnings(record=True) as caught:
        scaler.step(optimizer)
        scaler.update()
        scheduler.step()
    stepped = not torch.equal(before, model.weight)
    print(f"iter {it}: scale {scale_used:>7.0f} | lr {lr_used:.6f} | optimizer.step {'ran' if stepped else 'skipped'}"
          + (" | ⚠ " + str(caught[0].message)[:56] + "..." if caught else ""))
```

```text
iter 0: scale   65536 | lr 0.000200 | optimizer.step skipped | ⚠ Detected call of `lr_scheduler.step()` before `optimizer...
iter 1: scale   32768 | lr 0.000650 | optimizer.step skipped
iter 2: scale   16384 | lr 0.001100 | optimizer.step skipped
iter 3: scale    8192 | lr 0.001550 | optimizer.step ran
iter 4: scale    8192 | lr 0.002000 | optimizer.step ran
iter 5: scale    8192 | lr 0.001866 | optimizer.step ran
```

Reading it line by line, everything from section 3 is right there.

- **iter 0–2**: the scale halved from 65536 → 32768 → 16384 while <u>**skipping three times in a row.**</u> The warning appeared only on the first one (iter 0).
- **iter 3**: at scale 8192, an update finally happened without overflow.
- **lr column**: meanwhile, the LR <u>**kept dutifully climbing one notch at a time**</u>: 0.0002 → 0.00065 → 0.0011 → 0.00155.

As a result, 3 of the 4 warmup values (0.0002, 0.00065, 0.0011) <u>**passed by without ever being used for a parameter update.**</u> That's exactly what the warning means by "skipping the first value of the learning rate schedule." And <u>**skips after the first one, like iter 1 and 2, don't even trigger a warning.**</u>

### 5.3. So how much did this affect the actual training?

To be honest, <u>**I judge the impact to have been negligible with this setup.**</u>

1. **Number of skips at the start**: the notebook doesn't record how many times it skipped. The only certainty is at least once, since the warning appeared. If the first few are skipped, that many of the 161 warmup steps pass without an update. For example, with one skip, the factor of the first real update is just $0.1 + 0.9 \times 1/161 \approx 0.1056$ instead of 0.1. Even with three like in the toy example, that's 3 of 161 steps. The proportion is completely different from the toy example with only 4 warmup steps.
2. **Number of skips in the middle**: once the scale settles, it tries doubling after every `growth_interval=2000` consecutive successes, and shrinks again if that overflows. With 4,830 iterations in total, there are only a couple of doubling attempts at all, so I estimate the resulting skips to be on the order of a few.
3. **The end of cosine**: the schedule is pulled forward by the number of skips, so the last few iterations just spend slightly less time near LR 0.

If it still bothers you, <u>**advance the scheduler only when the optimizer actually updated.**</u> You can tell whether a step was skipped by comparing the scale before and after `update()` (a skip halves the scale).

```python
scale_before = scaler.get_scale()
scaler.step(optimizer)
scaler.update()
if scaler.get_scale() >= scale_before:   # didn't shrink = this step ran
    scheduler.step()
```

> 🤔 **So should the notebook have been fixed this way too?**
>
> Not necessarily. This approach has its own costs.
>
> 1. **`get_scale()` triggers a GPU→CPU sync.** Calling it every iteration makes the GPU wait that much.
> 2. **The scheduler's step count drifts from the actual iteration count.** By however many steps were skipped, training ends before the cosine reaches 0. The design of "LR 0 at the end of 30 epochs" gets slightly distorted.
>
> If the impact is a handful of steps, understanding the warning and moving on is also a reasonable choice. This notebook went that way. What matters is <u>**knowing that this warning doesn't mean "your code order is wrong."**</u> If you don't know that, you end up "fixing" it by flipping a perfectly good order.

## 6. So How Do You Write the Code?

Putting together everything we've covered in the notebook's final training loop gives the following.

```python
def train_one_epoch(model, loader, optimizer, scheduler, scaler, device, use_amp):
    """Train for one epoch and return the mean losses. The scheduler steps every iteration."""
    model.train()
    totals = {"loss": 0.0, "loss_classification": 0.0, "loss_bbox_regression": 0.0}
    for images, targets in tqdm(loader, desc="train", leave=False):
        images, targets = move_batch_to_device(images, targets, device)
        # 1. wrap only forward + loss in autocast (conv in fp16, loss in fp32)
        with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=use_amp):
            loss_dict = model(images, targets)
            loss = loss_dict["classification"] + loss_dict["bbox_regression"]
        optimizer.zero_grad(set_to_none=True)   # 2. set grads to None (don't leave zero tensors)
        scaler.scale(loss).backward()           # 3. backward on loss × S (outside autocast)
        scaler.step(optimizer)                  # 4. ÷ S, skip optimizer.step() on inf/NaN
        scaler.update()                         # 5. adjust scale (×0.5 on skip, ×2 after 2000 straight successes)
        scheduler.step()                        # 6. LR for the next iteration (per iteration)

        totals["loss"] += loss.item()
        totals["loss_classification"] += loss_dict["classification"].item()
        totals["loss_bbox_regression"] += loss_dict["bbox_regression"].item()
    return {key: value / len(loader) for key, value in totals.items()}
```

And here's what the wrapper (`fit`) prepares around this function.

```python
use_amp = train.use_amp and device.type == "cuda"                          # AMP only on CUDA
optimizer = build_optimizer(model, train)                                  # requires_grad=True only
scheduler = build_warmup_cosine_scheduler(optimizer, len(train_loader), train)  # per iteration
scaler = torch.amp.GradScaler("cuda", enabled=use_amp)                     # no-op when disabled
```

The call order within one iteration, summarized:

| Order | Call | What it does | Watch out for |
| --- | --- | --- | --- |
| 1 | `with autocast(...)` | computes forward and loss with per-op dtypes | backward goes outside |
| 2 | `optimizer.zero_grad(set_to_none=True)` | clears previous gradients | leaving zero tensors can let weight decay move frozen parameters |
| 3 | `scaler.scale(loss).backward()` | computes gradients scaled by S | |
| (3.5) | `scaler.unscale_(optimizer)` + clipping | scales gradients back to original size and clips | only when clipping. Once per iteration |
| 4 | `scaler.step(optimizer)` | ÷S, inf/NaN check, update if clean | can be skipped |
| 5 | `scaler.update()` | adjusts the scale | after step, at the end of the iteration |
| 6 | `scheduler.step()` | sets the next LR | advances even if 4 was skipped |

Checkpoints save the `state_dict` of all four — model, optimizer, scheduler, and **scaler** — and evaluation outputs are cast back with `.float()` before computing metrics.

Now we can explain both why the baseline's "created-but-never-called scheduler" did nothing, and why a puzzling warning showed up once it started being called properly!

## 📚 References

- :github: [Experiment code repository](https://github.com/raewoo0908/codeit_face_obj_detection)
- [Mixed Precision Training](https://arxiv.org/abs/1710.03740) — Micikevicius et al., 2017 (ICLR 2018). Loss scaling, the Multibox SSD case
- [SGDR: Stochastic Gradient Descent with Warm Restarts](https://arxiv.org/abs/1608.03983) — Loshchilov & Hutter, 2016. Cosine schedule
- [Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour](https://arxiv.org/abs/1706.02677) — Goyal et al., 2017. Warmup
- [torch.optim — How to adjust learning rate](https://docs.pytorch.org/docs/stable/optim.html)
- [LambdaLR — PyTorch documentation](https://docs.pytorch.org/docs/stable/generated/torch.optim.lr_scheduler.LambdaLR.html)
- [Automatic Mixed Precision package - torch.amp](https://docs.pytorch.org/docs/stable/amp.html)
- [Automatic Mixed Precision examples](https://docs.pytorch.org/docs/stable/notes/amp_examples.html)
- [PyTorch issue #20124](https://github.com/pytorch/pytorch/issues/20124) — background on the warning about `scheduler.step()` call order
