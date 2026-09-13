# QuantStrat Suite

You are a senior quantitative researcher, machine learning engineer, mathematical modeler, Python architect, and DevOps engineer.

Your task is to design and implement a complete portfolio-grade quantitative finance platform called:

STRATUM

Tagline:

"Layered Intelligence for Quantitative Decision Systems"

STRATUM is a quantitative finance research and decision-support system combining:

1. Machine Learning

2. Deep Mathematics

3. Statistical Modeling

4. Risk Analysis

5. Portfolio Optimization

6. Time-Series Analysis

7. Feature Engineering

8. Backtesting

9. MLOps

10. DevOps

The objective is NOT to create a toy ML notebook.

Build STRATUM as a real, modular software system that can ingest financial market data, engineer features, perform mathematical and statistical analysis, train machine-learning models, generate quantitative signals, evaluate strategies through rigorous backtesting, calculate risk metrics, and expose the results through an API and web dashboard.

IMPORTANT:

This is a research and educational quantitative-finance system.

Do NOT represent its outputs as guaranteed financial advice.

Do NOT fabricate historical data, model performance, returns, Sharpe ratios, accuracy, or backtest results.

If real market data is unavailable, clearly label generated/demo data as synthetic.

Prevent look-ahead bias, survivorship bias where possible, and data leakage.

Every performance result must be reproducible from code and data.

==================================================

1. CORE ARCHITECTURE

==================================================

Use this conceptual architecture:

                         MARKET DATA

                             |

                             v

                 +-----------------------+

                 | Data Ingestion Layer  |

                 +-----------------------+

                             |

                             v

                 +-----------------------+

                 | Data Validation       |

                 | & Cleaning            |

                 +-----------------------+

                             |

                             v

                 +-----------------------+

                 | Feature Engineering   |

                 +-----------------------+

                             |

               +-------------+-------------+

               |                           |

               v                           v

      +------------------+       +---------------------+

      | ML Layer         |       | Mathematical Layer  |

      |                  |       |                     |

      | Regression       |       | Returns             |

      | Classification   |       | Volatility          |

      | Time Series      |       | Covariance          |

      | Ensemble Models  |       | Correlation         |

      | Probabilities    |       | Risk                |

      +------------------+       | Optimization         |

               |                 +---------------------+

               |                           |

               +-------------+-------------+

                             |

                             v

                  +----------------------+

                  | Signal Generation    |

                  +----------------------+

                             |

                             v

                  +----------------------+

                  | Portfolio / Strategy |

                  | Engine               |

                  +----------------------+

                             |

                             v

                  +----------------------+

                  | Backtesting Engine   |

                  +----------------------+

                             |

                             v

                  +----------------------+

                  | Risk & Performance   |

                  | Analytics             |

                  +----------------------+

                             |

                             v

                  +----------------------+

                  | API / Dashboard      |

                  +----------------------+

                             |

                             v

                  +----------------------+

                  | DevOps / MLOps       |

                  +----------------------+

Use clean interfaces between every layer.

==================================================

2. TECHNOLOGY STACK

==================================================

Use Python as the primary language.

Backend:

- Python 3.12+

- FastAPI

- Pydantic

- Uvicorn

Data:

- pandas

- NumPy

- Polars where useful for performance

- PyArrow

- Parquet

Machine Learning:

- scikit-learn

- XGBoost or LightGBM if appropriate

- optionally PyTorch for a neural-network experiment

Mathematics / Statistics:

- SciPy

- NumPy

- statsmodels

Optimization:

- scipy.optimize

- CVXPY where appropriate

Database:

- PostgreSQL

- SQLAlchemy

- Alembic

Caching:

- Redis

Frontend:

- React

- TypeScript

- Vite

- Tailwind CSS

- Recharts or another suitable charting library

Infrastructure:

- Docker

- Docker Compose

- GitHub Actions

Testing:

- pytest

- pytest-cov

- mypy

- Ruff

Documentation:

- Markdown

