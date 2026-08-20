const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=require('path').join(__dirname,'..');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(ROOT,p);
 if(!fs.existsSync(f)){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});res.end(fs.readFileSync(f));});

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log('  ✓ '+m);} else {fail++;console.log('  ✗ FAIL: '+m);} }

(async()=>{
 await new Promise(r=>server.listen(8097,r));
 const b=await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
 const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const p=await ctx.newPage();
 const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
 await p.goto('http://localhost:8097/',{waitUntil:'networkidle'});
 await p.waitForTimeout(300);

 const center = async (sq) => { const bb=await p.locator(`.sq[data-square="${sq}"]`).boundingBox(); return {x:bb.x+bb.width/2,y:bb.y+bb.height/2}; };
 const tap = async (sq) => { const c=await center(sq); await p.mouse.click(c.x,c.y); await p.waitForTimeout(60); };
 const playSan = async (san) => {
   // resolve SAN -> from/to using the live engine of whatever view is active
   const mv = await p.evaluate((s)=>{
     const ch = (window.App.drill&&window.App.drill.chess)||(window.App.sandbox&&window.App.sandbox.chess);
     const m = ch.moveFromSan(s); if(!m) return null; return ch.prettyMove(m);
   }, san);
   if(!mv) throw new Error('cannot resolve '+san);
   await tap(mv.from); await tap(mv.to);
   return mv;
 };

 console.log('\n[1] Geometry / orientation');
 await p.click('[data-tab="sandbox"]'); await p.waitForTimeout(250);
 let a1=await center('a1'), h8=await center('h8');
 ok(a1.y>h8.y && a1.x<h8.x, 'white view: a1 bottom-left');
 await p.click('#sb-flip'); await p.waitForTimeout(250);
 a1=await center('a1'); h8=await center('h8');
 ok(a1.y<h8.y && a1.x>h8.x, 'flipped view: a1 top-right');
 let col = await p.evaluate(()=>getComputedStyle(document.querySelector('.sq[data-square="a1"]')).backgroundColor);
 ok(col==='rgb(111, 143, 95)', 'a1 still dark after flip');
 // tapping works while flipped
 await playSan('e4');
 let hist = await p.evaluate(()=>window.App.sandbox.history);
 ok(hist.join()==='e4', 'move by tap works on flipped board ('+hist.join()+')');
 await p.click('#sb-flip'); await p.waitForTimeout(200);

 console.log('\n[2] Sandbox opening detection');
 await playSan('c5'); await playSan('Nf3'); await playSan('d6');
 let st = await p.textContent('#sb-status');
 ok(/Sicilian/.test(st), 'detects Sicilian after 1.e4 c5 2.Nf3 d6 → '+st.replace(/\s+/g,' ').trim());
 await playSan('a3');
 st = await p.textContent('#sb-status');
 ok(/Out of book/.test(st), 'reports out of book after 3.a3');
 await p.click('#sb-undo'); await p.waitForTimeout(200);
 st = await p.textContent('#sb-status');
 ok(/Sicilian/.test(st), 'undo restores book detection');

 console.log('\n[3] Drag to move');
 const from=await center('d2'), to=await center('d4');
 await p.mouse.move(from.x,from.y); await p.mouse.down();
 await p.mouse.move(from.x+10,from.y-20,{steps:5}); await p.mouse.move(to.x,to.y,{steps:8});
 await p.mouse.up(); await p.waitForTimeout(300);
 hist = await p.evaluate(()=>window.App.sandbox.history);
 ok(hist[hist.length-1]==='d4','drag-and-drop plays d4 (got '+hist[hist.length-1]+')');

 console.log('\n[4] Promotion sheet');
 await p.evaluate(()=>{ App.sandbox.chess.load('8/4P3/8/8/8/8/8/K6k w - - 0 1'); App.sandbox.history=[]; App.board.update(); });
 await p.waitForTimeout(200);
 await tap('e7'); await tap('e8'); await p.waitForTimeout(200);
 ok(await p.locator('.board-promo:not(.hidden)').count()===1,'promotion sheet opens');
 await p.locator('.promo-btn').nth(1).click(); await p.waitForTimeout(300);
 const piece = await p.evaluate(()=>App.sandbox.chess.get('e8'));
 ok(piece && piece.type==='r','promoting to rook works (got '+(piece&&piece.type)+')');

 console.log('\n[5] Drill as Black — wrong move then full line');
 await p.click('[data-tab="book"]'); await p.waitForTimeout(250);
 await p.click('.chip[data-v="b"]'); await p.waitForTimeout(250);
 await p.locator('.op-item').first().click(); await p.waitForTimeout(300);
 const openName = await p.textContent('.appbar h1');
 await p.click('#d-train'); await p.waitForTimeout(1200);
 const o = await p.evaluate(()=>({id:App.drill.opening.id, side:App.drill.opening.side, moves:App.drill.opening.moves, ply:App.drill.ply}));
 ok(o.side==='b','opened a Black line: '+openName.trim());
 ok(o.ply===1,'opponent auto-played White\'s first move (ply='+o.ply+')');
 a1=await center('a1'); h8=await center('h8');
 ok(a1.y<h8.y,'board is flipped for the Black player');

 // wrong move
 const wrong = await p.evaluate(()=>{
   const ch=App.drill.chess, exp=App.drill.opening.moves[App.drill.ply];
   const alt=ch.moves({verbose:true}).filter(m=>m.san!==exp)[0];
   return {from:alt.from,to:alt.to,san:alt.san};
 });
 await tap(wrong.from); await tap(wrong.to); await p.waitForTimeout(300);
 ok(await p.locator('#prompt.err').count()===1,'wrong move flagged ('+wrong.san+')');
 ok(await p.evaluate(()=>App.drill.errors)===1,'error counter incremented');
 ok(await p.evaluate(()=>App.drill.ply)===1,'position not advanced by a wrong move');

 // hint
 await p.click('#btn-hint'); await p.waitForTimeout(150);
 ok(await p.locator('.mark.hint').count()>=1,'hint highlights the piece to move');

 // play the rest of the line correctly
 for(;;){
   const s = await p.evaluate(()=>{
     if(!App.drill) return {done:true};
     return {done:App.drill.done, ply:App.drill.ply, total:App.drill.opening.moves.length,
             mine:(App.drill.ply%2===0?'w':'b')===App.drill.opening.side, next:App.drill.opening.moves[App.drill.ply]};
   });
   if(s.done||s.ply>=s.total) break;
   if(!s.mine){ await p.waitForTimeout(400); continue; }
   await playSan(s.next);
   await p.waitForTimeout(700);
 }
 await p.waitForTimeout(900);
 ok(await p.locator('.result-hero').count()===1,'result screen shown after finishing the line');
 const stored = await p.evaluate((id)=>{
   const d=JSON.parse(localStorage.getItem('chess-opener.v1'));
   return {entry:d.progress[id], xp:d.stats.xp, streak:d.stats.streak, drills:d.stats.drillsDone};
 }, o.id);
 ok(stored.entry && stored.entry.attempts===1,'progress persisted for '+o.id);
 ok(stored.entry.box>=1,'SRS box advanced (box='+stored.entry.box+')');
 ok(stored.xp>0 && stored.streak===1,'xp + streak recorded (xp='+stored.xp+', streak='+stored.streak+')');
 ok(stored.entry.dueAt>Date.now(),'review scheduled in the future');

 console.log('\n[6] Status propagates to book + train');
 await p.click('[data-tab="book"]'); await p.waitForTimeout(300);
 const learningCount = await p.evaluate(()=>document.querySelectorAll('.pill-learning').length);
 ok(learningCount>=1,'line now shows as Learning in the book');
 await p.click('[data-tab="you"]'); await p.waitForTimeout(300);
 const youTxt = await p.textContent('#main');
 ok(/1 learning|learning/.test(youTxt),'progress view renders counts');

 console.log('\n[7] Settings');
 await p.click('.chip[data-board="walnut"]'); await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.documentElement.getAttribute('data-board'))==='walnut','board theme switches');
 await p.click('[data-toggle="showCoords"]'); await p.waitForTimeout(200);
 await p.click('[data-tab="sandbox"]'); await p.waitForTimeout(300);
 ok(await p.locator('.coord').count()===0,'coordinates can be turned off');

 console.log('\n[8] Persistence across reload');
 await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.documentElement.getAttribute('data-board'))==='walnut','settings survive reload');
 const badge = await p.locator('.tabbar [data-tab="train"] .badge').count();
 ok(true,'train badge count = '+badge);

 console.log('\n'+(errs.length? 'JS ERRORS:\n'+errs.join('\n') : 'no JS errors'));
 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); server.close();
 process.exit(fail||errs.length?1:0);
})().catch(e=>{console.error('TEST CRASH:',e);process.exit(1)});
