import references from '../data/scienceReferences.json';
import type { NASADataProvenance } from '../simulation/types';
export const sources = references as NASADataProvenance[];
export const sourceById = (id:string) => sources.find(s=>s.id===id)!;
export type DonkiFlare = { flrID:string; beginTime:string; peakTime:string; classType:string; link?:string };
// Never accept a flare's class as a surface-dose measurement. These are different observables.
export function mapDonkiFlare(record:DonkiFlare):NASADataProvenance {
 if(!/^\d{4}-\d\d-\d\dT/.test(record.peakTime)||!record.flrID||!record.classType)throw new Error('Invalid DONKI flare record');
 return {id:record.flrID,title:`Solar flare ${record.classType}`,instrument:'NASA DONKI / listed solar instruments',dataset:'DONKI FLR',observed:record.peakTime,verified:'2026-11-13',category:'measurement',values:`Flare classification ${record.classType}; peak ${record.peakTime}`,url:record.link??'https://ccmc.gsfc.nasa.gov/tools/DONKI/',note:'Solar flare metadata only. This is not a measured dose at Mars. Colony exposure is a separate gameplay assumption.'};
}