- OpenAPI through FastAPI

- architecture diagrams using Mermaid

Optional:

- MLflow for experiment tracking

- MinIO/S3-compatible object storage for datasets and model artifacts

Do not introduce unnecessary dependencies.

==================================================

3. PROJECT STRUCTURE

==================================================

Create a professional monorepo:

stratum/

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

├── docs/

│

├── scripts/

│

├── docker-compose.yml

├── Dockerfile

├── pyproject.toml

├── .env.example

├── Makefile

└── README.md

Keep business logic separate from API and UI code.

==================================================

4. DATA INGESTION

==================================================

Create a provider abstraction:

MarketDataProvider

with methods such as:

get_historical_prices()

get_latest_prices()

get_volume()

get_asset_metadata()

Do not hard-code one provider throughout the application.

Implement:

1. CSV provider

2. Synthetic data provider

3. Optional public market-data provider

The system must work without an external API key.

Create realistic synthetic OHLCV data for development and testing.

Synthetic data must be clearly identified.

Support:

- Open

- High

- Low

- Close

- Adjusted Close where available

- Volume

- Timestamp

- Symbol

Validate:

- missing timestamps

- duplicate timestamps

- invalid OHLC relationships

- missing values

- extreme anomalies

- timezone consistency

==================================================

5. FEATURE ENGINEERING

==================================================

Implement reusable feature pipelines.

Features should include:

Price-based:

- simple returns

- logarithmic returns

- rolling returns

- momentum

- moving averages

- exponential moving averages

Volatility:

- rolling standard deviation

- exponentially weighted volatility

- ATR

Trend:

- moving-average relationships

- momentum indicators

Volume:

- volume change

- rolling volume

- volume z-score

Statistical:

- rolling mean

- rolling variance

- skewness

- kurtosis

- autocorrelation

Technical indicators may include:

- RSI

- MACD

- Bollinger Bands

Every feature must specify its lookback period.

CRITICAL:

All features at timestamp t must use information available at or before t.

Never use future observations.

Create feature metadata so the system knows:

feature_name

lookback

source_columns

creation_timestamp

version

==================================================

6. MATHEMATICAL ENGINE

==================================================

Build a dedicated mathematics package.

Implement:

Returns:

r_t = P_t / P_{t-1} - 1

and logarithmic returns:

r_t = ln(P_t / P_{t-1})

Volatility:

rolling volatility

annualized volatility

Covariance:

rolling covariance matrix

Correlation:

rolling correlation matrix

Drawdown:

peak-to-trough drawdown

Risk metrics:

- volatility

- maximum drawdown

- Value at Risk

- Conditional Value at Risk

- downside deviation

- beta

- correlation

Implement multiple VaR methods where practical:

1. Historical VaR

2. Parametric VaR

Do not pretend these models are universally accurate.

Document assumptions.

==================================================

7. PORTFOLIO OPTIMIZATION

==================================================

Implement portfolio optimization.

Support:

Equal Weight

Minimum Variance

Maximum Sharpe-style optimization

Risk-aware optimization

Use constraints:

- weights sum to 1

- configurable long-only constraint

- configurable maximum asset weight

- configurable minimum asset weight

Use CVXPY or scipy.optimize.

Implement:

portfolio_return()

portfolio_volatility()

portfolio_sharpe()

portfolio_drawdown()

Return:

weights

expected return

volatility

risk metrics

objective value

Clearly separate estimated quantities from realized historical results.

==================================================

8. MACHINE LEARNING ENGINE

==================================================

Create a model abstraction.

Base interface:

QuantModel

Methods:

fit()

predict()

predict_proba()

save()

load()

evaluate()

Implement baseline models first.

Models:

1. Linear Regression

2. Logistic Regression

3. Random Forest

4. Gradient Boosting

5. XGBoost or LightGBM if dependency availability permits

Optional:

6. Neural Network using PyTorch

The first production path should remain simple and interpretable.

Target examples:

Regression:

