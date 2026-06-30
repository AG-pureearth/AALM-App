# AALM v3.1 — Input Variables Reference (`AALM_Inputs_v3-1.xlsm`)

This document explains every input variable presented in the AALM v3.1 input
workbook, **`AALM_Inputs_v3-1.xlsm`**, including the optional settings that only
appear or apply in certain modes. It is a companion to **Summary.md**; see that file
for how the model works and what the parameters do biologically.

The workbook is organized into one **visible setup sheet** (*Simulation Control*) plus
several **hidden parameter sheets** (*Growth Params*, *Time-Independent Physiology*,
*Time-Dependent Physiology*, *Media*, *Lung*) that you reach through the buttons/menus
on the control sheet. Units and definitions below are taken directly from the
workbook. Default/example values shown are those that ship in the workbook.

> **Note on units.** In the workbook UI, ages are entered in **years**. The macros
> convert them to **days** when writing `LeggettInput.txt` (which the model reads in
> days). Rate constants are per day (`d⁻¹`); `f` means a unitless fraction.

---

## 1. Simulation Control sheet (main setup)

This is the sheet you see when you open the workbook. It defines the run and selects
which optional parameter sets are active.

### Simulation Name

| Field | Meaning | Allowed values |
|-------|---------|----------------|
| **Simulation Name** | Names the run. Becomes the output subfolder name and the prefix on all result files (`Out_<name>.csv`, etc.). | Letters, digits, and underscore only; **fewer than 20 characters** (enforced by the cell). |

### 1. Set Base Parameters

| Field | Meaning | Allowed values / default |
|-------|---------|--------------------------|
| **Timesteps per day** | Numerical resolution of the simulation. Higher = finer and slower. | Whole number ≥ 0 (default **100**). |
| **Timesteps between outputs** | Output thinning — results are written every Nth timestep. | Whole number ≥ 0 (default **100**, i.e. one output per day at 100 steps/day). |
| **Age at start (yrs)** | Age at the beginning of the simulation. | Whole number ≥ 0 (default **0** = birth). |
| **Age at end (yrs)** | Age at the end of the simulation. | Number ≥ 0; must exceed start (default **7**; model supports up to ~90). |
| **Sex** | Biological sex; selects the corresponding growth/hematocrit defaults. | Dropdown: **Male**, **Female**. |

### 2. Set Growth and Physiology *(optional parameter sets)*

| Field | Meaning | Allowed values |
|-------|---------|----------------|
| **Adjust growth parameters?** | If **Yes**, the *Growth Params* sheet (Section 2 below) becomes editable and is used; otherwise built-in defaults apply. | Dropdown: **Yes**, **No (default)**. |
| **Adjust physiology parameters?** | If **Yes**, the *Time-Independent* and *Time-Dependent Physiology* sheets (Sections 3–4) become editable; otherwise defaults apply. | Dropdown: **Yes**, **No (default)**. |

> These two switches are the gateway to the "advanced" parameter sheets. Most users
> leave both at **No (default)** and only change exposure (Section 6).

### 3. Set Active Media

A grid with one row per exposure medium. Turning a medium **on** activates its inputs
on the *Media* sheet (Section 6).

| Column | Meaning | Allowed values |
|--------|---------|----------------|
| **Media** (Soil, Dust, Water, Air, Food, Other) | The six exposure media. | (row labels) |
| **(on/off)** | Whether this medium is included in the run. | Dropdown: **Yes**, **No**. |
| **Number of Sources** | How many distinct sources to model within the medium (e.g., two different soils). | Dropdown: **0, 1, 2, 3**. |
| **Number of Periodic "Time Masks"** | How many intermittent-exposure on/off patterns to define for the medium (e.g., seasonal exposure). | Dropdown: **0–9**. |

### Solution / run-mode options (bottom of the sheet)

