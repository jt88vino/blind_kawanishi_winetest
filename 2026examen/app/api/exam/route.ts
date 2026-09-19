import {choices,normalizeSharedChoices} from '@/lib/options';
import {sql,admin,config,json,originOk,device} from '@/lib/server';
import {EXAMS,type Exam,type Question} from '@/lib/exam';
export const dynamic='force-dynamic';
export async function GET(r:Request){try{
 const url=new URL(r.url),exam=url.searchParams.get('exam') as Exam;if(!Object.hasOwn(EXAMS,exam))return json({error:'試験区分が不正です'},400);
 const c=await config(exam),q=sql(),id=device(r)||crypto.randomUUID();
 const found=await q.query('SELECT exam FROM bk_submissions WHERE device=$1',[id]);const done=found[0]||null,isAdmin=await admin();let results=null;
 if(done||isAdmin){const counts=await q.query('SELECT count(*)::int AS n FROM bk_submissions WHERE exam=$1',[exam]);const rows=await q.query(`SELECT a->>'id' AS id,a->>'label' AS label,a->>'type' AS type,f.key AS field,f.value AS value,count(*)::int AS n FROM bk_submissions s CROSS JOIN LATERAL jsonb_array_elements(s.answers) a CROSS JOIN LATERAL jsonb_each_text(a->'values') f WHERE s.exam=$1 GROUP BY a->>'id',a->>'label',a->>'type',f.key,f.value ORDER BY n DESC`,[exam]);results={count:counts[0].n,rows};}
 const res=json({config:c,done,admin:isAdmin,results});res.headers.set('Set-Cookie',`bk_device=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=63072000${process.env.NODE_ENV==='production'?'; Secure':''}`);return res;
 }catch(err){console.error('exam read failed',err instanceof Error?err.name:'error');return json({error:'読み込めませんでした。時間をおいて再試行してください。'},503)}}
export async function POST(r:Request){try{
 if(!originOk(r))return json({error:'アクセスを確認できません'},403);const raw=await r.text();if(raw.length>2000000)return json({error:'データが大きすぎます'},413);let b:any;try{b=JSON.parse(raw)}catch{return json({error:'入力が不正です'},400)}if(!b||!Object.hasOwn(EXAMS,b.exam))return json({error:'試験区分が不正です'},400);const exam=b.exam as Exam;
 if(['configure','choices'].includes(b.action)&&!await admin())return json({error:'管理者のみ操作できます'},403);
 const c=await config(exam),q=sql();
 if(b.action==='choices'){
  let options;try{options=normalizeSharedChoices(b.options)}catch(e){return json({error:e instanceof Error?e.message:'選択肢が不正です。'},400)}
  const updated=await q.query("UPDATE bk_settings SET questions=$1::jsonb,revision=revision+1 WHERE exam='shared' AND revision=$2 RETURNING revision",[JSON.stringify(options),b.sharedRevision]);
  if(!updated.length)return json({error:'共通の選択肢が更新されています。再読み込みしてください。'},409);return json({ok:true});
 }
 if(b.action==='configure'){
  if(!Array.isArray(b.questions)||b.questions.length<1||b.questions.length>20||new Set(b.questions.map((x:any)=>x?.id)).size!==b.questions.length||b.questions.some((x:any)=>!x||!['white','red','spirit'].includes(x.type)||typeof x.id!=='string'||x.id.length>80||typeof x.label!=='string'||!x.label.trim()||x.label.length>40))return json({error:'問題は1〜20問、問題名は40文字以内で設定してください。'},400);
  const old=new Map((c.questions as Question[]).map(x=>[x.id,x]));const questions=b.questions.map((x:Question)=>{const o=old.get(x.id);return {id:o&&(o.type!==x.type||o.label!==x.label.trim())?crypto.randomUUID():x.id,type:x.type,label:x.label.trim()}});
  const updated=await q.query('UPDATE bk_settings SET questions=$1::jsonb,revision=revision+1 WHERE exam=$2 AND revision=$3 RETURNING revision',[JSON.stringify(questions),exam,b.revision]);if(!updated.length)return json({error:'設定が更新されています。再読み込みしてください。'},409);return json({ok:true});
 }
 if(b.action!=='submit')return json({error:'操作が不正です'},400);const id=device(r);if(!id)return json({error:'Cookieを有効にして、ページを再読み込みしてください。'},400);
 if((await q.query('SELECT 1 FROM bk_submissions WHERE device=$1',[id])).length)return json({error:'この端末では送信済みです。',done:true},409);
 if(c.revision!==b.revision||c.shared_revision!==b.sharedRevision)return json({error:'問題が変更されました。ページを再読み込みしてご確認ください。'},409);
 if(!Array.isArray(b.answers)||b.answers.length!==c.questions.length)return json({error:'すべての問題に回答してください。'},400);
 const answers=[];for(const item of c.questions as Question[]){const a=b.answers.find((x:any)=>x?.id===item.id)?.values;if(!a)return json({error:'すべての問題に回答してください。'},400);const opts=choices(item);const valid=item.type==='spirit'?opts.drink.includes(a.drink):opts.country.includes(a.country)&&opts.grape.includes(a.grape)&&opts.year.includes(a.year);if(!valid)return json({error:'すべての項目を選択してください。'},400);answers.push({id:item.id,label:item.label,type:item.type,values:item.type==='spirit'?{drink:a.drink}:{country:a.country,grape:a.grape,year:a.year}});}
 // Row lock serializes an in-flight submission against a settings update.
 const inserted=await q.query(`WITH current_config AS (SELECT e.exam FROM bk_settings e CROSS JOIN bk_settings s WHERE e.exam=$1 AND e.revision=$2 AND s.exam='shared' AND s.revision=$5 FOR SHARE OF e,s) INSERT INTO bk_submissions(device,exam,answers) SELECT $3::uuid,$1,$4::jsonb FROM current_config ON CONFLICT(device) DO NOTHING RETURNING device`,[exam,b.revision,id,JSON.stringify(answers),b.sharedRevision]);
 if(!inserted.length)return json({error:'送信済み、または問題が更新されました。再読み込みしてください。'},409);return json({ok:true});
 }catch(err){console.error('exam write failed',err instanceof Error?err.name:'error');return json({error:'保存できませんでした。入力内容を残したまま再試行できます。'},503)}}
