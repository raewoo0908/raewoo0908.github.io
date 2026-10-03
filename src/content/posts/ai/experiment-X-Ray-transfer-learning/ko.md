---
title: ":ai: 전이학습 데이터 전처리 전략의 근거를 EDA로 세워보자"
date: 2026-10-03T01:00:00+09:00
description: "흉부 X-Ray 폐렴 분류 모델을 전이학습하기 전에, EDA로 데이터의 분포와 특징을 살펴보고 어떤 전처리를 비교 실험할지 정했습니다."
tags: [AI, ComputerVision, TransferLearning, EDA, X-Ray, CLAHE, PyTorch]
draft: false
---
## 0. 들어가며

CodeIt AI 엔지니어 과정에서 흉부 X-Ray 사진을 바탕으로 폐렴 환자를 구분하는 실습을 진행했습니다. <u><strong>이번 미션의 목표는 X-Ray 사진을 입력으로 받아 폐렴 여부를 구분하는 분류(Classification) 모델을 만드는 것</strong></u>입니다. 저는 이를 위해 ImageNet으로 사전학습된 이미지 분류 모델을 X-Ray 사진으로 전이학습시켜서 진행하고자 했습니다.

> **사용한 데이터**
>
> :kaggle: [Kaggle Chest X-Ray Images (Pneumonia)](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia)

