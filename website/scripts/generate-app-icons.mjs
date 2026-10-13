// Rasterize the FranLumi sun mark without adding a runtime image dependency.
import {mkdirSync,writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
const directory=new URL('../public/icons/',import.meta.url);mkdirSync(directory,{recursive:true});
function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([size,t,data,crc]);}
const rays=[[[24,9],[24,6]],[[24,39],[24,42]],[[9,24],[6,24]],[[39,24],[42,24]],[[13,13],[11,11]],[[35,35],[37,37]],[[13,35],[11,37]],[[35,13],[37,11]]];
function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
function render(size,maskable=false){
 const raw=Buffer.alloc(size*(1+4*size)),scale=maskable?.82:1;
 for(let y=0;y<size;y++){let offset=y*(1+4*size)+1;for(let x=0;x<size;x++){
  let alpha=0,white=0;
  for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){
   const px=(x+(sx+.5)/4)/size*48,py=(y+(sy+.5)/4)/size*48;
   if(!maskable&&Math.hypot(Math.max(0,Math.abs(px-24)-11),Math.max(0,Math.abs(py-24)-11))>13)continue;
   alpha++;const gx=(px-24)/scale+24,gy=(py-24)/scale+24;
   if(Math.hypot(gx-24,gy-24)<=8.5||rays.some(([a,b])=>distance(gx,gy,a,b)<=.9))white++;
  }
  for(let c=0;c<3;c++)raw[offset++]=alpha?Math.round((white*[179,139,75][c]+(alpha-white)*[251,248,241][c])/alpha):0;
  raw[offset++]=Math.round(alpha/16*255);
 }}
 const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
for(const [name,size,maskable] of [['icon-192.png',192,false],['icon-512.png',512,false],['icon-maskable-512.png',512,true],['apple-touch-icon.png',180,true]])writeFileSync(new URL(name,directory),render(size,maskable));
console.log('Generated four FranLumi app icons.');
