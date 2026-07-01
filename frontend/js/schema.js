// schema.js — UI metadata for the AALM front-end (labels, units, tooltips, options).
// Numeric defaults live in shared/defaults.json (served at /api/defaults); this file
// only describes how to present each parameter.

window.AALM_SCHEMA = {
  sim: {
    simName:     { label: "Simulation name", help: "Letters, digits, underscore; under 20 characters. Names the output folder." },
    ageMinYr:    { label: "Age at start", unit: "yr", min: 0, step: 1 },
    ageMaxYr:    { label: "Age at end", unit: "yr", min: 0, step: 1 },
    stepsPerDay: { label: "Timesteps per day", unit: "", min: 1, step: 1, help: "Numerical resolution. Higher = finer and slower." },
    outwrite:    { label: "Timesteps between outputs", unit: "", min: 1, step: 1, help: "Output thinning: write every Nth timestep." },
    sex:         { label: "Sex", type: "select", options: [{ v: 0, t: "Female" }, { v: 1, t: "Male" }] },
    solution:    { label: "Solution type", type: "select",
                   options: [{ v: 0, t: "Forward (predict blood lead)" }, { v: 1, t: "Solve for allowable concentration" }],
                   help: "Forward predicts BLL from exposures; Solve back-calculates exposure to hit a target BLL." },
    interp:      { label: "Age interpolation", type: "select",
                   options: [{ v: 0, t: "Stepwise" }, { v: 1, t: "Interpolated" }],
                   help: "How age-varying inputs are filled between the ages you specify." },
    irbc:        { label: "Red blood cell model", type: "select",
                   options: [{ v: 1, t: "Non-linear RBC" }, { v: 0, t: "Linear RBC" }],
                   help: "Non-linear models RBC uptake saturation at high blood lead (recommended)." }
  },

  growth: {
    wbirth: { label: "Birth weight", unit: "kg" },
    wchild: { label: "Childhood weight scale", unit: "kg" },
    half:   { label: "Half-gain age", unit: "yr" },
    wadult: { label: "Adult weight", unit: "kg" },
    kappa:  { label: "kappa", unit: "" },
    lambda: { label: "lambda", unit: "" },
    LB:     { label: "LB", unit: "" }
  },

  // time-independent physiology constants: name -> [unit, definition]
  physConst: {
    HCTB:   ["--", "Birth hematocrit"],
    HCTA:   ["--", "Adult hematocrit (female)"],
    ASHWT:  ["g", "Skeletal ash weight"],
    BLDMOT: ["µg/dL", "Maternal blood lead concentration"],
    BONIN:  ["f", "Fraction of body lead, at birth, in bone"],
    BRANIN: ["f", "Fraction of body lead, at birth, in brain"],
    BRATIO: ["f", "Fetal:maternal blood lead concentration ratio"],
    CRTWT:  ["g", "Cortical bone weight"],
    H1TOBL: ["f", "Out of liver 1 → diffusible plasma"],
    H1TOH2: ["f", "Out of liver 1 → liver compartment 2"],
    H1TOSI: ["f", "Out of liver 1 → small intestine"],
    HEPIN:  ["f", "Fraction of body lead, at birth, in liver"],
    IFETAL: ["--", "Switch: start tissue Pb from maternal blood (1 = on)"],
    KWT:    ["g", "Adult kidney weight"],
    PLSVOL: ["dL", "Plasma volume"],
    POWER:  ["--", "Exponent for RBC deposition (saturation curve)"],
    RBCIN:  ["f", "Fraction of body lead, at birth, in red blood cells"],
    RBCNL:  ["µg/dL", "Threshold RBC concentration for non-linear deposition"],
    RBCVOL: ["dL", "Red blood cell volume"],
    RENIN:  ["f", "Fraction of body lead, at birth, in kidney"],
    RKDN1:  ["d⁻¹", "Kidney 1 → urinary pathway"],
    RLLI:   ["d⁻¹", "Lower large intestine → feces"],
    RLVR1:  ["d⁻¹", "Out of liver 1 (to SI and plasma)"],
    RPLAS:  ["d⁻¹", "Total transfer rate from diffusible plasma"],
    RPROT:  ["d⁻¹", "Bound plasma → diffusible plasma"],
    RSIC:   ["d⁻¹", "Small intestine → upper large intestine"],
    RSOF0:  ["d⁻¹", "Fast soft tissue → plasma"],
    RSOF1:  ["d⁻¹", "Intermediate soft tissue → plasma"],
    RSOF2:  ["d⁻¹", "Slow soft tissue → plasma"],
    RSTMC:  ["d⁻¹", "Stomach → small intestine"],
    RULI:   ["d⁻¹", "Upper → lower large intestine"],
    S2HAIR: ["f", "Soft tissue 1 → other excreta (hair)"],
    SATRAT: ["µg/dL", "Maximum (saturating) lead concentration in RBC"],
    SIZEVF: ["f", "EVF volume relative to plasma"],
    SOFIN:  ["f", "Fraction of body lead, at birth, in soft tissue"],
    TBONEL: ["f", "End value of the TBONE–age array"],
    TEVF:   ["f", "Plasma → extravascular fluid deposition fraction"],
    TOFECE: ["f", "Plasma → small intestine (direct)"],
    TOKDN1: ["f", "Plasma → kidney 1"],
    TOKDN2: ["f", "Plasma → kidney 2"],
    TOLVR1: ["f", "Plasma → liver 1"],
    TOPROT: ["f", "Plasma → protein-bound plasma"],
    TORBC:  ["f", "Plasma → red blood cells (below threshold)"],
    TOSWET: ["f", "Plasma → sweat"],
    TOURIN: ["f", "Plasma → urine"],
    TRBWT:  ["g", "Trabecular bone weight"],
    VBLC:   ["L/kg", "Total blood volume coefficient"],
    VKC:    ["L/kg", "Kidney volume coefficient (adult)"],
    VLC:    ["L/kg", "Liver volume coefficient (adult)"],
    VLUC:   ["L/kg", "Lung volume coefficient (adult)"]
  },

  // time-dependent physiology: name -> [unit, definition]
  physTimeDep: {
    F1:     ["f", "Fraction of GI lead absorbed"],
    AMTBLD: ["dL", "Blood volume by age"],
    FLONG:  ["f", "Fraction of bone diffusible transfer to non-exchangeable volume"],
    GSCAL:  ["f", "Growth-scaling factor for bone formation"],
    RBLAD:  ["d⁻¹", "Bladder → urine"],
    RBRAN:  ["d⁻¹", "Brain → plasma"],
    RCORT:  ["d⁻¹", "Cortical non-exchangeable volume → plasma"],
    RCS2B:  ["d⁻¹", "Cortical surface → plasma"],
    RCS2DF: ["d⁻¹", "Cortical surface → exchangeable volume"],
    RDIFF:  ["d⁻¹", "Exchangeable bone volume turnover"],
    RKDN2:  ["d⁻¹", "Kidney 2 → plasma"],
    RLVR2:  ["d⁻¹", "Liver 2 → plasma"],
    RRBC:   ["d⁻¹", "Red blood cells → plasma"],
    RTRAB:  ["d⁻¹", "Trabecular non-exchangeable volume → plasma"],
    RTS2B:  ["d⁻¹", "Trabecular surface → plasma"],
    RTS2DF: ["d⁻¹", "Trabecular surface → exchangeable volume"],
    TBONE:  ["f", "Plasma → total bone surface deposition fraction"],
    TFRAC:  ["f", "Fraction of bone deposition to trabecular"],
    TOBRAN: ["f", "Plasma → brain deposition fraction"],
    TOSOF0: ["f", "Plasma → fast soft tissue"],
    TOSOF1: ["f", "Plasma → intermediate soft tissue"],
    TOSOF2: ["f", "Plasma → slow soft tissue"]
  },

  lung: {
    DepFracLET:  ["f", "Deposition fraction, extrathoracic"],
    DepFracLTB:  ["f", "Deposition fraction, tracheo-bronchial"],
    DepFracLalv: ["f", "Deposition fraction, alveolar"],
    RLETplas:    ["d⁻¹", "Extrathoracic → plasma"],
    RLETstom:    ["d⁻¹", "Extrathoracic → stomach (swallowed)"],
    RLTBplas:    ["d⁻¹", "Tracheo-bronchial → plasma"],
    RLTBLET:     ["d⁻¹", "Tracheo-bronchial → extrathoracic"],
    RLalvPlas:   ["d⁻¹", "Alveolar → plasma"],
    RLalvLTB:    ["d⁻¹", "Alveolar → tracheo-bronchial"],
    RLalvLint:   ["d⁻¹", "Alveolar → interstitial"],
    RLintPlas:   ["d⁻¹", "Interstitial → plasma"]
  },

  media: {
    soil:  { label: "Soil",  concUnit: "µg/g",  intakeUnit: "g/day",
      rec: {
        conc: "Background ≈ 25; post-1940 housing ≈ 50; pre-1940 housing ≈ 250 µg/g",
        intakeLabel: "Soil ingestion rate", intakeUnit: "g/day",
        intake: [["Birth", "0.018"], ["3 mo", "0.032"], ["1 yr", "0.041"],
                 ["5 yr", "0.036"], ["10 yr", "0.027"], ["≥15 yr", "0.014"]],
        rba: "0.6 (relative to dissolved lead)"
      }
    },
    dust:  { label: "Dust",  concUnit: "µg/g",  intakeUnit: "g/day",
      rec: {
        conc: "Background ≈ 175 µg/g, or 70% of the soil value when dust is soil-derived",
        intakeLabel: "Dust ingestion rate", intakeUnit: "g/day",
        intake: [["Birth", "0.022"], ["3 mo", "0.039"], ["1 yr", "0.050"],
                 ["5 yr", "0.044"], ["10 yr", "0.033"], ["≥15 yr", "0.017"]],
        rba: "0.6 (soil-derived) or 1.0 (paint-derived)"
      }
    },
    water: { label: "Water", concUnit: "µg/L",  intakeUnit: "L/day",
      rec: {
        conc: "≈ 0.9 µg/L (average U.S. public tap water)",
        intakeLabel: "Water intake rate", intakeUnit: "L/day",
        intake: [["Birth", "0.20"], ["3 mo", "0.30"], ["1 yr", "0.35"], ["5 yr", "0.35"],
                 ["10 yr", "0.45"], ["15 yr", "0.55"], ["25 yr", "0.70"], ["≥50 yr", "1.04"]],
        rba: "1.0"
      }
    },
    air:   { label: "Air",   concUnit: "µg/m³", intakeUnit: "m³/day",
      rec: {
        conc: "≈ 0.01 µg/m³ (background), or ≈ 0.21 near a large emission source",
        intakeLabel: "Ventilation rate", intakeUnit: "m³/day",
        intake: [["<1 yr", "5.4"], ["1–2 yr", "8.0"], ["2–3 yr", "8.9"], ["3–6 yr", "10.1"],
                 ["6–11 yr", "12.0"], ["11–16 yr", "15.2"], ["16–21 yr", "16.3"], ["Adult", "≈15.7"]],
        rba: "1.0 (applies only to the swallowed fraction)"
      }
    },
    food:  { label: "Food",  amtUnit: "µg/day",
      rec: {
        intakeLabel: "Food lead intake", intakeUnit: "µg/day",
        intake: [["1 yr", "2.3"], ["2 yr", "3.3"], ["5 yr", "6.0"], ["10 yr", "7.7"],
                 ["15 yr", "9.2 F / 10.8 M"], ["≥20 yr", "7.9 F / 10.0 M"]],
        rba: "1.0",
        note: "Adult default ≈ 10 µg/day (~0.14 µg/kg body-weight/day). Values entered directly as µg/day."
      }
    },
    other: { label: "Other", amtUnit: "µg/day",
      rec: {
        note: "Catch-all for sources not listed (e.g., breast milk, occupational dust). No EPA default — enter a site-specific intake in µg/day. Breast-milk example: ≈ 0.13 µg/day per µg/dL of maternal blood lead (central estimate), up to ≈ 1.0 (protective)."
      }
    }
  },

  iter: {
    media:     { label: "Adjusted medium", type: "select",
                 options: [{ v: 1, t: "Air" }, { v: 2, t: "Dust" }, { v: 3, t: "Soil" }, { v: 4, t: "Water" }, { v: 5, t: "Food" }, { v: 6, t: "Other" }] },
    subtype:   { label: "Adjusted source #", min: 1, step: 1 },
    dustsoil:  { label: "Link dust & soil", type: "select", options: [{ v: 0, t: "No" }, { v: 1, t: "Yes" }] },
    targetbll: { label: "Target BLL", unit: "µg/dL", min: 0 },
    precision: { label: "Precision", unit: "" },
    metric:    { label: "Metric", type: "select", options: [{ v: 0, t: "Arithmetic mean" }, { v: 1, t: "Maximum" }] },
    startAgeYr:{ label: "Start age", unit: "yr", min: 0 },
    endAgeYr:  { label: "End age", unit: "yr", min: 0 },
    maxiter:   { label: "Max iterations", min: 1, step: 1 },
    gsd:       { label: "GSD", unit: "" },
    tailfrac:  { label: "Tail fraction", unit: "" }
  },

  // Out_<name>.csv columns -> presentation
  outputs: {
    groups: [
      { name: "Concentrations", keys: ["Cblood", "Cplas", "Ckidney", "Cliver", "Ccort", "Ctrab", "Cbone"] },
      { name: "Tissue amounts (µg)", keys: ["Ablood", "Aplas", "ARBC", "Akidney", "Aliver", "Abone", "Acort", "Atrab", "Asoft", "Abrain", "ART", "AGI", "Tbody"] },
      { name: "Excretion (µg, cumulative)", keys: ["Aurine", "Afecal", "Asweat", "Ahair"] }
    ],
    meta: {
      Cblood:  { label: "Blood lead (BLL)", unit: "µg/dL" },
      Cplas:   { label: "Plasma lead", unit: "µg/dL" },
      Ckidney: { label: "Kidney", unit: "µg/g" },
      Cliver:  { label: "Liver", unit: "µg/g" },
      Ccort:   { label: "Cortical bone", unit: "µg/g" },
      Ctrab:   { label: "Trabecular bone", unit: "µg/g" },
      Cbone:   { label: "Whole bone", unit: "µg/g" },
      Ablood:  { label: "Blood", unit: "µg" },
      Aplas:   { label: "Plasma", unit: "µg" },
      ARBC:    { label: "Red blood cells", unit: "µg" },
      Akidney: { label: "Kidney", unit: "µg" },
      Aliver:  { label: "Liver", unit: "µg" },
      Abone:   { label: "Whole bone", unit: "µg" },
      Acort:   { label: "Cortical bone", unit: "µg" },
      Atrab:   { label: "Trabecular bone", unit: "µg" },
      Asoft:   { label: "Soft tissue", unit: "µg" },
      Abrain:  { label: "Brain", unit: "µg" },
      ART:     { label: "Respiratory tract", unit: "µg" },
      AGI:     { label: "GI tract", unit: "µg" },
      Tbody:   { label: "Total body burden", unit: "µg" },
      Aurine:  { label: "Urine", unit: "µg" },
      Afecal:  { label: "Feces", unit: "µg" },
      Asweat:  { label: "Sweat", unit: "µg" },
      Ahair:   { label: "Hair", unit: "µg" }
    }
  }
};
