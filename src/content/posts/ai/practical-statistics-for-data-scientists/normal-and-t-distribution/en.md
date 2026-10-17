---
title: ":psds: The Normal Distribution and the t-Distribution"
date: 2026-10-17T23:53:00+09:00
description: "Covers the normal distribution and standardization (z-scores), checking normality with a Q-Q plot, long-tailed distributions and skewness, and the t-distribution and degrees of freedom used when the population standard deviation is unknown."
tags: [AI, Statistics, NormalDistribution, QQPlot, Skewness, TDistribution]
draft: false
---
## 1. The Normal Distribution

| Term | Meaning | Notes |
| --- | --- | --- |
| Error | The difference between an observed data value and the value predicted by a model (or the group mean). | If a student's actual test score is 90 and the average score is 80, the error (deviation) here is 90 - 80 = +10 points. |
| Standardize (normalize) | The process of converting data with different units or ranges onto **a common scale with mean 0 and standard deviation 1**. (The relative positions and shape of the data are preserved.) | Two variables with completely different units, like height (cm, mean 170) and weight (kg, mean 65), are hard to compare directly, so we subtract the mean from both and divide by the standard deviation to put them on the same scale. |
| Z-Score | A standardized value that indicates **how many standard deviations away** a value is. | On a test with a mean of 70 and a standard deviation of 10, a score of 90 gives z-score = +2. This student sits 2 standard deviations above the mean. |
| Standard Normal Distribution | A normal distribution with mean = 0 and standard deviation = 1. | Converting any ordinary normally distributed data into Z-scores places it on this **standard normal distribution**, which makes it easy to compare upper percentiles (probabilities) across different test scores or body measurements. |
| QQ-plot | A plot that shows how close a sample distribution is to a particular distribution (e.g., the normal distribution). | • If the data follow a normal distribution, the points on the QQ plot line up **along the 45-degree diagonal**.<br>• If the points at either end bend sharply away from or depart from the line, you can tell intuitively that the data do not follow a normal distribution (they are skewed or have heavy tails). |

It is not called the "normal" distribution because most data follow it, i.e., because that is the norm. In fact, most of the variables used in a typical data project — <u>**most real-world raw data — do not, on the whole, follow a normal distribution**</u>. The usefulness of the normal distribution shows up only in that <u>**most statistics in a sampling distribution (sample means, sums, errors, etc.) follow a normal distribution**</u>. Even so, the normality assumption is generally a last resort, used when an empirical probability distribution or a bootstrap distribution is not available.

![Standard normal curve with the ±1σ (68.3%), ±2σ (95.4%), and ±3σ (99.7%) ranges](./image/normal-distribution-68-95-99.png)

The graph above shows that 68.3% of sample statistics lie within one standard deviation, 95.4% within two standard deviations, and 99.7% within three standard deviations of the mean.

> 📌 **NOTE**
>
> The normal distribution is also called the <u>**Gaussian distribution**</u>, after the 18th-century German mathematician Carl Friedrich Gauss.

### 1.1. The Standard Normal Distribution and the Q-Q Plot

The <u>**standard normal distribution**</u> is a normal distribution whose x-axis units are expressed as standard deviations from the mean. To compare data with the standard normal distribution, you subtract the mean from the data and then divide by the standard deviation:

$$
Z = \frac{X - \mu}{\sigma}
$$

This is called <u>**normalization**</u> or <u>**standardization**</u>. The transformed score is called a <u>**z-score**</u>, and the standard normal distribution is called the z-distribution.

Converting data to z-scores does not make the data normally distributed. It merely puts the data on the same scale as the standard normal distribution for the purpose of comparison.

A <u>**Q-Q plot (Quantile-Quantile plot)**</u> is used to judge visually how close a sample is to a particular distribution.

A Q-Q plot sorts the z-scores in ascending order and plots each value's z-score on the y-axis. The x-axis shows the corresponding quantile of the normal distribution.

![A Q-Q plot of data that follow a normal distribution](./image/qq-plot-normal.png)

