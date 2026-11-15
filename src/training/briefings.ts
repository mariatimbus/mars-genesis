import type { TaskId } from './catalog';

/** Mission briefing shown before each challenge: why it matters on Mars, what you do, the rules, what you learn. */
export interface Briefing {
  /** Short headline of the problem on Mars. */
  problem: string;
  /** WHY: the Mars context that makes this job necessary. */
  why: string;
  /** Big-number facts shown as cards. */
  stats: [value: string, label: string][];
  /** HOW: the process, as an illustrated chain of steps. */
  flow: [icon: string, label: string][];
  /** Rules of the challenge. */
  rules: string[];
  /** WHAT you will learn. */
  learn: string;
}

export const briefings: Record<TaskId, Briefing> = {
  dust: {
    problem: 'Dust is blocking our sunlight',
    why: 'Mars is covered in fine red dust. The wind lifts it and it settles on everything, including our solar panels. A dusty panel is like a dirty window: less light gets through, so it makes less electricity. Without power, nothing else in the base works.',
    stats: [['~43%', 'of Earth’s sunlight reaches Mars'], ['2018', 'a global dust storm darkened the sky for months'], ['12', 'panel cells to clean']],
    flow: [['☀️', 'Sunlight'], ['🟦', 'Clean panel'], ['⚡', 'Electricity'], ['🏠', 'Base systems']],
    rules: ['Swipe (hold the mouse button) or tap each dusty cell.', 'A cell needs two brushes: dusty → half clean → shining blue.', 'Watch out: a wind gust will bring some dust back.'],
    learn: 'Why dust is one of the biggest enemies of solar power on Mars.'
  },
  sun: {
    problem: 'The Sun keeps moving',
    why: 'Like on Earth, the Sun crosses the Martian sky during the day. A panel collects the most light when it faces the Sun directly. If it points the wrong way, the light hits it at a slant and the power drops.',
    stats: [['24 h 37 min', 'is one Martian day (a “sol”)'], ['90°', 'facing the Sun gives the most light'], ['15 s', 'of strong light to collect']],
    flow: [['🌅', 'Sun rises'], ['↗️', 'Turn the panel'], ['🎯', 'Face the Sun'], ['🔋', 'More energy']],
    rules: ['Press “Start tracking”. The Sun starts to move.', 'Drag the slider so the panel faces the yellow Sun.', 'Stay close to the Sun (within 12°) for 15 seconds in total.', 'If you fall behind for too long, it counts as a mistake.'],
    learn: 'How the angle of a panel changes how much energy it produces.'
  },
  battery: {
    problem: 'The power network is disconnected',
    why: 'The panels only make electricity while the Sun shines. At night, and during dust storms, the base lives on its battery. Electricity flows only through a closed path: from the panels to the controller, into the battery, and out to every machine that keeps us alive.',
    stats: [['5', 'cables to connect'], ['0', 'crossings allowed'], ['~12 h', 'of darkness every sol']],
    flow: [['☀️', 'Solar array'], ['⚙️', 'Charge controller'], ['🔋', 'Battery'], ['🫧💧💡', 'Life support']],
    rules: ['Each colour joins two sockets of the same colour.', 'Drag from a socket across the board to its partner (or click a socket, then click the squares one by one).', 'Cables cannot cross, and they cannot go through the rock.', 'Dragging again from a socket redraws that cable. When all five are done, press “Switch on”.'],
    learn: 'Why electricity needs a closed circuit, and how a battery stores energy for the night.'
  },
  scan: {
    problem: 'We need water, and it is hidden underground',
    why: 'Mars has no rivers or lakes today. Its air is so thin and cold that liquid water cannot last on the surface. But there is a lot of ice hidden under the ground. To find it we use radar: radio waves bounce back differently from rock, frozen soil and ice.',
    stats: [['−63 °C', 'is the average temperature on Mars'], ['0.6%', 'of Earth’s air pressure'], ['6', 'places to scan']],
    flow: [['🚙', 'Move the rover'], ['📡', 'Radar scan'], ['🧊', 'Blue echo = ice'], ['⛏️', 'Drill']],
    rules: ['Drive the rover with the slider, or click a ground column.', 'Scan before you drill. Every scan without ice counts as a try.', 'Grey = basalt rock, orange = frozen soil (ice is near), blue = ice.', 'Drill only where you see the blue ice echo.'],
    learn: 'How scientists find buried ice without digging everywhere.'
  },
  melt: {
    problem: 'Ice is no use until it becomes liquid water',
    why: 'On Mars temperatures are very low, often below −60 °C, so water exists only as ice. The air pressure is also tiny. If you heat ice in the open, it turns straight into vapour and escapes (this is called sublimation). So we melt it inside a sealed tank, under pressure, where it can become liquid.',
    stats: [['−80 °C', 'a cold Martian night'], ['0 °C', 'ice melts (under enough pressure)'], ['0.6%', 'of Earth’s pressure outside']],
    flow: [['🧊', 'Load ice'], ['🔒', 'Seal the lid'], ['🎈', 'Add pressure'], ['🔥', 'Heat'], ['💧', 'Water']],
    rules: ['Follow the order: load the ice → close the lid → pump until the needle is in the green zone.', 'Hold the HEAT button. Release it when everything has melted.', 'Heating with the lid open or with the wrong pressure loses the sample.', 'Keep heating after it has melted and you waste electricity.'],
    learn: 'Why ice on Mars sublimates, and why the temperature stays at 0 °C while ice melts.'
  },
  filter: {
    problem: 'The melted water is dirty and salty',
    why: 'Ice from the Martian ground is mixed with rock grit, fine dust and dissolved salts. Some of these salts, called perchlorates, are harmful to people. No single filter can catch everything, so we use several barriers, from the largest holes to the smallest.',
    stats: [['~0.5%', 'of Phoenix soil samples was perchlorate salt'], ['98%', 'of water is recycled on the ISS'], ['3', 'filter stages']],
    flow: [['🪨', 'Grit'], ['🌫️', 'Dust'], ['🧂', 'Salts'], ['💧', 'Clean water']],
    rules: ['Put the three filters into the column, from top to bottom.', 'Coarse to fine: big particles must be stopped first, or the fine filter clogs.', 'Press “Run water”, then check the water with the conductivity sensor.'],
    learn: 'Why filters are stacked from coarse to fine, and how we test water for salts.'
  },
  fill: {
    problem: 'Our oxygen generator is empty',
    why: 'The air on Mars is 95% carbon dioxide and almost no oxygen. We cannot breathe it. Our oxygen comes from water: an electrolysis cell splits water into oxygen and hydrogen. But the same water is also needed for drinking and for the plants, so we must not waste it.',
    stats: [['0.13%', 'of Martian air is oxygen'], ['~0.84 kg', 'of oxygen one person needs per day'], ['60', 'units of water to add']],
    flow: [['🚰', 'Shared reserve'], ['🧪', 'Electrolysis cell'], ['🫧', 'Oxygen'], ['🧑‍🚀', 'Crew']],
    rules: ['Each pour adds 10 units of water to the cell.', 'Stop exactly at the green line (60).', 'Going over the line takes water from drinking and plants, which counts as a mistake. Drain if you overshoot.', 'Connect the cell when the level is right.'],
    learn: 'That water, food and oxygen on Mars all depend on the same reserve.'
  },
  split: {
    problem: 'Turn water into breathable oxygen',
    why: 'A water molecule (H₂O) is made of two hydrogen atoms and one oxygen atom held together. If we pass electricity through water, the molecules break apart. Oxygen gas collects at one electrode and hydrogen at the other. This is electrolysis, and it is how the ISS makes oxygen for its crew.',
    stats: [['H₂O', '2 hydrogen + 1 oxygen'], ['2 : 1', 'hydrogen to oxygen'], ['O₂', 'is the oxygen we breathe']],
    flow: [['💧', '2 H₂O'], ['⚡', 'Electric current'], ['⚪⚪', '2 H₂ (hydrogen)'], ['🔴🔴', 'O₂ (oxygen)']],
    rules: ['Move the two water molecules into the cell.', 'Switch on the current: the molecules break into atoms.', 'Click an atom, then the tank where it belongs.', 'White H → hydrogen tank. Red O → oxygen tank.'],
    learn: 'What a molecule is made of, and why 2 H₂O gives 2 H₂ + O₂.'
  },
  air: {
    problem: 'The crew breathes non-stop',
    why: 'Every breath uses up oxygen, and the crew needs more when they work or exercise and less when they sleep. Too little oxygen makes people dizzy and confused. Too much is dangerous too: things catch fire much more easily. The life-support system must keep the air balanced all the time.',
    stats: [['21%', 'of Earth’s air is oxygen'], ['×3', 'how much breathing changes with effort'], ['30 s', 'to keep the air balanced']],
    flow: [['🫧', 'Oxygen tank'], ['🔧', 'Valve'], ['🏠', 'Habitat air'], ['🧑‍🚀', 'Crew breathes']],
    rules: ['Press “Start regulator”.', 'Watch the crew: sleeping, working or exercising changes how much oxygen they use.', 'Move the valve to match the demand and keep the needle in the green zone.', 'Red = too little oxygen, orange = fire risk. Only green time counts.'],
    learn: 'Why life support must react all the time, not just once.'
  },
  lights: {
    problem: 'Our greenhouse has no sunlight inside',
    why: 'Mars gets less sunlight than Earth, and dust storms can block it for weeks. Inside the base, plants grow under LED lamps. Leaves use mostly red and blue light to make food (photosynthesis). Green light is mostly reflected, which is why leaves look green, but it helps us see the plants. Every lamp uses electricity, so we must not waste it.',
    stats: [['Red + Blue', 'the light leaves absorb most'], ['130', 'units of lighting budget'], ['3', 'LED colours to mix']],
    flow: [['⚡', 'Electricity'], ['🔴🔵', 'LED light'], ['🍃', 'Leaves'], ['🥗', 'Food']],
    rules: ['Use the three sliders to mix red, blue and green light.', 'Plants need enough red (at least 50) and enough blue (at least 30).', 'The total must stay within the budget of 130.', 'Watch the plants and the light graph, then test your recipe.'],
    learn: 'Which colours of light plants use, and why leaves look green.'
  },
  plant: {
    problem: 'We need fresh food for a long mission',
    why: 'A trip to Mars and back could take years. Stored food slowly loses vitamins, and fresh vegetables are good for the crew’s health and mood. Different crops are ready at different times, so a smart garden mixes fast crops with slower ones.',
    stats: [['~30 days', 'lettuce on the ISS'], ['~100 days', 'dwarf tomatoes on the ISS'], ['3', 'growing beds']],
    flow: [['🌰', 'Seeds'], ['🌱', 'Sprout'], ['🥬', 'Harvest'], ['🧑‍🚀', 'Fresh food']],
    rules: ['Choose a seed packet, then click a bed to plant it.', 'Fill all three beds.', 'Use three different crops: lettuce, mizuna and the tomato research crop.'],
    learn: 'Why astronauts grow different plants instead of just one.'
  },
  irrigate: {
    problem: 'Roots need water AND air',
    why: 'Too little water and the plant dries out. But too much water fills the spaces in the soil where air should be, and roots need air to breathe. In low gravity, water does not drain the way it does on Earth, so watering must be careful. Each crop likes a different amount.',
    stats: [['38%', 'of Earth’s gravity on Mars'], ['3', 'beds, each with its own target'], ['±10', 'units per watering']],
    flow: [['💧', 'Water'], ['🟫', 'Soil'], ['〰️', 'Roots get water + air'], ['🌿', 'Healthy plant']],
    rules: ['Add or drain water in small steps for each bed.', 'Bring every bed into its green zone. The zones are different.', 'Look at the roots: brown and dry or blue and soaked means trouble.', 'Inspect when all three beds are green.'],
    learn: 'That plants can drown, and why each crop needs its own care.'
  },
  kit: {
    problem: 'The medical bay is still in boxes',
    why: 'Mars is far away. A message to Earth takes up to 22 minutes, and no ambulance can come. The crew must treat problems themselves, so every tool must be in the right place and everyone must know what each one does.',
    stats: [['6–9 months', 'one-way trip to Mars'], ['22 min', 'maximum signal delay to Earth'], ['5', 'tools to put away']],
    flow: [['📦', 'Unpack'], ['🔍', 'Identify the tool'], ['🗄️', 'Right station'], ['🩺', 'Ready to help']],
    rules: ['Click a tool, then the station where it belongs.', 'Each station shows what it is for: wounds, illness, radiation monitoring, checkups.', 'One station needs two tools.', 'A wrong match counts as a mistake, but you can try again.'],
    learn: 'What each medical tool is for, and that a dosimeter measures radiation but does not treat it.'
  },
  gravity: {
    problem: 'Weaker gravity, weaker body?',
    why: 'On Earth, every step and every time you stand up, your muscles and bones work against gravity, and that keeps them strong. Mars has only 38% of Earth’s gravity, and in space there is almost none. When the body has less work to do, it slowly removes muscle and bone it does not seem to need. Exercise is how astronauts tell their body: “I still need you strong!”',
    stats: [['38%', 'of Earth’s gravity on Mars'], ['1–1.5%', 'bone density lost per month in space without exercise'], ['~2 h', 'of exercise per day on the ISS']],
    flow: [['🪐', 'Low gravity'], ['📉', 'Less work for the body'], ['🏋️', 'Daily exercise'], ['💪', 'Strong body']],
    rules: ['Look at the two Alex twins: the left one never exercises, the right one exercises every day.', 'Drag the slider from Sol 1 to Sol 30 and watch both change at the same time.', 'Tap the three body zones (Muscles, Bones, Joints) on Alex or with the buttons. Maya explains each one.', 'Finish by reaching Sol 30 and exploring all three zones.'],
    learn: 'Why astronauts must exercise every day, and what gravity does for your muscles, bones and joints.'
  },
  checkup: {
    problem: 'Space travel changes the human body',
    why: 'In weightlessness muscles and bones are barely used, so they get weaker. Astronauts can lose about 1% of bone mass per month. Long journeys disturb sleep, and radiation adds up over time. A quick checkup tells us what each crew member needs.',
    stats: [['~1%', 'bone mass lost per month in space'], ['2 h', 'of exercise per day on the ISS'], ['3', 'crew members to check']],
    flow: [['🔍', 'Scan'], ['📋', 'Find the problem'], ['💪😴🛡️', 'Choose support'], ['✅', 'Healthy crew']],
    rules: ['Scan each crew member first.', 'Read what the scan found.', 'Choose the right support: weak muscles → exercise, tired → rest, radiation alert → shelter.'],
    learn: 'How weightlessness and radiation affect astronauts, and how we help.'
  },
  antenna: {
    problem: 'Earth is waiting for our news',
    why: 'Radio signals travel at the speed of light, but Mars is so far away that a message still takes between 3 and 22 minutes to reach Earth. The answer needs the same time to come back. Our dish antenna must point exactly at Earth, a tiny blue dot in the sky.',
    stats: [['3–22 min', 'one-way signal delay'], ['300 000 km/s', 'the speed of radio waves'], ['±5°', 'aiming accuracy needed']],
    flow: [['📡', 'Aim the dish'], ['〰️', 'Radio signal'], ['🌍', 'Earth'], ['⏳', 'Wait for a reply']],
    rules: ['Move the slider to turn the antenna.', 'The beam turns green when it points at Earth.', 'Send the message and watch it fly to Earth. Here, 1 second = 1 real minute.', 'Earth reads it and replies. The reply needs the same time to come back to Mars.', 'The challenge ends when the reply arrives. Compare it with a phone call on Earth!'],
    learn: 'Why we cannot have a live phone call with Earth from Mars.'
  },
  rock: {
    problem: 'Rocks tell the story of Mars',
    why: 'Every rock keeps clues about how it formed. Round holes show gas bubbles from cooling lava. Thin layers show sediment laid down over time, sometimes by ancient water. Crystals show minerals that grew slowly. Rovers like Perseverance look at these textures up close.',
    stats: [['3', 'rock samples'], ['~3.5 billion years', 'ago Jezero crater held a lake'], ['65', 'perfect focus point']],
    flow: [['🪨', 'Sample'], ['🔬', 'Focus'], ['👀', 'Observe the texture'], ['📝', 'Record the clue']],
    rules: ['Turn the focus slider until the picture is sharp (the ring turns green).', 'Look at the texture: round holes, layers or crystals?', 'Record what you see. A blurred picture cannot be recorded.'],
    learn: 'How a texture becomes a clue to a rock’s history.'
  },
  weather: {
    problem: 'We need to know the weather before going outside',
    why: 'Martian weather can be dangerous: freezing nights, dust storms and strong winds. Before every trip outside we check the weather station. Each sensor measures a different thing, so it must go in the right socket on the mast.',
    stats: [['−83 °C', 'night low measured by Perseverance'], ['−22 °C', 'daytime high'], ['4', 'sensors to mount']],
    flow: [['🌡️', 'Temperature'], ['⏲️', 'Pressure'], ['🌬️', 'Wind'], ['🌫️', 'Light & dust']],
    rules: ['Click a sensor, then the socket that measures the same thing.', 'Mount all four sensors on the mast.', 'A wrong socket counts as a mistake.'],
    learn: 'Which instrument measures what, and what the real weather on Mars is like.'
  }
};
