import { ChevronRight, LockKeyhole } from 'lucide-react';
import { useGame } from '../store/game';
import { Plant, ToolIcon } from './art';
import { references, roomGuides, roomNames, tasks, type TaskId } from './catalog';
import { discoveries } from './discoveries';
import { useTrainingUI } from './ui';
import { failedLessonRoots } from './attempts';
import { blockingSurfaceIncidents,taskDependsOn } from '../weather/incidents';
import { SurfaceIncidentNotice } from '../weather/IncidentPanel';

const Stars = ({ stars }: { stars: number }) => <span className="training-stars" aria-label={`${stars} of 3 stars`}>{'★'.repeat(stars)}<span>{'☆'.repeat(3 - stars)}</span></span>;

/** Small illustration for each discovery card, 200×120. */
export function DiscoveryArt({ id }: { id: TaskId }) {
  const sky = <><defs><linearGradient id={`da-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1730" /><stop offset="1" stopColor="#8a4a3a" /></linearGradient></defs><rect width="200" height="120" fill={`url(#da-${id})`} /></>;
  const ground = <path d="M0 100 Q100 90 200 100 V120 H0 Z" fill="#9a5236" />;
  const panel = (x: number, y: number, rot = -15, dust = 0) => <g transform={`translate(${x} ${y}) rotate(${rot})`}><rect x="-36" y="-10" width="72" height="20" fill="#1f4fa8" stroke="#cfd8e6" strokeWidth="2.5" /><path d="M-18 -10 v20 M0 -10 v20 M18 -10 v20" stroke="#7fb0ff" />{dust > 0 && <rect x="-36" y="-10" width="72" height="20" fill="#b07a4e" opacity={dust} />}</g>;
  const art: Record<TaskId, React.ReactNode> = {
    dust: <>{sky}<circle cx="36" cy="30" r="12" fill="#fff4c4" />{Array.from({ length: 14 }, (_, i) => <circle key={i} cx={70 + (i * 37) % 120} cy={20 + (i * 23) % 60} r="2" fill="#c88a5a" />)}{ground}{panel(80, 88, -10, .75)}{panel(150, 88, -10, 0)}</>,
    sun: <>{sky}<path d="M30 90 A70 70 0 0 1 170 90" stroke="#ffffff44" strokeDasharray="4 5" fill="none" /><circle cx="100" cy="24" r="13" fill="#fff4c4" /><path d="M100 36 V80" stroke="#ffe9a8" strokeWidth="3" strokeDasharray="5 4" />{ground}{panel(100, 88, 0)}</>,
    battery: <><rect width="200" height="120" fill="#0f2a1f" /><path d="M30 60 H80 M120 60 H170" stroke="#ef4b4b" strokeWidth="8" strokeLinecap="round" /><path d="M30 60 V95 H170 V60" stroke="#3d8bff" strokeWidth="8" fill="none" strokeLinecap="round" /><rect x="80" y="40" width="40" height="40" rx="6" fill="#3cc27a" /><rect x="94" y="34" width="12" height="6" fill="#3cc27a" /><text x="100" y="67" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">⚡</text><text x="22" y="44" fontSize="20">☀️</text><text x="166" y="44" fontSize="20">💡</text></>,
    scan: <><rect width="200" height="40" fill="#2a1f3a" /><rect y="40" width="200" height="22" fill="#a0532f" /><rect y="62" width="70" height="38" fill="#4e4f5c" /><rect x="70" y="62" width="60" height="38" fill="#b87035" /><rect x="130" y="62" width="70" height="38" fill="#7fd3ff" /><path d="M140 70 l10 -6 M160 88 l12 -8" stroke="#fff" strokeWidth="2" /><rect y="100" width="200" height="20" fill="#3a2a2e" /><g transform="translate(165 30)"><rect x="-18" y="-6" width="36" height="12" rx="3" fill="#e3e7ee" /><circle cx="-10" cy="8" r="5" fill="#2e323c" /><circle cx="10" cy="8" r="5" fill="#2e323c" /></g><path d="M150 46 Q165 56 180 46" stroke="#9fe8ff" strokeWidth="2" fill="none" /><text x="35" y="84" textAnchor="middle" fontSize="9" fill="#fff">ROCK</text><text x="165" y="84" textAnchor="middle" fontSize="9" fill="#0b2a40" fontWeight="700">ICE</text></>,
    melt: <><rect width="200" height="120" fill="#0d1828" /><rect x="40" y="30" width="80" height="80" rx="10" fill="#132238" stroke="#cfd8e6" strokeWidth="4" /><rect x="44" y="76" width="72" height="30" fill="#3d8bff" /><path d="M62 54 l28 -4 l4 26 l-28 4 Z" fill="#d9f4ff" /><rect x="34" y="24" width="92" height="8" rx="3" fill="#cfd8e6" /><rect x="152" y="18" width="12" height="80" rx="6" fill="#e9edf3" /><rect x="155" y="58" width="6" height="40" fill="#3d8bff" /><circle cx="158" cy="102" r="9" fill="#3d8bff" /><text x="176" y="62" fontSize="11" fill="#f2d33c">0°</text></>,
    filter: <><rect width="200" height="120" fill="#0d1828" /><rect x="60" y="6" width="80" height="20" rx="4" fill="#8a6040" /><rect x="60" y="30" width="80" height="18" fill="#3a4458" />{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={64 + i * 13} y="31" width="5" height="16" fill="#8d99ab" />)}<rect x="60" y="52" width="80" height="18" fill="#d8cfb8" /><rect x="60" y="74" width="80" height="18" fill="#2f5f7a" /><path d="M60 83 q10 -6 20 0 t20 0 t20 0 t20 0" stroke="#9fdcff" fill="none" /><path d="M80 98 h40 l-6 18 h-28 Z" fill="#6fc3ff" /></>,
    fill: <><rect width="200" height="120" fill="#0d1828" /><path d="M100 14 C80 44 72 58 72 72 a28 28 0 0 0 56 0 C128 58 120 44 100 14 Z" fill="#3d8bff" /><path d="M100 100 L40 112 M100 100 L100 116 M100 100 L160 112" stroke="#8d99ab" strokeWidth="3" /><text x="30" y="118" fontSize="14">🥤</text><text x="92" y="119" fontSize="14">🌱</text><text x="156" y="118" fontSize="14">🫧</text></>,
    split: <><rect width="200" height="120" fill="#0d1828" /><g transform="translate(55 60)"><circle cx="-16" cy="12" r="10" fill="#f4f6fa" /><circle cx="16" cy="12" r="10" fill="#f4f6fa" /><circle r="17" fill="#e2412f" /><text y="5" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="700">O</text></g><text x="100" y="66" textAnchor="middle" fontSize="22" fill="#f2d33c">⚡→</text><circle cx="145" cy="40" r="9" fill="#f4f6fa" /><circle cx="163" cy="40" r="9" fill="#f4f6fa" /><circle cx="143" cy="82" r="13" fill="#e2412f" /><circle cx="168" cy="82" r="13" fill="#e2412f" /><text x="154" y="62" textAnchor="middle" fontSize="10" fill="#c9d4e6">H₂</text><text x="155" y="110" textAnchor="middle" fontSize="10" fill="#c9d4e6">O₂</text></>,
    air: <><rect width="200" height="120" fill="#0d1828" /><path d="M40 110 Q40 30 120 30 Q200 30 200 110 Z" fill="#1f4a5a" stroke="#8d99ab" strokeWidth="3" /><rect x="8" y="50" width="26" height="56" rx="12" fill="#4f8fd8" /><text x="21" y="82" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">O₂</text>{[[90, 60], [130, 50], [160, 75], [110, 85], [70, 90]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="6" fill="none" stroke="#9fe8ff" strokeWidth="2" />)}<text x="122" y="104" textAnchor="middle" fontSize="18">🧑‍🚀</text></>,
    lights: <><rect width="200" height="120" fill="#0b0f1a" /><rect x="30" y="10" width="140" height="10" rx="4" fill="#2a3245" />{Array.from({ length: 8 }, (_, i) => <circle key={i} cx={40 + i * 17} cy="15" r="4" fill={i % 2 ? '#3a6bff' : '#ff3a3a'} />)}<path d="M36 20 L164 20 L190 106 L10 106 Z" fill="#c04aa0" opacity=".25" /><rect x="10" y="104" width="180" height="12" fill="#4a3426" /><Plant kind={0} x={60} y={106} scale={.7} /><Plant kind={0} x={100} y={106} scale={.7} /><Plant kind={0} x={140} y={106} scale={.7} /></>,
    plant: <><rect width="200" height="120" fill="#141f30" /><rect x="0" y="100" width="200" height="20" fill="#6e4a2e" /><Plant kind={0} x={45} y={102} scale={.85} /><Plant kind={1} x={100} y={102} scale={.85} /><Plant kind={2} x={155} y={102} scale={.85} /></>,
    irrigate: <><rect width="200" height="120" fill="#0b1424" /><Plant kind={1} x={100} y={46} scale={.6} /><path d="M50 46 H150 L140 116 H60 Z" fill="#7a5034" stroke="#8d99ab" strokeWidth="2" /><rect x="56" y="88" width="88" height="26" fill="#3d8bff" opacity=".35" />{[-24, -8, 8, 24].map(dx => <path key={dx} d={`M100 48 C${100 + dx / 2} 70 ${100 + dx} 84 ${100 + dx * 1.3} 104`} stroke="#f2ead8" strokeWidth="2" fill="none" />)}{[[70, 66], [130, 70], [88, 80], [118, 60]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#fff" opacity=".5" />)}</>,
    kit: <><rect width="200" height="120" fill="#16203a" /><g transform="translate(10 25) scale(.62)"><ToolIcon kind={0} /></g><g transform="translate(70 25) scale(.62)"><ToolIcon kind={2} /></g><g transform="translate(130 25) scale(.62)"><ToolIcon kind={4} /></g></>,
    gravity: <><rect width="200" height="120" fill="#1a2340" /><g transform="translate(60 60)"><rect x="-36" y="-4" width="72" height="8" fill="#5a6272" /><rect x="-44" y="-16" width="14" height="32" rx="3" fill="#3a3f4a" /><rect x="30" y="-16" width="14" height="32" rx="3" fill="#3a3f4a" /></g><g transform="translate(145 60) rotate(-30)"><rect x="-30" y="-6" width="60" height="12" rx="6" fill="#f2ead8" /><circle cx="-30" cy="-6" r="8" fill="#f2ead8" /><circle cx="-30" cy="6" r="8" fill="#f2ead8" /><circle cx="30" cy="-6" r="8" fill="#f2ead8" /><circle cx="30" cy="6" r="8" fill="#f2ead8" /></g><text x="100" y="108" textAnchor="middle" fontSize="10" fill="#f2d33c">38% GRAVITY</text></>,
    checkup: <><rect width="200" height="120" fill="#16203a" /><path d="M10 70 h40 l10 -24 l14 46 l14 -34 l8 12 h94" stroke="#5fe08a" strokeWidth="3" fill="none" strokeLinejoin="round" /><text x="40" y="34" fontSize="22">💪</text><text x="90" y="30" fontSize="22">🛏️</text><text x="140" y="34" fontSize="22">🛡️</text></>,
    antenna: <><rect width="200" height="120" fill="#05070f" />{Array.from({ length: 20 }, (_, i) => <circle key={i} cx={(i * 53) % 200} cy={(i * 37) % 120} r=".8" fill="#fff" />)}<circle cx="30" cy="70" r="20" fill="#b3603a" /><circle cx="172" cy="70" r="15" fill="#3d8bff" /><path d="M52 70 H154" stroke="#f2d33c" strokeWidth="2" strokeDasharray="6 5" /><path d="M150 82 H52" stroke="#5fd0ff" strokeWidth="2" strokeDasharray="6 5" /><text x="100" y="40" textAnchor="middle" fontSize="12" fill="#f2d33c" fontWeight="700">3–22 min</text></>,
    rock: <><rect width="200" height="120" fill="#05070d" /><clipPath id="da-rock"><circle cx="100" cy="60" r="50" /></clipPath><g clipPath="url(#da-rock)">{Array.from({ length: 7 }, (_, i) => <path key={i} d={`M40 ${10 + i * 16} Q100 ${4 + i * 16} 160 ${12 + i * 16} V${26 + i * 16} H40 Z`} fill={['#c9a27a', '#a97e58', '#dcb98e'][i % 3]} />)}</g><circle cx="100" cy="60" r="52" fill="none" stroke="#3cc27a" strokeWidth="5" /></>,
    weather: <><rect width="200" height="120" fill="#1b1424" /><path d="M0 108 Q100 98 200 108 V120 H0 Z" fill="#9a5236" /><rect x="96" y="12" width="8" height="96" fill="#a8b2c4" /><text x="120" y="30" fontSize="18">🌡️</text><text x="120" y="56" fontSize="18">⏲️</text><text x="56" y="44" fontSize="18">🌬️</text><text x="56" y="72" fontSize="18">🔆</text><text x="150" y="90" fontSize="11" fill="#9fd0ff">−83 °C</text></>
  };
  return <svg viewBox="0 0 200 120" className="discovery-art" aria-hidden="true">{art[id]}</svg>;
}

/** Every challenge in one list: room, stars, status. */
export function AllChallenges() {
  const g=useGame(), records=g.commissioning.training.records, ui = useTrainingUI();
  return <section className="discovery-book"><div className="discovery-heading"><span className="training-kicker">MISSION LOG</span><h2>All challenges</h2><p>Every experiment in the colony, its room and your best stars.</p></div>
    <div className="training-maintenance-summary"><SurfaceIncidentNotice/></div><div className="challenge-list">{tasks.map((task, i) => { const r = records[task.id],incident=blockingSurfaceIncidents(g,task.id)[0],failure=failedLessonRoots(g).find(root=>taskDependsOn(task.id,root)); return <article key={task.id} className={incident||failure?'challenge-row is-suspended':r?'challenge-row done':'challenge-row'}>
      <span className="challenge-num">{String(i + 1).padStart(2, '0')}</span>
      <span className="challenge-room">{roomGuides[task.room].icon} {roomNames[task.room]}</span>
      <strong>{task.title}</strong>
      {failure?<span className="challenge-open"><LockKeyhole size={13}/>{failure===task.id?'attempt failed':'dependency paused'}</span>:incident?<span className="challenge-open" title={incident.title}><LockKeyhole size={13}/> {incident.task===task.id?'repair required':'dependency paused'}</span>:r ? <Stars stars={r.stars} /> : <span className="challenge-open"><LockKeyhole size={13} /> not done</span>}
      {!ui.scoped && <button onClick={() => incident?ui.repair(incident.task):failure?ui.repair(failure):ui.choose(task.room)}>{incident||failure?'Repair':'Go'} <ChevronRight size={14} /></button>}
    </article>; })}</div></section>;
}

/** Cards with what each mission teaches. Unlocked by completing the mission. */
export function DiscoveryCards() {
  const records = useGame(s => s.commissioning.training.records);
  const found = tasks.filter(t => records[t.id]).length;
  return <section className="discovery-book"><div className="discovery-heading"><span className="training-kicker">CAPTAIN’S DISCOVERY BOOK · {found} / 18 CARDS</span><h2>What you learned on Mars</h2><p>Each mission you finish adds a card with the science behind it.</p></div>
    <div className="discovery-cards">{tasks.map(task => { const d = discoveries[task.id], r = records[task.id]; return r ? <article key={task.id} className={`discovery-card room-${task.room}`}>
      <DiscoveryArt id={task.id} />
      <div className="card-body">
        <span className="card-room">{roomGuides[task.room].icon} {roomNames[task.room]} · {task.title}</span>
        <h3>{d.headline}</h3>
        <div className="card-stat"><strong>{d.stat[0]}</strong><small>{d.stat[1]}</small></div>
        <p>{d.text}</p>
        <footer>{task.sources.map(id => <a key={id} href={references[id].url} target="_blank" rel="noreferrer">{references[id].title} ↗</a>)}</footer>
      </div>
    </article> : <article key={task.id} className="discovery-card locked">
      <div className="card-lock"><LockKeyhole size={28} /><span>?</span></div>
      <div className="card-body"><span className="card-room">{roomGuides[task.room].icon} {roomNames[task.room]}</span><h3>{task.title}</h3><p>Finish this mission to unlock the card.</p></div>
    </article>; })}</div></section>;
}