Suppose we have the following 15 data points and want to check whether they follow a normal distribution.

![15 gene expression data points plotted along a vertical axis](./image/qq-15-data-points.png)

We then find the quantile of every one of these 15 data points, and look up the z-score each quantile corresponds to in the normal distribution.

![Each of the 15 data points assigned its own quantile](./image/qq-step1-data-quantiles.png "w=400") ![A normal curve marked with the same number of quantiles as the data](./image/qq-step3-normal-quantiles.png "w=314")

Now all that's left is to draw the Q-Q plot!

1. If the smallest data value is $0.6$ and its $\text{z-score} = -1.5$, we can plot one point like this.

   ![Pairing the smallest value 0.6 with the normal quantile -1.5 to plot the first point on the Q-Q plot](./image/qq-plot-point-1.png)

2. If the next data value is $1.1$ and its $\text{z-score} = -1.2$, we can plot one point like this.

   ![Pairing the second value 1.1 with the normal quantile -1.2 to plot the second point](./image/qq-plot-point-2.png)

3. If the next data value is $1.9$ and its $\text{z-score} = -0.89$, we can plot one point like this.

   ![Pairing the third value 1.9 with the normal quantile -0.89 to plot the third point](./image/qq-plot-point-3.png)

4. Repeating this process for every data point gives the graph below.

   ![A Q-Q plot with all 15 points plotted](./image/qq-plot-all-points.png "w=50%")

5. In this case, the points don't show a normal distribution. If the data followed a <u>**normal distribution**</u>, they would have to lie <u>**on the line**</u>.

   ![A reference line drawn over the Q-Q plot points to check normality](./image/qq-plot-fit-line.png "w=50%")

Because the data have been standardized, the units correspond to the number of standard deviations the data lie from the mean. If the points fall roughly on the diagonal, the sample distribution can be regarded as close to normal.

## 2. Long-Tailed Distributions

| Term | Meaning | Notes |
| --- | --- | --- |
| Tail | The long, narrow part of a frequency distribution, where a small number of extreme values occur. | • The sign of the skewness is determined by **which direction the tail stretches out**. |
| Skewness | • A statistic that indicates **how asymmetric** a data distribution is from left to right.<br><br>The degree to which one tail of a distribution is longer than the other. | • **Symmetric distribution (skewness = 0) meaning**: A perfectly symmetric shape from left to right (e.g., the normal distribution).<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ **Characteristic**: mean = median = mode.<br>• **Positive skew / right-tailed distribution (skewness > 0) meaning**: The right tail is stretched out long.<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ **Characteristic**: A few large values pull the mean to the right (toward higher values), giving the order **mean > median**.<br>• **Negative skew / left-tailed distribution (skewness &lt; 0) meaning**: The left tail is stretched out long.<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ **Characteristic**: A few extremely small values drag the overall mean to the left (toward lower values), giving the order **mean &lt; median**. |

The normal distribution is appropriate and useful for looking at the distribution of errors or sample statistics, but <u>**most raw data do not follow a normal distribution**</u>. Sometimes the distribution is tilted asymmetrically, as with income data, or it may be discrete, as with binomial data. Both symmetric and asymmetric distributions can have a <u>**long tail**</u>.

![A long-tailed distribution with a small number of frequent elements and a tail stretching far to the right](./image/long-tail-distribution.png)

![A Q-Q plot of a long-tailed distribution whose end points depart sharply from the reference line](./image/qq-plot-long-tail.png)

The figure above is a QQ-plot of a long-tailed distribution. Points with low z-scores lie far below the diagonal, and high values lie far above it. This means the data do not follow a normal distribution. It also means that we are likely to observe far more extreme values than would be expected if the data were normally distributed.

## 3. t-distribution

| Term | Meaning | Notes |
| --- | --- | --- |
| n | Sample size. | |
| Degrees of freedom | A parameter that adjusts the t-distribution for different sample sizes, statistics, and numbers of groups. | Suppose there is a condition that three numbers (A, B, C) must **always sum to 10**.<br>How many of them can you set freely to any number you like?<br>If you put 3 in A and 5 in B, C must automatically be 2 for the sum to be 10.<br>In other words, the **degrees of freedom — the number of values you can set independently — is 2** (3 - 1). |

