import {createHash} from 'node:crypto';
import {safeEqual,token,COOKIE} from '@/lib/auth';
import {json,originOk,init,sql} from '@/lib/server';
export async function POST(r:Request){if(!originOk(r))return json({error:'アクセスを確認できません'},403);try{
 const password=process.env.ADMIN_PASSWORD;if(!password||password.length<16||!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)return json({error:'管理者ログインはまだ設定されていません。'},503);
 const body=await r.text();if(body.length>2048)return json({error:'入力が不正です'},400);const b=JSON.parse(body);await init();const q=sql();
 const ip=r.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown';const key=createHash('sha256').update(ip).digest('hex');
 const limit=await q.query(`INSERT INTO bk_login_limits(key,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN bk_login_limits.reset_at<now() THEN 1 ELSE bk_login_limits.attempts+1 END,reset_at=CASE WHEN bk_login_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE bk_login_limits.reset_at END RETURNING attempts`,[key]);
 if(limit[0].attempts>10)return json({error:'試行回数を超えました。15分後に再試行してください。'},429);
 if(typeof b.password!=='string'||!safeEqual(b.password,password))return json({error:'パスワードが一致しません。'},401);
 const response=json({ok:true});response.headers.set('Set-Cookie',`${COOKIE}=${token()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);return response;
 }catch{return json({error:'ログインできませんでした。時間をおいて再試行してください。'},503)}}