predict future return over a configurable horizon.

Classification:

predict whether future return is positive.

Never train using future information.

==================================================

9. TIME-SERIES VALIDATION

==================================================

Do NOT use ordinary random train/test splitting for time-series prediction.

Implement:

- chronological train/validation/test split

- expanding-window validation

- walk-forward validation

Example:

Train:

2019-2022

Validation:

2023

Test:

2024

The actual periods must be configurable.

Prevent leakage.

Create a reusable:

TimeSeriesSplitter

class.

==================================================

10. MODEL EVALUATION

==================================================

For regression:

- MAE

- MSE

- RMSE

- R²

For classification:

- accuracy

- precision

- recall

- F1

- ROC-AUC

- confusion matrix

For quantitative usefulness:

- cumulative return

- annualized return

- volatility

- Sharpe ratio

- Sortino ratio

- maximum drawdown

- Calmar ratio

- turnover

Do not optimize solely for ML prediction accuracy.

The system should distinguish:

MODEL PERFORMANCE

from

STRATEGY PERFORMANCE

These are not the same thing.

==================================================

11. SIGNAL GENERATION

==================================================

Build a signal engine.

Inputs:

- model prediction

- prediction probability

- confidence threshold

- risk constraints

- market conditions

Possible signals:

LONG

NEUTRAL

SHORT

For long-only strategies:

BUY

HOLD

SELL

Make thresholds configurable.

Example:

prediction > upper_threshold

    -> LONG

prediction < lower_threshold

    -> SHORT

otherwise

    -> NEUTRAL

Do not create signals from future data.

Every signal must contain:

timestamp

symbol

prediction

probability/confidence

signal

model_version

==================================================

12. BACKTESTING ENGINE

==================================================

Build a proper event/time-based backtesting engine.

It must simulate:

- positions

- portfolio value

- transactions

- fees

- slippage

- turnover

- cash

- exposure

Parameters:

initial_capital

transaction_cost

slippage

rebalance_frequency

Support:

- daily backtesting

- configurable rebalance frequency

Produce:

equity curve

daily returns

positions

trades

transaction costs

drawdowns

IMPORTANT:

Do not create fake profitable results.

If the strategy performs poorly, show that honestly.

==================================================

13. BACKTESTING SAFETY

==================================================

Implement protections against:

Look-ahead bias

Data leakage

Survivorship bias where possible

Incorrect timestamp alignment

Using closing prices to generate a signal and assuming execution at that same unavailable close

Overfitting

Transaction-cost neglect

Unrealistic execution

The README must explain these limitations.

==================================================

14. RISK ENGINE

==================================================

Create a dedicated risk package.

Implement:

- volatility

- beta

- VaR

- CVaR

- maximum drawdown

- concentration risk

- exposure

- turnover

- downside risk

Portfolio-level metrics should update automatically after backtests.

Create a RiskReport object.

==================================================

15. EXPERIMENT TRACKING

==================================================

Create an experiment abstraction.

Every ML experiment should store:

experiment_id

model_name

model_version

dataset_version

feature_version

hyperparameters

training_period

validation_period

test_period

metrics

timestamp

If MLflow is used, integrate it cleanly.

Do not make MLflow mandatory for local development.

==================================================

16. MODEL REGISTRY

==================================================

Create:

ModelRegistry

It should support:

register_model()

load_model()

list_models()

promote_model()

archive_model()

Store metadata.

Example:

models/

    model_name/

        version/

            model.pkl

            metadata.json

==================================================

17. API

==================================================

Build FastAPI endpoints.

Examples:

GET /health

GET /assets

GET /market/{symbol}

GET /features/{symbol}

POST /models/train

GET /models

GET /models/{model_id}

POST /predict

POST /signals

POST /backtest

GET /backtest/{id}

GET /risk/{portfolio_id}

GET /portfolio/{id}

GET /experiments

GET /system/status

Generate automatic OpenAPI documentation.

Use Pydantic schemas.

