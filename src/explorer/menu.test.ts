import { afterEach,it,expect,vi } from 'vitest';
import { useExplorer } from './store';
const original=useExplorer.getState();
afterEach(()=>useExplorer.setState(original,true));
it('opens Mission Control on a real capture loss, preserves an explicitly closed menu on repeated loss notifications',()=>{
 useExplorer.setState({briefing:false,locked:true,pauseOpen:false});
 useExplorer.getState().setLocked(false);expect(useExplorer.getState().pauseOpen).toBe(true);
 useExplorer.setState({pauseOpen:false});useExplorer.getState().setLocked(false);
 expect(useExplorer.getState().pauseOpen).toBe(false);
});
it('keeps Mission Control closed during the astronaut briefing and opens it for equipment panels',()=>{
 vi.stubGlobal('document',{exitPointerLock:vi.fn()});
 useExplorer.setState({briefing:true,locked:true,pauseOpen:false});useExplorer.getState().setLocked(false);
 expect(useExplorer.getState().pauseOpen).toBe(false);
 useExplorer.setState({briefing:false});useExplorer.getState().open({type:'tablet'});
 expect(useExplorer.getState().pauseOpen).toBe(true);expect(useExplorer.getState().locked).toBe(false);
 vi.unstubAllGlobals();
});

it('does not notify React or persist unchanged indoor survival state on every frame',()=>{
 useExplorer.setState({activeRover:null,cycle:0,pressure:1,suited:false,oxygen:100,evaSeconds:0});
 const changed=vi.fn(),stop=useExplorer.subscribe(changed),state=useExplorer.getState();
 for(let frame=0;frame<120;frame++)state.tick(1/60,false,false);
 expect(changed).not.toHaveBeenCalled();expect(useExplorer.getState()).toBe(state);stop();
});
it('preserves airlock completion and EVA consumption when survival updates are sampled',()=>{
 useExplorer.setState({activeRover:null,cycle:.3,cycleTarget:0,pressure:1,suited:true,oxygen:100,evaSeconds:0});
 for(let i=0;i<10;i++)useExplorer.getState().tick(.1,true,false);
 expect(useExplorer.getState().cycle).toBe(0);expect(useExplorer.getState().pressure).toBe(0);
 expect(useExplorer.getState().evaSeconds).toBeCloseTo(1);
 expect(useExplorer.getState().oxygen).toBeCloseTo(100-100/480);
});
