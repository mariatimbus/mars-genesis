# MARS: Genesis

Browser-based Mars colony survival trainer built with Vite, React, TypeScript, Three.js, React Three Fiber, Drei, Zustand and Tailwind CSS.

## Run and verify

Use Node.js 22.14+ (or a compatible newer LTS release).

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

Open http://localhost:5173. New missions start with seven prebuilt facility types offline: energy, crew, health, water, research, greenhouse and oxygen. Select a facility or its startup card and solve its challenge to activate that group. Wrong answers give feedback without spending supplies. Time, resources, construction and terrain expansion remain paused until all seven challenges are complete. Startup progress is autosaved; ongoing legacy missions keep their progress and unlocks.

Drag to orbit, scroll to zoom, right-drag to pan. Inspect buildings, construct facilities, use Crew for assignments and recovery, and advance sols. Complete the mission at sol 30 with living, working crew, safe habitat, non-declining oxygen and food production, and at least 12 kWh of battery reserve.

## Simulation

- `src/simulation/engine.ts`: original colony geometry catalog and placement validation.
- `types.ts`, `scenario.ts`, `lifeSupport.ts`, `crewHealth.ts`, `events.ts`, `survival.ts`: deterministic scenario, energy allocation, resource conversion, health, six events, explicit delayed-effect queue and scoring.
- `commissioning.ts`: seven validated startup challenges, facility unlocks and legacy mission upgrades. Medical recovery requires a powered bay and working medic; water recycling and depot extraction require a powered water facility.
- `src/store/game.ts`: player actions and versioned LocalStorage save. The previous builder save is preserved under its original key; survival saves use a separate key.
- `src/components/`: crew, power/life support, scenario, decision, science and mission-result panels.
- `src/game/`: existing terrain, camera, buildings and new state-driven facility/shelter/EVA indicators.

Crew health is a gameplay abstraction. Repeated shortages impair health and work; a missed meal is not fatal. Radiation is an educational cumulative mSv metric and never causes invented acute medical effects. Manual repairs require a working engineer; unavailable engineers delay the repair queue.

## Scientific provenance and limitations

`src/data/scienceReferences.json` records source URLs, observation dates, units, archive status, verification date and the boundary between observation and model. All sources are archived, never labeled live. `historicalObservations.json` provides the numeric archived inputs used by the environment models. `balanceConfig.json` states units, Earth-day-to-sol conversions and assumptions. `historicalEvents.json` contains event explanations and scientific context.

Integrated historical sources: NASA SDO May 2024 solar-flare archives; Opportunity's June 2018 dust-opacity observation; NASA's archived Perseverance MEDA weather report; Curiosity RAD's August 2012–June 2013 average; NASA life-support planning references; Perseverance communication-delay guidance; qualitative OSDR study OSD-661 context.

DONKI endpoints were unavailable during integration. The app uses verified SDO observations for solar scenarios instead; `src/nasa/sources.ts` includes a tested DONKI metadata mapper, but no fabricated DONKI archive. MEDA integration uses NASA-published temperature extrema, not a downloaded PDS time series. OSDR is educational context only, never a human survival probability calculator.

Facility yields, shielding factors, pressure safety floors, storm duration/attenuation coefficients, repairs, injuries, recovery and scores are simplified gameplay assumptions, not NASA predictions. No API key or backend is required. Bundled science data works without NASA network access once the app is loaded; an uncached browser still needs network access to load the website itself.

## Deploy to Vercel

The project is configured by `vercel.json` and linked to `mars-genesis` locally.

```sh
npx vercel login
npx vercel --prod
```

Vercel runs `npm run build` and serves `dist`. Production: https://mars-genesis.vercel.app. Saved games remain per-browser and per-origin.

The original pre-implementation README is preserved as `Documentation/README.legacy.md`.
