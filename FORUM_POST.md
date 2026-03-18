# Draft Forum Post — forum.dynamobim.com (Packages category)

---

**Title:** [New Package] FutureWeather — Generate future EPW/DDY files in Dynamo for downstream energy modeling

**Category:** Packages

**Body:**

Hi everyone,

I wanted to share **FutureWeather**, a new Dynamo package we've just published. This package has been developed to support workflows where the project starts in Revit/Dynamo, but the analysis happens downstream in tools that use **EPW** and **DDY** weather files, such as EnergyPlus, OpenStudio, DesignBuilder, IES VE, Pollination, or similar tools.

## What it does

FutureWeather takes a historical EPW weather file and generates future climate-adjusted **EPW** and optional **DDY** files for any future year(s) between 2035-2090 using the latest global climate model projections (**CMIP6**).

The idea is simple: if your team is already preparing model data in Revit or Dynamo before sending it on for simulation, you can generate the future weather package there too, instead of using a separate workflow.

The package calls the [FutureWeather.co](https://futureweather.co) API behind the scenes, so processing happens in the cloud and typically takes under a minute per file.

## Who this is for

This may be useful if you:

- use Dynamo to automate project setup, exports, or analysis prep
- hand off Revit-based projects to an energy modeler
- run building performance, resilience, comfort, or HVAC sizing studies in downstream simulation tools
- want future **design day** (DDY) files to stay aligned with the future annual weather file

## Why we built it

We built the FutureWeather dynamo package to make future climate files as easy to generate and use as today's historical EPWs, especially in workflows where the model starts in Revit but the analysis happens downstream. Instead of treating future weather as a separate manual step, we wanted teams to be able to package future EPW and DDY files into the same repeatable handoff they already use for energy modeling, HVAC sizing, and resilience studies.

## The science

The FutureWeather.co platform is developed by Radbridge Incorporated in partnership with the [CURA Lab at the University of Coimbra](https://cura-lab.adai.pt/), who serve as technical advisors. The underlying morphing methodology is based on [Rodrigues et al. (2023)](https://www.sciencedirect.com/science/article/pii/S0360132323001312), a peer-reviewed paper with 180+ citations, applying monthly change factors derived from an ensemble of 23 CMIP6 climate models across all four SSP scenarios.

A technical (non-commercial) presentation on the platform was given to **ASHRAE Technical Committee 4.2 (Climatic Conditions)** in February 2026, which can be downloaded from the futureweather.co website. DesignBuilder has also built a production integration around the same API this package uses, which may be of interest to teams whose simulation workflow runs through that tool.

## Nodes included

- **FW.FutureWeatherSingleJob** — submit, wait, and download in one step
- **FW.FutureWeatherBatchJob** — generate multiple year/scenario combinations at once
- **FW.Authenticate** — validate API key and check credits
- **FW.GenerateFutureWeather**
- **FW.CheckJobStatus**
- **FW.DownloadResults**

## Output files

- **EPW** — future-adjusted weather file for annual simulation
- **DDY** — future design day file for HVAC sizing, if you provide a historical DDY
- **STAT** — climate statistics report

## Example use case

For example, if a team is preparing a project for downstream simulation, they could use Dynamo to:

1. select the baseline EPW
2. generate one or more future weather files, representing different combinations of future years and climate scenarios
3. optionally generate matching future DDY files
4. pass those files along with the model to the next analysis step

So the future-weather files are already packaged with the project instead of being created later as a separate manual task.

## Getting started

1. In Revit, go to the **Manage** tab and open **Dynamo**. Then open the Package Manager and search for `FutureWeather`.
2. Create an account at [app.futureweather.co](https://app.futureweather.co). For a limited time, new users can use this promo link to get **5 free credits** for testing and dry runs: [https://app.futureweather.co/?promo=DYNAMO5](https://app.futureweather.co/?promo=DYNAMO5)
3. Create an API Key: On the futureweather.co app, navigate to "API Docs" on the left navigation menu, then click the "API Keys" tab, then create a token by clicking the "Create Token" button. Save it somewhere safe - this will be pasted into the "API Key (PAT)" string input in Dynamo.
4. In Dynamo, open one of the included templates from the installed package folder. They do **not** appear in the node library. Use **File > Open** and browse to the installed package directory under your Windows user profile, or just copy/paste one of these addresses into File Explorer:
   - `%APPDATA%\Dynamo\Dynamo Revit\3.6\packages\FutureWeather\extra\` for a Revit / Dynamo 3.6 setup
   - `%APPDATA%\Dynamo\Dynamo Revit\4\packages\FutureWeather\extra\` for a Dynamo 4.x Revit install
   - If your Dynamo version is different, replace `3.6` with your installed Revit Dynamo version (for example `3.5`, `3.7`, etc.)

   Note: `%APPDATA%` is a Windows shortcut for your user **AppData\Roaming** folder (for example `C:\Users\YourName\AppData\Roaming`). It is different from `AppData\Local`.

   Then choose one of these template files:
   - `FW_SingleJobExample.dyn` — generate one future EPW for a single year and scenario
   - `FW_SingleJobWithDDYExample.dyn` — same as above, plus a future DDY file (provide a historical DDY as input)
   - `FW_BatchJobExample.dyn` — generate EPWs for multiple year/scenario combinations in one run (e.g. 2050 + 2080 × SSP2-4.5 + SSP5-8.5 = 4 files)
   - `FW_BatchJobWithDDYExample.dyn` — same as above, with future DDY files generated for each combination

5. Connect your EPW file (and DDY file if applicable), choose a future year(s) and climate scenario(s), and click "Run". In general, files should take under a minute each to generate.

## Known issue: node layout

When you open a template, the nodes may appear bunched together in the top-left corner. This is a known Dynamo 3.6 layout issue. To fix it, press **Ctrl+L** (Edit > Cleanup Node Layout) to auto-arrange the nodes.

## Included templates

One thing I think adds a lot of value here is that the package includes ready-to-use Dynamo templates in `FutureWeather/extra`, so you do not have to build the graph from scratch just to try the workflow.

- `FW_SingleJobExample.dyn` — single future EPW workflow
- `FW_SingleJobWithDDYExample.dyn` — single job with future DDY generation
- `FW_BatchJobExample.dyn` — batch generation across multiple years/scenarios
- `FW_BatchJobWithDDYExample.dyn` — batch workflow with DDY generation

They are meant to give users a working starting point that can be used as-is or adapted into a firm's own project handoff template.

## Pricing

For a limited time, new users can get **5 free credits** to test the service, try the included Dynamo templates, and do a couple of dry runs to work out any issues:

[https://app.futureweather.co/?promo=DYNAMO5](https://app.futureweather.co/?promo=DYNAMO5)

After that, credits are available at standard rates. Pricing starts at **$50 for 1 credit** (one run includes an EPW, STAT, and optional DDY), drops to **$25 per credit** for 4-credit bundles, and to **$17 per credit** for 10 or more.

## Technical notes

- targets Revit 2025+ / current Dynamo Python environments
- pure Python package, no C# dependency
- no extra pip install needed
- outputs standard weather files (EPW/DDY/STAT) that can be used in existing simulation workflows

If this sounds useful for your workflow, please check it out. Let me know if you encounter any issues, or if you have any feedback or questions. You can reach me at support@futureweather.co.

Thanks!

Rowan
Head of Product, www.FutureWeather.co
CEO, Radbridge Incorporated, www.radbridge.com

---
