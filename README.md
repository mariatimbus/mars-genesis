# MARS: Genesis

Demo : https://mars-genesis.vercel.app
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

Open http://localhost:5173. Choose **Mission challenges / 18 experiments** from the astronaut pause menu or colony view. New missions activate six rooms through three hands-on experiments each, in order: Energy, Water, Oxygen, Greenhouse, Medical, Laboratory. Each room starts producing only after its three lessons are complete. Habitats unlock with oxygen; ice depots unlock with water. Time, reserves, construction and expansion stay paused during startup. Version 5 saves keep their existing facility unlocks and gain the new trainer as practice.

Drag to orbit, scroll to zoom, right-drag to pan. Inspect buildings, construct facilities, use Crew for assignments and recovery, and advance sols. Complete the mission at sol 30 with living, working crew, safe habitat, non-declining oxygen and food production, and at least 12 kWh of battery reserve.

## Simulation

- `src/simulation/engine.ts`: original colony geometry catalog and placement validation.
- `types.ts`, `scenario.ts`, `lifeSupport.ts`, `crewHealth.ts`, `events.ts`, `survival.ts`: deterministic scenario, energy allocation, resource conversion, health, six events, explicit delayed-effect queue and scoring.
- `commissioning.ts`: six training room unlocks and legacy mission upgrades. `training/engine.ts` validates the eighteen interactive tasks and their rewards. Medical recovery requires a powered bay and working medic; water recycling and depot extraction require a powered water facility.
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

## Astronaut visuals

First-person crew, the suit locker, and overview EVA crew use a locally bundled
Smithsonian Apollo 11 suit scan with original PBR textures. Materials and geometry
are shared where possible; each crew member has independent subtle breathing/head
motion and added fictional life-support equipment. The first crewmate is stationed
near the habitat arrival area and remains interactive with E.

The historical scan has **non-commercial, educational and personal use restrictions**;
it is not CC0. Commercial distribution requires permission or a replacement asset.
Source, attribution, usage terms and adaptations are recorded in
`public/models/astronaut/CREDITS.txt` and accessible from the astronaut tablet.

First-person furnishings reserve 2.1 m circulation lanes and access space in front
of terminals and suit lockers. Ordinary interior doors start open; airlock doors
remain sealed until operated. Solar arrays and rocks stay clear of buildings and
the EVA exit apron. Terrain is flattened below interiors with a skirt wide enough
to prevent terrain triangles from protruding through edge floors.

The first-person exterior includes procedural regolith, craters, distant ridges,
instanced rocks, windblown dust, a rover/landing zone, communications antenna,
cargo and weather equipment. Marked EVA routes and map landmarks share the same
layout; large scenery keeps clear of those routes and the airlock apron. A
collision-tested ramp connects the habitat floor to the surface. “View exterior”
in the pause menu opens a free-orbit inspection view with exploration paused.
The scenery is artistic game geometry, not a reconstruction of a real Mars site.

## Planet exploration and rovers

The astronaut world now streams 100 m terrain chunks around the explorer. The
compressed procedural planet has a 32 km equatorial circumference; longitudes
join at the date line and journeys reflect through the poles. Surface gameplay
uses local heightfield charts, rather than full-size Mars or radial-gravity
orbital simulation. The globe atlas and terrain use the same spherical sampling.
Nine destinations include craters, canyons, volcanic terrain, polar ice, survey
sites and two charging outposts. Their names and geography are fictional.

Press **G** for the globe and select a waypoint; **M** keeps the local map in the
top-right corner. Positions, surveyed locations, rover locations, batteries and
odometer readings are saved in the browser. There is no longer a 205 m return-to-
base boundary. Close terrain has explicit collision meshes; distant chunks use
lower detail and skirts, and movement waits for ground collision data after a
chart transition.

Two driveable cabin rovers, Nomad and Pathfinder, start near the landing zone.
Use **Start rover expedition** in the pause menu, or approach a rover and press
**E**. **W/S** accelerate/reverse, **A/D** steer, **Shift** boosts, **Space** brakes,
and **E** exits after stopping if there is clear space and a usable suit. Arrow
keys also work. A pressurized cabin pauses suit oxygen consumption and EVA time.
Stop while aboard near the base or an outpost to recharge. **Return to habitat**
is available in the pause menu; it leaves rovers where they were parked.

