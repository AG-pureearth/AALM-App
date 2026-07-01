# All Ages Lead Model (AALM) v3.1 — Model Summary

This document summarizes how the All Ages Lead Model (AALM) version 3.1 works and
what users can input and change. It is intended as an orientation guide; the
authoritative references remain the AALM v3.1 *Users Guide*, the *Technical Support
Document for the AALM v3.0*, and the *Respiratory Module Documentation*.

---

## 1. What the model is

The AALM is a **biokinetic model for lead (Pb) in the human body**. It predicts how
lead taken in from the environment (air, dust, soil, water, food, and other sources)
moves into the blood, is distributed among organs and bone, and is eventually
excreted — across the **entire human lifespan**, from birth to old age.

The core of v3.1 is an updated implementation of the **1993 Leggett** radionuclide
biokinetic model, re-parameterized for lead. The executable program is internally
named `Leg20` (version "30 Aug 2024"). Version 3.1 adds a new **respiratory
(lung) module** that models particle deposition and clearance in the airways.

Typical uses:

- Estimate **blood lead level (BLL)** over time from a given exposure scenario.
- Back-calculate the exposure required to reach a **target blood lead level**
  (the "iterate" mode).
- Compare the contribution of different exposure sources and media.

---

## 2. How a simulation flows (the software pieces)

```
AALM_Inputs_v3-1.xlsm  →  LeggettInput.txt  →  AALM_64.exe  →  CSV output files  →  AALM_ExploreData_v3-1.xlsm
   (set up the run)        (plain-text          (the model)      (one folder per       (view & plot results)
                            parameter file)                       run, named by run)
```

| File | Role |
|------|------|
| **AALM_Inputs_v3-1.xlsm** | Excel/VBA user interface. You enter all settings here; its macros write out the plain-text `LeggettInput.txt` and a per-run `<RunName>_FortranInput.xlsm`. This is where users normally do their work. |
| **LeggettInput.txt** | The plain-text parameter file the executable actually reads. It is comma-delimited and human-readable, so advanced users can inspect or edit it directly. |
| **AALM_64.exe** / **AALM_32.exe** | The compiled Fortran model. Reads `LeggettInput.txt`, runs the simulation, writes CSV results. (The 64-bit version is the fully supported one; the 32-bit has limited functionality.) |
| **AALM31_Fortran.f90** | The Fortran source code for the executable. |
| **AALM_ExploreData_v3-1.xlsm** | Excel/VBA interface that loads the CSV outputs for visualization and analysis. |

