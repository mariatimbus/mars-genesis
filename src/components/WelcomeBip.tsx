import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { useGame } from '../store/game';
import { useExplorer } from '../explorer/store';
import { makeLayout } from '../explorer/layout';
import { useTrainingUI } from '../training/ui';
import { TRAINING_ROOMS, roomGuides, roomNames } from '../training/catalog';
import { CommsAstronaut } from '../weather/WeatherComms';
import '../weather/incidentBriefing.css';
import './welcomeBip.css';

const pages = [
  'Welcome to Mars, commander! We have just landed at Ares One, our new home on the red planet. It is cold, dusty and the air outside is not breathable, but together we can make it safe.',
  'You have to build our colony. The base has six rooms that keep the crew alive, and right now they are all asleep. You wake them up one by one by solving hands-on science challenges at each room’s terminal.',
  'First, we need Energy. Every machine here runs on electricity: water, oxygen, plants, everything. Walk to the Energy room and use its terminal. Finish its 3 challenges to unlock Water, and then the other rooms.'
];

/** Commander Maya greets the player once after landing, in the same corner comms style as the sol events. */
export function WelcomeBip() {
  const show = useGame(s => s.prologueSeen && !s.welcomeSeen && s.commissioning.completed.length === 0 && s.status === 'playing');
  const trainingOpen = useTrainingUI(s => s.open);
  const [page, setPage] = useState(0), button = useRef<HTMLButtonElement>(null);
  const active = show && !trainingOpen;
  useEffect(() => {
    if (!active) return;
    setPage(0);
    // Same as the sol event briefings: stand in the habitat where the mission starts.
    useExplorer.setState({ briefing: true, mode: 'first-person', pauseOpen: false, mapExpanded: false });
    useExplorer.getState().returnToBase(makeLayout(useGame.getState().buildings));
    button.current?.focus();
  }, [active]);
  useEffect(() => { button.current?.focus(); }, [page]);
  if (!active) return null;
  const last = page === pages.length - 1;
  const finish = () => {
    useGame.getState().completeWelcome();
    useExplorer.setState({ briefing: false, pauseOpen: false });
    useExplorer.getState().notify('Find the Energy room terminal and press E to start its challenges.');
  };
  return <aside className="incident-comms welcome-comms" aria-label="Welcome briefing">
    <div className="comms-bubble">
      <header><span className="comms-live" /> CREW COMMS <small>{page + 1} / {pages.length}</small></header>
      <h2>Maya<small>Expedition commander · Habitat</small></h2>
      <p key={page} aria-live="polite">{pages[page]}</p>
      {page >= 1 && <div className="welcome-rooms" aria-label="The six colony rooms">{TRAINING_ROOMS.map((room, i) =>
        <span key={room} className={`welcome-room ${i === 0 ? 'is-next' : ''}`}>{roomGuides[room].icon}<b>{roomNames[room]}</b><small>{i === 0 ? (last ? 'Start here' : 'Asleep') : <><LockKeyhole size={9} /> Locked</>}</small></span>)}</div>}
      <footer>
        {page > 0 && <button className="comms-back" onClick={() => setPage(page - 1)}>Back</button>}
        {last ? <button ref={button} onClick={finish}><Check size={15} /> OK</button> : <button ref={button} onClick={() => setPage(page + 1)}>Next <ArrowRight size={15} /></button>}
      </footer>
    </div>
    <CommsAstronaut name="Maya" />
  </aside>;
}