| Field | Meaning | Allowed values |
|-------|---------|----------------|
| **Solution type** | **Forward** = predict blood lead from given exposures. **Solve for Allowable Concentration** = iterate exposure to hit a target blood lead level (activates the Allowable-Concentration inputs, Section 7). | Dropdown: **Forward**, **Solve for Allowable Concentration**. |
| **Stepwise or Interpolated?** | How age-varying inputs are filled between the ages you specify. **Stepwise** holds each value until the next breakpoint; **Interpolated** draws a straight line between breakpoints. | Dropdown: **Stepwise**, **Interpolated**. |
| **Linear or Non-linear RBC?** | **Non-linear RBC** models red-blood-cell uptake saturation at high blood lead (recommended/realistic at elevated exposure); **Linear RBC** disables it. | Dropdown: **Linear RBC**, **Non-linear RBC**. |

---

## 2. Growth Parameters *(optional — only when "Adjust growth parameters?" = Yes)*

These drive the body-weight growth curve and a few sex-specific blood values. The sheet
holds a **Female** column and a **Male** column; the active one is chosen by **Sex**.

| Parameter | Unit | Meaning | Female / Male default |
|-----------|------|---------|-----------------------|
| `sex` | — | Sex label for the column. | Female / Male |
| `wbirth` | kg | Birth body weight. | 3.3 / 3.5 |
| `wchild` | kg | Childhood weight-gain scale. | 22 / 23 |
| `half` | years | Age at which half of the childhood weight gain is reached. | 3 / 3 |
| `wadult` | kg | Asymptotic adult body weight. | 34 / 50 |
| `kappa` | — | Shape constant of the adult growth term. | 600 / 600 |
| `lambda` | — | Rate constant of the adult growth term. | 0.017 / 0.0095 |
| `LB` | — | Lacrimation/“birth” scaling constant used in the growth model. | 0.85 / 0.88 |

---

## 3. Time-Independent Physiology Parameters *(optional — only when "Adjust physiology parameters?" = Yes)*

Whole-body constants (do not vary with age). Each has the official definition from the
workbook.

### Tissue sizes, volumes, and blood

| Parameter | Unit | Definition | Default |
|-----------|------|------------|---------|
| `ASHWT` | g | Skeletal ash weight | 2800 |
| `CRTWT` | g | Cortical bone weight | 4000 |
| `TRBWT` | g | Trabecular bone weight | 3000 |
| `KWT` | g | Adult kidney weight | 310 |
| `PLSVOL` | dL | Plasma volume | 30 |
| `RBCVOL` | dL | Red blood cell volume | 22 |
| `VBLC` | L/kg | Total blood volume coefficient | 0.067 |
| `VKC` | L/kg | Kidney volume coefficient (adult) | 0.0085 |
| `VLC` | L/kg | Liver volume coefficient (adult) | 0.025 |
| `VLUC` | L/kg | Lung volume coefficient (adult) | 0.015 |
| `HCTA` | — | Adult hematocrit (Female) | 0.41 |
| `HCTB` | — | Birth hematocrit | 0.52 |
| `SIZEVF` | f | Relative volume of EVF compartment vs. plasma (EVF/Plasma) | 3 |
| `TEVF` | f | Deposition fraction from diffusible plasma to extravascular fluid | 0.5 |

### Initial (birth) body-lead partitioning

| Parameter | Unit | Definition | Default |
|-----------|------|------------|---------|
| `BLDMOT` | µg/dL | Maternal blood lead concentration | 0.62 |
| `BRATIO` | f | Fetal:maternal blood lead concentration ratio | 0.85 |
| `IFETAL` | — | Switch: start tissue Pb from maternal blood (1 = on) | 1 |
| `BONIN` | f | Fraction of body lead, at birth, in bone | 0.32 |
| `BRANIN` | f | Fraction of body lead, at birth, in brain | 0.045 |
| `HEPIN` | f | Fraction of body lead, at birth, in liver | 0.055 |
| `RBCIN` | f | Fraction of body lead, at birth, in red blood cells | 0.07 |
| `RENIN` | f | Fraction of body lead, at birth, in kidney | 0.01 |
| `SOFIN` | f | Fraction of body lead, at birth, in soft tissue | 0.5 |

