---
title: ":ai: Evaluation Metrics: Accuracy, Recall, Precision, F1-Score, AU-ROC"
date: 2026-10-05T19:39:00+09:00
description: "Using a defect-detecting robot as an example, we walk through classification metrics one by one — from accuracy, precision, recall, and F1-Score to the ROC Curve and AU-ROC."
tags: [AI, MachineLearning, Classification, Accuracy, Precision, Recall, F1Score, AUROC, ConfusionMatrix]
draft: false
---

## 0. Introduction

How can we judge the predictions a model produces? We need some kind of metric to evaluate the model's performance — just like taking an exam and counting how many of the questions we got right. That is called an <u>**evaluation metric**</u>, and it means <u>**a way of quantifying performance and expressing it as a single value**</u>.

An evaluation metric is not just a single score. There are many of them: <u>**Accuracy**</u>, <u>**Precision**</u>, <u>**Recall**</u>, <u>**F1-Score**</u>, <u>**AUROC**</u>, and more. Today we'll look at each of them, and at which metric to use when and where.

> **📌 NOTE**
>
> The material on Accuracy, Precision, Recall, and F1-Score is based on the blog post [Precision & Recall | F1-Score | AUROC : 일상 사례로 쉽게 이해하기](https://ffighting.net/deep-learning-basic/%eb%94%a5%eb%9f%ac%eb%8b%9d-%ed%95%b5%ec%8b%ac-%ea%b0%9c%eb%85%90/accuracy-precision-recall-f1score-auroc/). That blog has plenty of write-ups on deep learning fundamentals beyond this topic, so I recommend taking a look :)

## 1. Accuracy

Imagine we're on a manufacturing floor and want to buy a robot that automatically detects defective products. Our company places great weight on reliability, and holds the creed that not a single product reaching a customer may be defective. In the end, two robots made the shortlist.

![Normal/defect predictions and scoring for robots A and B on 5 products. Both robots have 60% accuracy](./image/robot-ab-accuracy.en.png)

The table above summarizes how the two robots, A and B, judged whether each of 5 products was normal or defective. Both robots got 2 of the 5 wrong and 3 right. Since both robots got 60% of all their predictions right, do they perform equally well? This score is called <u>**accuracy**</u>, and it means <u>**the proportion of correctly predicted samples among all predictions**</u>.

Had we adopted robot A, roughly one in five products could have reached a customer defective. Robot B, on the other hand, caught the defective product but flagged as many as two normal products as defective. Given our company's situation, which robot should we adopt?

## 2. Precision and Recall

What matters most to our company is not detecting normal products, but never mistaking a defective product for a normal one. So what if we focus on exactly that and build <u>**a metric that focuses only on defects**</u>? *Here, "defect" covers both cases: the product actually being defective, and the robot predicting it as defective.*

First, let's look at the products that are actually defective.

![Comparison focused on actually defective products. Robot A got 0 right for 0%, robot B got 1 right for 100%](./image/recall-actual-defect.en.png)

Robot A did not correctly flag even one of the actually defective products. Robot B, on the other hand, correctly predicted the one actually defective product as defective. In numbers, that's 0% for robot A and 100% for robot B.

Now let's focus only on the cases the robot predicted as defective.

![Comparison focused on products the robot predicted as defective. Robot A gets 0%, robot B gets 1 of 3 right for 33.3%](./image/precision-predicted-defect.en.png)

Of the products robot A predicted as defective, none were actually defective. Of the products robot B predicted as defective, only one was actually defective. In numbers, that's 0% for robot A and 33.3% for robot B.

The approach that focuses on "actual defects" like this is called Recall.

The approach that focuses on "predicted defects", on the other hand, is called Precision.

![Focusing on actual defects gives recall: correct count divided by the number of actual defects. Focusing on predicted defects gives precision: correct count divided by the number of predicted defects](./image/recall-precision-definition.en.png)

Mapping this onto the famous <u>**Confusion Matrix**</u>, it can be summarized as follows.

![Confusion matrix with the four cells TP, FN, FP, TN and the formulas for Sensitivity, Specificity, Precision, Negative Predictive Value, and Accuracy](./image/confusion-matrix.png)

> Sensitivity is used to mean the same thing as Recall.

## 3. F1-Score

<u>**Precision and Recall are in a trade-off relationship**</u>. When Precision goes up, Recall goes down, and when Recall goes up, Precision goes down.

$$
\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}
$$