The model is started by opening `AALM_Inputs_v3-1.xlsm`; results are viewed in
`AALM_ExploreData_v3-1.xlsm`. Because of file-security restrictions, the model
generally must be run from a folder under `c:\users\{your username}\` (not from the
Documents folder or a network drive), and Excel macros must be enabled.

### Input file format

Each line of `LeggettInput.txt` follows the pattern:

```
Type, VariableName, nLevels, value1, value2, ...
```

- **Type** groups the parameter: `Sim`, `Growth`, `Phys`, `Lung`, `Iter`, or a
  medium (`Air`, `Dust`, `Soil`, `Water`, `Food`, `Other`).
- **nLevels** is how many values follow (1 for a constant; many for an age-varying
  series, paired with a matching `Age` line).
- Lines beginning with `!` are comments; an `END` line stops parsing.

---

## 3. How the model works internally

### 3.1 Compartments

Lead mass is tracked through **31 compartments**:

- **GI tract:** Stomach, Small Intestine, Upper & Lower Large Intestine
- **Blood:** Plasma (diffusible), Protein-bound plasma, Red Blood Cells (RBC)
- **Soft tissues:** fast / intermediate / slow turnover pools, Brain
- **Organs:** Liver (two pools), Kidney (two pools: urinary path and other)
- **Bone:** Cortical and Trabecular, each split into Surface, Exchangeable
  volume, and Non-exchangeable volume
- **Fluids/clearance:** Extravascular fluid, Bladder
- **Excretion sinks:** Urine, Feces, Sweat, Hair
- **Respiratory module:** Extrathoracic (LET), Tracheo-bronchial (LTB), Alveolar
  (Lalv), Interstitial (Lint)

Lead moves between compartments along **55 defined transfer flows**. Most flows
route through plasma, which acts as the central distribution hub.

### 3.2 The math

The simulation marches forward in discrete **timesteps** (the user sets steps per
day). On each step, every compartment is updated with a one-compartment
input/output solution:

```
Y(t) = (Y(t-1) − P/X)·exp(−X·Δt) + P/X
```

where `P` is the inflow rate, `X` is the total outflow rate constant, and `Δt` is
the timestep length. Outflow is then split among destination compartments in
proportion to their individual rate constants. Mass balance (intake = body burden +
flows − excretion) is tracked every step as a check.

### 3.3 Age dependence and growth

Body weight, blood volume, hematocrit, organ weights, bone mass, and most transfer
rates **change with age**. Age-varying inputs are supplied at a set of age
breakpoints (e.g., 0, 100, 365, 1825 … days) and the model fills in every timestep
by either **stepwise** or **linear interpolation** (`Sim,interp`). Body weight
follows a growth curve driven by the `Growth` parameters.

### 3.4 Source tracking and bioavailability

Up to **18 exposure sources** are tracked separately (3 sources × 6 media), plus 3
air/respiratory sources. Each source has its own **relative bioavailability (RBA)**,
which scales how much of the ingested lead is actually absorbed from the small
intestine into plasma. Inhaled lead is handled by the respiratory module: a fraction
deposits in each airway region and is then cleared to blood or swallowed into the GI
tract.

### 3.5 RBC saturation (nonlinearity)

At high blood lead levels, red-blood-cell uptake saturates. When enabled
(`Sim,irbc = 1`), the model reduces RBC uptake above a threshold concentration
(`RBCNL`) toward a saturation level (`SATRAT`), using a `POWER`-shaped curve, and
redistributes the displaced lead to other tissues. This produces the curvature seen
in the BLL-vs-intake relationship at higher exposures.

### 3.6 Target-BLL iteration mode

When `Sim,iterate = 1`, the model does not just run one scenario — it **repeatedly
adjusts the chosen exposure source(s) until a target blood lead level is met**. The
user specifies the target BLL, which medium/subtype is adjustable, the age window
over which the BLL is evaluated, the metric (mean or maximum), and a precision. A
geometric-standard-deviation (`GSD`) and tail-fraction setting let the target be
interpreted as a population percentile rather than a central value.

---

## 4. Outputs

Each run writes a folder named after the run, containing CSV files:

| File | Contents |
|------|----------|
| `Out_<run>.csv` | Per-timestep concentrations and amounts in every compartment (blood, plasma, kidney, liver, cortical/trabecular/total bone, soft tissue, brain, GI, excreta, etc.). This is the main results file — including **blood lead concentration (Cblood)**. |
| `Src_<run>.csv` | Per-timestep intake by source/medium plus overall mass-balance totals. |
| `Day_<run>.csv` | Daily intake, uptake, and excretion broken out by route and medium. |
| `Rates_<run>.csv` | Transfer-rate values at selected ages (diagnostic). |
| `Log_<run>.csv` | Echo of inputs and processing notes. |
| `RunInfo_<run>.txt` | Run name, timestamp, and completion status. |

These CSVs are what `AALM_ExploreData_v3-1.xlsm` reads for plotting.

---

## 5. What users can input and change

Everything below is set through the input workbook (and appears in
`LeggettInput.txt`). Values shown are representative defaults from the example
inputs.

### 5.1 Simulation control (`Sim`)

| Parameter | Meaning |
|-----------|---------|
| `age_range` | Start and end age of the simulation, in **days** (e.g., 0 to 32850 ≈ 0–90 yr). |
| `steps_per_day` | Number of timesteps per day (e.g., 100). Higher = finer/slower. |
| `outwrite` | Output thinning — write every Nth timestep to the CSVs. |
| `irbc` | 1 = enable RBC saturation nonlinearity; 0 = linear. |
| `iterate` | 1 = run target-BLL iteration; 0 = single forward run. |
| `interp` | 0 = stepwise inputs; 1 = linear interpolation between age breakpoints. |
| `debug` | 1 = verbose diagnostics. |

### 5.2 Growth / demographics (`Growth`)

`sex` (0 = female, 1 = male), `wbirth` (birth weight, kg), `wchild`, `half`,
`wadult` (asymptotic adult weight), `kappa`, `lambda`, `LB` — the parameters of the
body-weight growth curve. (Hematocrit `HCTA`/`HCTB` are set under `Phys`.)

### 5.3 Physiology — constants (`Phys`, single value)

Roughly 50 whole-body constants, including:

- **Blood/tissue sizes & fractions:** `HCTA`/`HCTB` (adult/birth hematocrit),
  `BLDMOT`, `BRATIO`, `VBLC` (blood volume coeff.), `VKC`/`VLC`/`VLUC`
  (kidney/liver/lung volume coeffs.), `PLSVOL`, `SIZEVF`, `ASHWT`, `CRTWT`, `TRBWT`.
- **Initial (birth) tissue lead partitioning:** `BONIN`, `BRANIN`, `RBCIN`,
  `RENIN`, `HEPIN`, `SOFIN`, `IFETAL`.
- **Transfer-rate constants (per day):** `RKDN1`, `RLLI`, `RLVR1`, `RPLAS`,
  `RPROT`, `RSIC`, `RSOF0`/`RSOF1`/`RSOF2`, `RSTMC`, `RULI`.
- **Outflow fractions from plasma:** `TOFECE`, `TOKDN1`, `TOKDN2`, `TOLVR1`,
  `TOPROT`, `TORBC`, `TOSWET`, `TOURIN`, `TOBRAN`.
- **Liver routing:** `H1TOBL`, `H1TOH2`, `H1TOSI`.
- **Other:** `S2HAIR` (soft-tissue→hair fraction), `TEVF`, `TBONEL`.
- **RBC saturation parameters:** `RBCNL` (threshold conc.), `SATRAT`
  (saturation level), `POWER` (curve shape). Used only when `irbc = 1`.

### 5.4 Physiology — age-varying series (`Phys`, multi-value with an `Age` line)

Supplied as a vector across age breakpoints (the `Phys,Age` line defines the ages):

- `F1` — fraction of GI lead absorbed (drops sharply after infancy).
- `AMTBLD` — blood volume scale by age.
- Bone dynamics: `RCORT`, `RTRAB`, `RDIFF`, `FLONG`, `RCS2B`/`RCS2DF`,
  `RTS2B`/`RTS2DF`, `TBONE`, `TFRAC`.
- Tissue/organ rates: `RRBC`, `RKDN2`, `RLVR2`, `RBRAN`, `RBLAD`, `GSCAL`.
- Plasma-outflow fractions by age: `TOSOF0`, `TOSOF1`, `TOSOF2`, `TOBRAN`.

### 5.5 Respiratory / lung module (`Lung`, 3 particle classes)

For each of three inhaled-particle classes, users set the **deposition fractions**
in each airway region (`DepFracLET`, `DepFracLTB`, `DepFracLalv`) and the
**clearance rate constants** between regions and to blood or stomach
(`RLETplas`, `RLETstom`, `RLTBplas`, `RLTBLET`, `RLalvPlas`, `RLalvLTB`,
`RLalvLint`, `RLintPlas`). The `RespMod` folder provides age/sex-specific
deposition workbooks (infant through adult, male/female, plus a custom calculator).

### 5.6 Exposure media and sources (`Air`, `Dust`, `Soil`, `Water`, `Food`, `Other`)

This is where the actual **exposure scenario** is defined. For each medium you can
specify up to 3 sources. Two equivalent ways to give the amount:

- **Concentration × intake:** `CONCS#` (lead concentration in the medium by age)
  combined with `INTAKE_AMT` (amount of the medium consumed/contacted by age) and
  `FRAC#` (fraction of that intake from each source); or
