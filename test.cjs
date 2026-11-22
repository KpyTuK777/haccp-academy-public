
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname, nodes=new Map(), listeners={};
function node(){return {innerHTML:'',textContent:'',style:{},classList:{toggle(){}},insertAdjacentHTML(){},focus(){}};}
const storage=new Map();
const ctx={console,Math,Date,JSON,Number,Array,Object,String,Set,Map,RegExp,Error,setTimeout:()=>0,clearTimeout(){},confirm:()=>true,location:{hash:''},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},body:node(),addEventListener:(type,fn)=>listeners[type]=fn},window:{addEventListener(){}},URL,Blob};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),ctx);
let count=0;function check(name,code){assert.equal(vm.runInContext(code,ctx),true,name);console.log('PASS '+name);count++;}
check('Every source and answer is valid','C.questions.every(q=>C.sources.some(s=>s.page===q.page)&&q.answers.length>=3&&new Set(q.answers).size===q.answers.length&&q.correct>=0&&q.correct<q.answers.length)&&new Set(C.questions.map(q=>q.id)).size===C.questions.length');
check('Every module has verified content and questions','[1,2,3,4,5,6].every(n=>C.facts.some(f=>f[0]===n)&&C.questions.filter(q=>q.module===n).length>=5)');
check('All fact and glossary references resolve','C.facts.every(f=>C.sources.some(s=>s.page===f[1]))&&C.terms.every(t=>C.sources.some(s=>s.page===t[2]))');
assert.ok(ctx.window.COURSE.sources.every(s=>!s.file));assert.ok(!fs.existsSync(path.join(root,'sources')));
check('500 exams: 30 unique questions, five per topic','Array.from({length:500},()=>selectExam()).every(a=>a.length===30&&new Set(a.map(q=>q.id)).size===30&&[1,2,3,4,5,6].every(m=>a.filter(q=>q.module===m).length===5))');
check('Answer shuffling preserves indices','C.questions.every(q=>{const a=shuffle(q.answers.map((_,i)=>i));return a.length===q.answers.length&&new Set(a).size===a.length&&a.includes(q.correct)})');
check('Exam and option order vary across samples','new Set(Array.from({length:30},()=>selectExam().map(q=>q.id).join())).size>1&&new Set(Array.from({length:30},()=>shuffle([0,1,2]).join())).size>1');
check('Unanswered submission cannot finish','start("exam"); const before=state.attempts.length; finish();state.attempts.length===before&&state.active!==null');
check('Unanswered and invalid choices cannot advance score','const i=state.active.items[0];submitAnswer(99);i.answer===null');
check('Confirmed answer is locked and session persists','submitAnswer(1);submitAnswer(0);state.active.items[0].answer===1&&JSON.parse(localStorage.getItem(KEY)).active.items[0].answer===1');
check('25/30 fails, mistakes recorded','state.active.items.forEach((i,n)=>i.answer=n<25?0:1);finish();state.attempts.at(-1).score===25&&!state.attempts.at(-1).passed&&unresolved().length===5');
check('Review uses only unresolved errors','start("review");state.active.items.length===5&&state.active.items.every(i=>unresolved().includes(i.id))');
check('Correct review resolves errors, preserves old history','state.active.items.forEach(i=>i.answer=0);finish();unresolved().length===0&&state.attempts.length===2&&state.attempts[0].items.filter(i=>i.answer!==0).length===5');
check('26/30 passes; completion is not duplicated','start("exam");state.active.items.forEach((i,n)=>i.answer=n<26?0:1);finish();const len=state.attempts.length;finish();state.attempts.at(-1).passed&&state.attempts.length===len');
check('Session validation rejects missing question and duplicate order','!validSession({kind:"exam",items:[{id:"missing",order:[0,1,2],answer:null}],index:0})&&!validSession({kind:"exam",items:[{id:"q1",order:[0,0,2],answer:null}],index:0})');
check('All primary pages render','["home","modules","module/1","module/2","module/3","module/4","module/5","module/6","module/7","tests","exam","progress"].every(r=>{location.hash="#"+r;render();return main.innerHTML.length>100})');
check('HTML escaping neutralizes injected text','esc("<script>") === "&lt;script&gt;"');
check('Guide merges all terms without losing their definitions or sources','guide.length===C.facts.length+1&&C.terms.every(t=>guide.some(r=>(r.title===t[0]&&r.body===t[1]&&r.page===t[2])||r.definitions.some(d=>d.title===t[0]&&d.body===t[1]&&d.page===t[2])))');
check('Guide searches merged aliases and respects topic filter','guideMatches("Термощуп").some(r=>r.id==="fact-28")&&guideMatches("Корекція",6).some(r=>r.id==="fact-70")&&guideMatches("Термощуп",2).length===0&&guideMatches("zzzzzz").length===0');
check('Cards show topic numbers','moduleCards(C.modules).includes("Тема 01")&&tests().includes("Тема 06")');
console.log(count+' checks passed; '+ctx.window.COURSE.sources.length+' source page labels verified; no original photos shipped.');

check('Public source labels are inert','source(20).includes("Оригінал · с. 20")&&!source(20).includes("button")&&!source(20).includes("href")&&!nav.some(n=>n[0]==="sources")');
check('Legacy sources route cannot reveal photos','location.hash="#sources";render();!main.innerHTML.includes("<img")&&main.innerHTML.includes("Сторінку не знайдено")');
assert.ok(!fs.readFileSync(path.join(root,'app.js'),'utf8').includes('data-source'));

check('Every new question has four distinct options','C.questions.length===71&&C.questions.every(q=>q.answers.length===4&&new Set(q.answers).size===4&&q.id.endsWith("-v2"))');
check('New exams never draw legacy questions','selectExam().every(q=>q.id.endsWith("-v2")&&q.answers.length===4)');
check('Legacy result still uses original answer text','qById("q62").answers.length===3&&qById("q62").answers[0]==="Не вище −18 °C"&&qById("q62-v2").answers[0]==="−18 °C"');
check('Legacy mistakes retry using new four-choice questions','state.active=null;state.mistakes={q62:{count:1,lastAnswer:1,resolved:false}};start("review");state.active.items.length===1&&state.active.items[0].id==="q62-v2"&&state.active.items[0].order.length===4');
check('Correct new response resolves legacy mistake','state.active.items[0].answer=0;finish();unresolved().length===0&&state.mistakes.q62.resolved');
check('Wrong new response supersedes old error without duplicate review','state.mistakes={q62:{count:1,lastAnswer:1,resolved:false}};start("review");state.active.items[0].answer=1;finish();unresolved().length===1&&unresolved()[0]==="q62-v2"');