$$
\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}
$$

It's like archery. The model is given a limited number of arrows and shoots them at a target split into four zones: $TP, FN, FP, TN$.

If many arrows land in $FN$, fewer arrows are left for $FP$, right? Then Recall can get smaller and Precision can get larger. Conversely, if many arrows land in $FP$, fewer are left for $FN$, and so Recall can get larger and Precision smaller.

> Of course, if many arrows land in $TP$ or $TN$, both go up. And then Accuracy goes up too.

That led to the following thought.

Since Precision and Recall trade off against each other, is there a metric that can embrace both? Looking closely, they share the same numerator but have different denominators. There's an averaging method that's perfect for exactly this situation: the harmonic mean.

$$
\text{F1-Score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} \\
 = \frac{2\text{TP}}{2\text{TP} + \text{FP} + \text{FN}}
$$

<u>**The metric that expresses Recall and Precision as their harmonic mean is called the F1-Score**</u>. If the model gets every question right without a single mistake ($FN = FP = 0$), the F1-Score is 1. The more mistakes it makes, the closer the F1-Score gets to 0.

### 3.1. Limitations of the F1-Score

We can now combine Recall and Precision and express performance as a single number, the F1-Score. So is everything fine now?

What if the model's "defect criterion" is very lenient, so it flags a product as defective at even the slightest flaw? Or what if the model's "defect criterion" is very strict, so it doesn't call most flaws defects?

![10 products sorted by defect score; products above the threshold are judged defective and those below it normal](./image/defect-score-threshold.en.png)

Suppose the robot company has some <u>**defect score**</u> that quantifies how defective a product is, and the model has its own <u>**Threshold**</u> for judging something defective. The robot assigns each product a defect score, sorts them, and judges the products whose defect score is higher than the threshold to be defective.

The problem here is that <u>**the F1-Score can change depending on the threshold**</u>. In other words, you can tune the threshold to look good on whatever score the company uses as its yardstick, producing a model that only looks good on the surface.

$$
\text{F1-Score}
 = \frac{2\text{TP}}{2\text{TP} + \text{FP} + \text{FN}}
$$

The F1-Score depends on TP and FN/FP, and all of these values change with the threshold. So if the threshold changes, the values that make up the confusion matrix — TP, TN, FP, and FN — will change too; then Precision and Recall change, and in turn the F1-Score changes as well. That's why <u>**a single F1-Score on its own can't tell you how good a model is**</u>. You always have to state the threshold alongside it.

So we came to <u>**need a single tool that represents a model's performance across every possible threshold**</u>.

## 4. AU-ROC

Is there a way to express performance across all thresholds as a single number? Since we're evaluating a defective-product classifier, we could <u>**simply plot Recall over every threshold**</u>. When the threshold is 0, Recall will be 1, because every product is judged defective. Conversely, when the threshold is at its max, Recall will be 0, because every product is judged normal. That gives us a graph like the one below.

![Graph where Recall drops from 1 to 0 as the threshold grows from 0 to 100. The total area is not 1](./image/recall-threshold-graph.en.png)

Then the area under this recall graph would represent the robot's defect-detection performance.

But this graph has a fatal flaw. **Because it only looks at Recall, it doesn't reflect normal products wrongly judged as defective (FP) at all.** Even a nonsense model that gives every product a high defect score would get a large area. On top of that, the threshold is not a value between 0 and 1, so the areas of models with different score scales can't even be compared.

The <strong>ROC (Receiver Operating Characteristic)</strong> solves both of these problems at once.

Instead of using the threshold as an axis, ROC is drawn **with "how well defects were caught (TPR)" and "how often normal products were wrongly flagged (FPR)" as its two axes**. Suppose we have 10 products, lined up in order of their defect score.