### Transfer-rate constants (per day)

| Parameter | Unit | Definition | Default |
|-----------|------|------------|---------|
| `RPLAS` | d⁻¹ | Total transfer rate from diffusible plasma to all compartments | 2000 |
| `RPROT` | d⁻¹ | Transfer rate from bound plasma to diffusible plasma | 0.139 |
| `RSTMC` | d⁻¹ | Stomach → small intestine | 24 |
| `RSIC` | d⁻¹ | Small intestine → upper large intestine | 6 |
| `RULI` | d⁻¹ | Upper → lower large intestine | 1.85 |
| `RLLI` | d⁻¹ | Lower large intestine → feces | 1 |
| `RLVR1` | d⁻¹ | Out of liver compartment 1 (to SI and plasma) | 0.0693 |
| `RKDN1` | d⁻¹ | Kidney compartment 1 → urinary pathway | 0.139 |
| `RSOF0` | d⁻¹ | Soft tissue 0 → diffusible plasma | 2.079 |
| `RSOF1` | d⁻¹ | Soft tissue 1 → diffusible plasma | 0.00693 |
| `RSOF2` | d⁻¹ | Soft tissue 2 → diffusible plasma | 0.00038 |

### Plasma outflow deposition fractions

| Parameter | Unit | Definition | Default |
|-----------|------|------------|---------|
| `TOFECE` | f | Diffusible plasma → small intestine directly (excludes biliary `RLVR1`) | 0.006 |
| `TOKDN1` | f | Diffusible plasma → kidney compartment 1 | 0.025 |
| `TOKDN2` | f | Diffusible plasma → kidney compartment 2 | 0.0004 |
| `TOLVR1` | f | Diffusible plasma → liver compartment 1 | 0.04 |
| `TOPROT` | f | Diffusible plasma → protein-bound plasma | 0.0004 |
| `TORBC` | f | Diffusible plasma → red blood cells (below non-linear threshold) | 0.25 |
| `TOSWET` | f | Diffusible plasma → sweat | 0.0035 |
| `TOURIN` | f | Diffusible plasma → urine | 0 |

### Liver routing fractions

| Parameter | Unit | Definition | Default |
|-----------|------|------------|---------|
| `H1TOBL` | f | Out of liver 1 → diffusible plasma | 0.45 |
| `H1TOH2` | f | Out of liver 1 → liver compartment 2 | 0.1 |
| `H1TOSI` | f | Out of liver 1 → small intestine | 0.45 |

### Other / RBC saturation (used when Non-linear RBC is selected)

| Parameter | Unit | Definition | Default |
|-----------|------|------------|---------|
| `S2HAIR` | f | Deposition fraction from soft tissue 1 to other excreta (hair) | 0.4 |
| `TBONEL` | f | End value of the `TBONE`–age array | 0.08 |
| `RBCNL` | µg/dL | Threshold RBC concentration where non-linear plasma→RBC deposition begins | 20 |
| `SATRAT` | µg/dL | Maximum (saturating) lead concentration in RBC | 350 |
| `POWER` | — | Exponent shaping the RBC deposition (saturation) curve | 1.5 |

---

## 4. Time-Dependent Physiology Parameters *(optional — only when "Adjust physiology parameters?" = Yes)*

These vary with age. You set a **Number of Ages**, the **Ages (years)** breakpoints,
and a value at each breakpoint; the model fills in between them using the
**Stepwise/Interpolated** choice from Section 1.

