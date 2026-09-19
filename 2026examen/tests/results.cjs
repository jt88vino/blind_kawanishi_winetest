const assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');const {PGlite}=require('@electric-sql/pglite');const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/results.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:m.exports});
(async()=>{const db=new PGlite();try{await db.exec('CREATE TABLE bk_submissions(exam text,answers jsonb)');
 const patterns=[['日本','甲州','2025',4],['フランス','シャルドネ','2024',3],['日本','シャルドネ','2024',3],['フランス','甲州','2025',2],['日本','甲州','2024',1]];
 for(const [country,grape,year,n] of patterns)for(let i=0;i<n;i++)await db.query('INSERT INTO bk_submissions VALUES($1,$2::jsonb)',['sommelier',JSON.stringify([{id:'q1',values:{country,grape,year}},{id:'spirit',values:{drink:'ジン'}}])]);
 await db.query('INSERT INTO bk_submissions VALUES($1,$2::jsonb)',['expert',JSON.stringify([{id:'q1',values:{country:'X'}}])]);
 const rows=(await db.query(m.exports.combinationQuery,['sommelier'])).rows,top=rows.filter(x=>x.id==='q1');assert.deepEqual(top.map(x=>x.n),[4,3,3,2]);assert.deepEqual(top.map(x=>x.rank),[1,2,2,3]);assert.ok(top.every(x=>x.total===13));assert.equal(rows.find(x=>x.id==='spirit').n,13);
 const seg=m.exports.chartSegments(Array.from({length:8},(_,i)=>({value:String(i),n:8-i})));assert.equal(seg.length,5);assert.equal(seg.reduce((n,x)=>n+x.n,0),36);
 console.log('PASS: actual joint combinations, tied top three ranks, question/exam separation, denominators, donut grouping');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