Validate every request.

==================================================

18. WEB DASHBOARD

==================================================

Build a professional quantitative research dashboard.

Design language:

- dark professional interface

- subtle grid background

- restrained colors

- high information density

- clean typography

- responsive layout

Do not make it look like a generic crypto dashboard.

Pages:

1. Overview

2. Market Data

3. Feature Explorer

4. Model Lab

5. Predictions

6. Signals

7. Backtesting

8. Portfolio

9. Risk

10. Experiments

11. System Health

Overview should show:

- selected asset

- latest price

- daily return

- volatility

- model prediction

- confidence

- current signal

- portfolio value

- drawdown

- Sharpe ratio

Use charts for:

- price

- returns

- equity curve

- drawdown

- volatility

- feature importance

- portfolio allocation

- correlation matrix

==================================================

19. MODEL INTERPRETABILITY

==================================================

Implement feature importance.

For tree models:

- feature importance

- permutation importance

Where practical, support SHAP.

Explain:

Which features influence predictions?

Do not present feature importance as causal evidence.

==================================================

20. CONFIGURATION

==================================================

Never hard-code important parameters.

Use environment variables and configuration files.

Example:

STRATUM_ENV=development

DATABASE_URL=

REDIS_URL=

DATA_PROVIDER=

INITIAL_CAPITAL=

TRANSACTION_COST=

SLIPPAGE=

MODEL_VERSION=

Create:

.env.example

Never commit secrets.

==================================================

21. DATABASE

==================================================

Use PostgreSQL.

Create tables for:

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

Use SQLAlchemy models.

Use Alembic migrations.

Do not store large ML artifacts directly inside PostgreSQL.

==================================================

22. REDIS

==================================================

Use Redis for:

- caching latest market data

- temporary task state

- optional job queues

Do not make Redis required for simple unit tests.

==================================================

23. ASYNCHRONOUS JOBS

==================================================

Training and large backtests should not block API requests.

Design a background-job abstraction.

Possible implementation:

Celery + Redis

or

RQ + Redis

Choose the simpler option.

Expose job status:

GET /jobs/{job_id}

==================================================

24. DEVOPS

==================================================

Containerize the complete application.

Create:

Dockerfile

docker-compose.yml

Services:

api

web

postgres

redis

Optional:

worker

Use multi-stage Docker builds where appropriate.

Keep images reasonably small.

==================================================

25. CI/CD

==================================================

Create GitHub Actions workflows.

Pipeline:

1. checkout

2. install dependencies

3. lint

4. type check

5. unit tests

6. integration tests

7. build Docker images

8. security/dependency checks

Fail the pipeline if tests fail.

Do not deploy broken builds.

==================================================

26. TESTING

==================================================

Write serious tests.

Unit tests:

- returns

- volatility

- covariance

- VaR

- CVaR

- drawdown

- portfolio metrics

- feature generation

- signal generation

ML tests:

- deterministic training with fixed seeds

- no NaN predictions

- correct train/test separation

Backtesting tests:

- transaction costs

- slippage

- position accounting

- cash accounting

- drawdown calculation

- timestamp alignment

API tests:

- health

- prediction

- backtest

- risk

- model endpoints

Integration tests:

API + PostgreSQL

API + Redis

==================================================

27. REPRODUCIBILITY

==================================================

Set random seeds.

Track:

- Python version

- dependency versions

- dataset version

- feature version

- model version

- configuration

Every experiment must be reproducible.

Create a command:

make reproduce

that runs a complete example experiment from data ingestion through evaluation.

==================================================

28. CLI

==================================================

Create a command-line interface.

Examples:

stratum data ingest

stratum features build

stratum model train

stratum model evaluate

stratum predict

stratum backtest

stratum risk

stratum experiment list

stratum system check

The CLI should produce useful human-readable output.

==================================================

29. DEMO WORKFLOW

==================================================

Create one complete end-to-end demo.

The demo should:

1. Generate or load historical data

