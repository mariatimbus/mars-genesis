import { describe, expect, it } from 'vitest';
import { WORLD, elevation, originalElevation, ownedPlots, expansionCandidates, insideBuildArea } from './worldConfig';
import { initialBuildings, validPlacement } from '../simulation/engine';

describe('small, selectable land expansions', () => {
  it('starts with the original colony area instead of unlocking the whole map', () => {
    expect(WORLD.buildHalfWidth).toBe(25);
    expect(WORLD.buildHalfDepth).toBe(23);
    expect(validPlacement('solar', 30, 5, initialBuildings)).toBe(false);
    expect(validPlacement('solar', -30, 5, initialBuildings)).toBe(false);
  });
  it('opens only the selected parcel and permits buildings across its shared seam', () => {
    const plots=['east-0-2'];
    expect(validPlacement('solar',30,5,initialBuildings,plots)).toBe(true);
    expect(insideBuildArea(25,5,3,plots)).toBe(true);
    expect(validPlacement('solar',30,-5,initialBuildings,plots)).toBe(false);
    expect(validPlacement('solar',40,5,initialBuildings,plots)).toBe(false);
    expect(validPlacement('solar',-30,5,initialBuildings,plots)).toBe(false);
    expect(insideBuildArea(34,9,3,plots)).toBe(false);
  });
  it('offers adjacent sectors only and never allows duplicate expansion', () => {
    expect(expansionCandidates().some(p=>p.id==='east-0-2')).toBe(true);
    expect(expansionCandidates().some(p=>p.id==='east-1-2')).toBe(false);
    expect(expansionCandidates(['east-0-2']).some(p=>p.id==='east-1-2')).toBe(true);
    expect(expansionCandidates(['east-0-2']).some(p=>p.id==='east-0-2')).toBe(false);
  });
  it('restores the old terrain and changes only the selected plot and its small blend margin', () => {
    const plots=ownedPlots(['east-0-2']);
    for(const [x,z] of [[0,0],[-35,5],[30,-5],[40,20],[10,35]])expect(elevation(x,z,plots)).toBe(originalElevation(x,z));
    expect(elevation(30,5)).toBe(originalElevation(30,5));
    expect(Math.abs(elevation(30,5,plots))).toBeLessThanOrEqual(.06);
    expect(elevation(30,5,plots)).toBeLessThan(originalElevation(30,5));
    expect(insideBuildArea(Number.NaN,0)).toBe(false);
  });
});
