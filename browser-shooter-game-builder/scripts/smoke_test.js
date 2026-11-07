#!/usr/bin/env node
// Usage: node scripts/smoke_test.js game.html ["extra js to run after the frames"]
// Extracts the main inline <script> (the one without src), syntax-checks it, stubs the DOM/canvas,
// runs 300 update/draw frames, then throws a bomb and runs 20 more. Prints one summary line.
const fs=require('fs'),cp=require('child_process');
const html=fs.readFileSync(process.argv[2],'utf8');
const m=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop();
if(!m){console.error('no inline <script> found');process.exit(1)}
let src=m[1];fs.writeFileSync('/tmp/_game.js',src);
const chk=cp.spawnSync('node',['--check','/tmp/_game.js']);
if(chk.status){console.error('SYNTAX ERROR\n'+chk.stderr);process.exit(1)}
const ctx=new Proxy({}, {get:(t,k)=>/^create(Radial|Linear)Gradient$|^createPattern$/.test(k)?()=>({addColorStop(){}}):()=>{},set:()=>true});
const el=()=>({getContext:()=>ctx,style:{},set textContent(v){},set innerHTML(v){},width:0,height:0,classList:{add(){},remove(){}}});
Object.assign(global,{document:{getElementById:()=>el(),createElement:()=>el()},innerWidth:1200,innerHeight:800,
  addEventListener(){},performance:{now:()=>Date.now()},requestAnimationFrame(){},setInterval(){},sessionStorage:{},indexedDB:undefined});
global.window=global;
src=src.replace(/\(function tick[\s\S]*$/,''); // drop the rAF loop, we drive frames ourselves
src+=`;paused=false;for(let i=0;i<300;i++){update(.016);draw()}
lobs.push({sx:P.x,sy:P.y,tx:P.x,ty:P.y,x:P.x,y:P.y,t:1.39});for(let i=0;i<20;i++){update(.016);draw()}
console.log('OK walls',walls.length,'trees',walls.filter(w=>w.tree).length,'bots',bots.length,'blasts',blasts.length,'hp',P.hp);
${process.argv[3]||''}`;
try{(0,eval)(src)}catch(e){console.error('RUNTIME ERROR',e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)}