| Parameter | Unit | Meaning |
|-----------|------|---------|
| `F1` | f | Fraction of GI lead absorbed (high in infancy, falls with age) |
| `AMTBLD` | dL | Blood volume by age |
| `FLONG` | f | Fraction of bone diffusible transfer directed to non-exchangeable (long-term) volume |
| `GSCAL` | f | Growth-scaling factor applied to bone formation |
| `RBLAD` | d⁻¹ | Bladder → urine transfer rate |
| `RBRAN` | d⁻¹ | Brain → plasma transfer rate |
| `RCORT` | d⁻¹ | Cortical non-exchangeable volume → plasma (bone resorption) |
| `RCS2B` | d⁻¹ | Cortical surface → plasma |
| `RCS2DF` | d⁻¹ | Cortical surface → exchangeable volume |
| `RDIFF` | d⁻¹ | Exchangeable bone volume turnover rate |
| `RKDN2` | d⁻¹ | Kidney compartment 2 → plasma |
| `RLVR2` | d⁻¹ | Liver compartment 2 → plasma |
| `RRBC` | d⁻¹ | Red blood cells → plasma |
| `RTRAB` | d⁻¹ | Trabecular non-exchangeable volume → plasma (bone resorption) |
| `RTS2B` | d⁻¹ | Trabecular surface → plasma |
| `RTS2DF` | d⁻¹ | Trabecular surface → exchangeable volume |
| `TBONE` | f | Deposition fraction from plasma to total bone surface |
| `TFRAC` | f | Fraction of bone deposition going to trabecular (vs. cortical) |
| `TOBRAN` | f | Deposition fraction from plasma to brain |
| `TOSOF0` | f | Deposition fraction from plasma to fast soft tissue |
| `TOSOF1` | f | Deposition fraction from plasma to intermediate soft tissue |
| `TOSOF2` | f | Deposition fraction from plasma to slow soft tissue |

---

## 5. Lung Parameters (respiratory module)

Set per **inhaled-particle source** (up to 3). Deposition fractions decide where
inhaled lead lands in the airways; the rate constants govern clearance to blood,
swallowing to the stomach, and movement between airway regions.

| Parameter | Unit | Meaning | Source 1 / 2 / 3 (example) |
|-----------|------|---------|----------------------------|
| `DepFracLET` | f | Deposition fraction in extrathoracic region | 0 / 0.2 / 0.2 |
| `DepFracLTB` | f | Deposition fraction in tracheo-bronchial region | 0 / 0.159 / 0.159 |
| `DepFracLalv` | f | Deposition fraction in alveolar region | 0.32 / 0.04 / 0.04 |
| `RLETplas` | d⁻¹ | Extrathoracic → plasma | 0 / 7.68 / 7.68 |
| `RLETstom` | d⁻¹ | Extrathoracic → stomach (swallowed) | 0 / 0 / 0 |
| `RLTBplas` | d⁻¹ | Tracheo-bronchial → plasma | 0 / 1.94 / 1.94 |
| `RLTBLET` | d⁻¹ | Tracheo-bronchial → extrathoracic | 0 / 0 / 0 |
| `RLalvPlas` | d⁻¹ | Alveolar → plasma | 1 / 0.347 / 0.347 |
| `RLalvLTB` | d⁻¹ | Alveolar → tracheo-bronchial | 0 / 0 / 0 |
| `RLalvLint` | d⁻¹ | Alveolar → interstitial | 0 / 0 / 0 |
| `RLintPlas` | d⁻¹ | Interstitial → plasma | 0 / 0 / 0 |

> The `RespMod` folder provides age/sex-specific deposition-fraction workbooks
> (infant through adult, plus a custom calculator) to populate the `DepFrac*` rows.

---

## 6. Media / Exposure Inputs

This is where the actual exposure scenario is defined, one block per active medium
(**Soil, Dust, Water, Air, Food, Other**). Each medium can carry up to **3 sources**.
Two ways to specify how much lead enters the body:

**(a) Concentration × Intake** (typical for environmental media)