The t-distribution is a probability distribution used <u>**when the population standard deviation is unknown and you estimate the mean from a small sample (n &lt; 30)**</u>. Its defining feature is that it <u>**looks similar to the normal distribution but has slightly thicker and longer tails**</u>.

Suppose we want to find the average height of all students at our university (the population mean, $\mu$). Measuring the height of every student is practically impossible. So we draw a sample of 30 students ($n=30$) and compute their average height (the sample mean, $\bar{x}$). We then want to figure out how close this is to the population mean ($\mu$).

If we knew the population standard deviation ($\sigma$), we could draw a normal distribution and find the difference between the sample mean and the population mean. But if we don't know the population mean ($\mu$), how could we know the population standard deviation ($\sigma$)? So we have no choice but to <u>**estimate from our sample mean ($\bar{x}$) and standard deviation ($s$)**</u>. Using the sample standard deviation, however, is a bit like measuring with a slightly crooked ruler. That is, there is <u>**uncertainty in the measurement itself (the sampling error of the sample mean ($\bar{x}$))**</u>, and there is also <u>**uncertainty in the tool itself (the estimation uncertainty and sampling variability of the sample standard deviation ($s$) (Sampling Variability of $s$))**</u>.

Because of this, both the numerator and the denominator of the test statistic become random variables, so the standard normal distribution can't be used as is. Instead, we compute and use the <u>**t-statistic**</u>.

$$
t=\frac{\bar{x}-\mu _{0}}{\frac{s}{\sqrt{n}}} = \frac{\bar{x}-\mu _{0}}{s} \times \sqrt{n}
$$

- $\bar{x}$: sample mean
- $\mu_0$: population mean under the null hypothesis
- $s$: sample standard deviation
- $n$: sample size
- $\frac{s}{\sqrt{n}}$: Standard Error (SE)
- Degrees of freedom (df): $n - 1$

**When the sample is small (when $n$ is small):** The sample standard deviation ($s$) computed from the small amount of data we drew may be larger, or much smaller, than the true standard deviation of the whole population ($\sigma$). In other words, **the variability (uncertainty) of the denominator $s$ itself becomes too large.** Because of this uncertainty, extreme t-statistics become more likely, producing **a heavy-tailed shape**.

**On the other hand, when the sample is large (as $n$ grows):** The more samples we have, the closer our $s$ gets to the actual population standard deviation ($\sigma$) (consistency). As the uncertainty in the denominator disappears, the t-statistic eventually converges to the same shape as the z-statistic (the standard normal distribution).

![t-distribution curves by degrees of freedom (df = 1, 3, 10, 30) — the larger the df, the closer to the normal distribution](./image/t-distribution-by-df.png)

It is generally known that <u>**when df ≥ 30, the t-distribution becomes very close to the normal distribution**</u>.

> 🤔 **Why is it called Student’s t-distribution?**
>
> It is sometimes called Student’s t-distribution because in 1908 William Gosset published his paper in *Biometrika* under the pen name "Student."

> When describing the behavior of a sample statistic, the accuracy of the t-distribution requires that the distribution of the statistic for the sample be normal.

## 📚 References

- [practical-statistics-for-data-scientists/python/notebooks/Chapter 1 - Exploratory Data Analysis.ipynb at master · gedeck/practical-statistics-for-data-scientists](https://github.com/gedeck/practical-statistics-for-data-scientists/blob/master/python/notebooks/Chapter%201%20-%20Exploratory%20Data%20Analysis.ipynb)
- [Quantile-Quantile Plots (QQ plots), Clearly Explained!!!](https://www.youtube.com/watch?v=okjYjClSjOg)
- [Student's T Distribution](https://www.youtube.com/watch?v=32CuxWdOlow)
- [Student's t-Distribution - Explained](https://www.youtube.com/watch?v=BZ-Go7VTquk)
