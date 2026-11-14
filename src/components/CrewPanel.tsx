import { useState } from 'react';
import { Heart, Activity, Shield, ChevronRight } from 'lucide-react';
import { useGame } from '../store/game';
import { canWork } from '../simulation/scenario';
import type { Assignment } from '../simulation/types';
const assignments:Assignment[]=['command','maintenance','greenhouse','medical','research','rest','shelter'];
export function CrewPanel(){
 const sheltered=useGame(s=>s.effects.some(e=>e.shelter&&e.untilSol>s.sol));
 const crew=useGame(s=>s.astronauts),assign=useGame(s=>s.assign);const [selected,setSelected]=useState<string|null>(null);
 return <div className="crew-content"><span className="eyebrow">FOUR PEOPLE. ONE SHARED FUTURE.</span><h2>Your mission crew</h2><p className="panel-intro">Assignments change real production, recovery and exposure. Rest matters as much as work.</p>
 {crew.map((c,i)=><article className={`crew-card ${!c.alive?'crew-lost':''}`} key={c.id}>
 <button className="crew-card-heading" onClick={()=>setSelected(selected===c.id?null:c.id)} aria-expanded={selected===c.id}><span className={`avatar avatar-${i}`}>{c.name.split(' ').map(n=>n[0]).join('')}</span><span><strong>{c.name}</strong><small>{c.role}</small></span><span className={`condition ${c.condition==='Healthy'?'healthy':'attention'}`}>{c.condition}</span><ChevronRight size={14}/></button>
 <div className="crew-meters"><span><Heart size={12}/> {c.health.toFixed(0)}<small>/100</small></span><div className="meter"><i style={{width:`${c.health}%`}}/></div><span><Activity size={12}/> {c.fatigue.toFixed(0)}% tired</span></div>
 <label className="assignment">Assignment<select aria-label={`${c.name} assignment`} value={c.assignment} disabled={!c.alive||sheltered} onChange={e=>assign(c.id,e.target.value as Assignment)}>{assignments.map(a=><option key={a} disabled={c.condition==='Incapacitated'&&a!=='rest'} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}</select></label>
 <div className="crew-work"><span>{canWork(c)?'● Available to work':c.alive?'◌ Resting / unable to work':'Mission loss'}</span><span><Shield size={11}/> {c.radiationMsv.toFixed(2)} mSv*</span></div>
 {selected===c.id&&<div className="crew-expanded"><p>{c.note}</p><div>Morale {c.morale.toFixed(0)}/100 · Reduced meals {c.hungerSols} sols · Oxygen debt {c.oxygenDebt} sols</div><p>{c.role==='Engineer'?'Maintenance assignment enables manual repairs. Incapacitation disables repairs.':c.role==='Botanist'?'Greenhouse assignment raises food production while able to work.':c.role==='Commander'?'Command assignment supports crew morale.':'Medical assignment supports recovery. Research assignment increases science output.'}</p></div>}
 </article>)}<p className="science-note">*Cumulative modeled dose equivalent, mSv. Historical RAD baseline plus illustrative shielding/event factors. No radiation score triggers acute illness. Health and fatigue are gameplay scores, not medical predictions.</p></div>
}
