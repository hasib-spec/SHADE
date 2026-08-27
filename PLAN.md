# 🏆 SHADE — THE COMPLETE MASTER PLAN
## Street-level Heat Action & Decision Engine
### *"The agentic temperature co-pilot that turns FortyGuard's 20 m² heat intelligence into cooling action for the people who need it most."*

---

## 0. IDENTITY & POSITIONING

| Item | Decision |
|---|---|
| **Project name** | SHADE — Street-level Heat Action & Decision Engine |
| **Tracks** | Track 1 (Resilient Cities) **+** Track 6 (Agentic AI) **+** Track 7 (Data Correlation) — combined, as allowed |
| **Demo city** | Phoenix, AZ — district pair: **Maryvale** (low canopy, high vulnerability) vs. a wealthy high-canopy district (e.g., Arcadia) |
| **Core user** | City heat-response officer / public-health planner (FortyGuard's actual B2G customer) |
| **The hook** | SHADE reads the hyperlocal grid like a city's nervous system, finds where extreme heat intersects vulnerable people, and doesn't display heat — it **acts**: ranked, budgeted, simulated intervention plans + resident alerts |
| **Positioning line** | "A working prototype of FortyGuard's Temperature Twin — built to become part of their product line" |

**The golden rule:** every screen ends in an action. Zero passive dashboards.

---

## 1. WHY THIS WINS (Research Compliance Map)

| Research pillar | How SHADE satisfies it |
|---|---|
| Action, not dashboards ("co-pilot") | Output is GeoJSON work orders + SMS alert drafts — a complete decision workflow |
| Human-centric impact / heat equity | HERI weights every cell by CDC Social Vulnerability Index; narrative centers the vulnerable resident |
| 20 m² + 2 m as core engine | Micro-hotspot detection at true cell level; simulator calibrated at the same 2 m height the API measures |
| Predictive LTMs | Agent plans interventions for **tomorrow's** forecast peak, not just today's heat |
| GIS / Temperature Twin alignment | QGIS-ready GeoJSON export + what-if twin slider = FortyGuard's own roadmap |
| NVIDIA ecosystem | NIM (LLM) + Triton (real learned model) + Jetson edge roadmap slide |
| Quantified impact | Simulated deltas anchored to Abu Dhabi precedent (−5 °C, −25% dangerous days) |

---

## 2. ARCHITECTURE (Six Layers)

```
┌─────────────────────────────────────────────────────────────┐
│  L6 PRESENTATION   Deck.gl 3D twin · God Mode console ·     │
│                    Before/After slider · Export buttons      │
├─────────────────────────────────────────────────────────────┤
│  L5 AGENT          LangGraph + NVIDIA NIM                    │
│                    (meta/llama-3.1-70b-instruct)             │
│                    4 tools + demo-mode toggle                │
├─────────────────────────────────────────────────────────────┤
│  L4 OPTIMIZATION   Budget-constrained knapsack solver with   │
│                    overlap penalty / diminishing returns      │
├─────────────────────────────────────────────────────────────┤
│  L3 INFERENCE      Triton Inference Server serving the       │
│                    INTERVENTION SURROGATE MODEL (real ML,    │
│                    not the formula)                          │
├─────────────────────────────────────────────────────────────┤
│  L2 ANALYTICS      HERI → APS → CES math engine (deterministic│
│                    NumPy/PostGIS) + forecast module           │
├─────────────────────────────────────────────────────────────┤
│  L1 DATA           FortyGuard API (current+forecast) ·       │
│                    PostGIS: CDC SVI, canopy, OSM · synthetic  │
│                    fallback grid                              │
└─────────────────────────────────────────────────────────────┘
```

**Stack:** Python FastAPI · PostgreSQL + PostGIS · LangGraph · NVIDIA NIM API (OpenAI-compatible interface → fallback key ready) · Triton Inference Server · React + Deck.gl + Mapbox GL JS.

**Critical architecture decision (Trap #1 fix):** Triton serves a *learned intervention-surrogate model* (small net predicting per-cell cooling delta from context features: canopy density, aspect, albedo, humidity) — trained on synthetic physics-labeled data. The HERI formula stays in deterministic NumPy. This makes the GPU story defensible: *"Our risk math is deterministic; our intervention physics is a GPU-served learned model."*

**Scale decision (Trap #3 fix):** district-scale at true 20 m² depth (not city-wide — 67M cells for Phoenix kills quotas and dilutes the micro-precision story).

---

## 3. THE MATH ENGINE

### A. Heat Equity Risk Index (per 20 m² cell *i*)
```
HERI_i = [(T_2m,i − T̄_city) / σ_T] · SVI_i · (1 − C_i)
```
- `T_2m,i` — FortyGuard temperature at 2 m
- `T̄_city`, `σ_T` — mean / std-dev across the district grid
- `SVI_i ∈ [0,1]` — CDC Social Vulnerability Index (tract-level, spatial-joined to cells, **precomputed**)
- `C_i ∈ [0,1]` — baseline canopy cover
- Normalize final HERI to 0–100 for display

### B. Action Priority + Cost-Effectiveness
```
APS_i,k = HERI_i · P_i · ΔT_2m,k
CES_i,k = APS_i,k / Cost_k
```
- `P_i` — vulnerable-population density in cell
- `ΔT_2m,k` — surrogate-model cooling delta for intervention *k* in cell *i*
- `Cost_k` — intervention cost (shade sail, tree, cool pavement, misting)

### C. Budget Allocation Solver (Trap #4 fix)
Greedy knapsack over CES ranking with **overlap penalty**: adjacent cells claiming the same residents share coverage credit (diminishing returns). Output: exact intervention list, total cost ≤ budget, estimated residents covered, projected ΔT. One deck line: *"SHADE solves a budget-constrained spatial allocation problem — not just ranking."*

### D. Dual-Layer Cooling Matrix (cite in README)
| Intervention | Air temp @2 m | MRT / perceived |
|---|---|---|
| Tree canopy | −1.0 to −3.8 °C | significant |
| Shade structures | −1.5 to −2.5 °C | **−10 to −20 °C** |
| Cool pavement | −0.6 to −1.2 °C | surface −5 to −10 °C |
| Misting (arid) | −3.0 to −5.0 °C perceived (labeled estimate) | — |

**The killer consistency line (say it in the pitch):** *"We simulate at 2 meters because that's exactly where FortyGuard measures — our predicted deltas are directly comparable to API readings."*

---

## 4. THE AGENT (LangGraph + NIM)

**Four tools:**
1. `calculate_hotspots` — returns top HERI cells with human-readable context
2. `forecast_heat` — returns district forecast (Trap #2 fix: **predictive pillar restored**)
3. `simulate_cooling_intervention` — runs surrogate + matrix, returns before/after
4. `generate_municipal_output` — produces GeoJSON work order + SMS alert draft

**Model:** `meta/llama-3.1-70b-instruct` (verified slug). Verify any Nemotron variant on build.nvidia.com before wiring. NIM is OpenAI-API-compatible → code behind one interface with a fallback key.

**The flagship demo prompt:**
> *"We have $50,000 for tactical cooling in Maryvale before tomorrow's 3 PM peak. Target the elderly. Where do we deploy?"*

Agent answer format: exact deployment list + cost + projected °C reduction + residents covered + work-order export.

**Demo mode (Trap #5 fix):** deterministic seeded trajectories toggle. The agent is real; the demo path is guaranteed. Never gamble $3,000 on token sampling.

---

## 5. THE 3D TWIN UI

1. **3D hexagon overview** — heat extruded as prisms (Deck.gl HexagonLayer)
2. **Cell view (mandatory)** — zoom into actual **20 m² cells** with a translucent **2 m pedestrian plane** floating above. This *shows* the spec instead of claiming it
3. **God Mode console** — terminal-style agent chat
4. **Before/After slider** — agent-applied interventions animate prisms shrinking; dual-mode toggle: air temp ↔ MRT/perceived
5. **Export buttons** — `.geojson` work order (QGIS-ready) + draft SMS alert for vulnerable residents (**both outputs = B2G and B2C story**)

---

## 6. DATA PLAN + FALLBACKS

| Source | Use | Risk handling |
|---|---|---|
| FortyGuard Temperature API | Current + forecast at 20 m²/2 m | Verify forecast endpoint in docs. If absent → diurnal-curve-derived forecast, **labeled honestly** |
| Synthetic grid generator | Phoenix August climatology + diurnal curve | Build Day 1 (2 hrs) — offline demo insurance, clearly labeled |
| CDC SVI | Vulnerability | Tract-level → spatial join to 20 m² cells, **precompute, never live** |
| Canopy (NLCD/Sentinel tiles) | `C_i` | Precompute static layers |
| OSM | Buildings/trees/roads context | Cached extracts |

---

## 7. TIMELINE — Aug 27 → Aug 30 (submission Aug 30, 11:59 PM GST)

| When | Milestones |
|---|---|
| **Day 1 · Thu Aug 27** | 4 workstreams kick off in parallel · contract day: lock tool JSON schemas + data schemas · PostGIS + static layers cached · API wrapper + synthetic fallback · Triton scaffold + surrogate training data · ⚠️ **Attend Mike Stelfox 4 PM GST — capture 2 verbatim quotes for the video hook** |
| **Day 2 · Fri Aug 28** | HERI/APS/CES engine unit-tested · knapsack solver · FastAPI endpoints · LangGraph tools wired · NIM connected · Attend Cvetanov 5 PM GST · 3D twin first render |
| **Day 3 · Sat Aug 29** | Slider + dual-mode toggle · exporters (GeoJSON + SMS) · demo mode seeded · **feature freeze 6 PM** · record video v1 · deck v1 · full rehearsal |
| **Day 4 · Sun Aug 30** | Buffer → fixes only · final video + deck · **SUBMIT BY NOON GST** — never at the deadline |

**Team split (4 parallel workstreams):** P1 = PostGIS/ingestion/fallbacks · P2 = Triton surrogate + allocation solver · P3 = LangGraph agent + NIM · P4 = Deck.gl twin + console + narrative/video/deck. Solo? Sequential order L1→L2→L4→L5→L6, Streamlit instead of Deck.gl.

**Definition of done, Day 1:** one `curl` returns top-5 HERI hotspots in Maryvale with real coordinates, and the cooling matrix passes unit tests.

---

## 8. THE PITCH (3-minute video script)

- **0:00–0:45 — Human hook (Stelfox framing):** *"In Phoenix, one side of the street is survivable; the other is a health emergency. People don't avoid heat evenly — they endure it unevenly."* (quote Stelfox). Urban heat = the "silent killer" — deadlier than most natural disasters, invisible to km-scale weather stations.
- **0:45–1:45 — The tech flex:** FortyGuard's 20 m² / 2 m grid vs. weather API — show the micro-hotspot SHADE finds that standard apps can't see. Cell view + 2 m plane on screen.
- **1:45–2:30 — The agent live:** flagship $50k prompt → forecast-aware plan → 3D twin animates cooling → exact deployment list.
- **2:30–3:00 — Impact + roadmap:** slider with Abu Dhabi anchor (*"same order of magnitude as FortyGuard's −5 °C result"*), GeoJSON export to QGIS, SMS alert, Triton/NIM today → **Jetson edge nodes tomorrow** → "built to become part of FortyGuard's Temperature Twin."

**Deck (8 slides):** Problem (silent killer) → Insight (measurement gap + equity) → Math engine → Agent + NVIDIA stack → 3D twin demo shots → Impact math + Abu Dhabi anchor → FortyGuard alignment (tOS, co-pilot, Twin, GIS) → Roadmap (Jetson edge) + team.

---

## 9. JUDGE Q&A PREP

| Question | Your answer |
|---|---|
| Why not a normal weather API? | km-scale averages erase the block that kills; 20 m²/2 m is the difference between weather and exposure |
| Why Triton for this? | Deterministic risk math stays in NumPy; the *learned intervention surrogate* runs on GPU — that's the model that needs scale |
| Is this deployable? | GeoJSON into existing GIS workflows; one-district pilot; Abu Dhabi precedent proves the playbook |
| What's novel? | The closed loop: detect → forecast → allocate (knapsack) → simulate → act, equity-weighted |
| Edge deployment? | Jetson kiosk node for offline neighborhood alerting — designed for the prize hardware |
| Are your numbers honest? | Coefficients cited; fallback data labeled; limitations section in README |

---

## 10. RISK REGISTER

| Risk | Mitigation |
|---|---|
| API credits/access fail | Synthetic 20 m² grid, labeled, built Day 1 |
| Forecast endpoint missing | Diurnal-derived forecast, labeled honestly |
| NIM rate limits mid-demo | OpenAI-compatible interface + fallback key |
| LLM nondeterminism in live pitch | Demo mode toggle |
| Scope creep past freeze | Freeze Sat 6 PM; anything after is video-only |
| Video disaster | Record twice (Sat + Sun), ≤3.5 min, captions on |

---

## 11. FINAL SUBMISSION GATE ✅

- [ ] "20 m²" and "2 m" **spoken aloud** in the video + shown in cell view
- [ ] Agent uses **forecast** (predictive, not reactive)
- [ ] Every screen ends in an action (work order + SMS alert)
- [ ] Equity layer names the vulnerable humans, not "users"
- [ ] Simulator cited + modeled at 2 m (consistency line delivered)
- [ ] NVIDIA visible: NIM now, Triton real model, Jetson roadmap
- [ ] GIS export + "Temperature Twin-compatible" language
- [ ] Stelfox/Cvetanov quotes woven in (you attended their sessions)
- [ ] Impact quantified and anchored to Abu Dhabi
- [ ] README honest: architecture, math, coefficients, limitations
- [ ] Submitted by **noon GST, Aug 30**

---

**Bottom line:** Most teams will build a heat map. Some will build a dashboard. You are building the **decision engine FortyGuard itself wants to exist** — hyperlocal data as the engine, equity as the compass, action as the output, their own roadmap as your destination. Every layer of this plan maps to a sentence in their mission. That is not a submission; that is a prototype they will want to hire.

Now execute. Stelfox speaks in a few hours — his quotes belong in your opening frame. 🏁
