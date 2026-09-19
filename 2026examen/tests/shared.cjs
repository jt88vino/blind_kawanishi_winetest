const assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const {PGlite}=require('@electric-sql/pglite');
function compile(file,requireFn){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod.exports,require:requireFn,Response,URL,Map,crypto,process,console});return mod.exports;}
(async()=>{const db=new PGlite();try{
 const exam=compile('lib/exam.ts',require),opts=compile('lib/options.ts',()=>exam);let allowed=true;
 const query=async(...args)=>(await db.query(...args)).rows;
 const server=compile('lib/server.ts',id=>id==='@neondatabase/serverless'?{neon:()=>({query})}:id==='./exam'?exam:id==='./options'?opts:{admin:async()=>allowed});
 process.env.DATABASE_URL='test';
 const results=compile('lib/results.ts',require);
 const route=compile('app/api/exam/route.ts',id=>id==='@/lib/server'?server:id==='@/lib/exam'?exam:id==='@/lib/results'?results:opts);
 const request=(b,id=crypto.randomUUID())=>new Request('https://example.test/api/exam',{method:'POST',headers:{origin:'https://example.test',cookie:'bk_device='+id},body:JSON.stringify(b)});
 const old=await server.config('sommelier');await server.config('expert');
 const shared=opts.defaultSharedChoices();shared.white={country:['日本'],grape:['甲州'],year:['2025']};
 allowed=false;assert.equal((await route.POST(request({action:'choices',exam:'sommelier',options:shared,sharedRevision:1}))).status,403);allowed=true;
 assert.equal((await route.POST(request({action:'choices',exam:'sommelier',options:shared,sharedRevision:1}))).status,200);
 assert.equal((await route.POST(request({action:'choices',exam:'sommelier',options:shared,sharedRevision:1}))).status,409);
 for(const e of ['sommelier','expert']){const c=await server.config(e);for(const q of c.questions.filter(q=>q.type==='white'))assert.equal(q.options.grape.join(','),'甲州');assert.equal(c.shared_revision,2);}
 const c=await server.config('sommelier');const answers=c.questions.map(q=>({id:q.id,values:q.type==='spirit'?{drink:opts.choices(q).drink[0]}:{country:opts.choices(q).country[0],grape:opts.choices(q).grape[0],year:opts.choices(q).year[0]}}));
 const body={action:'submit',exam:'sommelier',revision:c.revision,sharedRevision:1,answers};assert.equal((await route.POST(request(body))).status,409);
 body.sharedRevision=2;const device=crypto.randomUUID();assert.equal((await route.POST(request(body,device))).status,200);assert.equal((await route.POST(request(body,device))).status,409);
 shared.white.grape=['シャルドネ'];assert.equal((await route.POST(request({action:'choices',exam:'expert',options:shared,sharedRevision:2}))).status,200);
 const saved=await query('SELECT answers FROM bk_submissions');assert.equal(saved[0].answers[0].values.grape,'甲州');
 allowed=false;assert.equal((await route.POST(request({action:'reset',exam:'sommelier',confirm:'回答データをクリア'}))).status,403);allowed=true;
 assert.equal((await route.POST(request({action:'reset',exam:'sommelier',confirm:'wrong'}))).status,400);
 assert.equal((await route.POST(request({action:'reset',exam:'sommelier',confirm:'回答データをクリア'}))).status,200);
 assert.equal((await query('SELECT * FROM bk_submissions')).length,0);assert.equal((await query('SELECT * FROM bk_submission_archive')).length,1);
 const latest=await server.config('sommelier');body.sharedRevision=latest.shared_revision;body.answers[0].values.grape='シャルドネ';body.answers[1].values.grape='シャルドネ';assert.equal((await route.POST(request(body,device))).status,200);
 console.log('PASS: shared choices across both exams and all same-type questions, authorization, stale edits and submissions, retained historical answers');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
