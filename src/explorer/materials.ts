import { CanvasTexture, SRGBColorSpace } from 'three';
import { INDUSTRIAL as C } from '../visuals/palette';

// Authored panel and grating textures; shared by all repeated base modules.
export function panelTexture(floor:boolean){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle=floor?'#303344':'#74788e';ctx.fillRect(0,0,512,512);
 ctx.fillStyle='#171c2b';ctx.fillRect(0,0,512,9);ctx.fillRect(0,0,9,512);ctx.fillRect(503,0,9,512);ctx.fillRect(0,503,512,9);
 ctx.strokeStyle=floor?'#585d72':'#a3a7b8';ctx.lineWidth=2;ctx.strokeRect(13,13,486,486);
 if(floor){
  ctx.fillStyle='#141a29';ctx.fillRect(38,38,436,436);ctx.fillStyle='#454b60';
  for(let y=44;y<466;y+=12)for(let x=44;x<466;x+=19){ctx.fillRect(x,y,13,5);ctx.fillStyle='#0d1322';ctx.fillRect(x+2,y+1,8,2);ctx.fillStyle='#454b60'}
  ctx.fillStyle='#a49d56';ctx.fillRect(21,68,5,72);ctx.fillRect(486,370,5,72);
 }else{
  ctx.fillStyle='#51566c';ctx.fillRect(28,30,456,266);ctx.fillStyle='#656a80';ctx.fillRect(35,37,442,250);
  ctx.strokeStyle='#8e94a9';ctx.strokeRect(36,38,440,248);ctx.fillStyle=C.burgundy;ctx.fillRect(22,310,468,19);ctx.fillRect(22,340,468,6);
  ctx.fillStyle='#272b3e';ctx.fillRect(30,380,166,86);ctx.fillStyle='#8a8fa4';for(let y=388;y<460;y+=10)ctx.fillRect(39,y,148,3);
  ctx.fillStyle='#1d2637';ctx.fillRect(290,385,176,44);ctx.font='15px monospace';ctx.fillStyle='#c3c7ba';ctx.fillText('ARES // S-04',302,412);
  ctx.fillStyle=C.yellow;ctx.fillRect(416,446,50,5);ctx.fillStyle=C.blue;ctx.fillRect(402,446,8,5);
 }
 for(const x of [23,489])for(const y of [23,489]){ctx.fillStyle='#171d2c';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#959aaf';ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.stroke()}
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return texture;
}
