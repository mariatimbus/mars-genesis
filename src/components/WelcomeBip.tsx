import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, LockKeyhole } from 'lucide-react';
import { useGame } from '../store/game';
import { useTrainingUI } from '../training/ui';
import { Mascot, playCue } from '../training/Celebrate';
import { TRAINING_ROOMS, roomGuides, roomNames } from '../training/catalog';
import './welcomeBip.css';

const steps = [
  { title: 'Welcome to Mars, commander! 👋', text: 'I’m BIP, your robot helper. We have just landed at Ares One, our new home on the red planet. It is cold, dusty and the air is not breathable, but together we can make it safe.' },
  { title: 'You have to build our colony', text: 'Our base has six rooms that keep the crew alive. Right now they are all asleep. You will wake them up one by one by solving hands-on science challenges.' },
  { title: 'First, we need ⚡ Energy', text: 'Every machine on Mars runs on electricity: water, oxygen, plants, everything! So we start in the Energy room. Finish its 3 challenges to unlock Water, and then the other rooms.' }
];

/** BIP greets the player once, right after the landing intro, and explains that Energy unlocks everything else. */
export function WelcomeBip() {
  const show = useGame(s => s.prologueSeen && !s.welcomeSeen && s.commissioning.completed.length === 0 && s.status === 'playing');
  const trainingOpen = useTrainingUI(s => s.open);
  const [step, setStep] = useState(0), okRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (show && !trainingOpen) { document.exitPointerLock?.(); playCue('step'); } }, [show, trainingOpen]);
  useEffect(() => { okRef.current?.focus(); }, [step, show]);
  if (!show || trainingOpen) return null;
  const last = step === steps.length - 1, s = steps[step];
  const done = (openEnergy: boolean) => { useGame.getState().completeWelcome(); setStep(0); if (openEnergy) useTrainingUI.getState().show('solar'); };
  return createPortal(<div className="welcome-backdrop" role="presentation">
    <section className="welcome-bip" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-mascot"><Mascot mood="happy" /></div>
      <div className="welcome-bubble" key={step}>
        <span className="welcome-kicker">BIP · STEP {step + 1} / {steps.length}</span>
        <h2 id="welcome-title">{s.title}</h2>
        <p>{s.text}</p>
        {step >= 1 && <div className="welcome-rooms" aria-label="The six colony rooms">{TRAINING_ROOMS.map((room, i) => {
          const first = i === 0;
          return <div key={room} className={`welcome-room ${first ? 'is-next' : ''}`} style={{ animationDelay: `${.15 + i * .08}s` }}>
            <span className="welcome-room-icon">{roomGuides[room].icon}</span><b>{roomNames[room]}</b>
            <small>{first ? (step === 2 ? 'START HERE' : 'Asleep') : <><LockKeyhole size={10} /> locked</>}</small>
          </div>;
        })}</div>}
        <div className="welcome-dots" aria-hidden="true">{steps.map((_, i) => <i key={i} className={i === step ? 'on' : ''} />)}</div>
        <div className="welcome-actions">
          {step > 0 && <button type="button" className="welcome-back" onClick={() => setStep(step - 1)}>Back</button>}
          {!last && <button type="button" ref={okRef} className="welcome-next" onClick={() => setStep(step + 1)}>Next <ChevronRight size={16} /></button>}
          {last && <>
            <button type="button" className="welcome-back" onClick={() => done(false)}>OK, I’ll explore first</button>
            <button type="button" ref={okRef} className="welcome-next" onClick={() => done(true)}>⚡ OK, let’s power up!</button>
          </>}
        </div>
      </div>
    </section>
  </div>, document.body);
}
