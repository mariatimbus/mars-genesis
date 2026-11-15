# Exterior weather: 720-sol visual calendar

Verified 15 November 2026. Exterior weather now also triggers fictional maintenance
scenarios in the 18-challenge dependency chain. The resource campaign remains 30
sols. Existing mission alarms, rover physics and weather reference dates are unchanged.

## Evidence

- [MEDA / NASA PDS](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html): instrument and archive reference for wind, dust, temperatures, pressure and radiation. No bulk daily sensor files were imported.
- [Sánchez-Lavega et al., 2025](https://doi.org/10.1029/2024JE008565), sections 6.3, 6.7 and 6.8: cloud-rich sols 284–305, dust arriving at Jezero on sol 571 and peaking on sol 574, enhanced opacity on sols 600–640, and the unexplained pressure-tide change on sol 703.
- [Lemmon et al., 2022](https://doi.org/10.1029/2022GL100126): local effects of the regional storm over sols 313–318.
- [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/): linked for future space-weather integration. No feed has been downloaded for this feature. Solar events are not converted into visible dust or a Mars surface dose.
- [MOXIE / NASA PDS](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/moxie.html): oxygen experiment reference, reserved for later gameplay integration; not a weather sensor.

## Reconstruction

`src/weather/calendar.ts` generates exactly 720 stable day profiles offline. Linked
observational windows are explicitly distinguished from modeled days. The fictional
base replays Perseverance sol numbers as an educational reference, not a forecast
for a future human settlement. Distant polar storms are not rendered as local
Jezero storms. Sol 703 changes the information card without inventing a storm.

All 0–1 cloud, dust and wind coefficients, seasonal envelopes, particle speeds,
cloud patterns, colors, fog distances and visual transitions are authored artistic
choices. They are not measured optical depths, wind speeds or daily MEDA records.
Clouds represent thin water-ice wisps; there is no rain. Fog is a rendering technique
for dust extinction, not a claim that surface water fog was observed. No numerical
temperature, pressure or wind readings are invented for the HUD.

## Clock and controls

- Esc → **Surface weather · 720 sols** opens the exterior inspector.
- **N**, on foot or driving, or **Skip to next event** in the pause menu advances
  surface time to the next documented milestone (284, 313, 571, 574, 600,
  703). At the last milestone the button disables; the calendar does not wrap.
  Active maintenance locks block further skip and sol progression until repaired.
  Pressing N again opens the pending repair. The inspector offers a committed
  **Skip to event** button that returns to the habitat and activates the incident.
- The slider, arrow keys on the focused slider, day buttons and example chips
  preview every sol without changing the active sol or colony state.
- **Skip to sol … & return to habitat** commits the exterior day and enters any
  crossed event milestones. A previously resolved observation window can be replayed
  explicitly. This action is disabled during repairs.
- Each 12 minutes of active exploration advances the exterior by one sol. Panels,
  paused exploration, challenges, hidden tabs, mission alarms and the inspector
  pause that clock. Weather still animates in the inspector for comparison.
- Mission sol advances also move the exterior calendar forward once; resetting to
  a new scenario resets it. The calendar stops at sol 720. Its clock is shared
  with the crew time-of-day buttons and independent of the 30-sol resource campaign.
- Surface day and partial progress persist separately from the colony save.
  Preview state never persists; closing the inspector restores the active weather.

## Rendering and validation

The astronaut, rover, exterior inspector and colony overview share the calendar.
GPU particles and procedural clouds require no downloaded assets or API key.
Dust has no physics bodies or interaction raycasts. A shelter occupancy texture
masks particle centers within room and corridor floors; opaque walls supply depth
occlusion. Indoor fog remains distant so the rooms stay usable. Dust stays near
the terrain even when the inspection camera is above the roof.

Tests cover all 720 profiles, documented windows, the pressure-only anomaly,
calendar bounds, clock rollover, shelter masking, preview isolation, mission clock
sync, maintenance cascades, persistent repairs, safe emergency access and unchanged
resources/achievements during repair. Run `npm test` and `npm run build`.

## Fictional maintenance scenarios

The dates describe real atmospheric episodes; the base failures and recovery
actions are educational game design, not measured MEDA damage or NASA operating
procedures. Cleaning panels does not clear airborne dust. The sol-703 pressure
anomaly is not asserted to mean a broken sensor or a habitat pressure leak.

| Entry sol | Affected step | Recovery |
| --- | --- | --- |
| 284 | Greenhouse 1: lights | Recalibrate LED power use after clouds reduce exterior solar input |
| 313 | Energy 1: dust | Clean every solar cell |
| 571 | Energy 1: dust | Clear the arrays after a new storm |
| 574 | Energy 3: battery | Reconnect the isolated backup distribution bus |
| 600 | Water 3: filter | Inspect the external sample-processing line with filter/test activity |
| 703 | Laboratory 3: weather | Revalidate sensor connections before accepting weather data |

`incidents.ts` computes transitive dependencies using the existing room graph and
the ordered tasks in each room. The affected task displays a padlock; later tasks
and dependent rooms suspend until it is restored. Earlier independent steps stay
accessible. Module production and field actions use the same lock through
`facilityUnlocked`; building power switches, damage, best stars, credits, discovery
cards and ordinary lesson state are retained. Habitat emergency circulation is
kept separate from production shutdown. Mission-sol advancement pauses for repair.

Repairs use the existing mini-game reducers on a separately persisted emergency
workbench. They can be completed even before commissioning and without the failed
upstream system. They award no repeat credits and do not grant unearned lessons.
Completion automatically releases dependent tasks; other active incidents still
apply. Partial repairs survive reload. Normal progression triggers each event once; explicit inspector travel can replay
a resolved observation window, and a later storm resets the dust repair again. A large forward jump queues all crossed events;
shared dust-cleaning faults can be cleared together. Weather preview never triggers
a fault, and moving the calendar backwards never erases one. Resetting the mission
clears both its incident journal and the independent surface calendar.

## Difficulty, failure and retry clocks

The challenge rules are gameplay assumptions. They are not measured equipment
failure thresholds, NASA operating procedures, or physiological predictions.
Thirteen challenges have consequences. Five exploratory lessons (molecules,
medical tools, gravity, crew checkups, rock interpretation) retain guided feedback
without a system penalty.

| Challenge | Normal attempt | Hard event repair |
| --- | --- | --- |
| Solar dust | 60 active seconds | 45 seconds, three layers/cell, two gusts, 44 wipes instead of 25 |
| Solar tracking | 45 seconds to accumulate stable capture | No current event uses this repair |
| Battery wiring | 60 seconds; wrong CONNECT fails | 45 seconds; all five paths still required |
| Ice scan | 45 seconds; a wrong/unverified DRILL fails; exploratory scans stay safe | No current event uses this repair |
| Ice melting | 60 seconds; unsafe heating, opening while heating or overheating fails | No current event uses this repair |
| Water filter | 60 seconds; wrong RUN or TEST fails | 45 seconds, two fresh filter trains and two verified samples |
| Electrolysis fill | 45 seconds; wrong CONNECT fails; draft fill/drain remains adjustable | No current event uses this repair |
| Air regulator | 60 seconds; leaving the training band fails | No current event uses this repair |
| Grow lights | 60 seconds; wrong TEST fails | 45 seconds; red 58–68, blue 36–46, green 8–18, total ≤115 |
| Planting | 45 seconds; wrong confirmed plan fails | No current event uses this repair |
| Irrigation | 45 seconds; wrong confirmed moisture check fails | No current event uses this repair |
| Antenna | 60 seconds including both compressed signal journeys; sending while misaligned fails | No current event uses this repair |
| Weather sensors | 60 seconds; a wrong connection fails | 45 seconds; assembly plus four calibration checks |

A failed attempt isolates its step and transitive dependents. Historical stars,
credits and discovery cards are retained. The retry interlock lasts one game hour:
**30 seconds of active play**, using the existing 12-minute/day scale. Finishing
the cooldown enables a new attempt; only success restores the system. The weather
calendar and mission-sol skip remain blocked until that success.

The retry clock is independent of the paused resource campaign and the surface
clock's hour skips. It runs while the focused, visible game has an open
challenge, active astronaut/rover exploration or colony overview. It continues
through commissioning and maintenance so a paused sol cannot deadlock a cooldown.
It pauses on the astronaut Esc menu, hidden tabs, app blur and ended missions. It
does not spend colony resources. The deadline/cooldown progress is saved; leaving
or reloading does not refill it. Offline time does not count.

The attempt deadline continues when switching challenges, resetting the board or
pausing the mini-game mechanism. The board can reset without resetting its timer.
A retry after the cooldown starts a fresh board and fresh deadline. Failed boards
reject play/reset actions until an explicit retry. Repair results continue to use
separate state, award no duplicate credits and leave original lessons intact.

## Forward time skips and day/night

The habitat clock and 720-sol exterior calendar share one saved time of day.
New games start at 08:00. Lights out advances to 22:00; Morning advances to
08:00. If the target hour has already passed, the skip goes to the next sol.
An exact match is a no-op. Natural exploration also increments the surface sol
at midnight. The 30-sol resource campaign still settles through its Next sol
action; hour skips do not spend campaign reserves or advance retry timers.

Overnight hour skips stop at 00:00 on the next important environmental-event
day, allowing the existing incident bridge to isolate systems and activate the
base alarm. Existing maintenance locks block further skips. Archive previews
remain separate. The final calendar day cannot wrap to an earlier time.

The sky, visible Sun and directional/ambient lights use the same artistic
day/night profile. NPC schedules use that same clock. Version-1 saves retain
their surface sol and adopt their previously displayed habitat hour once when
migrating to version 2.

## Committed weather travel

Skip to event and Skip to sol in the weather inspector now commit the date and
return the astronaut to the habitat. They activate maintenance locks and the
base alert before exploration resumes. Mere slider previews remain harmless.
Explicit travel into a previously resolved cloud/storm/dust/pressure observation
window re-arms its fictional maintenance scenario without resetting achievements
or granting rewards. Normal clock progression remains idempotent. An active
repair cannot be bypassed or restarted by weather travel.

All thirteen operational attempts now use 45- or 60-second deadlines. All five
event repair variants use 45 seconds. The five guided lessons retain feedback
without failure locks. Planet Atlas, its G shortcut, globe view and atlas-only
styles have been removed; the tactical base map and rover driving HUD remain.
