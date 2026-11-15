import { roomNames,taskById } from '../training/catalog';
import { followupTask,followupReason,surfaceIncident,type SurfaceIncidentId } from './incidents';

const causes:Record<SurfaceIncidentId,string>={
 'ice-clouds':'Hey! When the Martian atmosphere cools, water vapour can freeze into thin ice clouds. They scatter sunlight before it reaches our outdoor solar arrays.',
 'regional-dust':'Hey! Strong Martian winds can lift fine dust into the atmosphere. A regional storm dims the sunlight, and settling dust coats exposed solar panels.',
 'dust-c-arrival':'Hey! Seasonal winds can raise another dust storm even after we have cleaned the panels. Storm C is bringing a fresh layer of dust to our arrays.',
 'dust-c-peak':'Hey! A thick dust storm can sharply reduce solar generation. At the peak, the base relies more heavily on its backup battery network.',
 'persistent-dust':'Hey! Fine dust can linger after a storm and settle on exposed equipment. External sample-processing filters need a precautionary inspection before we use them again.',
 'pressure-tides':'Hey! Martian pressure rises and falls as the atmosphere warms and cools. An unexpected cycle needs careful validation; it does not automatically mean a sensor has failed.',
};
export function incidentBriefing(id:SurfaceIncidentId){
 const event=surfaceIncident(id),room=taskById(event.task).room;
 const name=room==='greenhouse'?'Sam':room==='research'?'Maya':'Alex';
 const role=room==='greenhouse'?'Botanist':room==='research'?'Expedition commander':room==='water'?'Water systems engineer':'Power engineer';
 const followup=taskById(followupTask[id]);
 return {name,role,room:roomNames[room],pages:[causes[id],`During the last base cycle, we recorded this incident: ${event.title}. ${event.problem} I am coordinating the response in ${roomNames[room]}.`,`If we leave this unresolved, connected rooms will stay unavailable and the disruption can last longer. We need to verify “${taskById(event.task).title}”. ${followupReason[id]} If you choose Later, we must also check “${followup.title}” in ${roomNames[followup.room]} before connected systems restart.`]};
}
