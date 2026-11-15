import { ChevronRight } from 'lucide-react';
import { RoomScene } from './art';
import { briefings } from './briefings';
import { references, roomNames, type TrainingTask } from './catalog';

/** Mission briefing shown before a challenge starts: WHY on Mars → HOW it works → RULES → WHAT you learn. */
export function Briefing({ task, number, disabled, onStart }: { task: TrainingTask; number: number; disabled: boolean; onStart: () => void }) {
  const b = briefings[task.id];
  return <article className="briefing">
    <header className="briefing-hero">
      <RoomScene room={task.room} />
      <div className="briefing-title">
        <span className="training-kicker">MISSION BRIEFING · EXPERIMENT {number} / 18 · {roomNames[task.room].toUpperCase()}</span>
        <h3>{b.problem}</h3>
      </div>
    </header>
    <section className="briefing-why">
      <h4><span>?</span>Why do we need this on Mars?</h4>
      <p>{b.why}</p>
    </section>
    <div className="briefing-stats">{b.stats.map(([value, label]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div>
    <section className="briefing-how">
      <h4><span>⚙</span>How it works</h4>
      <ol className="briefing-flow">{b.flow.map(([icon, label], i) => <li key={label} style={{ animationDelay: `${i * .12}s` }}><span>{icon}</span><small>{label}</small></li>)}</ol>
    </section>
    <section className="briefing-rules">
      <h4><span>!</span>Rules of the challenge</h4>
      <ol>{b.rules.map(rule => <li key={rule}>{rule}</li>)}</ol>
      <p className="briefing-stars">★★★ no mistakes · ★★ one or two · ★ more. After two mistakes BIP shows a hint.</p>
    </section>
    <section className="briefing-learn">
      <h4><span>💡</span>What you will learn</h4>
      <p>{b.learn}</p>
    </section>
    <footer className="briefing-start">
      <button type="button" disabled={disabled} onClick={onStart}>I understand, start the mission <ChevronRight size={18} /></button>
      <small>Training mode · colony time and supplies stay paused · progress is saved</small>
    </footer>
  </article>;
}

/** After the challenge: what was learned, with the honest model note and NASA sources. */
export function Learned({ task }: { task: TrainingTask }) {
  return <section className="learned">
    <h4><span>🎓</span>What you discovered</h4>
    <p>{task.fact}</p>
    <p className="model-note">{task.model}</p>
    <div className="learned-sources">{task.sources.map(id => <a key={id} href={references[id].url} target="_blank" rel="noreferrer">{references[id].title} ↗</a>)}</div>
  </section>;
}