![10 items — normal products (green checks) and defective products (red X's) — placed on a defect-score axis, with a threshold near 30 splitting normal from defective](./image/defect-score-distribution.png)

Products whose defect score is above the threshold are the ones the model predicts as defective, and those below it are predicted as good.

> It's just like binary classification with a Sigmoid activation function: if the Sigmoid output (a probability) is greater than the 0.5 threshold, it's classified as positive, and if smaller, as negative. In this setting, the defect score plays the role of the "probability", and the threshold plays the role of 0.5.

Let's say $threshold=30$.

- <u>**Of the 5 "actually defective products", only 4 were predicted as defective**</u>, and 1 was wrongly predicted as normal. This is called the <u>**True Positive Rate (TPR)**</u>, also known as <u>**Sensitivity**</u>, and it's the same concept as <u>**Recall**</u>. As a formula:
  $$
  \text{TPR} = \frac{\text{TP}}{\text{TP} + \text{FN}}
  $$

  TP is the number correctly predicted as "defective", and FN is the number that were "actually defective but wrongly predicted as normal".

  So at threshold = 30, we can say TPR = 4/5 = 0.8.
- However, <u>**of the 5 "actually normal products", 2 were wrongly predicted as "defective"**</u>. This is called the <u>**False Positive Rate (FPR)**</u>, and it corresponds to <u>**1 - Specificity**</u>.
  $$
  \text{FPR} = \frac{\text{FP}}{\text{FP} + \text{TN}}
  $$

  FP is the number of "normal products wrongly predicted as defective".

  So at threshold=30, we can say FPR = 2/5 = 0.4.

If we repeat this for every threshold, we get a TPR and an FPR at each one. Plotting every (TPR, FPR) pair we can obtain finally gives a picture like the one below. And this is called the <u>**ROC Curve**</u>.

![Step-shaped ROC Curve with False Positive Rate on the x-axis and True Positive Rate on the y-axis](./image/roc-curve.png)

This solves every problem we've run into so far.

1. <u>**It doesn't depend on any particular threshold**</u>: every threshold is captured in a single curve.
2. <u>**It also accounts for false alarms (FP)**</u>: it shows the trade-off between catching defects well (TPR) and wrongly flagging normal products (FPR) at the same time.
3. <u>**It's independent of the score scale**</u>: both axes are ratios between 0 and 1, so different models can be compared.

> 🤔 **Why FPR and not Precision?**
>
> Let's install the same model — one that <u>**catches 80% of defective products**</u> and <u>**wrongly flags normal products 10% of the time**</u> — in two factories. Both factories have 100 defective products; only the number of normal products differs.
>
> |                                    | Factory A (100 normal) | Factory B (10,000 normal) |
> | ---------------------------------- | ---------------------- | ------------------------- |
> | TP / FN                            | 80 / 20                | 80 / 20                   |
> | FP / TN                            | 10 / 90                | 1,000 / 9,000             |
> | **TPR** $= \frac{TP}{TP+FN}$       | 0.80                   | 0.80                      |
> | **FPR** $= \frac{FP}{FP+TN}$       | 0.10                   | 0.10                      |
> | **Precision** $= \frac{TP}{TP+FP}$ | 0.89                   | **0.07**                  |
>
> The model is identical, yet only Precision dropped from 0.89 to 0.07. Look at the denominators and you'll see why.
>
> - **TPR** is computed only within the actually defective products, and **FPR** only within the actually normal products. When normal products become 100 times more numerous, FP and TN both grow 100-fold, so the ratio stays the same.
> - **Precision** has TP (from defective products) and FP (from normal products) <u>**mixed together**</u> in its denominator. When only normal products increase, only FP grows, so the value drops even for the same model.
>
> In other words, TPR and FPR show <u>**the model's own discriminative ability, independent of the data composition**</u>, while Precision shows <u>**how much you can trust a "defective" verdict in that particular setting**</u>. ROC uses TPR and FPR as its axes precisely because it wants the former property.
>
> But this strength is a double-edged sword. In Factory B, an FPR of 0.1 looks small, but in reality <u>**false alarms (1,000) outnumber real defects (80) by about 12 times**</u>. The more overwhelmingly normal cases outnumber positives, the better ROC makes a model look than it really is.
>
> 🤔 That's why Object Detection uses the <u><strong>PR Curve</strong></u> rather than the ROC Curve: negatives (background) vastly outnumber the objects.

Picking one point on it, we can see that <u>**80% of the defective items were correctly predicted as defective**</u>, and <u>**20% of the normal items were wrongly predicted as defective**</u>.

![The point (0.2, 0.8) on the ROC Curve: 80% of defective items were caught as defective, and 20% of good items were wrongly judged defective](./image/roc-curve-point.png)

Now we can use the area under this ROC Curve to compare different classification models — in the example above, robot A and robot B. This area is called the <u>**AU-ROC (Area Under the ROC Curve)**</u>. In other words, <u>**AU-ROC is the probability that, given one randomly chosen defective product and one randomly chosen normal product, the defective one receives the higher score**</u>.

![Curves on a 1-Specificity x-axis and Sensitivity y-axis comparing a good model bowed upward, a random guess along the diagonal, and a bad model bowed downward](./image/roc-model-comparison.en.png)

If the model has no ability to tell defects apart — that is, if it's no better than guessing at random — it will show up as a straight line, because TPR and FPR change by the same amount as the threshold changes. If, on the other hand, <u>**the model is good at telling defects apart, the curve will hug the top-left corner (TPR=1, FPR=0), since a good model means high TPR and low FPR**</u>. Conversely, if the model is distinguishing them the wrong way around, the curve will be drawn close to the bottom-right corner (TPR=0, FPR=1).

> <strong> 🤔 For an ideal graph, if (TPR, FPR) = (1.0, 0.0) at every threshold, wouldn't all the points pile up in one spot and leave an area of 0?</strong>
>
> Such a model can't exist. The thresholds at the two extremes <u>**always produce the same points**</u>, no matter how good the model is.
>
> - **threshold > highest score**: nothing is called defective, so TP = FP = 0 → always **(FPR, TPR) = (0, 0)**
> - **threshold < lowest score**: everything is called defective, so FN = TN = 0 → always **(FPR, TPR) = (1, 1)**
>
> So every ROC Curve, whatever the model, <u>**starts at (0, 0) and ends at (1, 1)**</u>; models differ in the path they take between those two points.
>
> Take a perfect model where every defective product's score (0.9, 0.8, 0.7) is higher than every normal product's score (0.3, 0.2, 0.1).
>
> | threshold | Products judged defective | TPR | FPR | Position |
> |---|---|---|---|---|
> | 1.0 | None | 0 | 0 | Starting point (0, 0) |
> | 0.85 | 1 defective | 0.33 | 0 | Up along the left edge |
> | 0.75 | 2 defective | 0.67 | 0 | 〃 |
> | 0.5 | 3 defective | **1.0** | **0** | **Top-left corner** |
> | 0.25 | 3 defective + 1 normal | 1.0 | 0.33 | Right along the top edge |
> | 0.15 | 3 defective + 2 normal | 1.0 | 0.67 | 〃 |
> | 0.0 | All | 1.0 | 1.0 | End point (1, 1) |
>
> Since no normal product gets caught until every defective one has been caught, the curve <u>**goes straight up the left edge, then right along the top edge**</u>. The area under this path is 1 × 1 = **1.0**.
>
> ![ROC curve of a perfect model. It rises along the left edge from (0,0) to (0,1), then runs along the top edge to (1,1), giving an area of 1](./image/roc-perfect-model.en.png)
>
> In other words, (1.0, 0.0) only appears when the threshold is between 0.3 and 0.7. A perfect model is <u>**one for which there exists a range of thresholds that "catches every defect and not a single normal product"**</u> — not one that does so at every threshold.
>
> Conversely, for the area to be 0, the curve would have to go (0, 0) → (1, 0) → (1, 1): along the bottom edge, then up the right edge. That's a <u>**completely inverted model**</u> that gives normal products higher defect scores. Simply flipping its decisions turns it into a perfect model with an area of 1.


So now we can express a model's predictive performance across all thresholds as a single number: the AUROC!

## 📚 References

- [https://ffighting.net/deep-learning-basic/딥러닝-핵심-개념/accuracy-precision-recall-f1score-auroc/](https://ffighting.net/deep-learning-basic/%eb%94%a5%eb%9f%ac%eb%8b%9d-%ed%95%b5%ec%8b%ac-%ea%b0%9c%eb%85%90/accuracy-precision-recall-f1score-auroc/)
- [https://chowonsang.com/혼동행렬의-개념과-핵심-평가지표/](https://chowonsang.com/%ED%98%BC%EB%8F%99%ED%96%89%EB%A0%AC%EC%9D%98-%EA%B0%9C%EB%85%90%EA%B3%BC-%ED%95%B5%EC%8B%AC-%ED%8F%89%EA%B0%80%EC%A7%80%ED%91%9C/)
- [ROC Curve and AUC Value](https://www.youtube.com/watch?v=QBVzZBsif20&list=LL&index=51)
