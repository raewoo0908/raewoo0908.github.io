---
title: ":ai: 전이학습 시, 분류 클래스 개수를 바꾸고 싶다. 어떻게 바꿔야 할까? 구현 소스코드를 파헤쳐보자"
date: 2026-10-10T22:00:00+09:00
description: "COCO로 학습된 torchvision SSD300을 3클래스 탐지기로 전이학습하면서, num_classes 속성 하나 바꾸는 코드가 왜 아무 효과가 없는지, 그리고 분류 헤드를 어떻게 교체해야 하는지를 SSD 구현 코드를 직접 읽으며 근거를 세워봅니다."
tags: [AI, ObjectDetection, SSD, TransferLearning, PyTorch, torchvision]
draft: false
---

## 0. 들어가며

코드잇 미션7은 COCO로 사전학습된 <u>**SSD300-VGG16**</u> 모델을 가져와서, 고양이·강아지 사진에서 <u>**머리(head)의 위치**</u>를 찾는 탐지기로 전이학습하는 과제였습니다. 탐지할 클래스는 `background`, `cat`, `dog` 세 개입니다.

미션에는 참고용 baseline 노트북이 함께 주어졌는데, 그 안에 모델을 불러와서 클래스 수를 맞추는 코드가 이렇게 들어 있었습니다.

```python
model = torchvision.models.detection.ssd300_vgg16(weights=SSD300_VGG16_Weights.DEFAULT).to(device)

# 클래스 개수에 맞게 출력 레이어 수정
num_classes = len(classes)  # background 포함
model.head.classification_head.num_classes = num_classes
```

주석만 보면 출력 레이어를 3클래스용으로 고친 것 같습니다. 실제로 이 코드로 학습을 돌려도 에러 하나 없이 잘 돌아가고, loss도 잘 내려갑니다.

하지만 이 한 줄은 <u>**아무것도 바꾸지 않습니다.**</u> 모델은 여전히 COCO의 91개 클래스를 예측하고 있고, 우리가 넣어준 `cat`(1), `dog`(2) 라벨은 COCO의 `person`, `bicycle` 자리에서 학습되고 있었습니다.

오늘 포스트에서는 이 코드가 왜 효과가 없는지, 그리고 클래스 수를 바꾸려면 무엇을 해야 하는지를 <u>**torchvision의 SSD 구현 코드를 직접 읽으며**</u> 근거를 세워보겠습니다. 

