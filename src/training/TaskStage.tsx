import type { TaskId } from './catalog';
import type { TaskAction, TaskState } from './engine';
import type { StageProps } from './stages/common';
import { BatteryStage, DustStage, SunStage } from './stages/power';
import { FilterStage, MeltStage, ScanStage } from './stages/water';
import { AirStage, FillStage, SplitStage } from './stages/oxygen';
import { IrrigateStage, LightsStage, PlantStage } from './stages/greenhouse';
import { CheckupStage, GravityStage, KitStage } from './stages/medical';
import { AntennaStage, RockStage, WeatherStage } from './stages/lab';
import './stages/stages.css';

const stages: Record<TaskId, (p: StageProps) => React.ReactNode> = {
  dust: DustStage, sun: SunStage, battery: BatteryStage,
  scan: ScanStage, melt: MeltStage, filter: FilterStage,
  fill: FillStage, split: SplitStage, air: AirStage,
  lights: LightsStage, plant: PlantStage, irrigate: IrrigateStage,
  kit: KitStage, gravity: GravityStage, checkup: CheckupStage,
  antenna: AntennaStage, rock: RockStage, weather: WeatherStage
};

export function TaskStage({ id, t, act, running, setRunning }: { id: TaskId; t: TaskState; act: (a: TaskAction) => void; running: boolean; setRunning: (running: boolean) => void }) {
  const Stage = stages[id];
  const send = (type: string, index?: number, value?: number) => act({ type, index, value });
  return <div className={`stage stage-${id}`}><Stage t={t} send={send} running={running} setRunning={setRunning} /></div>;
}
