/* Verifies the app behaves the way GitHub Pages serves it: from a project
 * subpath (/chess-opener/), installable, offline-capable, and able to pick up
 * a new deploy. Needs playwright:
 *   CHROMIUM_PATH=/path/to/chrome node test/pages.js  */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const PREFIX='/chess-opener';           // mimic https://user.github.io/chess-opener/
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml',
  '.webmanifest':'application/manifest+json','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]);
  if(!u.startsWith(PREFIX)){res.writeHead(404);return res.end('outside pages root');}
  let p=u.slice(PREFIX.length)||'/';
  if(p==='/')p='/index.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('nf');}
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  res.end(fs.readFileSync(f));
});
let pass=0,fail=0; const ok=(c,m)=>{c?(pass++,console.log('  ✓ '+m)):(fail++,console.log('  ✗ FAIL '+m))};
(async()=>{
 await new Promise(r=>server.listen(8094,r));
 const b=await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
 const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const p=await ctx.newPage();
 const bad=[], errs=[];
 p.on('response',r=>{ if(r.status()>=400) bad.push(r.status()+' '+r.url()); });
 p.on('pageerror',e=>errs.push(e.message));
 p.on('requestfailed',r=>{ const f=r.failure(); if(f && !/ERR_INTERNET_DISCONNECTED/.test(f.errorText)) bad.push('FAILED '+r.url()+' '+f.errorText); });

 const BASE='http://localhost:8094/chess-opener/';
 console.log('\n[1] Loads from a subpath');
 await p.goto(BASE,{waitUntil:'networkidle'});
 await p.waitForTimeout(600);
 ok(bad.length===0,'no 404s / failed requests'+(bad.length?': '+bad.join(', '):''));
 ok(errs.length===0,'no JS errors'+(errs.length?': '+errs[0]:''));
 ok(await p.locator('#start-session').count()===1,'train view rendered');
 ok(await p.locator('.tabbar button').count()===4,'tab bar rendered');

 console.log('\n[2] Manifest + icons resolve under the subpath');
 const man = await p.evaluate(async()=>{
   const href=document.querySelector('link[rel=manifest]').href;
   const r=await fetch(href); const j=await r.json();
   const icon=new URL(j.icons[1].src, href).href;
   const ir=await fetch(icon);
   return {href, ok:r.ok, start:new URL(j.start_url, href).href, icon, iconOk:ir.ok, iconType:ir.headers.get('content-type')};
 });
 ok(man.ok,'manifest fetched: '+man.href);
 ok(man.start===BASE,'start_url resolves to the site root ('+man.start+')');
 ok(man.iconOk,'PNG icon resolves: '+man.icon);

 console.log('\n[3] Service worker');
 const sw = await p.evaluate(async()=>{
   const r = await navigator.serviceWorker.ready;
   return {scope:r.scope, active:!!r.active};
 });
 ok(sw.active,'service worker activated');
 ok(sw.scope===BASE,'scope is the project subpath, not the domain root ('+sw.scope+')');
 const cached = await p.evaluate(async()=>{
   const keys=await caches.keys();
   const c=await caches.open(keys[0]);
   const reqs=await c.keys();
   return {cache:keys[0], n:reqs.length, sample:reqs.slice(0,3).map(r=>r.url)};
 });
 ok(cached.n>=12,'precached '+cached.n+' files into '+cached.cache);
 ok(cached.sample.every(u=>u.startsWith(BASE)),'cached URLs live under the subpath');

 console.log('\n[4] Works offline');
 await ctx.setOffline(true);
 await p.reload({waitUntil:'domcontentloaded'});
 await p.waitForTimeout(900);
 ok(await p.locator('#start-session').count()===1,'app still boots with the network off');
 // and a drill runs offline
 await p.click('#start-session'); await p.waitForTimeout(1400);
 ok(await p.locator('#board .piece').count()===32,'board renders offline');
 ok(await p.locator('#prompt').count()===1,'drill runs offline');
 await ctx.setOffline(false);

 console.log('\n[5] Fresh deploy reaches a returning visitor');
 const css=path.join(ROOT,'css/styles.css');
 const original=fs.readFileSync(css,'utf8');
 fs.writeFileSync(css, original+'\n/* deployed-update-marker */\n');
 try {
   await p.reload({waitUntil:'networkidle'});      // serves cache, revalidates behind it
   await p.waitForTimeout(800);
   await p.reload({waitUntil:'networkidle'});      // now the refreshed copy is in cache
   await p.waitForTimeout(500);
   const got = await p.evaluate(async()=>{
     const keys=await caches.keys(); const c=await caches.open(keys[0]);
     const r=await c.match(new URL('css/styles.css', location.href).href);
     return r ? (await r.text()).includes('deployed-update-marker') : false;
   });
   ok(got,'stale-while-revalidate picked up the updated CSS without a hard refresh');
 } finally { fs.writeFileSync(css, original); }

 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); server.close(); process.exit(fail?1:0);
})().catch(e=>{console.error('CRASH',e);process.exit(1)});
