import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { useGame } from '../store/game';
import { useExplorer } from '../explorer/store';
import { useTrainingUI } from '../training/ui';
import './resetGame.css';

/** "Restart from Day 1" with a clear warning: the whole save is replaced by a fresh mission. */
export function ResetGameButton({ className = '', label = 'Restart from Day 1' }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false), cancelRef = useRef<HTMLButtonElement>(null);
  const done = useGame(s => Object.keys(s.commissioning.training.records).length), sol = useGame(s => s.sol);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); setOpen(false); } };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [open]);
  const confirm = () => {
    setOpen(false);
    useTrainingUI.getState().close();
    useExplorer.getState().modeTo('overview');
    useGame.getState().reset();
  };
  return <>
    <button type="button" className={`reset-game-button ${className}`} onClick={() => { document.exitPointerLock?.(); setOpen(true); }}><RotateCcw size={15} /> {label}</button>
    {open && createPortal(<div className="reset-backdrop" role="presentation" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="reset-dialog" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-text">
        <div className="reset-icon"><TriangleAlert size={34} /></div>
        <h2 id="reset-title">Restart the whole game from Day 1?</h2>
        <p id="reset-text">You will <b>lose all your progress</b>. This cannot be undone.</p>
        <ul>
          <li>⭐ Stars from <b>{done}</b> finished mission{done === 1 ? '' : 's'}</li>
          <li>📖 Every Discovery Book card</li>
          <li>🏠 Your colony, crew and resources (you are on <b>Sol {sol}</b>)</li>
        </ul>
        <div className="reset-actions">
          <button type="button" ref={cancelRef} className="reset-cancel" onClick={() => setOpen(false)}>No, keep my progress</button>
          <button type="button" className="reset-confirm" onClick={confirm}><RotateCcw size={15} /> Yes, restart from Day 1</button>
        </div>
      </section>
    </div>, document.body)}
  </>;
}