2. Validate the data

3. Build features

4. Split chronologically

5. Train a baseline ML model

6. Evaluate it

7. Generate predictions

8. Generate signals

9. Run a backtest

10. Calculate portfolio metrics

11. Calculate risk metrics

12. Save the experiment

13. Display results through the dashboard

The demo must work locally with:

docker compose up

and should not require paid APIs.

==================================================

30. DOCUMENTATION

==================================================

Create an excellent README.

README sections:

# STRATUM

## Overview

## Why STRATUM?

## Architecture

## Mathematical Foundation

## Machine Learning

## Feature Engineering

## Portfolio Optimization

## Risk Engine

## Backtesting

## API

## Dashboard

## DevOps

## MLOps

## Installation

## Quick Start

## Example Workflow

## Testing

## Reproducibility

## Limitations

## Roadmap

## License

Include architecture diagrams.

Explain the mathematical assumptions.

Explain why time-series validation is used.

Explain look-ahead bias.

Explain transaction costs.

==================================================

31. MATHEMATICAL DOCUMENTATION

==================================================

Create docs/mathematics.md.

Document the mathematics behind:

- returns

- logarithmic returns

- volatility

- covariance

- correlation

- portfolio return

- portfolio volatility

- Sharpe ratio

- Sortino ratio

- drawdown

- VaR

- CVaR

- beta

- portfolio optimization

Use equations where appropriate.

Explain every variable.

Do not include equations merely to look impressive.

==================================================

32. RESEARCH NOTEBOOKS

==================================================

Create notebooks:

01_data_exploration.ipynb

02_feature_engineering.ipynb

03_model_training.ipynb

04_walk_forward_validation.ipynb

05_backtesting.ipynb

06_risk_analysis.ipynb

07_portfolio_optimization.ipynb

Notebooks should call reusable package code.

Do NOT duplicate the entire application inside notebooks.

==================================================

33. SECURITY

==================================================

Implement basic security best practices.

- validate API inputs

- do not expose secrets

- sanitize configuration

- restrict CORS appropriately

- avoid arbitrary code execution

- use dependency pinning

- use non-root Docker users where practical

==================================================

34. OBSERVABILITY

==================================================

Implement structured logging.

Log:

- requests

- model training

- prediction jobs

- backtests

- failures

- job status

Create:

GET /system/status

Return:

API status

database status

Redis status

model registry status

data provider status

==================================================

35. PERFORMANCE

==================================================

Avoid unnecessary recomputation.

Use:

- vectorized NumPy/pandas operations

- Parquet for datasets

- caching

- database indexes

- asynchronous jobs where appropriate

Do not prematurely optimize everything.

Prioritize correctness.

==================================================

36. CODE QUALITY

==================================================

Follow:

PEP 8

Type hints

Docstrings for public functions/classes

Small modules

Single responsibility

Dependency injection where useful

Clear naming

No giant files

No duplicated business logic

No magic numbers

No unused imports

No dead code

No fake implementations hidden behind impressive names.

==================================================

37. ERROR HANDLING

==================================================

Create meaningful custom exceptions.

Examples:

DataValidationError

FeatureGenerationError

ModelTrainingError

BacktestError

RiskCalculationError

ModelNotFoundError

API errors should return structured JSON.

==================================================

38. FRONTEND UX

==================================================

The dashboard should clearly distinguish:

Observed data

Model predictions

Backtested results

Simulated/demo data

Do not visually imply that predicted returns are guaranteed.

Show timestamps.

Show model version.

Show dataset period.

Show backtest assumptions.

For every backtest, display:

Initial capital

Transaction costs

Slippage

Period

Strategy

Model

Final portfolio value

Total return

Annualized return

Volatility

Sharpe

Maximum drawdown

Turnover

==================================================

39. EXAMPLE RESEARCH STRATEGY

==================================================

Create one baseline strategy.

Example:

Model predicts next-period return.

If predicted return > threshold:

    LONG

