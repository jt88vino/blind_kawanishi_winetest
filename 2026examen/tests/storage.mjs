import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
try {
 const server=readFileSync('lib/server.ts','utf8'),route=readFileSync('app/api/exam/route.ts','utf8');
 for(const m of server.matchAll(/q\.query\((?:`([^`]+)`|'([^']+)')/g)){const sql=m[1]||m[2];if(sql.startsWith('CREATE'))await db.exec(sql);}
 const questions=[{id:'q1',label:'第1問',type:'white'}];
 await db.query('INSERT INTO bk_settings VALUES($1,1,$2::jsonb)',['sommelier',JSON.stringify(questions)]);
 await db.query('INSERT INTO bk_settings VALUES($1,1,$2::jsonb)',['shared','{}']);
 const answers=[{...questions[0],values:{country:'フランス',grape:'シャルドネ',year:'2023'}}];
 const submission=[...route.matchAll(/q\.query\(`([^`]+)`/g)].map(m=>m[1]).find(s=>s.startsWith('WITH current_config'));
 assert.ok(submission);
 const id='9e510dd9-0609-4cda-91c2-1e9cd790bace';
 assert.equal((await db.query(submission,['sommelier',1,id,JSON.stringify(answers),1])).rows.length,1);
 assert.equal((await db.query(submission,['sommelier',1,id,JSON.stringify(answers),1])).rows.length,0);
 assert.equal((await db.query(submission,['sommelier',0,crypto.randomUUID(),JSON.stringify(answers),1])).rows.length,0);
 assert.equal((await db.query(submission,['sommelier',1,crypto.randomUUID(),JSON.stringify(answers),0])).rows.length,0);
 const aggregate=[...route.matchAll(/q\.query\(`([^`]+)`/g)].map(m=>m[1]).find(s=>s.startsWith('SELECT a'));
 const rows=(await db.query(aggregate,['sommelier'])).rows;assert.equal(rows.length,3);assert.ok(rows.every(x=>x.n===1));
 await db.query('UPDATE bk_settings SET revision=2,questions=$1::jsonb WHERE exam=$2',[JSON.stringify([]),'sommelier']);
 assert.equal((await db.query(aggregate,['sommelier'])).rows.length,3);
 assert.equal((await db.query(aggregate,['expert'])).rows.length,0);
 console.log('PASS: PostgreSQL schema, duplicate blocking, revision check, aggregation, history retention, exam separation');
}finally{await db.close()}