## Industrial visual style

Interiors, exterior structures, rovers, astronauts and interface share a dark
industrial palette: grey metal, burgundy pipes, yellow caution markings and
green CRT readouts with blue system diagrams. Equipment screens display live
colony or rover data. Bulkheads, turbine assemblies and overhead service pipes
are procedural local geometry; the added decoration preserves walking routes.

Choose **Inspect reactor room** from the pause menu to orbit the machinery, or
**View exterior** to inspect the habitat from outside. Both views pause the
simulation and leave the astronaut and rovers in their current locations.

## Hands-on mission challenges

- Energy: brush dusty cells, track the moving Sun, rotate battery cable tiles.
- Water: move and scan with a survey rover, melt ice in a sealed pressurized tank, assemble and test a coarse-to-fine filter.
- Oxygen: fill the shared-water cell, split and sort H/O atoms in a 2:1 ratio, regulate the air score for thirty stable seconds.
- Greenhouse: mix grow lights, plan three crops, balance individual root-zone moisture.
- Medical: sort the kit, predict and compare radiation exposure, scan crew and match support.
- Laboratory: aim the antenna and send a delayed message, focus three rock textures, assemble four weather sensors.

BIP and the specialist give three short introductory bubbles. Two mistakes reveal a hint; retries remain available. Each first completion awards 10 mission credits, or 15 for a perfect three-star result. Practice preserves the best stars and awards no duplicate credits. These training credits are separate from the existing colony material economy. Task progress, records, credits and message timestamps autosave. The one-way message and round-trip reply countdowns continue while the panel is closed; timing uses the mission's radio-delay setting.

Discovery Book stores all eighteen sourced learning pages. The weather task unlocks the existing mission after the six-room course; its first report is the archived MEDA high/low from real sols 43-44, not a live reading. The present sol campaign remains the existing 30-sol simulation. The document's 20-sol calendar, night attacks, upgrade variants and separate factory economy are outside this challenge implementation.

Science notes distinguish teaching models from measurements. The radar site is fictional and does not claim buried ice at Jezero. The pressure scale is illustrative. The air gauge is a gameplay score, not an oxygen concentration. Green grow light is not described as useless. Conductivity alone does not certify drinking water. Radiation comparison does not fabricate an ISS dose; the numeric Mars example is Curiosity's historical Gale average. No radiation dose is converted into an instant health penalty by these activities.

## Autonomous crew in the habitat

Other astronauts now walk between their assigned workroom, water station and habitat, with a short pause at each destination. A half-metre navigation grid accounts for furnishings and exterior walls. Crew yield and replan around the player and one another, open ordinary interior doors when needed, and never enter the pressure chamber or operate airlock doors. Northern interior corridors bypass the airlock spine.

The habitat clock starts at 08:00. Crew return to individually reserved bunks from 21:00, lie down between 22:00 and 06:00, and get up for the next shift. A rest assignment, incapacitation or fatigue of at least 80 also sends an astronaut to bed early. Shelter orders override sleeping. Sleep includes a transition onto the mattress, a reclining pose with the life-support pack stowed, pillows and bedding, and softer habitat lighting. Work assignments remain under the player's control.

The artistic habitat clock runs through 24 hours in twelve active minutes; it is separate from manually advancing the campaign sol. It pauses with exploration, training, alarms or a hidden tab, and its time and crew locations are saved locally. These ambient routines do not replace the existing per-sol fatigue, health or production calculations. In the pause menu, **Lights out / 22:00** and **Morning / 08:00** let you inspect the two routines without advancing the mission sol; resume exploration to let crew reach their destination. Crew activity appears on the local map, in conversations and on the crew tablet.

The top-right local map uses a tactical floor plan: continuous grey rooms and
corridors, perimeter walls, fixed furnishings, live door bars, a white player
arrow and viewing cone, mint crew badges, blue sleeping markers and gold rovers.
The base scale stays stable indoors. Outside the base view it follows the explorer
and points back towards the habitat. **M** expands the map; **G** opens the globe.