> **EDA 코드**
>
> :github: [GitHub 레포지토리](https://github.com/raewoo0908/codeit_finetuning_for_x_ray/blob/main/eda.ipynb)

하지만 데이터를 그대로 모델 훈련에 사용해서는 안 됩니다. <u><strong>반드시 데이터가 어떤 분포를 갖고 있고, 어떤 특징을 갖고 있는지 파악한 후에, 적절한 전처리 전략을 적용해서 학습에 사용하는 것이 필요합니다.</strong></u> 모델 학습을 성공적으로 이끌기 위해서는 데이터의 품질이 아주 중요하기 때문입니다.

전체적인 단계는 다음 순서로 이루어집니다.

> 📌 **EDA 진행 순서**
>
> 1. **클래스 비율 확인**
>    - **목적**
>      - 데이터 클래스가 각 train/val/test 데이터셋에 고루 분포되어 있는지 확인하고, 데이터 전처리 시에 증강 기법 적용의 필요성을 검토합니다.
>      - 모델이 모두 PNEUMONIA라고 찍었을 때의 기준선을 확인합니다.
>      - val/test의 데이터 양이 충분히 확보되어 있는지 확인하고, 데이터셋 재분할의 필요성을 검토합니다.
>      - 데이터셋 재분할이 필요하다고 판단되면 재분할 비율과 그룹 기준까지 결정합니다.
> 2. **이미지 육안 확인**
>    - **목적**
>      - split별, 클래스별 이미지를 육안으로 확인해서 특징을 직접 살펴봅니다.
> 3. **이미지 크기와 채널 확인**
>    - **목적**
>      - ImageNet으로 학습된 모델에 사진을 그대로 넣을 수 있을지, 데이터 크기와 채널을 하나로 맞추는 전처리의 필요성, 후보와 trade-off를 검토합니다.
>      - 평활화 기법(CLAHE) 적용의 필요성을 검토합니다.
> 4. **이미지 상세 분석**
>    - **목적**
>      - ImageNet은 컬러 이미지로, 3채널 픽셀 값이 서로 다릅니다. 반면 X-ray는 흑백입니다. ImageNet 통계와 데이터셋 자체 통계 중 무엇으로 정규화할지 결정합니다.
> 5. **중복 이미지 점검**
>    - **목적**
>      - train/val/test에 완전히 중복되는 이미지가 있는지 확인하고, 중복제거 기준을 수립합니다.
> 6. **중복 환자 점검**
>    - **목적**
>      - train/val/test에 동일한 환자의 X-ray 사진이 나뉘어 들어가면 데이터 누수의 위험이 있을 수 있습니다. 이 위험성이 실재하는지 점검합니다.

## 1. 클래스 분포: 절대 도수와 비율 확인

우선 각 split에 각 클래스가 어떤 비율로 분포해 있는지 확인해봤습니다.


|           | **count**  |               | **ratio**  |               |
| --------- | ---------- | ------------- | ---------- | ------------- |
| **split** | **NORMAL** | **PNEUMONIA** | **NORMAL** | **PNEUMONIA** |
| train     | 1341       | 3875          | 0.257      | 0.743         |
| val       | 8          | 8             | 0.500      | 0.500         |
| test      | 234        | 390           | 0.375      | 0.625         |


![split별 클래스 개수와 비율 — train은 PNEUMONIA 74.3%, val은 8장씩, test는 PNEUMONIA 62.5%](./image/class-distribution-per-split.png)

![split별 이미지 수 — train 5216장(89.1%), val 16장(0.27%), test 624장(10.7%)](./image/images-per-split.png)

몇 가지 문제가 발견되었습니다.

1. **split이 불균형하게 되어 있었습니다.** 특히, validation split의 데이터가 16개밖에 되지 않았습니다.
2. split마다 **클래스 불균형**이 심각했습니다.
   - train+val
     - NORMAL : PNEUMONIA ≈ 3:7
   - test
     - NORMAL : PNEUMONIA ≈ 0.4:0.6

또한, 모든 예측을 PNEUMONIA라고 했을 때의 성능 베이스라인을 측정했습니다.


| **split** | **accuracy** | **precision** | **recall** | **f1** |
| --------- | ------------ | ------------- | ---------- | ------ |
| train     | 0.743        | 0.743         | 1.0        | 0.852  |
| val       | 0.500        | 0.500         | 1.0        | 0.667  |
| test      | 0.625        | 0.625         | 1.0        | 0.769  |


따라서, 다음과 같이 **결론**을 내렸습니다.

1. <u><strong>train과 val을 합쳐서 9:1 비율로 다시 split</strong></u>합니다. train+val : test ≈ 9:1이기 때문입니다.
2. `DataLoader`에서 `WeightedRandomSampler`<u><strong>를 활용해 클래스 불균형을 완화</strong></u>합니다.

## 2. 실제 이미지 육안 확인

데이터를 통계적으로 보는 것도 중요하지만, 특히 이미지 데이터의 경우 육안으로 확인하는 작업이 필수적입니다.

![split × 클래스별 무작위 샘플 X-Ray 이미지와 각 이미지의 크기·채널 모드](./image/random-samples-per-split-class.png)

split별로, 그리고 클래스별로 이미지의 모습을 육안으로 확인해보니, 몇 가지 발견이 있었습니다.

- 사진에 L/R 마커와 의료장비로 추정되는 흰색 선이 보였습니다.
- 이미지의 종횡비 차이가 많이 났습니다.

여기서 몇 가지 **신경 써야 할 점**을 얻을 수 있었습니다.

- <u><strong>L/R 마커, 의료장비 선</strong></u>이 학습에 영향을 줄 수 있습니다.
- <u><strong>클래스 간의 종횡비 차이</strong></u>가 유의미하다면, 이 차이가 학습에 영향을 줄 수 있습니다.

## 3-1. split별 이미지 크기, 종횡비 분포

만약 train/val/test별로 이미지 크기와 종횡비 분포가 다르다면 검증 성능을 온전히 믿을 수 없을 수도 있습니다. 따라서 split별로 이미지 크기와 종횡비에 차이가 있는지 확인해봤습니다.

![split별 width·height·종횡비 분포 히스토그램과 width-height 산점도](./image/size-aspect-per-split.png)


|        | 대푯값 | **train** | **val** | **test** |
| ------ | --- | --------- | ------- | -------- |
| width  | min | 384.00    | 968.00  | 728.00   |
|        | 5%  | 840.00    | 1004.00 | 889.20   |
|        | 50% | 1284.00   | 1280.00 | 1265.00  |
|        | 95% | 1928.00   | 1746.00 | 2224.50  |
|        | max | 2916.00   | 1776.00 | 2752.00  |
| height | min | 127.00    | 592.00  | 344.00   |
|        | 5%  | 504.00    | 640.00  | 537.20   |
|        | 50% | 888.00    | 996.00  | 870.50   |
|        | 95% | 1670.00   | 1416.00 | 1914.65  |
|        | max | 2663.00   | 1416.00 | 2713.00  |
| aspect | min | 0.84      | 1.12    | 0.93     |
|        | 5%  | 1.10      | 1.18    | 1.13     |
|        | 50% | 1.41      | 1.36    | 1.45     |
|        | 95% | 1.87      | 1.66    | 1.86     |
|        | max | 3.38      | 1.73    | 2.58     |


**분석 결과**

- 전체의 5% 미만이 종횡비 1.10 미만입니다. <u><strong>즉</strong></u>, <u><strong>전체의 95%가 가로 &gt; 세로</strong></u>입니다.
- 종횡비는 train, val, test에 걸쳐 비슷합니다. split에 따른 종횡비 차이는 없었습니다. <u><strong>따라서 종횡비 때문에 split을 다시 할 필요는 없습니다.</strong></u>

## 3-2. 클래스별 이미지 크기, 종횡비 분포

하지만 클래스별로 이미지의 크기 차이나 종횡비 차이가 크면, 그것을 각 클래스의 특징이라고 모델이 잘못 학습할 수도 있습니다. 따라서 클래스별로 이미지 크기와 종횡비에 유의미한 차이가 있는지 확인해봤습니다.

![클래스별 width·height·종횡비 박스플롯과 클래스별 width-height 산점도](./image/size-aspect-per-class.png)


|       | **class** | **width median** | **height median** | **aspect median** |
| ----- | --------- | ---------------- | ----------------- | ----------------- |
| train | NORMAL    | 1640.0           | 1328.0            | 1.22              |
|       | PNEUMONIA | 1168.0           | 776.0             | 1.49              |
| val   | NORMAL    | 1446.0           | 1164.5            | 1.22              |
|       | PNEUMONIA | 1172.0           | 788.0             | 1.50              |
| test  | NORMAL    | 1762.0           | 1317.5            | 1.35              |
|       | PNEUMONIA | 1111.0           | 736.0             | 1.51              |


**분석 결과**

- <u><strong>PNEUMONIA</strong></u>가 NORMAL에 비해 <u><strong>종횡비가 큽니다.</strong></u>
- <u><strong>PNEUMONIA</strong></u>가 NORMAL에 비해 width도 작고, height도 더 작습니다. 즉, <u><strong>크기가 더 작습니다.</strong></u>
- 이미지 크기를 하나로 통일하지 않는 경우, 이미지의 특징이 아니라 **크기를 근거로 예측할 위험이 있을 것으로 예상됩니다. 따라서 클래스 간의 크기 차이가 나지 않도록** <u><strong>이미지 크기를 맞추는 전처리를 고려해야 합니다.</strong></u>

## 3-3. 클래스별/split별 채널 분포

X-Ray 사진은 일반적으로 흑백사진으로, 1채널로 구성되어 있습니다. 하지만 언제든 예외는 있을 수 있으므로 채널의 분포 또한 꼭 확인해야 합니다.

![split × 클래스별 채널 모드 개수 — RGB 283장은 모두 train/PNEUMONIA](./image/channel-mode-count.png)

**분석 결과**

- <u><strong>train PNEUMONIA 클래스에만 3채널 이미지들이 100%</strong></u> 몰려 있습니다.
- **따라서 채널을 통일하지 않으면 모델이 채널이 3개라는 이유로 PNEUMONIA 클래스라고 예측할 위험이 있습니다.** <u><strong><em>채널을 1개 또는 3개로 무조건 통일해야 합니다.</em></strong></u>

## 3-4. 3채널 이미지의 채널 간 픽셀값 동일 여부

흑백임에도 불구하고 3채널 이미지가 있음을 확인했습니다. 따라서 이걸 1채널로 합친다고 결정했을 때, 그대로 합칠 수 있을지, 아니면 변환 알고리즘을 사용해야 하는지 판단해야 합니다. 그래서 3채널 각각에 동일한 픽셀 밝기가 들어 있는지 확인해보았습니다.

![채널 차이가 가장 큰 RGB 이미지의 R·G·B 채널과 |R-G| 차이(최대 0)](./image/rgb-channel-difference.png)


| **split** | **cls**   | **n** | **all\_equal** | **diff\_max** | **diff\_median** |
| --------- | --------- | ----- | -------------- | ------------- | ---------------- |
| train     | PNEUMONIA | 283   | 283            | 0             | 0.0              |


**분석 결과**

- 283건 모든 3채널 이미지의 각 채널 밝기가 동일했습니다.
- <u><strong>따라서 3채널을 1채널로 합치거나, 1채널을 3채널로 복사해서 확장하는 데 무리가 없습니다.</strong></u>

## 3-5. 이미지 크기 통일, 채널 통일 전략별 예시

3-1에서 3-4에 걸쳐서 이미지 크기와 채널을 통일해야 할 필요성을 논의했습니다. 그러면 여러 이미지 크기 통일 및 채널 통일 기법의 변환 예시를 눈으로 직접 확인해보고, 손실되는 정보가 있는지 확인해보고자 했습니다.

![극단적 종횡비 이미지에 squash resize, short-side 224 center crop, keep ratio + pad를 적용한 비교](./image/resize-strategies.png)

전이학습 대상 이미지의 크기를 사전학습 데이터인 ImageNet 기준으로 (224,224)로 통일한 예시입니다. squash-resize, short-side center crop, keep ratio+pad 세 방식을 서로 비교했습니다.

- **squash resize**: 제일 단순한 방법입니다. 하지만 우리는 종횡비가 다양한 사진을 쓰기 때문에, 단순 <u><strong>squash resize는 이미지에 왜곡</strong></u>을 준다는 점이 우려되었습니다.
- **short-side 224 crop**: 세로로 긴 사진은 폐의 모든 영역이 고루 crop됩니다. 하지만 가로로 긴 사진은 <u><strong>폐 가장자리의 정보가 심하게 소실</strong></u>되는 경향이 있다는 점이 우려되었습니다.
- **keep ratio+pad**: 원본 이미지의 비율이 유지되면서 주변이 검정색으로 채워지는 방식입니다. 어차피 X-Ray는 가장자리가 검정색이므로, 가장 손해가 적을 것 같았습니다. 하지만 <u><strong>L/R 마커나 심전도 선과 같은 노이즈가 그대로 남는다는 점</strong></u>이 우려되었습니다.

### 3-5-1. UNet 활용 bbox crop

squash-resize, short-side center crop, keep ratio+pad 세 대안이 모두 우려되는 점이 있었습니다. 그래서 수업 시간에 강사님께서 언급하셨던, <u><strong>폐 영역 bbox를 추론한 다음 그걸 기준으로 crop하는 방식</strong></u> 도입을 고려해보았습니다.

> **UNet 학습 코드와 데이터**
>
> :github: [GitHub 레포지토리](https://github.com/raewoo0908/codeit_finetuning_for_x_ray/blob/main/unet_lung_seg.ipynb)

![train/NORMAL 이미지에 UNet 폐 마스크(빨강)와 crop bbox(노랑)를 그린 결과](./image/unet-bbox-normal.png)

NORMAL 폐를 기준으로는 폐와 갈비뼈 부분을 아주 잘 crop하는 것을 볼 수 있습니다.

![train/PNEUMONIA 이미지에 UNet 폐 마스크와 crop bbox를 그린 결과 — 일부는 폐를 작게 잡거나 한쪽 폐만 잡음](./image/unet-bbox-pneumonia.png)

하지만 PNEUMONIA 폐를 기준으로는 bbox 성능이 매우 떨어짐을 확인했습니다. 특히 (0,0) 위치에 있는 사진을 주목해주세요. 폐렴으로 인해 폐에서 어두운 부분이 아주 조금 남아 있는 케이스입니다. 이 경우에는 폐를 아주 조그맣게 인식해서 <u><strong>폐의 대부분 영역이 잘려나가는 현상</strong></u>이 발견되었습니다.

그리고 가장 아랫줄의 하늘색 영역으로 그려진 사진을 주목해주세요. 이 케이스는 폐렴으로 인해 한쪽 폐가 완전히 뿌옇게 변하고, 나머지 한쪽 폐만 어두운 케이스입니다. 이런 경우에는 UNet 모델이 <u><strong>남아 있는 한쪽 폐만을 폐라고 인식</strong></u>한 점을 알 수 있습니다.

**결론**

- UNet Image Segmentation 추론을 통한 폐 영역 crop은 오히려 <u><strong>데이터의 품질을 완전히 해칠 수 있습니다.</strong></u>
- 이는 bbox crop 방식 자체의 문제가 아니라, <u><strong>U-Net 모델 학습 데이터와 학습 품질의 문제</strong></u>로 판단했습니다. UNet 모델 학습에 사용한 데이터가 성인 정상 폐 기준이었다는 점이 핵심 원인으로 우려됩니다.
- UNet을 사용한 bbox 검출 crop 방식은 이에 작용할 수 있는 변수가 너무 많다는 점이 가장 큰 우려였습니다. UNet을 전이학습한 데이터셋의 퀄리티와 그 학습 방법 퀄리티가 본 실험 대상 데이터셋 퀄리티에 너무 큰 영향을 줍니다. 따라서 <u><strong>UNet을 이용한 데이터 전처리는 데이터셋의 차이로 비교되지 않고, UNet 성능의 차이로 비교될 여지가 있습니다.</strong></u>
- 따라서 이번 비교 실험을 위한 후보군에 두지 않는 것이 좋다고 판단했습니다.
- 결론적으로, short-side center crop은 이미지를 잘라내는 방식이라 가로가 긴 사진에서 정보가 손실되는 문제가 있으므로, <u><strong>squash-resize와 keep ratio+pad 두 방식을 후보로 데이터셋 비교 실험</strong></u>을 할 가치가 있다고 판단했습니다.

## 3-6. 이미지별 밝기 평균, 표준편차 분포

한 이미지의 밝기 평균과 표준편차는 곧 <u><strong>한 이미지의 평균 노출(Exposure)과, 그 이미지의 대비(Contrast)</strong></u>를 의미합니다. 즉 다음과 같이 정리할 수 있습니다.

> - mean이 높으면 ➡ 이미지 전체의 노출(exposure)이 높습니다. 밝아 보입니다.
> - std가 높으면 ➡ 이미지 전체의 대비(contrast)가 높습니다. 뼈와 폐가 뚜렷이 갈립니다.
> - mean ↑ std ↓ ➡ 이미지가 전체적으로 밝고 뿌옇습니다.
> - mean ↑ std ↑ ➡ 이미지가 전체적으로 밝지만 구분은 잘 됩니다.
> - mean ↓ std ↓ ➡ 이미지가 전체적으로 어둡고 구분이 잘 안 됩니다.
> - mean ↓ std ↑ ➡ 이미지가 전체적으로 어둡지만 구분은 잘 됩니다.

만약 이미지 노출과 대비가 적절하지 않다면, 모델이 엉뚱한 특징을 학습할 수도 있습니다. 특히 클래스별로 노출/대비 차이가 극명하다면, 이를 보정할 필요가 있습니다.


|           | **cls** | **NORMAL** | **PNEUMONIA** |
| --------- | ------- | ---------- | ------------- |
| img\_mean | count   | 1583.000   | 4273.000      |
|           | mean    | 0.481      | 0.482         |
|           | std     | 0.053      | 0.078         |
|           | min     | 0.287      | 0.230         |
|           | 5%      | 0.394      | 0.347         |
|           | 50%     | 0.480      | 0.482         |
|           | 95%     | 0.574      | 0.608         |
|           | max     | 0.665      | 0.869         |
| img\_std  | count   | 1583.000   | 4273.000      |
|           | mean    | 0.240      | 0.217         |
|           | std     | 0.023      | 0.039         |
|           | min     | 0.130      | 0.080         |
|           | 5%      | 0.202      | 0.155         |
|           | 50%     | 0.241      | 0.215         |
|           | 95%     | 0.276      | 0.284         |
|           | max     | 0.326      | 0.343         |


![클래스별 이미지 표준편차 히스토그램과 이미지 평균-표준편차 산점도(점선 = 5th 백분위수)](./image/per-image-std-and-mean.png)

![클래스별 전체 픽셀 밝기 분포와 split × 클래스별 이미지 평균 밝기 박스플롯](./image/pixel-intensity-distribution.png)


|       | **cls**   | 저대비 이미지 도수 |
| ----- | --------- | ---------- |
| train | NORMAL    | 2          |
|       | PNEUMONIA | 279        |
| test  | NORMAL    | 1          |
|       | PNEUMONIA | 11         |


> 이미지 밝기의 표준편차가 5번째 백분위수 이하라면, 저대비 이미지라고 판단했습니다.

**분석 결과**

- 히스토그램: NORMAL은 0.24 근처에 좁고 높게 몰려 있고, PNEUMONIA는 왼쪽으로 밀려 있으면서 넓게 퍼져 있습니다. <u><strong>PNEUMONIA 안에서도 사진마다 대비가 크게 다르다는 뜻이고, 폐렴 하나로 설명하기에는 편차가 큽니다.</strong></u>
- 산점도: 점선(5th pct) 아래의 저대비 점들이 mean 0.3 부근(어둡게 뭉개짐)과 0.6 이상(밝게 뭉개짐) 양 끝에 모두 있습니다. 병변이 폐를 하얗게 만드는 방향은 한쪽인데 양쪽 극단에 다 있다는 건 <u><strong>노출 조건의 문제가 섞여 있다는 신호</strong></u>로 해석됩니다.
- Pixel Intensity distribution, box plot: <u><strong>클래스별로 밝기 차이는 없음</strong></u>을 확인했습니다.
- 또, RGB로 저장된 이미지들이 점선 아래(저대비)에 몰려 있습니다. 즉, 다른 환경에서 추출된 이미지들이 저대비로 추출되었다는, <u><strong>사진 수집 단계 자체에서의 결함이 있을 수 있다는 가능성</strong></u>이 있습니다.
- img\_std가 NORMAL 평균 0.240(표준편차 0.023), PNEUMONIA 평균 0.217(표준편차 0.039)입니다. PNEUMONIA의 퍼짐이 NORMAL의 약 1.7배입니다. img\_mean은 두 클래스 평균이 0.48로 같지만 PNEUMONIA의 양 끝(5% 0.347, 95% 0.608)이 더 넓습니다.
- <u><strong>저대비(low std) 293장 중 279장이 train/PNEUMONIA</strong></u>에 있습니다. NORMAL은 3장뿐입니다.

**결론**

- PNEUMONIA에만 있는 RGB 저장본과 극단적(매우 어둡거나 매우 밝은) 노출 이미지가 저대비를 만듭니다. <u><strong>모델이 이것을 "뿌옇거나 RGB 경로면 폐렴"이라는 지름길로 배울 수 있다는 우려</strong></u>가 있습니다.
- ImageNet 사전학습 필터는 경계·질감이 있는 입력에 맞춰져 있어, <u><strong>전체가 뭉개진 이미지에서는 폐 구조 특징을 제대로 뽑기 어려울 것으로 예상</strong></u>됩니다.
- 따라서 <u><strong>CLAHE를 통해 타일 단위로 뭉개진 이미지를 복원하는 작업</strong></u>을 시도할 가치가 있다고 판단했습니다.

**우려사항**

하지만 <u><strong>폐가 국소적으로 뿌옇게 변한 병변은 폐렴의 주요 특징 중 하나</strong></u>입니다. 만약 이런 점을 무시하고 CLAHE 평활화를 진행하면 미세한 밝기나 대비 차이가 사라져서 오히려 부작용이 생길 수도 있다고 생각했습니다. 그래서 CLAHE로 평활화를 실제로 진행해서 Before와 After를 비교해봤습니다.

![저대비 이미지 4장의 원본과 CLAHE 적용 결과, 그리고 픽셀 히스토그램 비교](./image/clahe-low-contrast-examples.png)

![CLAHE 적용 전후 클래스별 이미지 표준편차 분포](./image/std-before-after-clahe.png)

**분석 결과**

- 저대비 사진에서는 폐뿐 아니라 뼈, 배경, 쇄골까지 함께 뿌옇거나 어둡습니다. <u><strong>CLAHE 후에는 갈비뼈와 폐 음영이 다시 구분되는 것을 확인</strong></u>했습니다.
- 하지만 person636\_bacteria\_2527.jpeg를 보면, <u><strong>CLAHE 후 연부조직과 폐 안쪽에 자글자글한 노이즈</strong></u>가 두드러져 보입니다. 모델이 이 노이즈를 폐렴의 특징으로 배울 수 있다는 우려도 보였습니다.
- 또, person1413\_bacteria\_3615.jpeg를 보면, 원본에서 폐 전체가 하얗게 뿌옇던 것이 CLAHE 후에는 늑골 사이가 어둡게 갈라져 NORMAL과 비슷한 인상이 됩니다. <u><strong>뿌옇게 보이는 것이 진짜 병변이었다면 CLAHE가 그 신호를 지운 것입니다.</strong></u>
- 또, 마지막 BEFORE/AFTER 히스토그램을 보면, 두 클래스의 중심 위치 차이는 거의 그대로지만, PNEUMONIA의 왼쪽 꼬리(0.10\~0.15)가 사라지고 분포 폭이 좁아졌습니다. 클래스 간 **평균 차이는 유지**되었지만 PNEUMONIA 내부의 **대비 다양성은 줄었다는 것을 뜻합니다**.
- 이 특징만으로는 CLAHE가 이미지 자체의 결함을 지운 건지, 폐렴의 신호를 지운 건지 판단할 수 없습니다. 대비 다양성이 줄어든 것이 결함의 제거일 수도 있고, 폐렴 신호의 손실일 수도 있다는 것이고, 대비 평균이 유지되었다는 것도 결함이 남아 있다는 뜻일 수도, 폐렴 신호가 보존된 것일 수도 있다는 겁니다.

**결론**

CLAHE는 시도할 가치는 있지만, 우려되는 부작용이 있으니, 데이터셋 구성 후보 중 하나로 선정해 <u><strong>CLAHE를 적용한 데이터셋과 적용하지 않은 데이터셋의 성능을 실험</strong></u>해보는 게 필요하다고 결론지었습니다.

## 4. 데이터셋 통계 VS ImageNet 통계

이미지 픽셀을 [0,1]로 스케일링한 다음, 정규화 작업을 거쳐야 합니다. 이때, ImageNet 통계와 데이터셋 자체 통계 중 무엇으로 정규화할지 결정해야 합니다. 만약 둘의 분포가 차이가 크다면 둘을 비교 실험할 가치가 있다고 생각했습니다.

![train 픽셀 분포와 데이터셋·ImageNet 정규화 통계, 그리고 각 정규화 후의 픽셀 분포](./image/normalization-statistics.png)


|                       | **mean** | **std** |
| --------------------- | -------- | ------- |
| dataset (train, gray) | 0.4875   | 0.2456  |
| dataset (all, gray)   | 0.4874   | 0.2454  |
| ImageNet (RGB avg)    | 0.4490   | 0.2260  |
| ImageNet R            | 0.4850   | 0.2290  |
| ImageNet G            | 0.4560   | 0.2240  |
| ImageNet B            | 0.4060   | 0.2250  |


**분석 결과**

- 좌: 학습 대상 데이터셋의 밝기 평균이 더 밝은 편입니다.
- 우: 원본 이미지의 픽셀 분포를 ImageNet 기준으로 정규화하면 분포가 밝은 쪽으로 약 +0.17 치우칩니다.

**결론**

**두 정규화 방식의 차이가 작습니다. ImageNet 통계를 기준으로 정규화 후에 평균은 0.17, 표준편차는 1.09로, 데이터셋 통계 기준으로 정규화를 했을 때와 별 차이가 나지 않습니다.** <u><strong>무엇으로 정규화해도 영향이 없을 것으로 판단했고, 따라서 사전학습 가중치와의 일관성을 고려해서 ImageNet 통계를 기준으로 정규화하기로 결정했습니다.</strong></u>

## 5. 완전 중복 이미지 확인

만약 train과 val/test에 중복 이미지가 존재한다면, 이는 일종의 데이터 누수로 볼 수 있을 것입니다. 또한, val 또는 test에 같은 이미지가 여러 장 존재한다면, 이는 올바른 검증이 아니게 됩니다. <u><strong>한 문제를 맞혔는데 여러 문제를 맞힌 꼴이 되고, 한 문제를 틀렸는데 여러 문제를 틀린 꼴이 되기 때문입니다.</strong></u>

![split 간 픽셀 해시 중복 쌍 히트맵 — train 내부 28, test 내부 6, split 간 0](./image/duplicate-pairs-heatmap.png)

완전히 동일한 이미지는 train 안에 28장, test 안에 6장 있고, split 간 중복은 없습니다. 따라서 데이터 누수는 없습니다.

![train/PNEUMONIA 안에서 픽셀이 완전히 같은 중복 이미지 쌍 예시](./image/duplicate-pair-examples.png)

해시 기준으로 일치하는 이미지를 육안으로 확인해봤습니다.

**결론**

- train set 내 중복은 단순한 중복입니다. 전체 데이터 개수를 기준으로 봤을 때, 28장만 중복이라는 것은 영향이 없을 것으로 판단됩니다. 단순히 에폭 몇 번 더 돈 셈이라고 판단해서 제거하지 않기로 결정했습니다.
- 하지만 <u><strong>test set 내 중복은 하나만 남기고 지워야 합니다.</strong></u>

## 6. train 내 사람별 이미지 수 분포

1절에서 train+val로 합친 다음에 다시 나누어야 한다고 결론을 내린 적이 있습니다. 하지만 데이터를 나눌 때 <u><strong>같은 사람의 X-Ray 사진이 train과 val에 동시에 들어가면 일종의 데이터 누수</strong></u>라고 볼 수 있습니다. 따라서 사람별 이미지 수 분포를 확인해보고자 했습니다.

![train/PNEUMONIA에서 person id당 이미지 수 분포 — 최대 30장](./image/images-per-person.png)

**분석 결과**

이미지 제목을 기준으로 봤을 때, 한 사람이 최대 30장까지 찍은 경우가 있습니다.

<u><strong>하지만, 이미지 제목에 있는 person#이 같다고 해서, 그것이 한 사람이 찍은 사진이라고 판단할 수 있을까요?</strong></u>


| **split** | **cls**   | **pattern**             | **n** |
| --------- | --------- | ----------------------- | ----- |
| train     | NORMAL    | IM-#-#-#.jpeg           | 80    |
|           |           | IM-#-#.jpeg             | 517   |
|           |           | NORMAL#-IM-#-#-#.jpeg   | 53    |
|           |           | NORMAL#-IM-#-#.jpeg     | 691   |
|           | PNEUMONIA | person#*bacteria*#.jpeg | 2530  |
|           |           | person#*virus*#.jpeg    | 1344  |
|           |           | person#*virus*#\_#.jpeg | 1     |
| val       | NORMAL    | NORMAL#-IM-#-#.jpeg     | 8     |
|           | PNEUMONIA | person#*bacteria*#.jpeg | 8     |
| test      | NORMAL    | IM-#-#-#.jpeg           | 4     |
|           |           | IM-#-#.jpeg             | 65    |
|           |           | NORMAL#-IM-#-#-#.jpeg   | 6     |
|           |           | NORMAL#-IM-#-#.jpeg     | 159   |
|           | PNEUMONIA | person#*bacteria*#.jpeg | 242   |
|           |           | person#*virus*#.jpeg    | 148   |


이미지 제목은 위와 같이 구성되어 있습니다. NORMAL에는 person#이 없고, 오직 PNEUMONIA에만 있습니다.

![split별 PNEUMONIA person id 분포 — train과 test의 번호 구간이 겹침](./image/person-id-by-split.png)

또한, train, test 간에 겹치는 번호도 많이 있었습니다.


|      | **split** | **cls**   | **filename**              | **width** | **height** | **pixel\_md5**                   |
| ---- | --------- | --------- | ------------------------- | --------- | ---------- | -------------------------------- |
| 2967 | train     | PNEUMONIA | person1\_bacteria\_1.jpeg | 712       | 439        | c901b203e2751964e5c3b89e35326617 |
| 2968 | train     | PNEUMONIA | person1\_bacteria\_2.jpeg | 1240      | 840        | 7f39f091cfb4237449423a515dd9e3a0 |
| 5719 | test      | PNEUMONIA | person1\_virus\_11.jpeg   | 872       | 560        | 2b8c531c86a4f2e37c76bb2979a593c9 |
| 5720 | test      | PNEUMONIA | person1\_virus\_12.jpeg   | 1080      | 624        | e34eb39a3de95c14aba2440cac26b09f |
| 5721 | test      | PNEUMONIA | person1\_virus\_13.jpeg   | 1136      | 654        | ca0fb78af19ebfce1f9152261d7bdb5d |
| 5722 | test      | PNEUMONIA | person1\_virus\_6.jpeg    | 944       | 640        | 97af9bb5486f4f0c5251438cca964d2a |
| 5723 | test      | PNEUMONIA | person1\_virus\_7.jpeg    | 1000      | 544        | a3f6886d7620627cedae843ce68dc21f |
| 5724 | test      | PNEUMONIA | person1\_virus\_8.jpeg    | 960       | 544        | a5f93650ed6a78dc4c70b57260089db9 |
| 5725 | test      | PNEUMONIA | person1\_virus\_9.jpeg    | 856       | 552        | 1b29e90e3bd3d7a5fd1783f0af93d51f |


또, 겹치는 person#의 이미지들을 md5 해시를 구해서 비교해봤습니다. train/test에 겹치는 person#은 170개였고, 그중 동일한 이미지는 하나도 없었습니다.

**결론**

- person#은 환자를 식별하는 번호라고 보기 어렵고, PNEUMONIA 클래스에 임의로 붙은 번호로 추정됩니다.
- train+val로 다시 train/val split을 진행할 때, <u><strong>person#을 고려 대상으로 넣지 않아도 됩니다.</strong></u>

## 7. 최종 결론

EDA 결과를 바탕으로 최종 모델 빌드 실험에서 적용할 점들에 대한 결론입니다.

1. train + val을 합쳐서 다시 나눠야 합니다.
   - 단, 종횡비는 고려할 필요가 없습니다.
   - person#도 고려할 필요가 없습니다.
2. test 세트 해시 기준 중복 데이터를 제거해야 합니다.
3. <u><strong>Resize 전략: squash resize VS keep ratio+pad 비교 실험을 진행합니다.</strong></u>
4. 채널 통일 전략: 3채널로 통일합니다.
   - 실험할 전이학습 전략을 Full VS Partial VS Feature Extraction으로 제한했습니다.
   - 따라서 사전학습 모델의 첫 번째 conv layer를 바꾸지 않고 보존하는 방향을 채택합니다.
5. <u><strong>CLAHE 적용: 적용 VS 미적용 비교 실험을 진행합니다.</strong></u>
6. 데이터 정규화: ImageNet 통계를 대상으로 진행합니다.

> ☺️ 다음 포스트는 <u><strong>ResNet, DenseNet, EfficientNet</strong></u> 세 모델 위에서 <u><strong>FeatureExtraction, Partial Fine-Tuning, Full Fine-Tuning</strong></u> 세 학습방법을 비교하고, <u><strong>CLAHE와 Resize 전략에서 유의미한 차이가 있었는지 비교하는 실험</strong></u>으로 돌아오겠습니다!

## 📚 참고자료
- :github: [EDA와 실험 코드 레포지토리](https://github.com/raewoo0908/codeit_finetuning_for_x_ray)