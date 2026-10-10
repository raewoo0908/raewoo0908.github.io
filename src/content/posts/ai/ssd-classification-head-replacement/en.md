---
title: ":ai: Want to Change the Number of Classes When Transfer Learning? How Should You Do It? Let's Dig Into the Implementation Source Code"
date: 2026-10-10T22:00:00+09:00
description: "While transfer-learning a COCO-trained torchvision SSD300 into a 3-class detector, we read the SSD implementation itself to find out why changing a single num_classes attribute does nothing, and how the classification head should be replaced instead."
tags: [AI, ObjectDetection, SSD, TransferLearning, PyTorch, torchvision]
draft: false
---

## 0. Introduction

Codeit Mission 7 was about taking an <u>**SSD300-VGG16**</u> model pretrained on COCO and transfer-learning it into a detector that finds <u>**the location of the head**</u> in photos of cats and dogs. There are three classes to detect: `background`, `cat`, and `dog`.

The mission came with a reference baseline notebook, and it contained this code for loading the model and matching the number of classes.

```python
model = torchvision.models.detection.ssd300_vgg16(weights=SSD300_VGG16_Weights.DEFAULT).to(device)

# Modify the output layer to match the number of classes
num_classes = len(classes)  # including background
model.head.classification_head.num_classes = num_classes
```

Judging by the comment, it looks like the output layer was changed for 3 classes. And in fact, training with this code runs without a single error, and the loss goes down nicely.

But this one line <u>**changes nothing.**</u> The model still predicts COCO's 91 classes, and the `cat` (1) and `dog` (2) labels we fed in were being learned in COCO's `person` and `bicycle` slots.

In this post, we'll build the case for why this code has no effect, and what you actually need to do to change the number of classes, <u>**by reading torchvision's SSD implementation directly**</u>.