- **Direct intake:** `SOURCE_AMT#` (lead mass taken in directly by age).

Supporting keys per medium:

- `sources` — how many sources (1–3) for this medium.
- `conc_ages` / `source_ages` / `intake_ages` — the age breakpoints for the series.
- `RBA` — relative bioavailability for each source (absorption multiplier).
- `MASK` — an intermittent-exposure pattern (e.g., on/off cycling by day) so a
  source applies only on certain days.

All series can be age-varying, so exposures can ramp, switch on/off, or change with
life stage.

---

## 6. Getting started

1. Unzip the package into a writable folder under `c:\users\{your username}\`.
2. Open `AALM_Inputs_v3-1.xlsm`; unblock the file and enable macros if prompted.
3. Load one of the example scenarios (`Examples` folder, Ex1–Ex5; respiratory
   examples in `RespMod`) to see a working setup.
4. Adjust the parameters above for your scenario and run.
5. Open `AALM_ExploreData_v3-1.xlsm` to view and plot the results.

---

## 7. Troubleshooting

### 7.1 Setup required before the model will run

Most "it won't run" problems are environment/setup issues rather than the model
itself:

- **Run from a writable local folder.** Place the files under
  `c:\users\{your username}\`. Because of Windows/Office security safeguards, the
  model typically will **not** run from the **Documents** folder, OneDrive, or any
  **network drive**, and needs **read/write** access to its folder (it writes output
  files there).
- **Unblock the downloaded files.** The first time you open a workbook you may see a
  red banner: *"SECURITY RISK — Microsoft has blocked macros…"*. Fix it by closing
  Excel, right-clicking each file in File Explorer → **Properties** → tick
  **Unblock** at the bottom → **OK**.
- **Enable macros.** A yellow *"SECURITY WARNING — Some active content has been
  disabled"* banner means you must click **Enable Content**. The model is driven by
  Excel/VBA macros and will not function with macros disabled.
- **Use a supported environment.** Best tested on **Windows 11** with
  **Microsoft 365 Excel**. Use the **64-bit** executable (`AALM_64.exe`); the
  32-bit build (`AALM_32.exe`) has only limited functionality.
- **The run-name output folder must exist.** The executable writes its results into
  a subfolder named after the run (the `Name` line in the input file). The input
  workbook creates this folder automatically; if you run the `.exe` **manually**,
  create a folder matching the run name first, or the run will stop when it cannot
  open its output files.

### 7.2 Input errors that stop the run (fatal)

These cause the program to halt. Because the executable prints messages to a console
window that the Excel interface usually hides, a fatal error often appears simply as
a run that **ends with missing or empty output files**. Check the console message or
the `RunInfo_<run>.txt` / `Log_<run>.csv` files.

| Condition | Message printed | Cause / fix |
|-----------|-----------------|-------------|
| Input file missing or unreadable | *(silent stop)* | The parameter file (default `LeggettInput.txt`, or the one passed on the command line) was not found. Check the file name/location. |
| Output folder missing / not writable | *(silent stop)* | The run-name subfolder does not exist or is read-only. See §7.1. |
| Iteration medium out of range | `Adjustable media out of range` | In target-BLL mode, `Iter,media` must be 1–6 (Air, Dust, Soil, Water, Food, Other). |
| Non-positive target | `Target BLL not positive` | `Iter,targetBLL` must be greater than 0. |
| Tail fraction out of range | `Tail fraction out of range` | `Iter,tailfrac` must satisfy 0 < value ≤ 0.5. |
| Precision out of range | `Iterative precision out of range` | `Iter,precision` must satisfy 0 < value ≤ 0.5. |
| Target unreachable | `Background sources too high to achieve target` | Even with the adjustable source set to zero, background exposure already exceeds the target BLL. Lower the non-adjustable (background) sources or raise the target. |

### 7.3 Input errors that are *silently* accepted (no crash, but wrong results)

These are the most dangerous because the model runs to completion and produces
output that is quietly incorrect. Review `Log_<run>.csv`, which echoes how each line
was interpreted.

- **Unrecognized line type.** Only `Sim`, `Growth`, `Phys`, `Lung`, `Iter`, and the
  six media (`Air`/`Dust`/`Soil`/`Water`/`Food`/`Other`) are processed. A misspelled
  type (e.g., `Physs`) is ignored with no error, so that parameter silently keeps its
  default.
- **Misspelled variable name.** A `Phys` (or other) variable name that doesn't match
  the expected list prints `Phys variable not found: <name>` and is **skipped** — the
  parameter stays at its internal default (often zero), which can badly distort
  results. Watch for this message in the console/log.
- **`nLevels` doesn't match the values supplied.** The third field must equal the
  number of values that follow. Too few/many values shifts or truncates the data and
  produces wrong (or zero) inputs.
- **Age-varying vector without a matching `Age` line.** Multi-value `Phys` series are
  paired with the most recent `Phys,Age` line and must have the **same number of
  breakpoints**. A missing or mismatched `Age` line misaligns every value with the
  wrong age.
- **Line ordering within a medium.** Order matters: for each medium the **`MASK`**
  line (intermittent-exposure pattern) must come **after** the concentration/intake
  lines, and the **`RBA`** line must be **last** — the model finalizes that medium's
  source amounts when it reads `RBA`. Lines placed out of order are applied at the
  wrong stage.
- **Source fractions that don't sum to 1.** For multi-source media the model derives
  the last source's fraction as `1 − (other fractions)`. If the `FRAC` values sum to
  more than 1, the remaining fraction goes **negative**, producing nonsensical
  intakes.
- **Missing `END` line.** Parsing stops at `END`; without it the reader may run past
  the intended data.

### 7.4 Other common pitfalls

- **Ages are in days, not years.** `Sim,age_range` and all age breakpoints are
  expressed in **days** (e.g., 32850 days ≈ 90 years), and the `age_range` end must
  be greater than the start.
- **`steps_per_day` drives run time and memory.** Large values combined with a long
  `age_range` create very large arrays and long runs; reduce `steps_per_day` or use
  `outwrite` to thin the output if runs are slow or memory-limited.
- **No exposure defined ⇒ near-zero blood lead.** If no media/source lines are
  supplied (only physiology/growth), there is no intake and the predicted BLL will be
  ~0. Make sure at least one source is defined for a forward exposure run.
- **Comma-delimited, plain decimals.** The input file is comma-separated; use a
  period as the decimal separator and avoid thousands separators or stray characters
  in numeric fields.
- **Iteration mode needs an adjustable source.** With `Sim,iterate = 1`, the
  `Iter,media` (and optional `subtype`/`dustsoil`) must actually match a defined
  source, or there is nothing for the model to scale toward the target.

---

*Prepared from the AALM v3.1 README, the Fortran source (`code/AALM31_Fortran.f90`),
and the example input files. For parameter definitions, recommended values, and
scenario guidance, consult the official AALM v3.1 Users Guide and Technical Support
Document.*