| Input | Unit | Meaning |
|-------|------|---------|
| **Concentration** | µg/g (soil/dust), µg/L (water), µg/m³ (air) | Lead concentration in the medium, per source, age-varying via **Number of Ages** + **Ages (years)**. |
| **Intake** | g/day, L/day, or m³/day | Amount of the medium contacted/consumed per day, age-varying. |
| **Fraction, Source 1/2/3** | f | Split of the total intake among the medium's sources (should sum to 1; the model derives the last source as 1 − others). |
| **RBA, Source 1/2/3** | f | **Relative bioavailability** — fraction of ingested lead actually absorbed for that source. |

**(b) Direct intake** — for **Food**, the value is entered as an intake (µg/day),
not a true concentration (the workbook notes: *"Food value is an intake not a true
concentration"*).

### Time Masks (intermittent exposure) — optional

Activated by **Number of Periodic "Time Masks"** in Section 3. Each mask switches a
source on/off on a repeating schedule:

| Column | Meaning |
|--------|---------|
| **Mask #** | The mask index (1–9). |
| **Source** | Which source in the medium the mask applies to. |
| **Period (days)** | Length of the repeating cycle. |
| **First day blocked** | First day in each cycle the source is turned off. |
| **Last day blocked** | Last day in each cycle the source is turned off. |

Use masks for seasonal exposure, intermittent occupancy, remediation periods, etc.

---

## 7. Allowable Concentration Calculation Parameters *(optional — only when Solution type = "Solve for Allowable Concentration")*

When you choose the iterate/back-solve mode, this parameter row (top of the *Media*
sheet) controls how the model searches for the exposure concentration that produces a
target blood lead level.

| Field | Unit | Meaning | Example default |
|-------|------|---------|-----------------|
| **Media** | — | Which medium's concentration is adjusted toward the target. | Soil |
| **Subtype** | — | Which source within that medium is adjusted. | Source 1 |
| **Link Dust and Soil?** | Yes/No | Adjust soil and dust together as one combined source. | No |
| **Target BLL** | µg/dL | The blood lead level to solve for. Must be > 0. | 5 |
| **Precision** | — | Convergence tolerance on the target (0 < value ≤ 0.5). | 0.001 |
| **Metric** | — | How the achieved BLL is summarized over the age window: **Arithmetic Mean** or **Maximum**. | Arithmetic Mean |
| **Start Age (yr)** | years | Start of the age window over which the BLL metric is evaluated. | 0 |
| **End Age (yr)** | years | End of that age window. | 7 |
| **Max Iteration** | — | Maximum number of solver iterations before stopping. | 10 |
| **GSD** | — | Geometric standard deviation — lets the target be interpreted as a population value rather than an individual central estimate. | 1.6 |
| **Tail Fraction** | — | Upper-tail fraction (percentile) of the population distribution to target (0 < value ≤ 0.5). | 0.05 |

> If background (non-adjusted) sources alone already exceed the target, the solver
> reports *"Background sources too high to achieve target"* and stops — lower the
> background exposure or raise the target. (See **Summary.md** §7.2.)

---

## Quick reference: which inputs are required vs. optional

| Always set | Optional (mode/switch-gated) |
|------------|------------------------------|
| Simulation Name | Growth Params *(Adjust growth = Yes)* |
| Base Parameters (steps, ages, sex) | Time-Independent Physiology *(Adjust physiology = Yes)* |
| Active Media + at least one source's exposure | Time-Dependent Physiology *(Adjust physiology = Yes)* |
| Solution type, Stepwise/Interp, RBC mode | Lung Parameters *(when an Air source is active)* |
| | Time Masks *(when # masks > 0)* |
| | Allowable Concentration params *(Solution type = Solve…)* |

---

*Prepared by inspecting the contents of `AALM_Inputs_v3-1.xlsm` (sheet labels, cell
values, dropdown/data-validation lists, and the embedded parameter definitions).
Default values are those shipped in the workbook and are examples, not
recommendations — consult the official AALM v3.1 Users Guide and Technical Support
Document for guidance on appropriate values.*
