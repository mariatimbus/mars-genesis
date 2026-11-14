import type { CommissioningState } from './commissioning';
import type { Building, Resources, Kind } from './engine';
export type Difficulty = 'cadet' | 'commander' | 'expert';
export type Assignment = 'command' | 'maintenance' | 'greenhouse' | 'research' | 'medical' | 'rest' | 'shelter';
export type Condition = 'Healthy' | 'Tired' | 'Injured' | 'Ill' | 'Recovering' | 'Incapacitated' | 'Deceased';
export interface CrewMember {
  id: string; name: string; role: 'Commander' | 'Engineer' | 'Botanist' | 'Scientist / Medic';
  health: number; fatigue: number; morale: number; radiationMsv: number;
  condition: Condition; assignment: Assignment; canWork: boolean; alive: boolean;
  oxygenDebt: number; hungerSols: number; injury: number; note: string;
}
export interface EnvironmentState {
  dustUntil: number; dustFactor: number; radiationUntil: number; radiationExtraMsv: number;
  temperatureC: number; outsidePressurePa: number; commDelayMinutes: number;
}
export interface Systems {
  waterKg: number; recycling: number; backupOxygenKg: number; batteryCapacityKwh: number;
  habitatPressureKpa: number; co2Percent: number; leakRateKpa: number; shelterActive: boolean;
  research: number; panelEfficiency: number;
}
export interface Consequence {
  id: string; label: string; untilSol: number; productionFactor?: number; kind?: Kind;
  rationFactor?: number; oxygenDemandFactor?: number; shelter?: boolean;
  researchOff?: boolean; constructionHold?: boolean; exposureFactor?: number;
}
export interface DelayedEffect {
  id: string; dueSol: number; type: 'repair' | 'resource' | 'crew' | 'flag';
  buildingId?: string; resource?: keyof Resources; amount?: number; crewId?: string;
  fatigue?: number; health?: number; flag?: string; assignment?: Assignment; requiresEngineer?: boolean; text: string;
}
export type EventKind = 'solar' | 'dust' | 'oxygen' | 'greenhouse' | 'leak' | 'communication';
export interface MissionEvent { id: string; kind: EventKind; sol: number; severity: number; sourceId: string; buildingId?: string }
export interface DecisionRecord { sol: number; event: string; choice: string; explanation: string; outcome: string; sourceId: string }
export interface MissionStats { shortages: number; failures: number; constructed: number; produced: Resources; consumed: Resources; decisions: DecisionRecord[] }
export interface SurvivalState {
  commissioning: CommissioningState; expandedPlots: string[]; sol: number; crew: number; astronauts: CrewMember[]; resources: Resources; buildings: Building[];
  environment: EnvironmentState; systems: Systems; effects: Consequence[]; queue: DelayedEffect[];
  pendingEvent: MissionEvent | null; completedEvents: string[]; flags: string[];
  seed: number; rng: number; scenario: 'solar-watch' | 'dust-season'; difficulty: Difficulty;
  status: 'playing' | 'won' | 'lost'; message: string; history: string[];
  notifications: string[]; stats: MissionStats; lastReport: SolReport | null;
}
export interface SolReport {
  delta: Resources; generatedKwh: number; usedKwh: number; oxygenDemandKg: number; foodDemandKg: number;
  oxygenCoverage: number; foodCoverage: number; waterCoverage: number;
  powered: Record<string, number>; safeHabitat: boolean; co2Removal: boolean; notes: string[];
}
export interface NASADataProvenance {
  id: string; title: string; instrument: string; dataset: string; observed: string; verified: string;
  category: 'measurement' | 'reference'; values: string; url: string; note: string;
}