If predicted return < negative threshold:

    SHORT

Otherwise:

    NEUTRAL

Make thresholds configurable.

Do not claim that this strategy is profitable.

The application should calculate whether it was profitable on the selected historical period.

==================================================

40. COMPARISON BASELINES

==================================================

Every ML strategy should be compared against simple baselines.

At minimum:

1. Buy and Hold

2. Equal Weight

3. Simple Momentum

This prevents the ML model from receiving credit for performance that could have been obtained more simply.

==================================================

41. RESEARCH REPORT

==================================================

Generate an automated research report after each experiment.

Report:

Dataset

Features

Model

Training period

Validation period

Test period

Hyperparameters

Prediction metrics

Strategy metrics

Risk metrics

Transaction costs

Drawdown

Baseline comparison

Limitations

Save as:

reports/{experiment_id}.md

==================================================

42. NO FABRICATION POLICY

==================================================

This is extremely important.

Never fabricate:

- market prices

- historical returns

- Sharpe ratios

- model accuracy

- profits

- competition results

- Harvard affiliation

- Stanford affiliation

- datasets

- investors

- users

- production deployments

If something has not actually been measured, label it:

"Not yet measured"

If using synthetic data, explicitly say:

"Synthetic development data"

If an external data provider is unavailable, do not pretend otherwise.

==================================================

43. IMPLEMENTATION STRATEGY

==================================================

Do NOT attempt to create everything as one giant code dump.

Work incrementally.

Phase 1:

Repository structure

Configuration

Logging

Core domain models

Phase 2:

Data ingestion

Validation

Synthetic data

Phase 3:

Feature engineering

Mathematical engine

Phase 4:

ML engine

Time-series validation

Model registry

Phase 5:

Signal generation

Backtesting

Phase 6:

Risk engine

Portfolio optimization

Phase 7:

FastAPI

Phase 8:

React dashboard

Phase 9:

PostgreSQL

Redis

background jobs

Phase 10:

Docker

GitHub Actions

testing

Phase 11:

Documentation

research notebooks

demo experiment

After every phase:

- run tests

- fix errors

- update documentation

- verify imports

- verify type checking

- verify the application still starts

==================================================

44. DEFINITION OF DONE

==================================================

STRATUM is complete only when:

[ ] API starts successfully

[ ] Frontend starts successfully

[ ] PostgreSQL connects

[ ] Redis connects

[ ] Synthetic data pipeline works

[ ] Feature pipeline works

[ ] Mathematical engine passes tests

[ ] ML model trains

[ ] Walk-forward validation works

[ ] Signals are generated

[ ] Backtesting works

[ ] Transaction costs are included

[ ] Risk metrics work

[ ] Portfolio optimization works

[ ] Model registry works

[ ] Experiment tracking works

[ ] Dashboard displays results

[ ] CLI works

[ ] Docker Compose works

[ ] GitHub Actions works

[ ] Unit tests pass

[ ] Integration tests pass

[ ] Type checking passes

[ ] Linting passes

[ ] README is complete

[ ] Mathematical documentation is complete

[ ] No fabricated performance claims exist

[ ] No secrets are committed

==================================================

45. FINAL OUTPUT

==================================================

At the end, provide:

1. Complete repository tree

2. Technology stack

3. Architecture explanation

4. Mathematical models implemented

5. ML models implemented

6. Backtesting methodology

7. Risk methodology

8. API endpoints

9. Dashboard pages

10. DevOps architecture

11. How to run locally

12. How to run tests

13. Example experiment

14. Known limitations

15. Future roadmap

Most importantly:

Build the actual system.

Do not merely describe how it could be built.

When you encounter a design decision, choose a sensible implementation and continue.

Prioritize:

CORRECTNESS

REPRODUCIBILITY

MATHEMATICAL VALIDITY

TESTABILITY

ENGINEERING QUALITY

over visual complexity or unnecessary features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ca43b8b0-6e3d-4247-8ad8-c5f0d91bfda4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
