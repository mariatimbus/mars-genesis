/** Archived Jezero chronology, not 720 downloaded MEDA daily measurements.
 * Unitless rendering coefficients below are authored, not instrument readings.
 * See Documentation/surface-weather.md for provenance and clock behavior.
 */
export const SURFACE_SOLS=720;
export const SECONDS_PER_SURFACE_SOL=720;
export const WEATHER_SOURCES={
 meda:{title:'Perseverance · MEDA / PDS',url:'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html'},
 chronology:{title:'Jezero atmospheric chronology · Sánchez-Lavega et al. (2025)',url:'https://doi.org/10.1029/2024JE008565'},
 storm:{title:'Jezero storm · Lemmon et al. (2022)',url:'https://doi.org/10.1029/2022GL100126'},
 donki:{title:'NASA CCMC · DONKI',url:'https://ccmc.gsfc.nasa.gov/tools/DONKI/'},
 moxie:{title:'Perseverance · MOXIE / PDS',url:'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/moxie.html'},
} as const;
type SourceId=keyof typeof WEATHER_SOURCES;
interface WeatherReference {start:number;end:number;title:string;fact:string;source:SourceId;effect:'cloud'|'storm'|'haze'|'pressure';peak?:number}
export const WEATHER_REFERENCES:readonly WeatherReference[]=[
 {start:284,end:305,title:'Water-ice cloud season',fact:'Orbital images show denser water-ice clouds reaching Jezero during sols 284–305.',source:'chronology',effect:'cloud',peak:295},
 {start:313,end:318,title:'Regional dust storm',fact:'Dust reached Perseverance on sol 313. Wind and dust lifting were observed during this regional storm.',source:'storm',effect:'storm',peak:315},
 {start:571,end:574,title:'Dust storm C reaches Jezero',fact:'Opacity increased at Jezero from sol 571 and peaked on sol 574.',source:'chronology',effect:'storm',peak:574},
 {start:600,end:640,title:'Elevated atmospheric dust',fact:'An additional opacity peak is reported during sols 600–640.',source:'chronology',effect:'haze',peak:620},
 {start:703,end:703,title:'Atmospheric tide anomaly',fact:'Pressure tide phases changed on sol 703; the cause was not established. This is not evidence of a local dust storm.',source:'chronology',effect:'pressure'},
];
// Only the dust-C peak has a published exact peak sol. The other authored
// envelope peaks are rendering choices and must not become historical events.
export const IMPORTANT_WEATHER_EVENTS=[
 {sol:284,title:'Water-ice clouds arrive',kind:'cloud'},
 {sol:313,title:'Regional dust storm arrives',kind:'storm'},
 {sol:571,title:'Dust storm C arrives',kind:'storm'},
 {sol:574,title:'Dust storm C opacity peak',kind:'storm'},
 {sol:600,title:'Elevated-dust period begins',kind:'haze'},
 {sol:703,title:'Atmospheric tide anomaly',kind:'pressure'},
] as const;
export function nextImportantWeather(sol:number){return IMPORTANT_WEATHER_EVENTS.find(event=>event.sol>clampSol(sol))??null}
export interface SurfaceWeather {
 sol:number;title:string;description:string;dust:number;cloud:number;wind:number;heading:number;gust:number;
 reference:WeatherReference|null;source:SourceId;basis:'archived-period'|'seasonal-model';
}
export function clampSol(sol:number){return Math.max(1,Math.min(SURFACE_SOLS,Number.isFinite(sol)?Math.round(sol):1))}
function noise(sol:number,salt:number){const n=Math.sin(sol*127.1+salt*311.7)*43758.5453;return n-Math.floor(n)}
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function generate(sol:number):SurfaceWeather {
 // Smooth seasonal envelopes with deterministic sol-to-sol variation. These are
 // artistic interpolation, including days with no linked local observation.
 const cloudSeason=Math.exp(-Math.pow((sol-210)/125,2));
 const dustSeason=Math.exp(-Math.pow((sol-490)/155,2));
 let cloud=.05+cloudSeason*(.25+noise(sol,1)*.24),dust=.1+dustSeason*.22+noise(sol,2)*.08;
 let wind=.18+noise(sol,3)*.32;
 const reference=WEATHER_REFERENCES.find(r=>sol>=r.start&&sol<=r.end)??null;
 if(reference?.effect==='cloud')cloud=.67+noise(sol,4)*.23;
 if(reference?.effect==='storm'){
  const strength=1-Math.abs(sol-reference.peak!)/Math.max(1,reference.end-reference.start+1);
  dust=.6+strength*.33;wind=.65+noise(sol,5)*.3;cloud*=.15;
 }
 if(reference?.effect==='haze'){dust=.42+.23*Math.sin(Math.PI*(sol-reference.start)/(reference.end-reference.start));cloud*=.25;}
 const title=reference?.title??(cloud>.4?'High ice-cloud wisps':wind>.43?'Windblown surface dust':dust>.3?'Seasonal dust haze':'Clear intervals & drifting dust');
 const description=reference?.fact??'MEDA observes wind, suspended dust and seasonal atmospheric changes. This day is a science-informed visual variation, not a measured daily forecast.';
 return {sol,title,description,dust:clamp(dust),cloud:clamp(cloud),wind:clamp(wind),heading:noise(sol,6)*Math.PI*2,gust:noise(sol,7)*Math.PI*2,reference,source:reference?.source??'meda',basis:reference?'archived-period':'seasonal-model'};
}
export const SURFACE_CALENDAR:readonly SurfaceWeather[]=Array.from({length:SURFACE_SOLS},(_,i)=>generate(i+1));
export function surfaceWeather(sol:number){return SURFACE_CALENDAR[clampSol(sol)-1]}
export function advanceSurfaceClock(sol:number,seconds:number,delta:number){
 const total=Math.max(0,Number.isFinite(seconds)?seconds:0)+Math.max(0,Number.isFinite(delta)?delta:0);
 const day=clampSol(sol)+Math.floor(total/SECONDS_PER_SURFACE_SOL);
 return {sol:clampSol(day),seconds:day>SURFACE_SOLS?SECONDS_PER_SURFACE_SOL-1e-6:total%SECONDS_PER_SURFACE_SOL};
}
export function atmosphereSheltered(cells:ReadonlySet<string>,x:number,y:number,z:number){
 return y>-.5&&y<4.1&&cells.has(`${Math.round(x/3)},${Math.round(z/3)}`);
}
