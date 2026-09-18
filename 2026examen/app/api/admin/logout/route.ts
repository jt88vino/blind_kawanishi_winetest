import {json,originOk} from '@/lib/server';
import {COOKIE} from '@/lib/auth';
export async function POST(r:Request){if(!originOk(r))return json({error:'アクセスを確認できません'},403);const res=json({ok:true});res.headers.set('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure`);return res;}
