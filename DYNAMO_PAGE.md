# Landing Page Outline — futureweather.co/revit

## Hero Section

**Headline:** Generate Future Weather Files, Right Inside Revit

**Subhead:** Generate climate-adjusted EPW and DDY files for 2035-2090 directly from Dynamo. No browser, no manual downloads — just drag, connect, and run.

**CTA:** Install from Dynamo Package Manager | Get Started with 5 Free Credits

## How It Works

### 1. Install the Package

Open Dynamo (from Revit: Manage tab > Dynamo). Go to **Packages > Search for a Package**. Search for **"FutureWeather"** and click **Install**.

### 2. Create a Free Account and Get 5 Free Credits

Sign up at [app.futureweather.co](https://app.futureweather.co) and use the link below to claim **5 free credits** — enough to try the included templates and do a few test runs:

**[Get 5 Free Credits](https://app.futureweather.co/?promo=DYNAMO5)**

### 3. Create an API Key

On the FutureWeather app, navigate to **"API Docs"** on the left navigation menu, then click the **"API Keys"** tab, then click the **"Create Token"** button. Save the token somewhere safe — this is the Personal Access Token (PAT) you will use in Dynamo. It starts with `fw_`.

### 4. Open a Template and Run

The package includes ready-to-use Dynamo templates so you don't have to build a graph from scratch. In Dynamo, go to **File > Open** and navigate to your Dynamo packages folder:

`%APPDATA%\Dynamo\Dynamo Revit\3\packages\FutureWeather\extra\`

Open a template (e.g., `FW_SingleJobExample.dyn`), fill in your inputs, and click **Run**. The node processes your file in under a minute. Check the Watch node for downloaded file paths.

_[Screenshot of the Dynamo canvas with the node connected and results showing]_

## Included Templates

The package includes ready-to-use Dynamo templates in `FutureWeather/extra`, so you do not have to build the graph from scratch just to try the workflow. They are meant to give users a working starting point that can be used as-is or adapted into a firm's own project handoff template.

- **FW_SingleJobExample.dyn** — Generate a single future EPW file. The simplest starting point: provide an EPW, choose a year and scenario, and get a future-adjusted EPW and STAT file back.
- **FW_SingleJobWithDDYExample.dyn** — Same as above, but also provide a historical DDY file to generate a matching future DDY for HVAC sizing.
- **FW_BatchJobExample.dyn** — Generate multiple future EPW files at once. Provide lists of years and scenarios (e.g., {2050, 2080} x {SSP2-4.5, SSP5-8.5} = 4 files). Results are organized into subdirectories by year and scenario.
- **FW_BatchJobWithDDYExample.dyn** — Batch generation with DDY files included. Same multi-year/multi-scenario setup, with future DDY files generated alongside each EPW.

## Input Reference

Every input field you'll see on the FW nodes, explained:

| Input            | Required    | Description                                                                                                                                  |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **pat**          | Yes         | Your Personal Access Token. Starts with `fw_`. Create one in the FutureWeather app under API Docs > API Keys.                                |
| **epw_path**     | Yes         | File path to your historical EPW weather file. Use a File Path node in Dynamo to select it.                                                  |
| **future_year**  | Yes         | The target future year for climate adjustment. Integer value between 2035 and 2090 (e.g., `2050`).                                           |
| **future_years** | Yes (batch) | A list of target years for batch generation. Use a Code Block node: `[2050, 2080]`.                                                          |
| **scenario**     | Yes         | The CMIP6 climate scenario (SSP). See the scenario table below.                                                                              |
| **scenarios**    | Yes (batch) | A list of scenarios for batch generation. Use a Code Block node: `["ssp245", "ssp585"]`.                                                     |
| **output_dir**   | Yes         | Directory where generated files will be saved. Use a Directory Path node in Dynamo.                                                          |
| **ddy_path**     | No          | File path to a historical DDY file. When provided, a future-adjusted DDY file is generated alongside the EPW. Use a File Path node.          |
| **job_name**     | No          | A label for this job (e.g., `"Chicago Office 2050"`). Helps you find it later in your FutureWeather.co dashboard.                            |
| **project_name** | No          | Assign the job to a project for organization (e.g., `"Chicago Office"`). If the project doesn't exist yet, it will be created automatically. |

### Climate Scenarios

| Scenario | Code     | Description                      | Global Warming by 2100 |
| -------- | -------- | -------------------------------- | ---------------------- |
| SSP1-2.6 | `ssp126` | Low emissions, strong mitigation | ~1.8°C                 |
| SSP2-4.5 | `ssp245` | Middle of the road               | ~2.7°C                 |
| SSP3-7.0 | `ssp370` | High emissions                   | ~3.6°C                 |
| SSP5-8.5 | `ssp585` | Very high emissions              | ~4.4°C                 |

Most users start with **SSP2-4.5** (`ssp245`) as a moderate baseline. For resilience or worst-case studies, use **SSP5-8.5** (`ssp585`).

### Climate Models

FutureWeather uses an ensemble of **23 CMIP6 global climate models (GCMs)** to produce robust multi-model average projections. The Dynamo package always uses the full ensemble of all 23 models by default, and no selection is needed.

For users who need to select specific climate models (e.g., for research or to match a particular study), the [FutureWeather.co web app](https://app.futureweather.co) and [API](https://app.futureweather.co/api) allow selecting any combination of the 23 available GCMs.

## What You Get

Each run produces up to three files:

| File            | Purpose                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| **Future EPW**  | Annual hourly weather for energy simulation (EnergyPlus, OpenStudio, DesignBuilder). Always generated.   |
| **Future DDY**  | Design day conditions for HVAC sizing (ASHRAE format). Generated when you provide a historical DDY file. |
| **STAT Report** | Climate statistics summary. Always generated alongside the EPW.                                          |

## Batch Generation

Need multiple scenarios? Use **FW.FutureWeatherBatchJob** to generate all combinations at once.

Example: `[2050, 2080]` x `["ssp245", "ssp585"]` = 4 future weather files in a single run (4 credits).

Results are organized into folders by year and scenario: `output_dir/2050_ssp245/`, `output_dir/2050_ssp585/`, etc.

_[Screenshot of batch node with code block inputs]_

## Why Future Weather?

Buildings designed today will operate for 30-60+ years. Historical weather data doesn't account for climate change.

- **Energy codes** are beginning to require future climate analysis
- **LEED, BREEAM, and Passive House** projects benefit from future-year simulations
- **Resilience planning** needs worst-case scenario modeling
- **HVAC sizing** based on today's design days may undersize future cooling loads

## The Science

- **CMIP6** climate projections (IPCC AR6 — current generation)
- **23 global climate models** for robust multi-model averages
- **4 scenarios** from optimistic (SSP1-2.6) to high-emissions (SSP5-8.5)
- **Peer-reviewed methodology** from the University of Coimbra (145+ citations)

## Pricing

The Dynamo package is **free**. Weather file generation uses credits (1 credit = 1 run, which includes an EPW, STAT, and optional DDY):

| Credits | Price  | Per File |
| ------- | ------ | -------- |
| 1       | $50    | $50      |
| 4       | $100   | $25      |
| 8       | $160   | $20      |
| 10+     | $17/ea | $17      |

[Buy Credits](https://app.futureweather.co)

**Try it free:** New users can get **5 free credits** to test the service and try the included templates: **[Get 5 Free Credits](https://app.futureweather.co/?promo=DYNAMO5)**

## Works With Your Existing Tools

Future EPW files are standard EnergyPlus format. Use them with:

- EnergyPlus
- OpenStudio
- DesignBuilder
- Ladybug Tools
- IES VE
- Any tool that reads EPW files

## Compatible With

- Revit 2025 and 2026
- Dynamo 3.x and 4.0
- Windows 10/11