> 📌 **NOTE**
>
> - 이 글의 코드와 출력은 **torchvision 0.28.0** 기준입니다. 소스 인용은 설치된 `torchvision/models/detection/ssd.py`에서 가져왔습니다.
> - 데이터는 Oxford-IIIT Pet 데이터셋의 머리 bounding box 어노테이션(PASCAL VOC 형식)을 썼습니다.
>
> :github: [실험 코드 레포지토리](https://github.com/raewoo0908/codeit_face_obj_detection/blob/main/experiment.ipynb)

> 📌 **총정리**
>
> 1. `classification_head.num_classes = 3`은 **아무 의미 없는 새 속성**을 하나 추가할 뿐이다. 출력은 그대로 `(N, 8732, 91)`이다.
> 2. `ssd300_vgg16(weights=COCO, num_classes=3)`처럼 생성자에 넘기면 **ValueError**가 난다. 사전학습 가중치의 클래스 수(91)와 맞아야 하기 때문이다.
> 3. 분류 헤드의 클래스 수는 **conv 층의 출력 채널 수(`클래스 수 × anchor 수`)와 reshape 크기(`num_columns`)에 생성 시점에 박힌다.** 그래서 헤드 객체를 통째로 새로 만들어야 한다.
> 4. SSD 본체는 클래스 수를 따로 저장하지 않고 `cls_logits.size(-1)`에서 읽는다. 그래서 **분류 헤드만 바꾸면 loss와 후처리는 자동으로 따라온다.**
> 5. 새 헤드의 인자(`in_channels`, `num_anchors`)는 **SSD 생성자가 헤드를 만드는 방식을 그대로 따라** backbone과 anchor generator에서 읽는다.
> 6. 교체 후에는 출력 shape `(1, 8732, 3)`으로 반드시 검증한다.

## 1. baseline의 한 줄은 정말 클래스 수를 바꿨을까?

### 1.1. 출력 shape를 찍어보자

모델에 300×300 더미 이미지를 넣고, 분류 헤드가 내는 출력의 shape를 찍어봤습니다.

```python
import torch
from torchvision.models.detection import ssd300_vgg16, SSD300_VGG16_Weights

model = ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1)
head = model.head.classification_head

print("속성 추가 전 num_classes가 있었나?", hasattr(head, "num_classes"))
head.num_classes = 3  # baseline의 그 한 줄

model.eval()
with torch.no_grad():
    features = list(model.backbone(torch.zeros(1, 3, 300, 300)).values())
    print("cls_logits:", tuple(model.head(features)["cls_logits"].shape))
```

```text
속성 추가 전 num_classes가 있었나? False
cls_logits: (1, 8732, 91)
```

두 가지가 보입니다.

- 분류 헤드에는 애초에 `num_classes`라는 속성이 **없었습니다.** baseline의 코드는 기존 값을 바꾼 게 아니라, 파이썬 객체에 <u>**아무도 읽지 않는 새 속성을 하나 붙인 것**</u>입니다.
- 출력의 마지막 차원은 여전히 <u>**91**</u>입니다. 8732개의 anchor 하나하나마다 91개 클래스의 점수를 내고 있다는 뜻이죠.

### 1.2. 그런데 왜 학습은 에러 없이 돌아갔을까?

> 🤔 **91개 클래스를 내는 모델에 3클래스 라벨을 넣었는데 왜 에러가 안 나나요?**
>
> 분류 loss는 `F.cross_entropy(cls_logits, labels)`로 계산됩니다. cross entropy는 <u>**라벨 값이 클래스 수보다 작기만 하면**</u> 아무 불평 없이 계산합니다. 우리 라벨은 0(background), 1(cat), 2(dog)뿐이니 91보다 작죠. 그래서 문법적으로는 완벽하게 정상인 학습이 됩니다.
>
> 문제는 의미입니다. COCO의 클래스 목록에서 1번은 `person`, 2번은 `bicycle`입니다. 즉 모델은 <u>**"고양이 머리는 사람 칸에, 강아지 머리는 자전거 칸에 점수를 줘라"**</u>라고 배우고 있던 겁니다.
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
> 게다가 COCO에는 이미 `cat`(17), `dog`(18) 칸이 따로 있습니다. 

에러가 안 난다는 게 오히려 무서운 부분입니다. loss는 내려가고 박스도 그럴듯하게 나오니, 결과만 보고는 잘못된 걸 알아채기 어렵습니다.

## 2. 그럼 생성자에 `num_classes=3`을 넘기면 되지 않을까?

`ssd300_vgg16()` 함수에는 `num_classes` 인자가 있습니다. 속성을 나중에 고치지 말고 처음부터 3을 넘기면 될 것 같은데요, 해보겠습니다.

```python
ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1, num_classes=3)
```

```text
ValueError: The parameter 'num_classes' expected value 91 but got 3 instead.
```

`ValueError`가 나네요. 이유는 `ssd300_vgg16()` 본문에 있습니다.

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

사전학습 가중치(`weights`)를 쓰면 `num_classes`는 <u>**가중치가 학습된 클래스 수(91)와 같아야만**</u> 합니다. 가중치 파일 안의 분류 헤드 텐서가 91클래스 모양으로 저장되어 있으니, 모델 뼈대도 91클래스로 만들어야 `load_state_dict`로 가중치를 넣을 수 있기 때문이죠.

그렇다고 `weights=None`으로 두고 `num_classes=3`을 넘기면, 이번에는 COCO로 학습된 가중치를 **하나도** 못 씁니다. backbone은 ImageNet 분류 가중치(`weights_backbone`)만 받고, SSD가 COCO에서 배운 extra layer와 박스 회귀 헤드는 전부 랜덤 초기화에서 시작합니다. 전이학습을 하려던 의미가 크게 줄어들죠.

| 시도 | 결과 |
| --- | --- |
| COCO 가중치로 만든 뒤 `classification_head.num_classes = 3` | 에러 없음. 하지만 출력은 그대로 91클래스 |
| `ssd300_vgg16(weights=COCO, num_classes=3)` | `ValueError` |
| `ssd300_vgg16(weights=None, num_classes=3)` | 동작은 하지만 COCO에서 학습한 가중치를 버린다 |

남은 방법은 하나입니다. <u>**COCO 가중치로 91클래스 모델을 그대로 만든 뒤, 분류 헤드만 3클래스용으로 갈아끼우는 것**</u>입니다. 그런데 "갈아끼운다"는 게 정확히 무엇을 바꿔야 하는 걸까요? 그걸 알려면 분류 헤드가 클래스 수를 어디에 쓰는지 봐야 합니다.

## 3. SSD 소스에서 근거 찾기: 클래스 수는 어디에 박혀 있나?

### 3.1. SSD의 헤드는 두 갈래다

먼저 헤드의 전체 구조입니다.

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

<!-- TODO: 그림 — backbone의 6개 feature map → 각 feature map마다 분류 conv / 회귀 conv → (N, HWA, K)로 펼쳐 concat → cls_logits (N, 8732, K), bbox_regression (N, 8732, 4) -->

SSD는 backbone이 뽑은 <u>**크기가 다른 feature map 6장**</u> 각각에 대해 두 가지를 예측합니다.

- **분류 헤드**(`classification_head`): 각 위치의 anchor마다 "이 anchor 안에 무엇이 있나" 클래스 점수
- **회귀 헤드**(`regression_head`): 각 anchor를 실제 박스에 맞추려면 얼마나 옮기고 늘려야 하나, 좌표 보정값 4개

여기서 벌써 힌트가 하나 보입니다. 회귀 헤드의 생성자에는 `num_classes`가 <u>**아예 없습니다.**</u> 클래스 수가 바뀌어도 회귀 헤드는 영향을 받지 않는다는 뜻이죠.

### 3.2. 분류 헤드: 클래스 수는 생성할 때 conv 층에 박힌다

이제 분류 헤드를 열어보겠습니다.

```python
class SSDClassificationHead(SSDScoringHead):
    def __init__(self, in_channels: list[int], num_anchors: list[int], num_classes: int):
        cls_logits = nn.ModuleList()
        for channels, anchors in zip(in_channels, num_anchors):
            cls_logits.append(nn.Conv2d(channels, num_classes * anchors, kernel_size=3, padding=1))
        _xavier_init(cls_logits)
        super().__init__(cls_logits, num_classes)
```

`num_classes`는 생성자 안에서 딱 두 군데 쓰입니다.

1. **conv 층의 출력 채널 수**: `num_classes * anchors`
2. **부모 클래스에 넘기는 `num_columns`**: `super().__init__(cls_logits, num_classes)`

그리고 `self.num_classes = num_classes` 같은 줄은 <u>**어디에도 없습니다.**</u> 1.1절에서 `hasattr(head, "num_classes")`가 `False`였던 이유가 이겁니다.

1번이 무엇을 의미하는지 실제 숫자로 보겠습니다. COCO 모델의 분류 헤드를 출력해보면 이렇습니다.

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

출력 채널 364와 546이 어디서 왔는지 손으로 풀어보면,

- $364 = 91 \times 4$: 위치마다 anchor 4개, anchor마다 91개 클래스 점수
- $546 = 91 \times 6$: 위치마다 anchor 6개, anchor마다 91개 클래스 점수

즉 <u>**클래스 수 91은 conv 가중치 텐서의 모양 자체에 들어가 있습니다.**</u> 첫 번째 conv의 가중치 shape는 `(364, 512, 3, 3)`이고, 이 모양은 객체를 만든 뒤에 속성 하나 바꾼다고 달라지지 않습니다.

### 3.3. `num_columns`: reshape도 생성 시점의 값으로 한다

2번 `num_columns`는 부모 클래스 `SSDScoringHead`에서 쓰입니다.

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

forward가 하는 일은 conv 출력을 <u>**"anchor 하나당 한 줄"**</u>이 되도록 펼치는 것입니다. 첫 번째 feature map(38×38, 위치당 anchor 4개)으로 shape를 따라가 보겠습니다.

1. conv 출력: `(N, 364, 38, 38)` → 채널 364개 안에 anchor 4개 × 클래스 91개가 섞여 있습니다.
2. `view(N, -1, 91, 38, 38)`: 채널을 `(anchor 4, 클래스 91)`로 쪼갭니다 → `(N, 4, 91, 38, 38)`
3. `permute(0, 3, 4, 1, 2)`: 위치(H, W)를 앞으로, 클래스를 맨 뒤로 → `(N, 38, 38, 4, 91)`
4. `reshape(N, -1, 91)`: 위치 × anchor를 한 줄로 → `(N, 5776, 91)`

이걸 feature map 6장에 대해 하고 이어 붙이면 `(N, 8732, 91)`이 됩니다.

여기서 `self.num_columns`가 바로 마지막 차원 K입니다. 그리고 이 값은 부모 클래스의 **생성자에서 한 번 저장**될 뿐, 클래스 쪽 어디에도 `num_classes`라는 이름과 연결되어 있지 않습니다. 그러니 baseline처럼 `num_classes` 속성을 붙여도 forward는 그걸 쳐다보지도 않는 거죠.

> 🤔 **그럼 `num_columns = 3`으로 바꾸면 되는 거 아닌가요?**
>
> 안 됩니다. conv는 여전히 채널 364개를 내놓는데, 2단계에서 `view(N, -1, 3, 38, 38)`을 하면 $364 / 3$이 나누어떨어지지 않아 에러가 납니다. 설령 나누어떨어지는 숫자였다고 해도, 91클래스 기준으로 배치된 채널을 3개씩 엉뚱하게 잘라 읽게 됩니다.
>
> <u>**conv의 출력 채널과 `num_columns`는 반드시 함께 바뀌어야 하고**</u>, 둘을 함께 정하는 곳은 생성자뿐입니다. 그래서 헤드 객체를 통째로 새로 만들어야 합니다.

### 3.4. SSD 본체는 클래스 수를 어디서 읽을까?

헤드를 새로 만든다고 끝일까요? SSD 본체 어딘가에 "클래스 수 = 91"이 따로 저장되어 있다면, 그것도 같이 고쳐야 할 겁니다. 이번에는 SSD 본체를 뒤져봅니다.

```python
print("SSD 본체에 num_classes 속성이 있나?", hasattr(model, "num_classes"))
```

```text
SSD 본체에 num_classes 속성이 있나? False
```

본체에도 없습니다. 그럼 loss를 계산할 때와 추론 후처리를 할 때는 클래스 수를 어떻게 알까요? 두 함수를 보면 답이 있습니다.

```python
# SSD.compute_loss — 학습할 때
num_classes = cls_logits.size(-1)
cls_loss = F.cross_entropy(cls_logits.view(-1, num_classes), cls_targets.view(-1), reduction="none")
```

```python
# SSD.postprocess_detections — 추론할 때
pred_scores = F.softmax(head_outputs["cls_logits"], dim=-1)
num_classes = pred_scores.size(-1)
...
for label in range(1, num_classes):
    score = scores[:, label]
```

둘 다 <u>**분류 헤드가 내놓은 텐서의 마지막 차원에서 클래스 수를 읽습니다.**</u> 후처리가 1번부터 (클래스 수 - 1)번까지 모든 클래스를 도는 것도 바로 이 `range(1, num_classes)` 때문입니다.

이건 좋은 소식입니다.

⭐️ → <u>**분류 헤드만 3클래스용으로 바꾸면, 출력이 `(N, 8732, 3)`이 되고, loss와 후처리는 그 3을 알아서 읽어갑니다.**</u> SSD 본체에서 따로 고칠 곳은 없습니다.

## 4. 새 분류 헤드에 넘길 인자는 어디서 구할까?

이제 무엇을 할지는 정해졌습니다. `SSDClassificationHead(in_channels, num_anchors, num_classes=3)`를 새로 만들어 끼우면 됩니다. 남은 질문은 `in_channels`와 `num_anchors`를 어디서 가져오느냐입니다.

### 4.1. SSD 생성자가 헤드를 만드는 방식을 그대로 따라 하자

가장 확실한 방법은 <u>**SSD가 처음에 헤드를 만들 때 쓴 코드를 그대로 따라 하는 것**</u>입니다. `SSD.__init__`에서 헤드를 만드는 부분입니다.

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

라이브러리는 두 값을 이렇게 얻습니다.

- `in_channels`(여기선 `out_channels`): backbone에 `out_channels` 속성이 없으면 `retrieve_out_channels`로 구한다
- `num_anchors`: anchor generator의 `num_anchors_per_location()`

우리도 이 두 줄을 그대로 쓰면, <u>**라이브러리가 91클래스 헤드를 만든 것과 똑같은 방식으로 3클래스 헤드를 만들게 됩니다.**</u>

### 4.2. `in_channels`: 더미 이미지를 흘려서 읽는다

`retrieve_out_channels`는 이름 그대로 backbone이 내는 feature map들의 채널 수를 알아내는 함수입니다.

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

원리는 단순합니다. 0으로 채운 300×300 이미지를 backbone에 한 번 흘려보내고, 나온 feature map들의 채널 차원(`size(1)`)을 모읍니다. 주석에도 <u>**"값을 하드코딩하지 않으려고"**</u>라고 적혀 있죠.

```text
in_channels : [512, 1024, 512, 256, 256, 256]
```

SSD300-VGG16의 6개 feature map은 각각 conv4_3(512), fc7(1024), conv8_2(512), conv9_2(256), conv10_2(256), conv11_2(256)에서 나옵니다.

> 🤔 **이 숫자를 그냥 리스트로 적어 넣으면 안 되나요?**
>
> 이 모델 하나만 쓴다면 동작은 합니다. 하지만 backbone을 바꾸거나 torchvision이 구조를 조금만 바꿔도 숫자가 조용히 어긋납니다. 어긋나면 conv 입력 채널이 안 맞아 forward에서 에러가 나는데, 그 에러 메시지만 보고 "헤드를 만들 때 채널 수를 잘못 적었다"까지 거슬러 올라가기는 꽤 번거롭습니다.
>
> 라이브러리 스스로도 하드코딩 대신 이 함수를 쓰고 있으니, <u>**같은 함수를 쓰는 게 라이브러리와 어긋나지 않는 가장 확실한 방법**</u>입니다.

### 4.3. `num_anchors`: aspect ratio 개수로 계산된다

다음은 위치마다 놓이는 anchor(SSD 논문에서는 default box) 수입니다. `ssd300_vgg16()`은 anchor generator를 이렇게 만듭니다.

```python
anchor_generator = DefaultBoxGenerator(
    [[2], [2, 3], [2, 3], [2, 3], [2], [2]],
    scales=[0.07, 0.15, 0.33, 0.51, 0.69, 0.87, 1.05],
    steps=[8, 16, 32, 64, 100, 300],
)
```

그리고 `num_anchors_per_location()`은 이렇게 생겼습니다.

```python
def num_anchors_per_location(self) -> list[int]:
    # Estimate num of anchors based on aspect ratios: 2 default boxes + 2 * ratios of feaure map.
    return [2 + 2 * len(r) for r in self.aspect_ratios]
```

- **기본 2개**: 비율 1:1인 정사각형 박스가 크기별로 2개(해당 scale $s_k$와, 다음 scale과의 기하평균 $\sqrt{s_k s_{k+1}}$)
- **비율마다 2개**: 비율 $r$마다 가로로 긴 박스($r:1$)와 세로로 긴 박스($1:r$)

손으로 계산해보면,

| feature map | aspect ratios | anchor 수 |
| --- | --- | --- |
| 1번째 (38×38) | `[2]` | $2 + 2 \times 1 = 4$ |
| 2~4번째 (19×19, 10×10, 5×5) | `[2, 3]` | $2 + 2 \times 2 = 6$ |
| 5~6번째 (3×3, 1×1) | `[2]` | $2 + 2 \times 1 = 4$ |

```text
num_anchors : [4, 6, 6, 6, 4, 4]
```

3.2절에서 본 364(= 91×**4**)와 546(= 91×**6**)의 4와 6이 바로 이 숫자입니다.

### 4.4. 새 헤드 만들어 끼우기

이제 재료가 다 모였습니다. 아래 코드는 실험 노트북에서 쓴 최종 함수입니다.

```python
from torchvision.models.detection import SSD300_VGG16_Weights, ssd300_vgg16
from torchvision.models.detection import _utils as detection_utils
from torchvision.models.detection.ssd import SSD, SSDClassificationHead


def build_ssd300_for_head_detection(num_classes: int, image_size: int) -> SSD:
    """COCO SSD300-VGG16을 불러와 분류 head를 num_classes용으로 교체한다."""
    # 1. COCO 가중치로 91클래스 모델을 그대로 만든다
    model = ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1)
    # 2. SSD.__init__이 헤드를 만들 때와 같은 방법으로 인자를 구한다
    in_channels = detection_utils.retrieve_out_channels(model.backbone, (image_size, image_size))
    num_anchors = model.anchor_generator.num_anchors_per_location()
    # 3. 분류 헤드만 새 객체로 교체한다 (회귀 헤드는 COCO 가중치 그대로)
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

364 → 12(= **3**×4), 546 → 18(= **3**×6). conv의 출력 채널이 3클래스 기준으로 바뀌었습니다. `num_columns`도 생성자에서 3으로 함께 정해졌고요.

새 헤드의 가중치는 `SSDClassificationHead` 생성자 안의 `_xavier_init`으로 초기화됩니다. 원래의 91클래스 헤드를 처음 생성할 때와 같은 초기화 방식이죠.

> 🤔 **회귀 헤드는 왜 그대로 두나요?**
>
> 3.1절에서 봤듯이 `SSDRegressionHead`의 생성자에는 `num_classes`가 없습니다. 회귀 헤드는 anchor마다 <u>**클래스와 상관없이 좌표 보정값 4개**</u>를 냅니다. 출력이 `(N, 8732, 4)`로 클래스 수와 무관하니 교체할 이유가 없습니다.
>
> 물론 COCO에서 배운 박스는 "사람 전체", "고양이 전체" 같은 물체 전체의 박스이고, 우리가 찾을 건 "머리" 박스라 분포가 다릅니다. 그래도 "anchor를 물체 경계에 맞추는 법"이라는 일반적인 능력은 랜덤 초기화보다 나은 출발점입니다. 그리고 이번 실험에서는 회귀 헤드도 학습 대상이라 머리 박스에 맞게 다시 학습됩니다.

> 🤔 **COCO에 이미 `cat`(17), `dog`(18) 칸이 있는데, 라벨을 17, 18로 바꿔서 그 칸을 쓰면 안 되나요?**
>
> 그럴듯한 아이디어지만, 이번 과제에는 맞지 않는다고 판단했습니다.
>
> 1. **찾는 대상이 다릅니다.** COCO의 `cat` 칸은 고양이 **몸 전체**를 찾도록 학습되었습니다. 우리가 원하는 건 **머리**입니다. 그 칸의 사전지식이 오히려 몸 전체에 박스를 치도록 끌어당길 수 있습니다.
> 2. **나머지 88개 칸이 계속 살아 있습니다.** 후처리가 모든 클래스를 돌기 때문에, 쓰지 않는 칸에서 나온 예측(사람, 소파 등)을 따로 걸러내야 합니다.
> 3. **헤드가 30배 무겁습니다.** 바로 아래 5.3절에서 숫자로 보겠습니다.

## 5. 교체가 정말 반영됐는지 검증하자

1절에서 봤듯이 잘못된 설정도 에러 없이 학습됩니다. 그래서 학습을 돌리기 전에 <u>**출력 shape로 교체가 반영됐는지 직접 확인**</u>하는 단계를 넣었습니다.

### 5.1. 8732는 어디서 나온 숫자일까?

검증하려면 기대값을 알아야겠죠. anchor 총개수 8732는 feature map마다 $H \times W \times (\text{위치당 anchor 수})$를 더한 값입니다.

| feature map | $H \times W$ | 위치당 anchor | anchor 수 |
| --- | --- | --- | --- |
| 1 | $38 \times 38 = 1444$ | 4 | 5,776 |
| 2 | $19 \times 19 = 361$ | 6 | 2,166 |
| 3 | $10 \times 10 = 100$ | 6 | 600 |
| 4 | $5 \times 5 = 25$ | 6 | 150 |
| 5 | $3 \times 3 = 9$ | 4 | 36 |
| 6 | $1 \times 1 = 1$ | 4 | 4 |
| **합계** | | | **8,732** |

38×38처럼 큰 feature map은 작은 물체를, 1×1처럼 작은 feature map은 이미지 전체만 한 큰 물체를 담당합니다. anchor의 3분의 2가 첫 번째 feature map에 몰려 있는 것도 보이네요.

### 5.2. shape를 assert로 박아두자

```python
@torch.no_grad()
def check_head_output_shapes(model: SSD, num_classes: int, image_size: int, expected_num_anchors: int) -> dict:
    """더미 입력으로 backbone → head를 통과시켜 출력 shape를 검증한다."""
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

`cls_logits`가 `(1, 8732, 3)`으로 나왔습니다. baseline 방식이었다면 두 번째 assert에서 `(1, 8732, 91)`로 걸렸을 겁니다.

이 함수는 노트북의 학습 함수 안에서 <u>**모델을 만들 때마다 자동으로 호출**</u>되도록 넣어 두었습니다. 나중에 누가 헤드 교체 코드를 실수로 지워도 학습이 시작되기 전에 멈추게 하기 위해서입니다.

### 5.3. 파라미터 수로도 확인해보자

헤드를 바꾸면 파라미터 수도 크게 달라집니다.

| 분류 헤드 | 파라미터 수 |
| --- | --- |
| COCO 91클래스 헤드 | 12,163,242 |
| 새 3클래스 헤드 | 400,986 |

3클래스 헤드의 파라미터 수를 손으로 검산해보면, conv 하나의 파라미터는 $(\text{입력 채널} \times \text{출력 채널} \times 3 \times 3) + \text{출력 채널}(\text{bias})$이니,

- $512 \times 12 \times 9 + 12 = 55{,}308$
- $1024 \times 18 \times 9 + 18 = 165{,}906$
- $512 \times 18 \times 9 + 18 = 82{,}962$
- $256 \times 18 \times 9 + 18 = 41{,}490$
- $(256 \times 12 \times 9 + 12) \times 2 = 55{,}320$

→ 합계 $400{,}986$. 출력값과 정확히 맞습니다.

91클래스 헤드의 약 <u>**30분의 1**</u>입니다. SSD300 전체 파라미터(35,641,826개)의 3분의 1 이상이 91클래스 분류 헤드였던 셈이니, 3클래스 과제에 91클래스 헤드를 들고 다니는 건 꽤 큰 낭비였네요.

## 6. 함정 하나 더: 아무것도 안 얼렸는데 이미 얼어 있다

헤드 교체를 마치고 Feature Extraction(backbone은 얼리고 head만 학습) 설정을 하려고 파라미터를 세다가, 이상한 숫자를 하나 발견했습니다.

```python
default_frozen = sum(p.numel() for p in model.parameters() if not p.requires_grad)
print(f"torchvision 기본 상태에서 이미 얼어 있는 파라미터: {default_frozen:,}")
```

```text
torchvision 기본 상태에서 이미 얼어 있는 파라미터: 38,720
```

저는 아무것도 얼리지 않았는데, 이미 <u>**38,720개의 파라미터가 `requires_grad=False`**</u>였습니다. 이번에도 `ssd300_vgg16()` 본문에 답이 있었습니다.

```python
trainable_backbone_layers = _validate_trainable_layers(
    weights is not None or weights_backbone is not None, trainable_backbone_layers, 5, 4
)
...
backbone = _vgg_extractor(backbone, False, trainable_backbone_layers)
```

사전학습 가중치를 쓰면 `trainable_backbone_layers`의 기본값이 **4**가 됩니다. VGG16의 5개 블록 중 <u>**뒤쪽 4개만 학습하고, 첫 번째 블록은 얼린다**</u>는 뜻입니다. 실제로 얼리는 코드는 `_vgg_extractor`에 있습니다.

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

한 단계씩 따라가 보면,

1. VGG16 `features`에서 MaxPool의 위치는 `[4, 9, 16, 23, 30]`입니다.
2. 마지막 하나를 빼고 앞에 0을 붙이면 `stage_indices = [0, 4, 9, 16, 23]`, 블록 5개입니다.
3. `trainable_layers = 4`이면 `freeze_before = stage_indices[5 - 4] = stage_indices[1] = 4`
4. `backbone[:4]` = conv1_1, ReLU, conv1_2, ReLU → 첫 번째 블록의 conv 2개가 얼어붙습니다.

파라미터 수로 검산하면,

- conv1_1: $3 \times 64 \times 9 + 64 = 1{,}792$
- conv1_2: $64 \times 64 \times 9 + 64 = 36{,}928$

→ 합계 $38{,}720$. 출력된 숫자와 정확히 같습니다.

이게 왜 함정이냐면, Full Fine-tuning(전체 학습)을 하려고 <u>**"아무것도 안 얼렸으니 전체가 학습되겠지"**</u>라고 생각하면, 사실은 첫 블록이 얼어 있는 상태로 학습하게 되기 때문입니다. FE와 FT를 비교하는 실험이라면 FT 쪽 설정이 조용히 틀어지는 거죠.

그래서 학습 범위를 정하는 함수는 <u>**모든 파라미터의 `requires_grad`를 명시적으로 지정**</u>하도록 짰습니다.

```python
def set_trainable_scope(model: SSD, scope: str) -> None:
    """scope에 따라 모든 파라미터의 requires_grad를 명시적으로 지정한다."""
    if scope not in ("head", "all"):
        raise ValueError(f"unknown trainable scope: {scope}")
    for parameter in model.parameters():
        parameter.requires_grad_(scope == "all")   # 1. 일단 전부 끄거나(FE) 전부 켠다(FT)
    if scope == "head":
        for parameter in model.head.parameters():
            parameter.requires_grad_(True)          # 2. FE면 head만 다시 켠다
```

FE 설정을 적용한 결과는 이렇습니다.

| component | params | trainable | trainable % |
| --- | --- | --- | --- |
| backbone | 22,943,936 | 0 | 0.0 |
| head.regression_head | 534,648 | 534,648 | 100.0 |
| head.classification_head | 400,986 | 400,986 | 100.0 |
| total | 23,879,570 | 935,634 | 3.9 |

전체의 3.9%만 학습합니다.

> 🤔 **backbone을 얼리면 BatchNorm은 괜찮나요?**
>
> `requires_grad=False`는 가중치의 gradient만 막을 뿐, BatchNorm의 running mean/var는 `model.train()` 상태에서 계속 갱신됩니다. 그래서 BN이 있는 backbone이라면 BN 층을 따로 `eval()`로 고정해야 합니다.
>
> 다행히 <u>**VGG16에는 BatchNorm이 없습니다.**</u> 그래서 이번 모델은 `model.train()`만 호출해도 backbone이 진짜로 고정됩니다.

## 7. 그래서 코드는 어떻게 씀?

정리하면, COCO 사전학습 SSD300을 다른 클래스 수로 전이학습할 때의 순서는 이렇습니다.

```python
# 1. COCO 가중치로 91클래스 모델을 그대로 만든다 (num_classes를 넘기면 ValueError)
model = ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1)

# 2. SSD.__init__과 같은 방법으로 헤드 인자를 구해 분류 헤드만 새로 만든다
in_channels = detection_utils.retrieve_out_channels(model.backbone, (300, 300))
num_anchors = model.anchor_generator.num_anchors_per_location()
model.head.classification_head = SSDClassificationHead(in_channels, num_anchors, num_classes=3)

# 3. 학습 범위를 모든 파라미터에 대해 명시적으로 지정한다 (기본값으로 conv1 블록이 얼어 있음)
set_trainable_scope(model, "head")

# 4. device로 옮긴다
model.to(device)

# 5. 출력 shape로 교체를 검증한다
check_head_output_shapes(model, num_classes=3, image_size=300, expected_num_anchors=8732)

# 6. 학습 대상 파라미터만 optimizer에 넘긴다
optimizer = torch.optim.SGD([p for p in model.parameters() if p.requires_grad], lr=2e-3, momentum=0.9, weight_decay=5e-4)
```

> 💡 **순서가 중요합니다.**
>
> 헤드 교체는 반드시 `model.to(device)`와 optimizer 생성 **전에** 해야 합니다.
>
> - `to(device)` 뒤에 교체하면 새 헤드만 CPU에 남아, 첫 forward에서 device 불일치 에러가 납니다.
> - optimizer를 만든 뒤에 교체하면 더 조용히 망가집니다. optimizer는 **옛 헤드**의 파라미터를 들고 있어서, 새 헤드는 gradient를 받기만 하고 영영 갱신되지 않습니다. 이번에도 에러는 나지 않습니다.

`num_classes` 속성 하나 바꾸는 한 줄이 왜 효과가 없는지 따라가다 보니, 클래스 수가 conv 가중치의 모양에 박혀 있다는 것, SSD 본체는 그 모양에서 클래스 수를 읽어 간다는 것, 그래서 헤드만 바꾸면 나머지가 따라온다는 것까지 근거를 세울 수 있었습니다. <u>**모델을 전이학습시킬 때는 모델의 구조를 이해함과 동시에 그게 코드로 어떻게 구현되어 있는지 따라가면서 검증해보는 습관이 중요하다는 걸 알게 된 경험**</u>이었습니다.

## 📚 참고자료

- [SSD: Single Shot MultiBox Detector](https://arxiv.org/abs/1512.02325) — Liu et al., 2016
- [torchvision `ssd.py` 소스 코드](https://github.com/pytorch/vision/blob/main/torchvision/models/detection/ssd.py)
- [torchvision `detection/_utils.py` 소스 코드](https://github.com/pytorch/vision/blob/main/torchvision/models/detection/_utils.py) — `retrieve_out_channels`
- [torchvision 공식 문서: ssd300_vgg16](https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.detection.ssd300_vgg16.html)
- [TorchVision Object Detection Finetuning Tutorial](https://docs.pytorch.org/tutorials/intermediate/torchvision_tutorial.html)
- :github: [실험 코드 레포지토리](https://github.com/raewoo0908/codeit_face_obj_detection/blob/main/experiment.ipynb)
