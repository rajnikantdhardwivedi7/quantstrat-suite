# QuantStrat

### Layered Intelligence for Quantitative Decision Systems

**QuantStrat** is a quantitative finance research and decision-support platform that combines **financial mathematics, statistical modeling, machine learning, time-series analysis, portfolio optimization, risk management, and software engineering** into a unified research environment.

The system is designed around a complete quantitative research lifecycle:

```text
Market Data
     │
     ▼
Data Ingestion
     │
     ▼
Validation & Cleaning
     │
     ▼
Feature Engineering
     │
     ├──────────────────────┐
     ▼                      ▼
Mathematical Analysis   Machine Learning
     │                      │
     └───────────┬──────────┘
                 ▼
          Signal Generation
                 │
                 ▼
        Portfolio Construction
                 │
                 ▼
            Backtesting
                 │
                 ▼
          Risk Analytics
                 │
                 ▼
       Research Evaluation
                 │
        ┌────────┴────────┐
        ▼                 ▼
       API            Web Dashboard
        │
        ▼
    MLOps / DevOps
```

QuantStrat is intended for **quantitative research and education**. It does not provide guaranteed investment returns or financial advice.

---

## Table of Contents

* [Overview](#overview)
* [Why QuantStrat](#why-quantstrat)
* [Research Philosophy](#research-philosophy)
* [Core Capabilities](#core-capabilities)
* [Architecture](#architecture)
* [Mathematical Foundation](#mathematical-foundation)
* [Feature Engineering](#feature-engineering)
* [Machine Learning](#machine-learning)
* [Time-Series Validation](#time-series-validation)
* [Signal Generation](#signal-generation)
* [Portfolio Optimization](#portfolio-optimization)
* [Backtesting](#backtesting)
* [Risk Engine](#risk-engine)
* [Model Interpretability](#model-interpretability)
* [Experiment Tracking](#experiment-tracking)
* [Model Registry](#model-registry)
* [API](#api)
* [Dashboard](#dashboard)
* [Technology Stack](#technology-stack)
* [Project Structure](#project-structure)
* [Data Architecture](#data-architecture)
* [Reproducibility](#reproducibility)
* [Testing](#testing)
* [Security](#security)
* [DevOps](#devops)
* [Research Workflow](#research-workflow)
* [Installation](#installation)
* [Quick Start](#quick-start)
* [Example Experiment](#example-experiment)
* [Limitations](#limitations)
* [Research Roadmap](#research-roadmap)
* [License](#license)

---

# Overview

QuantStrat was built to explore what happens when a quantitative finance workflow is treated as a **complete software system rather than an isolated machine-learning experiment**.

Traditional quantitative experiments often separate:

* data preparation
* statistical analysis
* feature engineering
* model training
* portfolio construction
* backtesting
* risk analysis

QuantStrat brings these components together.

The platform allows a research hypothesis to move through a reproducible pipeline:

```text
Hypothesis
    ↓
Market Data
    ↓
Validation
    ↓
Feature Construction
    ↓
Mathematical / Statistical Analysis
    ↓
Model Training
    ↓
Time-Series Validation
    ↓
Prediction
    ↓
Signal
    ↓
Portfolio
    ↓
Backtest
    ↓
Risk Analysis
    ↓
Research Report
```

This makes it possible to evaluate not only whether a model predicts something, but whether the information it produces remains meaningful after realistic strategy construction and execution assumptions.

---

# Why QuantStrat?

Financial markets present a difficult modeling environment.

They are:

* noisy
* non-stationary
* adaptive
* partially observable
* affected by transaction costs
* sensitive to regime changes
* vulnerable to overfitting

A model can perform well statistically while producing a poor trading strategy.

Likewise, a backtest can look impressive while being invalid because of:

* look-ahead bias
* data leakage
* survivorship bias
* unrealistic execution
* ignored costs
* excessive turnover
* overfitting
* incorrect timestamp alignment

QuantStrat therefore separates two questions:

### 1. Does the model predict effectively?

and

### 2. Does that predictive information produce useful strategy behavior?

These are **not the same problem**.

QuantStrat treats them as separate research layers.

---

# Research Philosophy

QuantStrat follows five principles.

## 1. Correctness

Financial calculations must be mathematically and temporally correct.

## 2. Reproducibility

A result should be reconstructible from:

* data
* code
* configuration
* dependencies
* feature definitions
* model version
* experiment metadata

## 3. No Fabricated Results

The platform does not invent:

* returns
* Sharpe ratios
* accuracy
* profits
* historical prices
* datasets
* institutional affiliations
* production deployments

If something has not been measured, it should be represented as:

```text
Not yet measured
```

Synthetic development data is explicitly identified as:

```text
Synthetic development data
```

## 4. Temporal Integrity

Every feature and prediction must respect the information available at the relevant point in time.

Future information must never leak into historical decisions.

## 5. Research Before Optimization

QuantStrat prioritizes correctness over visual complexity and theoretical sophistication.

A simpler model with valid evaluation is more valuable than a complex model with questionable methodology.

---

# Core Capabilities

QuantStrat integrates the following research capabilities:

### Market Data

* OHLCV data
* historical prices
* volumes
* asset metadata
* CSV ingestion
* synthetic development data
* provider abstraction

### Financial Mathematics

* simple returns
* logarithmic returns
* volatility
* covariance
* correlation
* drawdown
* beta
* portfolio mathematics

### Statistical Modeling

* rolling statistics
* variance
* skewness
* kurtosis
* autocorrelation
* statistical evaluation

### Feature Engineering

* momentum
* moving averages
* exponential moving averages
* volatility indicators
* volume features
* RSI
* MACD
* Bollinger Bands
* ATR

### Machine Learning

* linear regression
* logistic regression
* random forests
* gradient boosting
* optional XGBoost / LightGBM
* optional neural-network experiments

### Strategy Research

* signal generation
* long / neutral / short states
* configurable thresholds
* confidence-based decisions
* risk-aware signals

### Portfolio Construction

* equal weighting
* minimum variance
* maximum Sharpe-style optimization
* configurable constraints

### Backtesting

* positions
* cash
* portfolio value
* trades
* fees
* slippage
* turnover
* exposure
* equity curves
* drawdowns

### Risk

* volatility
* beta
* VaR
* CVaR
* maximum drawdown
* concentration
* exposure
* downside risk
* turnover

### Engineering

* FastAPI
* React
* PostgreSQL
* Redis
* Docker
* GitHub Actions
* automated testing
* typed Python
* structured logging

---

# Architecture

QuantStrat follows a layered architecture.

```text
┌──────────────────────────────────────────────┐
│                 MARKET DATA                  │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│             DATA INGESTION LAYER             │
│     Providers / CSV / Synthetic / APIs       │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│          VALIDATION & NORMALIZATION          │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│            FEATURE ENGINEERING               │
└───────────────────────┬──────────────────────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
┌─────────────────────┐   ┌─────────────────────┐
│ MACHINE LEARNING    │   │ MATHEMATICAL ENGINE │
│                     │   │                     │
│ Regression          │   │ Returns             │
│ Classification      │   │ Volatility          │
│ Tree Models         │   │ Covariance          │
│ Evaluation          │   │ Correlation         │
└──────────┬──────────┘   │ Risk                │
           │              │ Optimization        │
           │              └──────────┬──────────┘
           └──────────────┬───────────┘
                          ▼
                ┌─────────────────────┐
                │ SIGNAL GENERATION   │
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │ PORTFOLIO ENGINE    │
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │ BACKTESTING ENGINE  │
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │ RISK & PERFORMANCE  │
                └──────────┬──────────┘
                           ▼
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌───────────┐             ┌───────────┐
        │  FastAPI  │             │  React UI │
        └─────┬─────┘             └───────────┘
              │
              ▼
       ┌───────────────┐
       │ MLOps / DevOps│
       └───────────────┘
```

Each layer has a defined responsibility and communicates through explicit interfaces.

---

# Mathematical Foundation

QuantStrat implements core quantitative-finance mathematics rather than treating the market as a generic tabular ML problem.

## Simple Returns

For price \(P_t\):

$$
r_t = \frac{P_t}{P_{t-1}} - 1
$$

where:

* \(P_t\) is the current price
* \(P_{t-1}\) is the previous price
* \(r_t\) is the simple return

---

## Logarithmic Returns

$$
r_t^{log} = \ln\left(\frac{P_t}{P_{t-1}}\right)
$$

Log returns are useful for additive time-series analysis and statistical modeling.

---

## Volatility

For a return series \(r_t\), rolling volatility is estimated using the standard deviation:

$$
\sigma = \sqrt{\frac{1}{n-1}
\sum_{i=1}^{n}(r_i-\bar r)^2}
$$

Annualized volatility can be estimated as:

$$
\sigma_{annual} = \sigma_{period}\sqrt{N}
$$

where \(N\) depends on the observation frequency.

---

## Portfolio Return

For weights \(w\) and expected asset returns \(\mu\):

$$
E[R_p] = w^T\mu
$$

---

## Portfolio Volatility

Given covariance matrix \(\Sigma\):

$$
\sigma_p = \sqrt{w^T\Sigma w}
$$

This allows portfolio risk to account for interactions between assets rather than simply adding individual volatilities.

---

## Sharpe Ratio

$$
Sharpe =
\frac{R_p-R_f}{\sigma_p}
$$

where:

* \(R_p\) = portfolio return
* \(R_f\) = risk-free rate
* \(\sigma_p\) = portfolio volatility

The Sharpe ratio is treated as an evaluation statistic, not proof of future performance.

---

## Maximum Drawdown

For portfolio value \(V_t\):

$$
DD_t = \frac{V_t}{\max_{s\leq t}V_s}-1
$$

Maximum drawdown is:

$$
MDD = \min_t DD_t
$$

---

## Value at Risk

QuantStrat supports multiple approaches, including:

* historical VaR
* parametric VaR

Each method has assumptions and limitations that must be considered when interpreting the result.

---

## Conditional Value at Risk

CVaR estimates the expected loss conditional on losses exceeding the VaR threshold.

It provides additional information about the tail of the loss distribution.

---

# Feature Engineering

QuantStrat provides reusable financial feature pipelines.

### Price Features

* simple returns
* logarithmic returns
* rolling returns
* momentum
* SMA
* EMA

### Volatility Features

* rolling standard deviation
* exponentially weighted volatility
* ATR

### Trend Features

* moving-average relationships
* momentum indicators

### Volume Features

* volume change
* rolling volume
* volume z-score

### Statistical Features

* rolling mean
* rolling variance
* skewness
* kurtosis
* autocorrelation

### Technical Features

* RSI
* MACD
* Bollinger Bands

Every feature has an associated lookback period and metadata.

A critical design rule is:

> **A feature at time \(t\) may only use information available at or before \(t\).**

This prevents future observations from contaminating historical decisions.

---

# Machine Learning

QuantStrat uses a model abstraction so different models can participate in the same research pipeline.

The conceptual interface includes:

```python
fit()
predict()
predict_proba()
save()
load()
evaluate()
```

## Supported Models

### Linear Regression

Used as an interpretable baseline for future-return prediction.

### Logistic Regression

Used for binary classification problems such as predicting whether future returns are positive.

### Random Forest

Provides nonlinear decision boundaries and feature-importance analysis.

### Gradient Boosting

Provides another nonlinear baseline suitable for tabular financial features.

### Optional Gradient-Boosted Libraries

Where dependency availability permits:

* XGBoost
* LightGBM

### Optional Neural Networks

PyTorch can be introduced for experimental research.

The production research path intentionally begins with simpler, interpretable models.

---

# Time-Series Validation

Random train/test splitting is inappropriate for many financial forecasting problems because it can allow future information to influence the training process.

QuantStrat instead supports:

* chronological train/validation/test splits
* expanding-window validation
* walk-forward validation

Conceptually:

```text
Historical Data

├─────────────── Train ───────────────┤
                                    │
                                    ▼
                         ├── Validation ──┤
                                             │
                                             ▼
                                      ├── Test ──┤
```

Walk-forward evaluation extends this concept:

```text
Window 1
Train ───────► Validate

Window 2
Train ───────────► Validate

Window 3
Train ───────────────► Validate

Window 4
Train ──────────────────► Test
```

This provides a more realistic representation of how a strategy would operate through time.

---

# Model Evaluation

QuantStrat separates predictive evaluation from economic evaluation.

## Regression Metrics

* MAE
* MSE
* RMSE
* R²

## Classification Metrics

* accuracy
* precision
* recall
* F1
* ROC-AUC
* confusion matrix

## Strategy Metrics

* cumulative return
* annualized return
* volatility
* Sharpe ratio
* Sortino ratio
* maximum drawdown
* Calmar ratio
* turnover

A model is not considered successful simply because it has high predictive accuracy.

---

# Signal Generation

Predictions are converted into configurable quantitative signals.

Example:

```text
prediction > upper_threshold
        │
        ▼
      LONG


prediction < lower_threshold
        │
        ▼
      SHORT


otherwise
        │
        ▼
     NEUTRAL
```

For long-only strategies:

```text
BUY
HOLD
SELL
```

Each signal contains information such as:

* timestamp
* symbol
* prediction
* confidence/probability
* signal
* model version

This creates an auditable connection between model output and strategy behavior.

---

# Portfolio Optimization

QuantStrat includes portfolio-construction methods designed to make allocation decisions explicit.

## Equal Weight

Every asset receives equal allocation.

## Minimum Variance

The optimizer attempts to minimize portfolio variance:

$$
\min_w w^T\Sigma w
$$

subject to portfolio constraints.

## Maximum Sharpe-Style Optimization

The system can optimize the return-to-risk relationship under configurable constraints.

## Risk-Aware Allocation

Additional restrictions can be introduced to control:

* concentration
* maximum position size
* minimum allocation
* long-only exposure

Common constraints include:

$$
\sum_i w_i = 1
$$

and:

$$
w_i \leq w_{max}
$$

The platform distinguishes estimated optimization outputs from realized historical performance.

---

# Backtesting

The backtesting engine is designed around time-based strategy simulation.

It models:

* positions
* cash
* portfolio value
* transactions
* transaction costs
* slippage
* turnover
* exposure
* equity curve
* drawdowns

Example configuration:

```text
Initial Capital:      configurable
Transaction Cost:     configurable
Slippage:             configurable
Rebalance Frequency:  configurable
```

The purpose of the backtester is not to make strategies look profitable.

It is to determine what would have happened under the specified assumptions.

If a strategy performs poorly, QuantStrat should report that result.

---

# Backtesting Integrity

Financial backtesting is particularly vulnerable to methodological errors.

QuantStrat explicitly considers:

### Look-Ahead Bias

Future information must not influence historical decisions.

### Data Leakage

Training and evaluation data must remain appropriately separated.

### Survivorship Bias

Historical asset universes should not be constructed solely from assets that survived to the present where avoidable.

### Timestamp Alignment

Signals and executions must correspond to information actually available at the relevant time.

### Execution Assumptions

A signal generated using information at the close should not automatically assume execution at that same unavailable closing price.

### Transaction Costs

Costs must be included when evaluating realistic strategy behavior.

### Slippage

Execution prices should account for deviations from idealized prices where appropriate.

### Overfitting

A strategy that performs exceptionally well only under one configuration may simply have learned historical noise.

---

# Risk Engine

QuantStrat contains a dedicated risk-analysis layer.

The engine evaluates:

* volatility
* beta
* VaR
* CVaR
* maximum drawdown
* concentration risk
* exposure
* turnover
* downside risk

The system can produce a structured `RiskReport` containing portfolio-level risk information.

Risk metrics are interpreted as estimates under model assumptions, not guarantees about future market behavior.

---

# Model Interpretability

QuantStrat supports model interpretation to investigate which variables influence predictions.

For tree-based models, this can include:

* model feature importance
* permutation importance

SHAP-based analysis can also be incorporated where appropriate.

Feature importance should answer:

> Which variables contributed to the model's prediction?

It should **not** be interpreted as:

> Which variables causally move the market?

Correlation, predictive usefulness, and causality are different concepts.

---

# Experiment Tracking

Each experiment should be associated with metadata such as:

```text
Experiment ID
Model Name
Model Version
Dataset Version
Feature Version
Hyperparameters
Training Period
Validation Period
Test Period
Metrics
Timestamp
```

This makes it possible to compare experiments without losing track of how each result was produced.

---

# Model Registry

QuantStrat provides a model-registry abstraction supporting operations such as:

```text
register_model()
load_model()
list_models()
promote_model()
archive_model()
```

Model artifacts can be organized as:

```text
models/
└── model_name/
    └── version/
        ├── model.pkl
        └── metadata.json
```

Large model artifacts should remain outside the relational database.

---

# API

QuantStrat exposes its research functionality through FastAPI.

## Core Endpoints

```text
GET  /health

GET  /assets

GET  /market/{symbol}

GET  /features/{symbol}

POST /models/train

GET  /models

GET  /models/{model_id}

POST /predict

POST /signals

POST /backtest

GET  /backtest/{id}

GET  /risk/{portfolio_id}

GET  /portfolio/{id}

GET  /experiments

GET  /system/status

GET  /jobs/{job_id}
```

FastAPI automatically exposes OpenAPI documentation.

When running locally:

```text
http://localhost:8000/docs
```

---

# Dashboard

QuantStrat provides a research-oriented web dashboard rather than a generic trading interface.

The design focuses on:

* dark professional interface
* high information density
* restrained visual hierarchy
* clear typography
* responsive layouts
* research transparency

## Dashboard Sections

### Overview

Displays:

* selected asset
* latest price
* daily return
* volatility
* model prediction
* confidence
* current signal
* portfolio value
* drawdown
* Sharpe ratio

### Market Data

Explore market prices and historical observations.

### Feature Explorer

Inspect engineered features and their behavior over time.

### Model Lab

Train and evaluate quantitative models.

### Predictions

Inspect model predictions and confidence.

### Signals

Explore generated strategy signals.

### Backtesting

Run and analyze historical strategy simulations.

### Portfolio

Inspect allocations and portfolio statistics.

### Risk

Explore portfolio risk metrics.

### Experiments

Compare model and strategy experiments.

### System Health

Inspect application infrastructure and service status.

---

# Dashboard Visualizations

The interface can visualize:

* price history
* returns
* equity curves
* drawdowns
* volatility
* feature importance
* portfolio allocation
* correlation matrices

The dashboard explicitly distinguishes between:

```text
Observed Data
Predictions
Backtested Results
Synthetic / Demo Data
```

This prevents simulated or predicted information from being visually confused with observed market history.

---

# Technology Stack

## Backend

* Python 3.12+
* FastAPI
* Pydantic
* Uvicorn

## Data

* pandas
* NumPy
* Polars
* PyArrow
* Parquet

## Machine Learning

* scikit-learn
* XGBoost / LightGBM where appropriate
* PyTorch for optional experiments

## Mathematics & Statistics

* NumPy
* SciPy
* statsmodels

## Optimization

* scipy.optimize
* CVXPY

## Database

* PostgreSQL
* SQLAlchemy
* Alembic

## Caching

* Redis

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts

## Infrastructure

* Docker
* Docker Compose
* GitHub Actions

## Testing & Quality

* pytest
* pytest-cov
* mypy
* Ruff

---

# Project Structure

```text
quantstrat/
│
├── apps/
│   ├── api/
│   └── web/
│
├── packages/
│   ├── data/
│   ├── features/
│   ├── mathematics/
│   ├── models/
│   ├── signals/
│   ├── portfolio/
│   ├── backtesting/
│   ├── risk/
│   └── common/
│
├── pipelines/
│   ├── ingestion/
│   ├── training/
│   └── evaluation/
│
├── notebooks/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── backtesting/
│
├── infrastructure/
│   ├── docker/
│   └── github/
│
├── configs/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── features/
│
├── models/
│
├── reports/
│
├── docs/
│
├── scripts/
│
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── pyproject.toml
├── .env.example
└── README.md
```

The architecture intentionally separates business logic from API and frontend code.

---

# Data Architecture

QuantStrat uses a provider abstraction:

```python
MarketDataProvider
```

with operations conceptually including:

```python
get_historical_prices()
get_latest_prices()
get_volume()
get_asset_metadata()
```

Supported development paths include:

### CSV Provider

Useful for importing research datasets.

### Synthetic Provider

Useful for:

* development
* testing
* demonstrations
* reproducible examples

Synthetic data is clearly labeled.

### External Provider

The architecture allows public market-data providers to be introduced without coupling the entire system to a single vendor.

---

# Database

The production architecture uses PostgreSQL for structured metadata and research state.

Core entities include:

```text
assets
market_data
features
experiments
models
predictions
signals
backtests
trades
portfolios
```

SQLAlchemy provides database models and Alembic manages schema migrations.

Large machine-learning artifacts are stored separately rather than inside PostgreSQL.

---

# Redis

Redis can be used for:

* latest market-data caching
* temporary task state
* background-job infrastructure

Redis is not required for basic mathematical or unit-test execution.

---

# Asynchronous Jobs

Training and large backtests can be computationally expensive.

QuantStrat therefore supports an asynchronous-job architecture so that long-running work does not unnecessarily block API requests.

Possible execution architecture:

```text
Client
  │
  ▼
FastAPI
  │
  ▼
Job Queue
  │
  ▼
Worker
  │
  ├── Model Training
  ├── Backtesting
  └── Evaluation
```

Job status can be exposed through:

```text
GET /jobs/{job_id}
```

---

# Reproducibility

Reproducibility is a first-class requirement.

Experiments should track:

* Python version
* dependency versions
* dataset version
* feature version
* model version
* configuration
* random seeds
* training period
* validation period
* test period

A reproducible experiment should be executable from a clean environment.

The project provides a complete example workflow through:

```bash
make reproduce
```

---

# Testing

QuantStrat treats quantitative calculations as testable software components.

## Mathematical Tests

Tests cover areas such as:

* returns
* volatility
* covariance
* VaR
* CVaR
* drawdown
* portfolio metrics

## Feature Tests

Feature generation is tested for:

* correct calculations
* expected columns
* temporal integrity
* missing values

## Machine Learning Tests

Tests include:

* deterministic training
* fixed random seeds
* valid predictions
* train/test separation

## Backtesting Tests

Backtesting tests cover:

* transaction costs
* slippage
* position accounting
* cash accounting
* drawdowns
* timestamp alignment

## API Tests

API-level tests cover:

* health
* prediction
* backtesting
* risk
* model endpoints

---

# Security

QuantStrat follows basic application-security principles:

* validated API inputs
* environment-based configuration
* no committed secrets
* controlled CORS
* dependency pinning
* avoidance of arbitrary code execution
* non-root containers where practical

Secrets belong in environment configuration, never in source control.

---

# DevOps

The system is containerized using Docker.

The development environment can include:

```text
┌─────────────┐
│    React    │
│     Web     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   FastAPI   │
│     API     │
└──────┬──────┘
       │
   ┌───┴────┐
   ▼        ▼
PostgreSQL Redis
```

Docker Compose provides local orchestration.

---

# CI/CD

The CI pipeline is designed around:

```text
Checkout
   ↓
Install Dependencies
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Docker Build
   ↓
Security / Dependency Checks
```

A failing test or quality check should prevent a successful build from being treated as valid.

---

# Observability

Structured logging captures important application events such as:

* API requests
* model training
* prediction jobs
* backtests
* failures
* job status

System health can be exposed through:

```text
GET /system/status
```

The status layer can report:

```text
API
Database
Redis
Model Registry
Data Provider
```

---

# Research Workflow

A typical QuantStrat research experiment looks like this:

## Step 1: Define a Hypothesis

Example:

> Historical price and volatility features may contain information useful for predicting next-period returns.

## Step 2: Obtain Data

Use:

* historical market data
* CSV data
* or synthetic development data

## Step 3: Validate Data

Check:

* timestamps
* duplicates
* missing observations
* OHLC consistency
* anomalies
* timezone consistency

## Step 4: Build Features

Construct features using only information available at the prediction timestamp.

## Step 5: Split Chronologically

Separate:

```text
Training
Validation
Testing
```

without randomly mixing observations across time.

## Step 6: Train Model

Begin with an interpretable baseline.

## Step 7: Evaluate Predictions

Calculate statistical prediction metrics.

## Step 8: Generate Signals

Convert predictions into strategy decisions.

## Step 9: Construct Portfolio

Apply allocation and risk constraints.

## Step 10: Backtest

Simulate:

* positions
* transactions
* costs
* slippage
* portfolio value

## Step 11: Analyze Risk

Calculate:

* volatility
* Sharpe
* Sortino
* drawdown
* VaR
* CVaR
* turnover

## Step 12: Compare Against Baselines

At minimum:

```text
Buy & Hold
Equal Weight
Simple Momentum
```

## Step 13: Record the Experiment

Save:

* model
* configuration
* dataset version
* feature version
* metrics
* assumptions

## Step 14: Generate a Research Report

The final report should include both successful and unsuccessful findings.

---

# Example Research Strategy

QuantStrat includes a baseline strategy in which a model predicts next-period return.

Conceptually:

```text
Predicted Return
       │
       ├── > Upper Threshold ──► LONG
       │
       ├── < Lower Threshold ──► SHORT
       │
       └── Otherwise ──────────► NEUTRAL
```

The thresholds are configurable.

The system does not assume the strategy is profitable.

Instead, it calculates the result over the selected historical period.

---

# Baseline Comparison

Machine learning should not automatically receive credit for market behavior that could have been captured by a simpler strategy.

QuantStrat therefore encourages comparisons against:

### Buy and Hold

A passive baseline.

### Equal Weight

A simple portfolio allocation baseline.

### Simple Momentum

A traditional rule-based quantitative baseline.

The purpose is to answer:

> **Does the additional complexity of the ML model actually add value?**

---

# Research Reports

After an experiment, QuantStrat can generate a structured research report.

A report should contain:

```text
Dataset
Features
Model
Training Period
Validation Period
Test Period
Hyperparameters
Prediction Metrics
Strategy Metrics
Risk Metrics
Transaction Costs
Drawdown
Baseline Comparison
Limitations
```

Reports can be stored as:

```text
reports/{experiment_id}.md
```

---

# Harvard Crimson Research Context

QuantStrat can serve as a technical research platform for quantitative-finance work presented, discussed, or developed in an academic or student-research context involving financial markets and computational methods.

In that context, the value of QuantStrat is not simply the ability to produce a prediction.

The platform provides a way to demonstrate the complete chain from:

```text
Mathematical Hypothesis
        ↓
Statistical Representation
        ↓
Machine Learning Model
        ↓
Quantitative Signal
        ↓
Portfolio Construction
        ↓
Historical Simulation
        ↓
Risk Analysis
        ↓
Research Conclusion
```

This makes the project suitable for demonstrating how concepts from:

* mathematics
* statistics
* computer science
* machine learning
* financial economics
* optimization

can be integrated into a single computational research system.

Any specific publication, institutional affiliation, competition result, or recognition should be documented separately and only claimed when independently verifiable.

---

# What Makes QuantStrat Powerful?

The strength of QuantStrat does not come from using the largest possible model.

It comes from connecting multiple disciplines into one controlled system.

### Mathematical Layer

Provides the theoretical foundation.

### Statistical Layer

Measures uncertainty and historical behavior.

### Machine Learning Layer

Searches for nonlinear and predictive relationships.

### Feature Layer

Transforms raw observations into structured signals.

### Portfolio Layer

Converts predictions into allocation decisions.

### Backtesting Layer

Tests decisions through historical simulation.

### Risk Layer

Measures downside and portfolio-level exposure.

### MLOps Layer

Tracks models and experiments.

### DevOps Layer

Makes the research environment reproducible and deployable.

Together, these layers turn QuantStrat from a model into a **quantitative research infrastructure**.

---

# What QuantStrat Is Not

QuantStrat is not:

* a guaranteed trading system
* a financial advisor
* a prediction oracle
* a high-frequency trading engine
* proof of future profitability
* a replacement for professional investment research

Historical backtests describe historical simulations.

Predictions describe model outputs.

Neither guarantees future market behavior.

---

# Limitations

Quantitative finance has fundamental limitations that software cannot eliminate.

## Non-Stationarity

Market relationships can change.

A feature that worked historically may stop working.

## Model Risk

A mathematically correct model can still be poorly specified.

## Data Quality

Bad or incomplete data can invalidate downstream analysis.

## Transaction Costs

Real execution may differ substantially from assumptions.

## Liquidity

Backtests can underestimate market impact.

## Survivorship Bias

Historical universes can be difficult to reconstruct perfectly.

## Overfitting

A strategy can fit historical noise rather than persistent information.

## Distribution Shift

Future market conditions may differ from training data.

## Risk Model Assumptions

VaR, CVaR, volatility, and other statistics depend on assumptions about the return distribution and estimation window.

These limitations are part of the research problem rather than something to hide.

---

# Installation

## Requirements

Recommended environment:

```text
Python 3.12+
Node.js
npm
Docker
Docker Compose
PostgreSQL
Redis
```

For the basic local research workflow, external paid market-data APIs are not required.

---

# Backend Setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

### macOS / Linux

```bash
source .venv/bin/activate
```

### Windows

```powershell
.venv\Scripts\activate
```

Install the project:

```bash
pip install -e .
```

---

# Run the API

```bash
uvicorn apps.api.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

Interactive documentation:

```text
http://localhost:8000/docs
```

---

# Run the Dashboard

From the web application directory:

```bash
cd apps/web
npm install
npm run dev
```

---

# Docker

The complete local environment can be started with:

```bash
docker compose up --build
```

This provides the infrastructure required by the application according to the configured services.

---

# Run Tests

Run the complete test suite:

```bash
pytest
```

With coverage:

```bash
pytest --cov
```

Type checking:

```bash
mypy .
```

Linting:

```bash
ruff check .
```

---

# Reproduce the Example Experiment

Run:

```bash
make reproduce
```

The experiment performs the complete research pipeline:

```text
Generate / Load Data
        ↓
Validate Data
        ↓
Build Features
        ↓
Chronological Split
        ↓
Train Model
        ↓
Evaluate Model
        ↓
Generate Predictions
        ↓
Generate Signals
        ↓
Run Backtest
        ↓
Calculate Portfolio Metrics
        ↓
Calculate Risk Metrics
        ↓
Save Experiment
```

---

# CLI

QuantStrat is designed to expose common research operations through a command-line interface.

Examples:

```bash
stratum data ingest

stratum features build

stratum model train

stratum model evaluate

stratum predict

stratum backtest

stratum risk

stratum experiment list

stratum system check
```

The CLI is intended to provide concise, human-readable research output.

---

# Research Notebooks

The project can include focused research notebooks such as:

```text
01_data_exploration.ipynb
02_feature_engineering.ipynb
03_model_training.ipynb
04_walk_forward_validation.ipynb
05_backtesting.ipynb
06_risk_analysis.ipynb
07_portfolio_optimization.ipynb
```

The notebooks should call reusable QuantStrat package code rather than duplicate the application logic.

---

# Example Experiment Structure

A complete experiment can be represented as:

```text
Experiment
│
├── Dataset
│
├── Feature Set
│
├── Model
│
├── Hyperparameters
│
├── Training Period
│
├── Validation Period
│
├── Test Period
│
├── Predictions
│
├── Signals
│
├── Portfolio
│
├── Backtest
│
├── Risk Report
│
└── Research Report
```

This creates a traceable chain from the original research hypothesis to the final evaluation.

---

# Reproducibility Checklist

Before accepting a quantitative result, verify:

```text
[ ] Dataset identified
[ ] Dataset period recorded
[ ] Features versioned
[ ] Lookback periods recorded
[ ] No future information used
[ ] Train/test periods separated
[ ] Model version recorded
[ ] Hyperparameters recorded
[ ] Random seeds fixed
[ ] Transaction costs specified
[ ] Slippage specified
[ ] Execution assumptions specified
[ ] Baselines evaluated
[ ] Risk metrics calculated
[ ] Limitations documented
```

---

# Research Roadmap

Future development can extend QuantStrat with:

### Advanced Models

* XGBoost
* LightGBM
* temporal neural networks
* transformers for time-series research

### Advanced Portfolio Methods

* Black-Litterman
* factor models
* hierarchical risk parity
* robust optimization
* CVaR optimization

### Advanced Risk

* stress testing
* scenario analysis
* regime detection
* factor exposure
* tail-risk analysis

### Advanced Research

* Bayesian models
* probabilistic forecasting
* causal inference experiments
* regime-aware strategies
* alternative data research

### MLOps

* MLflow
* automated model promotion
* model monitoring
* dataset lineage
* feature drift detection
* prediction drift detection

### Infrastructure

* object storage
* distributed workers
* scheduled data pipelines
* production monitoring
* cloud deployment

---

# Design Principles

QuantStrat follows several engineering rules:

```text
Correctness over complexity
Reproducibility over convenience
Evidence over assumptions
Research over marketing
Simple baselines before complex models
Explicit assumptions over hidden behavior
Testable components over giant scripts
```

The project intentionally avoids unnecessary complexity until there is a measurable reason to introduce it.

---

# Responsible Use

QuantStrat is a **research and educational system**.

Outputs should be interpreted as computational research results rather than guaranteed financial recommendations.

Any live-market use should involve:

* independent validation
* appropriate data licensing
* realistic execution modeling
* risk controls
* regulatory considerations
* professional review

---

# License

MIT License
```

or another license appropriate for the intended distribution model.

---

# Final Perspective

QuantStrat is an attempt to treat quantitative finance as the intersection of several disciplines rather than as a single machine-learning problem.

The central architecture is:

$$
\boxed{
Data
\rightarrow
Mathematics
\rightarrow
Statistics
\rightarrow
Machine\ Learning
\rightarrow
Signals
\rightarrow
Portfolio
\rightarrow
Backtesting
\rightarrow
Risk
}
$$

The goal is not to manufacture impressive performance numbers.

The goal is to create a system in which quantitative ideas can be:

**formulated → implemented → tested → challenged → reproduced → evaluated.**

That is the foundation of QuantStrat.

> **Layered Intelligence for Quantitative Decision Systems**
