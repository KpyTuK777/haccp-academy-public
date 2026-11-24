const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||__dirname);const storage=new Map();
function boot(search=''){
const nodes=new Map(),listeners={};const node=()=>({innerHTML:'',value:'',textContent:'',style:{},classList:{toggle(){}},insertAdjacentHTML(p,s){this.innerHTML=s+this.innerHTML},focus(){}});
const ctx={console,Math,Date,JSON,Number,Array,Object,String,Set,Map,RegExp,Error,setTimeout:()=>0,clearTimeout(){},confirm:()=>true,location:{search,hash:'',href:'https://example.test/'+search},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},body:node(),addEventListener:(t,f)=>listeners[t]=f},window:{addEventListener(){}},URL,Blob};vm.createContext(ctx);for(const f of ['data.js','hygiene.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);return {ctx,listeners,run:s=>vm.runInContext(s,ctx)};
}
(async()=>{
const old={version:1,read:[1,3],checks:{'1-0':true},attempts:[],mistakes:{q62:{count:2,lastAnswer:1,resolved:false}},active:{id:'old-active',kind:'module',module:4,title:'Legacy',items:[{id:'q62',order:[2,0,1],answer:null}],index:0},theme:'light'};
storage.set('haccp-academy-v1',JSON.stringify(old));
let f=boot();assert.equal(f.run('state.read.length'),2);assert.equal(f.run('state.active.id'),'old-active');assert.equal(f.run('qById(state.active.items[0].id).answers.length'),3);
f.run('switchCourse("hygiene")');assert.match(f.ctx.location.href,/\?course=hygiene#home$/);const savedFood=storage.get('haccp-academy-v1');
let h=boot('?course=hygiene');assert.equal(h.run('state.read.length'),0);assert.equal(h.run('state.active'),null);assert.equal(h.run('KEY'),'haccp-academy-hygiene-v1');
assert.equal(h.run('C.sources.length===25&&C.facts.length===67&&C.questions.length===60&&C.modules.length===7'),true);
assert.equal(h.run('C.questions.every(q=>q.answers.length===4&&new Set(q.answers).size===4&&C.sources.some(s=>s.page===q.page))'),true);
assert.equal(h.run('C.facts.every((f,n)=>C.lessons[f[0]-1].sections.some(s=>s[2].includes(n)))'),true);
assert.equal(h.run('C.lessons.every(l=>l.sections.every(s=>s[2].every(n=>C.facts[n])))'),true);
assert.equal(h.run('Array.from({length:100},()=>selectExam()).every(a=>a.length===30&&new Set(a.map(q=>q.id)).size===30&&[1,2,3,4,5,6].every(m=>a.filter(q=>q.module===m).length===5))'),true);
h.run('state.read=[2];start("module",3);submitAnswer(1)');assert.equal(h.run('state.active.items[0].answer'),1);
assert.equal(storage.get('haccp-academy-v1'),savedFood);
h=boot('?course=hygiene');assert.equal(h.run('state.read[0]'),2);assert.equal(h.run('state.active.items[0].answer'),1);
h.run('state.active.items.forEach(i=>i.answer=1);finish()');assert.equal(h.run('unresolved().length'),10);assert.equal(h.run('state.attempts.length'),1);
h.run('start("review");state.active.items.forEach(i=>i.answer=0);finish()');assert.equal(h.run('unresolved().length'),0);assert.equal(storage.get('haccp-academy-v1'),savedFood);
for(const route of ['home','module/1','module/2','module/3','module/4','module/5','module/6','module/7','tests','reference','exam','progress']){h.run(`location.hash=${JSON.stringify('#'+route)};render()`);assert.ok(h.run('main.innerHTML.length>100'));}
assert.equal(h.run('moduleView(3).includes("Шість рухів: пам’ятка")'),true);
assert.equal(h.run('guideMatches("рукавич").length>0&&guideMatches("рукавич",1).every(r=>r.module===1)'),true);
const before=storage.get('haccp-academy-hygiene-v1');await h.listeners.change({target:{id:'import-progress',dataset:{},files:[{size:100,text:async()=>JSON.stringify(old)}],value:'old.json'}});assert.equal(storage.get('haccp-academy-hygiene-v1'),before);
const backup=JSON.parse(before);await h.listeners.change({target:{id:'import-progress',dataset:{},files:[{size:100,text:async()=>JSON.stringify(backup)}],value:'new.json'}});assert.equal(h.run('state.attempts.length'),2);
h.run('switchCourse("food")');f=boot('?course=food');assert.equal(f.run('state.active.id'),'old-active');assert.equal(f.run('state.mistakes.q62.count'),2);
const pub=!h.run('C.sources[0].file');if(pub){assert.equal(h.run('source(13).includes("button")'),false);assert.equal(h.run('nav.some(n=>n[0]==="sources")'),false);assert.equal(fs.existsSync(path.join(root,'sources-hygiene')),false);}else{for(let i=1;i<=25;i++)assert.ok(fs.statSync(path.join(root,'sources-hygiene',i+'.jpg')).size>0);h.run('location.hash="#sources";render()');assert.equal(h.run('main.innerHTML.includes("25 / 25")'),true);assert.equal(h.run('main.innerHTML.includes("sources-hygiene/13.jpg")'),true);}
console.log('PASS two-course integration: legacy progress, isolation, session resume, exams, errors, all modules, reference, backup rejection/restore, source separation');
})().catch(e=>{console.error(e);process.exitCode=1});