> 📌 **NOTE**
>
> - The code and outputs in this post are based on **torchvision 0.28.0**. Source quotes are taken from the installed `torchvision/models/detection/ssd.py`.
> - The data is the head bounding box annotations (PASCAL VOC format) from the Oxford-IIIT Pet dataset.
>
> :github: [Experiment code repository](https://github.com/raewoo0908/codeit_face_obj_detection/blob/main/experiment.ipynb)

> 📌 **Summary**
>
> 1. `classification_head.num_classes = 3` only adds **a new, meaningless attribute**. The output stays `(N, 8732, 91)`.
> 2. Passing it to the constructor, as in `ssd300_vgg16(weights=COCO, num_classes=3)`, raises a **ValueError**, because it has to match the number of classes in the pretrained weights (91).
> 3. The classification head's number of classes is **baked in at construction time into the conv layers' output channel count (`number of classes × number of anchors`) and the reshape size (`num_columns`).** So the head object has to be rebuilt from scratch.
> 4. The SSD body doesn't store the number of classes separately; it reads it from `cls_logits.size(-1)`. So **replacing just the classification head makes the loss and post-processing follow along automatically.**
> 5. The new head's arguments (`in_channels`, `num_anchors`) are read from the backbone and the anchor generator, **exactly the way the SSD constructor builds its head**.
> 6. After the replacement, always verify it with the output shape `(1, 8732, 3)`.

## 1. Did the baseline's one line really change the number of classes?

### 1.1. Let's print the output shape

I fed a 300×300 dummy image into the model and printed the shape of the classification head's output.

```python
import torch
from torchvision.models.detection import ssd300_vgg16, SSD300_VGG16_Weights

model = ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1)
head = model.head.classification_head

print("Did num_classes exist before adding the attribute?", hasattr(head, "num_classes"))
head.num_classes = 3  # the baseline's one line

model.eval()
with torch.no_grad():
    features = list(model.backbone(torch.zeros(1, 3, 300, 300)).values())
    print("cls_logits:", tuple(model.head(features)["cls_logits"].shape))
```

```text
Did num_classes exist before adding the attribute? False
cls_logits: (1, 8732, 91)
```

Two things stand out.

- The classification head **never had** a `num_classes` attribute in the first place. The baseline code didn't change an existing value; it just attached <u>**a new attribute that nobody reads**</u> to a Python object.
- The last dimension of the output is still <u>**91**</u>. That means it's producing scores for 91 classes for every single one of the 8732 anchors.

### 1.2. Then why did training run without errors?

> 🤔 **We fed 3-class labels into a model that outputs 91 classes. Why is there no error?**
>
> The classification loss is computed with `F.cross_entropy(cls_logits, labels)`. Cross entropy computes without complaint <u>**as long as the label values are smaller than the number of classes**</u>. Our labels are only 0 (background), 1 (cat), and 2 (dog), all smaller than 91. So syntactically, it's a perfectly normal training run.
>
> The problem is the meaning. In COCO's class list, index 1 is `person` and index 2 is `bicycle`. In other words, the model was learning <u>**"give cat heads a score in the person slot and dog heads a score in the bicycle slot."**</u>
>
> ```python
> categories = SSD300_VGG16_Weights.COCO_V1.meta["categories"]
> print(len(categories), categories[:3], categories.index("cat"), categories.index("dog"))
> ```
>
> ```text
> 91 ['__background__', 'person', 'bicycle'] 17 18
> ```
>
> On top of that, COCO already has separate `cat` (17) and `dog` (18) slots.

The fact that there's no error is actually the scary part. The loss goes down and the boxes look plausible, so it's hard to notice something is wrong just by looking at the results.

## 2. Then can't we just pass `num_classes=3` to the constructor?

The `ssd300_vgg16()` function has a `num_classes` argument. Instead of fixing the attribute afterwards, it seems like we could just pass 3 from the start. Let's try.

```python
ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1, num_classes=3)
```

```text
ValueError: The parameter 'num_classes' expected value 91 but got 3 instead.
```

We get a `ValueError`. The reason is in the body of `ssd300_vgg16()`.

```python
if weights is not None:
    weights_backbone = None
    num_classes = _ovewrite_value_param("num_classes", num_classes, len(weights.meta["categories"]))
elif num_classes is None:
    num_classes = 91
```

```python
def _ovewrite_value_param(param: str, actual: Optional[V], expected: V) -> V:
    if actual is not None:
        if actual != expected:
            raise ValueError(f"The parameter '{param}' expected value {expected} but got {actual} instead.")
    return expected
```

When you use pretrained weights (`weights`), `num_classes` <u>**must equal the number of classes the weights were trained on (91)**</u>. The classification head tensors in the weight file are stored in a 91-class shape, so the model skeleton also has to be built for 91 classes for `load_state_dict` to load the weights in.

On the other hand, if you set `weights=None` and pass `num_classes=3`, this time you can't use **any** of the COCO-trained weights. The backbone only gets the ImageNet classification weights (`weights_backbone`), and the extra layers and box regression head that SSD learned on COCO all start from random initialization. That largely defeats the purpose of transfer learning.

| Attempt | Result |
| --- | --- |
| Build with COCO weights, then `classification_head.num_classes = 3` | No error. But the output is still 91 classes |
| `ssd300_vgg16(weights=COCO, num_classes=3)` | `ValueError` |
| `ssd300_vgg16(weights=None, num_classes=3)` | Works, but throws away the weights learned on COCO |

There's only one option left: <u>**build the 91-class model as-is with COCO weights, then swap out just the classification head for a 3-class one**</u>. But what exactly does "swapping out" need to change? To know that, we need to see where the classification head uses the number of classes.

## 3. Finding the evidence in the SSD source: where is the number of classes baked in?

### 3.1. SSD's head has two branches

First, the overall structure of the head.

```python
class SSDHead(nn.Module):
    def __init__(self, in_channels: list[int], num_anchors: list[int], num_classes: int):
        super().__init__()
        self.classification_head = SSDClassificationHead(in_channels, num_anchors, num_classes)
        self.regression_head = SSDRegressionHead(in_channels, num_anchors)

    def forward(self, x: list[Tensor]) -> dict[str, Tensor]:
        return {
            "bbox_regression": self.regression_head(x),
            "cls_logits": self.classification_head(x),
        }
```

<!-- TODO: figure — the backbone's 6 feature maps → a classification conv / regression conv per feature map → flattened to (N, HWA, K) and concatenated → cls_logits (N, 8732, K), bbox_regression (N, 8732, 4) -->

SSD makes two predictions for each of the <u>**6 feature maps of different sizes**</u> extracted by the backbone.

- **Classification head** (`classification_head`): for each anchor at each location, class scores for "what's inside this anchor"
- **Regression head** (`regression_head`): 4 coordinate offsets saying how much each anchor needs to be moved and stretched to fit the actual box

We can already spot one hint here. The regression head's constructor <u>**doesn't take `num_classes` at all.**</u> That means the regression head isn't affected when the number of classes changes.

### 3.2. Classification head: the number of classes is baked into the conv layers at construction

Now let's open up the classification head.

```python
class SSDClassificationHead(SSDScoringHead):
    def __init__(self, in_channels: list[int], num_anchors: list[int], num_classes: int):
        cls_logits = nn.ModuleList()
        for channels, anchors in zip(in_channels, num_anchors):
            cls_logits.append(nn.Conv2d(channels, num_classes * anchors, kernel_size=3, padding=1))
        _xavier_init(cls_logits)
        super().__init__(cls_logits, num_classes)
```

`num_classes` is used in exactly two places in the constructor.

1. **The conv layers' output channel count**: `num_classes * anchors`
2. **The `num_columns` passed to the parent class**: `super().__init__(cls_logits, num_classes)`

And a line like `self.num_classes = num_classes` appears <u>**nowhere.**</u> That's why `hasattr(head, "num_classes")` was `False` in Section 1.1.

Let's see what item 1 means with real numbers. Printing the COCO model's classification head gives this.

```python
print(model.head.classification_head)
```

```text
SSDClassificationHead(
  (module_list): ModuleList(
    (0): Conv2d(512, 364, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (1): Conv2d(1024, 546, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (2): Conv2d(512, 546, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (3): Conv2d(256, 546, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (4-5): 2 x Conv2d(256, 364, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
  )
)
```

Working out by hand where the output channels 364 and 546 come from:

- $364 = 91 \times 4$: 4 anchors per location, 91 class scores per anchor
- $546 = 91 \times 6$: 6 anchors per location, 91 class scores per anchor

In other words, <u>**the number of classes, 91, is part of the very shape of the conv weight tensors.**</u> The first conv's weight shape is `(364, 512, 3, 3)`, and that shape doesn't change just because you change an attribute after the object is created.

### 3.3. `num_columns`: the reshape also uses the value from construction time

Item 2, `num_columns`, is used in the parent class `SSDScoringHead`.

```python
class SSDScoringHead(nn.Module):
    def __init__(self, module_list: nn.ModuleList, num_columns: int):
        super().__init__()
        self.module_list = module_list
        self.num_columns = num_columns

    def forward(self, x: list[Tensor]) -> Tensor:
        all_results = []

        for i, features in enumerate(x):
            results = self._get_result_from_module_list(features, i)

            # Permute output from (N, A * K, H, W) to (N, HWA, K).
            N, _, H, W = results.shape
            results = results.view(N, -1, self.num_columns, H, W)
            results = results.permute(0, 3, 4, 1, 2)
            results = results.reshape(N, -1, self.num_columns)  # Size=(N, HWA, K)

            all_results.append(results)

        return torch.cat(all_results, dim=1)
```

What forward does is flatten the conv output so that there's <u>**"one row per anchor."**</u> Let's trace the shape through the first feature map (38×38, 4 anchors per location).

1. Conv output: `(N, 364, 38, 38)` → 4 anchors × 91 classes are mixed together inside the 364 channels.
2. `view(N, -1, 91, 38, 38)`: split the channels into `(4 anchors, 91 classes)` → `(N, 4, 91, 38, 38)`
3. `permute(0, 3, 4, 1, 2)`: move the location (H, W) to the front and the classes to the very end → `(N, 38, 38, 4, 91)`
4. `reshape(N, -1, 91)`: put location × anchor into a single row → `(N, 5776, 91)`

Do this for all 6 feature maps and concatenate, and you get `(N, 8732, 91)`.

Here, `self.num_columns` is exactly the last dimension K. And this value is only **stored once in the parent class's constructor**; nowhere is it tied to the name `num_classes`. So even if you attach a `num_classes` attribute like the baseline did, forward doesn't even look at it.

> 🤔 **Then can't we just change `num_columns = 3`?**
>
> No. The conv still outputs 364 channels, so in step 2, `view(N, -1, 3, 38, 38)` fails because $364 / 3$ doesn't divide evenly. Even if it happened to be a divisible number, you'd end up reading channels laid out for 91 classes in nonsensical groups of 3.
>
> <u>**The conv's output channels and `num_columns` must change together**</u>, and the only place that sets both together is the constructor. That's why the head object has to be rebuilt from scratch.

### 3.4. Where does the SSD body read the number of classes from?

Is building a new head the end of it? If somewhere in the SSD body "number of classes = 91" were stored separately, we'd have to fix that too. This time, let's dig through the SSD body.

```python
print("Does the SSD body have a num_classes attribute?", hasattr(model, "num_classes"))
```

```text
Does the SSD body have a num_classes attribute? False
```

The body doesn't have it either. Then how does it know the number of classes when computing the loss and doing inference post-processing? The answer is in these two functions.

```python
# SSD.compute_loss — during training
num_classes = cls_logits.size(-1)
cls_loss = F.cross_entropy(cls_logits.view(-1, num_classes), cls_targets.view(-1), reduction="none")
```

```python
# SSD.postprocess_detections — during inference
pred_scores = F.softmax(head_outputs["cls_logits"], dim=-1)
num_classes = pred_scores.size(-1)
...
for label in range(1, num_classes):
    score = scores[:, label]
```

Both <u>**read the number of classes from the last dimension of the tensor that the classification head outputs.**</u> This `range(1, num_classes)` is also exactly why post-processing loops over every class from 1 to (number of classes - 1).

This is good news.

⭐️ → <u>**If we swap just the classification head for a 3-class one, the output becomes `(N, 8732, 3)`, and the loss and post-processing pick up that 3 on their own.**</u> There's nothing else to fix in the SSD body.

## 4. Where do we get the arguments for the new classification head?

Now what to do is settled: build a new `SSDClassificationHead(in_channels, num_anchors, num_classes=3)` and plug it in. The remaining question is where to get `in_channels` and `num_anchors`.

### 4.1. Let's follow exactly how the SSD constructor builds the head

The most reliable way is to <u>**follow exactly the code SSD used when it first built the head**</u>. Here's the part of `SSD.__init__` that builds the head.

```python
if head is None:
    if hasattr(backbone, "out_channels"):
        out_channels = backbone.out_channels
    else:
        out_channels = det_utils.retrieve_out_channels(backbone, size)

    if len(out_channels) != len(anchor_generator.aspect_ratios):
        raise ValueError(...)

    num_anchors = self.anchor_generator.num_anchors_per_location()
    head = SSDHead(out_channels, num_anchors, num_classes)
self.head = head
```

The library gets the two values like this.

- `in_channels` (here, `out_channels`): if the backbone has no `out_channels` attribute, it's obtained with `retrieve_out_channels`
- `num_anchors`: the anchor generator's `num_anchors_per_location()`

If we use these same two lines, <u>**we build the 3-class head in exactly the same way the library built the 91-class head.**</u>

### 4.2. `in_channels`: read by passing a dummy image through

`retrieve_out_channels` is, as the name says, a function that figures out the channel counts of the feature maps the backbone produces.

```python
def retrieve_out_channels(model: nn.Module, size: tuple[int, int]) -> list[int]:
    in_training = model.training
    model.eval()

    with torch.no_grad():
        # Use dummy data to retrieve the feature map sizes to avoid hard-coding their values
        device = next(model.parameters()).device
        tmp_img = torch.zeros((1, 3, size[1], size[0]), device=device)
        features = model(tmp_img)
        if isinstance(features, torch.Tensor):
            features = OrderedDict([("0", features)])
        out_channels = [x.size(1) for x in features.values()]

    if in_training:
        model.train()

    return out_channels
```

The principle is simple. It passes a zero-filled 300×300 image through the backbone once and collects the channel dimension (`size(1)`) of the resulting feature maps. The comment even says it's there <u>**"to avoid hard-coding their values."**</u>

```text
in_channels : [512, 1024, 512, 256, 256, 256]
```

The 6 feature maps of SSD300-VGG16 come from conv4_3 (512), fc7 (1024), conv8_2 (512), conv9_2 (256), conv10_2 (256), and conv11_2 (256), respectively.

> 🤔 **Can't I just write these numbers in as a list?**
>
> If you only ever use this one model, it works. But if you swap the backbone or torchvision changes the structure even slightly, the numbers silently go out of sync. When they do, the conv input channels don't match and forward throws an error, and tracing that error message all the way back to "I wrote the wrong channel count when building the head" is quite a hassle.
>
> The library itself uses this function instead of hard-coding, so <u>**using the same function is the surest way to stay in sync with the library**</u>.

### 4.3. `num_anchors`: computed from the number of aspect ratios

Next is the number of anchors placed at each location (called default boxes in the SSD paper). `ssd300_vgg16()` builds the anchor generator like this.

```python
anchor_generator = DefaultBoxGenerator(
    [[2], [2, 3], [2, 3], [2, 3], [2], [2]],
    scales=[0.07, 0.15, 0.33, 0.51, 0.69, 0.87, 1.05],
    steps=[8, 16, 32, 64, 100, 300],
)
```

And `num_anchors_per_location()` looks like this.

```python
def num_anchors_per_location(self) -> list[int]:
    # Estimate num of anchors based on aspect ratios: 2 default boxes + 2 * ratios of feaure map.
    return [2 + 2 * len(r) for r in self.aspect_ratios]
```

- **2 by default**: two square boxes with a 1:1 ratio at different sizes (the scale $s_k$ and the geometric mean with the next scale, $\sqrt{s_k s_{k+1}}$)
- **2 per ratio**: for each ratio $r$, one wide box ($r:1$) and one tall box ($1:r$)

Computing by hand:

| feature map | aspect ratios | number of anchors |
| --- | --- | --- |
| 1st (38×38) | `[2]` | $2 + 2 \times 1 = 4$ |
| 2nd–4th (19×19, 10×10, 5×5) | `[2, 3]` | $2 + 2 \times 2 = 6$ |
| 5th–6th (3×3, 1×1) | `[2]` | $2 + 2 \times 1 = 4$ |

```text
num_anchors : [4, 6, 6, 6, 4, 4]
```

The 4 and 6 in the 364 (= 91×**4**) and 546 (= 91×**6**) we saw in Section 3.2 are exactly these numbers.

### 4.4. Building and plugging in the new head

Now we have all the ingredients. The code below is the final function used in the experiment notebook.

```python
from torchvision.models.detection import SSD300_VGG16_Weights, ssd300_vgg16
from torchvision.models.detection import _utils as detection_utils
from torchvision.models.detection.ssd import SSD, SSDClassificationHead


def build_ssd300_for_head_detection(num_classes: int, image_size: int) -> SSD:
    """Load COCO SSD300-VGG16 and replace the classification head for num_classes."""
    # 1. Build the 91-class model as-is with COCO weights
    model = ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1)
    # 2. Get the arguments the same way SSD.__init__ does when building the head
    in_channels = detection_utils.retrieve_out_channels(model.backbone, (image_size, image_size))
    num_anchors = model.anchor_generator.num_anchors_per_location()
    # 3. Replace only the classification head with a new object (the regression head keeps its COCO weights)
    model.head.classification_head = SSDClassificationHead(in_channels, num_anchors, num_classes)
    return model


model = build_ssd300_for_head_detection(num_classes=3, image_size=300)
print(model.head.classification_head)
```

```text
SSDClassificationHead(
  (module_list): ModuleList(
    (0): Conv2d(512, 12, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (1): Conv2d(1024, 18, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (2): Conv2d(512, 18, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (3): Conv2d(256, 18, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (4-5): 2 x Conv2d(256, 12, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
  )
)
```

364 → 12 (= **3**×4), 546 → 18 (= **3**×6). The conv output channels have changed to a 3-class basis. And `num_columns` was set to 3 in the constructor at the same time.

The new head's weights are initialized by `_xavier_init` inside the `SSDClassificationHead` constructor. That's the same initialization used when the original 91-class head was first created.

> 🤔 **Why leave the regression head as it is?**
>
> As we saw in Section 3.1, `SSDRegressionHead`'s constructor has no `num_classes`. The regression head outputs <u>**4 coordinate offsets per anchor regardless of class**</u>. Its output is `(N, 8732, 4)`, independent of the number of classes, so there's no reason to replace it.
>
> Of course, the boxes learned on COCO are boxes around whole objects, like "a whole person" or "a whole cat," whereas we're looking for "head" boxes, so the distribution differs. Still, the general ability of "fitting anchors to object boundaries" is a better starting point than random initialization. And in this experiment, the regression head is also trainable, so it gets retrained to fit head boxes.

> 🤔 **COCO already has `cat` (17) and `dog` (18) slots. Couldn't we change the labels to 17 and 18 and use those slots?**
>
> It's a plausible idea, but I judged it a poor fit for this task.
>
> 1. **The target is different.** COCO's `cat` slot was trained to find a cat's **whole body**. What we want is the **head**. That slot's prior knowledge could actually pull the boxes toward the whole body.
> 2. **The other 88 slots stay alive.** Since post-processing loops over every class, predictions from unused slots (person, sofa, etc.) would have to be filtered out separately.
> 3. **The head is 30 times heavier.** We'll see the numbers in Section 5.3 right below.

## 5. Let's verify the replacement actually took effect

As we saw in Section 1, even a wrong setup trains without errors. So before running training, I added a step to <u>**check directly via the output shape that the replacement took effect**</u>.

### 5.1. Where does 8732 come from?

To verify, we need to know the expected value. The total anchor count of 8732 is the sum of $H \times W \times (\text{anchors per location})$ over the feature maps.

| feature map | $H \times W$ | anchors per location | number of anchors |
| --- | --- | --- | --- |
| 1 | $38 \times 38 = 1444$ | 4 | 5,776 |
| 2 | $19 \times 19 = 361$ | 6 | 2,166 |
| 3 | $10 \times 10 = 100$ | 6 | 600 |
| 4 | $5 \times 5 = 25$ | 6 | 150 |
| 5 | $3 \times 3 = 9$ | 4 | 36 |
| 6 | $1 \times 1 = 1$ | 4 | 4 |
| **Total** | | | **8,732** |

Large feature maps like 38×38 handle small objects, and small feature maps like 1×1 handle large objects as big as the whole image. You can also see that two-thirds of the anchors are concentrated in the first feature map.

### 5.2. Let's lock the shape in with asserts

```python
@torch.no_grad()
def check_head_output_shapes(model: SSD, num_classes: int, image_size: int, expected_num_anchors: int) -> dict:
    """Pass a dummy input through backbone → head and verify the output shapes."""
    was_training = model.training
    model.eval()
    device = next(model.parameters()).device
    features = list(model.backbone(torch.zeros(1, 3, image_size, image_size, device=device)).values())
    head_outputs = model.head(features)
    model.train(was_training)

    anchors_per_location = model.anchor_generator.num_anchors_per_location()
    num_anchors = sum(f.shape[-2] * f.shape[-1] * a for f, a in zip(features, anchors_per_location))
    shapes = {key: tuple(value.shape) for key, value in head_outputs.items()}
    assert num_anchors == expected_num_anchors, num_anchors
    assert shapes["cls_logits"] == (1, expected_num_anchors, num_classes), shapes
    assert shapes["bbox_regression"] == (1, expected_num_anchors, 4), shapes
    return {"feature_maps": [tuple(f.shape[-2:]) for f in features], **shapes}


print(check_head_output_shapes(model, num_classes=3, image_size=300, expected_num_anchors=8732))
```

```text
{'feature_maps': [(38, 38), (19, 19), (10, 10), (5, 5), (3, 3), (1, 1)], 'bbox_regression': (1, 8732, 4), 'cls_logits': (1, 8732, 3)}
```

`cls_logits` came out as `(1, 8732, 3)`. With the baseline approach, it would have been caught by the second assert as `(1, 8732, 91)`.

I set this function up to be <u>**called automatically every time a model is built**</u> inside the notebook's training function. This is so that even if someone accidentally deletes the head replacement code later, it stops before training starts.

### 5.3. Let's also check via parameter counts

Replacing the head also changes the parameter count significantly.

| Classification head | Number of parameters |
| --- | --- |
| COCO 91-class head | 12,163,242 |
| New 3-class head | 400,986 |

To double-check the 3-class head's parameter count by hand, the parameters of one conv are $(\text{input channels} \times \text{output channels} \times 3 \times 3) + \text{output channels}(\text{bias})$, so:

- $512 \times 12 \times 9 + 12 = 55{,}308$
- $1024 \times 18 \times 9 + 18 = 165{,}906$
- $512 \times 18 \times 9 + 18 = 82{,}962$
- $256 \times 18 \times 9 + 18 = 41{,}490$
- $(256 \times 12 \times 9 + 12) \times 2 = 55{,}320$

→ Total $400{,}986$. It matches the output exactly.

That's about <u>**1/30th**</u> of the 91-class head. More than a third of SSD300's total parameters (35,641,826) were in the 91-class classification head, so carrying a 91-class head around for a 3-class task was quite a waste.

## 6. One more trap: it's already frozen even though I didn't freeze anything

After finishing the head replacement, I was counting parameters to set up Feature Extraction (freeze the backbone and train only the head) when I spotted a strange number.

```python
default_frozen = sum(p.numel() for p in model.parameters() if not p.requires_grad)
print(f"Parameters already frozen in torchvision's default state: {default_frozen:,}")
```

```text
Parameters already frozen in torchvision's default state: 38,720
```

I hadn't frozen anything, yet <u>**38,720 parameters already had `requires_grad=False`**</u>. Once again, the answer was in the body of `ssd300_vgg16()`.

```python
trainable_backbone_layers = _validate_trainable_layers(
    weights is not None or weights_backbone is not None, trainable_backbone_layers, 5, 4
)
...
backbone = _vgg_extractor(backbone, False, trainable_backbone_layers)
```

When pretrained weights are used, the default value of `trainable_backbone_layers` becomes **4**. That means <u>**of VGG16's 5 blocks, only the last 4 are trained and the first block is frozen**</u>. The code that actually freezes them is in `_vgg_extractor`.

```python
def _vgg_extractor(backbone: VGG, highres: bool, trainable_layers: int):
    backbone = backbone.features
    # Gather the indices of maxpools. These are the locations of output blocks.
    stage_indices = [0] + [i for i, b in enumerate(backbone) if isinstance(b, nn.MaxPool2d)][:-1]
    num_stages = len(stage_indices)
    ...
    freeze_before = len(backbone) if trainable_layers == 0 else stage_indices[num_stages - trainable_layers]

    for b in backbone[:freeze_before]:
        for parameter in b.parameters():
            parameter.requires_grad_(False)
```

Following it step by step:

1. The MaxPool positions in VGG16's `features` are `[4, 9, 16, 23, 30]`.
2. Dropping the last one and prepending 0 gives `stage_indices = [0, 4, 9, 16, 23]`, i.e. 5 blocks.
3. With `trainable_layers = 4`, `freeze_before = stage_indices[5 - 4] = stage_indices[1] = 4`
4. `backbone[:4]` = conv1_1, ReLU, conv1_2, ReLU → the first block's 2 convs get frozen.

Checking with parameter counts:

- conv1_1: $3 \times 64 \times 9 + 64 = 1{,}792$
- conv1_2: $64 \times 64 \times 9 + 64 = 36{,}928$

→ Total $38{,}720$. Exactly the number that was printed.

The reason this is a trap: if you do Full Fine-tuning (training everything) thinking <u>**"I didn't freeze anything, so everything will be trained,"**</u> you're actually training with the first block frozen. In an experiment comparing FE and FT, the FT setup silently goes wrong.

So I wrote the function that sets the training scope to <u>**explicitly set `requires_grad` for every parameter**</u>.

```python
def set_trainable_scope(model: SSD, scope: str) -> None:
    """Explicitly set requires_grad for every parameter according to scope."""
    if scope not in ("head", "all"):
        raise ValueError(f"unknown trainable scope: {scope}")
    for parameter in model.parameters():
        parameter.requires_grad_(scope == "all")   # 1. First turn everything off (FE) or on (FT)
    if scope == "head":
        for parameter in model.head.parameters():
            parameter.requires_grad_(True)          # 2. For FE, turn only the head back on
```

Here's the result of applying the FE setting.

| component | params | trainable | trainable % |
| --- | --- | --- | --- |
| backbone | 22,943,936 | 0 | 0.0 |
| head.regression_head | 534,648 | 534,648 | 100.0 |
| head.classification_head | 400,986 | 400,986 | 100.0 |
| total | 23,879,570 | 935,634 | 3.9 |

Only 3.9% of the total is trained.

> 🤔 **If you freeze the backbone, is BatchNorm okay?**
>
> `requires_grad=False` only blocks the gradients of the weights; BatchNorm's running mean/var keep updating while in `model.train()` mode. So with a backbone that has BN, you need to fix the BN layers separately with `eval()`.
>
> Fortunately, <u>**VGG16 has no BatchNorm.**</u> So for this model, just calling `model.train()` keeps the backbone truly fixed.

## 7. So how do you actually write the code?

To sum up, here's the order for transfer-learning a COCO-pretrained SSD300 to a different number of classes.

```python
# 1. Build the 91-class model as-is with COCO weights (passing num_classes raises ValueError)
model = ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1)

# 2. Get the head arguments the same way SSD.__init__ does, and rebuild only the classification head
in_channels = detection_utils.retrieve_out_channels(model.backbone, (300, 300))
num_anchors = model.anchor_generator.num_anchors_per_location()
model.head.classification_head = SSDClassificationHead(in_channels, num_anchors, num_classes=3)

# 3. Explicitly set the training scope for every parameter (the conv1 block is frozen by default)
set_trainable_scope(model, "head")

# 4. Move to the device
model.to(device)

# 5. Verify the replacement via the output shape
check_head_output_shapes(model, num_classes=3, image_size=300, expected_num_anchors=8732)

# 6. Pass only the trainable parameters to the optimizer
optimizer = torch.optim.SGD([p for p in model.parameters() if p.requires_grad], lr=2e-3, momentum=0.9, weight_decay=5e-4)
```

> 💡 **Order matters.**
>
> The head replacement must happen **before** `model.to(device)` and before creating the optimizer.
>
> - If you replace it after `to(device)`, only the new head stays on the CPU, and the first forward fails with a device mismatch error.
> - If you replace it after creating the optimizer, it breaks even more quietly. The optimizer holds the parameters of the **old** head, so the new head just receives gradients and is never updated. Once again, there's no error.

Following the trail of why a single line changing the `num_classes` attribute has no effect, we were able to establish that the number of classes is baked into the shape of the conv weights, that the SSD body reads the number of classes from that shape, and that therefore replacing just the head makes everything else follow along. <u>**It was an experience that taught me that, when transfer-learning a model, it's important to build the habit of understanding the model's structure while also following and verifying how it is actually implemented in code.**</u>

## 📚 References

- [SSD: Single Shot MultiBox Detector](https://arxiv.org/abs/1512.02325) — Liu et al., 2016
- [torchvision `ssd.py` source code](https://github.com/pytorch/vision/blob/main/torchvision/models/detection/ssd.py)
- [torchvision `detection/_utils.py` source code](https://github.com/pytorch/vision/blob/main/torchvision/models/detection/_utils.py) — `retrieve_out_channels`
- [torchvision official docs: ssd300_vgg16](https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.detection.ssd300_vgg16.html)
- [TorchVision Object Detection Finetuning Tutorial](https://docs.pytorch.org/tutorials/intermediate/torchvision_tutorial.html)
- :github: [Experiment code repository](https://github.com/raewoo0908/codeit_face_obj_detection/blob/main/experiment.ipynb)
