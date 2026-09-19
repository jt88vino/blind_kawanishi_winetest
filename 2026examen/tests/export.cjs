const assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const {PGlite}=require('@electric-sql/pglite');
function compile(file,requireFn){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod.exports,require:requireFn,Response,URL,Date,Map});return mod.exports;}
(async()=>{const db=new PGlite();let allowed=false,calls=0;
try{
 await db.exec('CREATE TABLE bk_submissions(device UUID PRIMARY KEY,exam TEXT,answers JSONB,created TIMESTAMPTZ DEFAULT now())');
 const answer=(value)=>JSON.stringify([{id:'old-question',label:'旧問題',type:'white',values:{country:'日本',grape:value,year:'2025'}}]);
 await db.query('INSERT INTO bk_submissions(device,exam,answers) VALUES($1,$2,$3::jsonb),($4,$2,$5::jsonb)',['00000000-0000-4000-8000-000000000001','sommelier',answer('甲州'),'00000000-0000-4000-8000-000000000002',answer('=1+1')]);
 const csv=compile('lib/csv.ts',require),exam=compile('lib/exam.ts',require);
 const route=compile('app/api/admin/export/route.ts',(id)=>id==='@/lib/csv'?csv:id==='@/lib/exam'?exam:{admin:async()=>allowed,init:async()=>{},json:(v,s)=>Response.json(v,{status:s}),sql:()=>({query:async(...args)=>{calls++;return (await db.query(...args)).rows}})});
 const req=(mode,exam='sommelier')=>new Request('https://example.test/api/admin/export?exam='+exam+'&mode='+mode);
 assert.equal((await route.GET(req('summary'))).status,403);assert.equal(calls,0);
 allowed=true;assert.equal((await route.GET(req('bad'))).status,400);
 const summary=await route.GET(req('summary')),text=await summary.text();assert.equal(summary.status,200);assert.match(text,/50.00/);assert.match(text,/旧問題/);assert.match(text,/'=1\+1/);
 const details=await (await route.GET(req('answers'))).text();assert.ok(!details.includes('00000000-0000'));assert.match(details,/回答日時（日本時間）/);assert.equal(details.trim().split('\r\n').length,3);
 const empty=await (await route.GET(req('answers','expert'))).text();assert.equal(empty.trim().split('\r\n').length,1);
 console.log('PASS: admin-only CSV, PostgreSQL aggregation, historical records, exam separation, anonymous detail rows');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
