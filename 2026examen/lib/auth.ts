import {cookies} from 'next/headers';
import {createHmac, timingSafeEqual, createHash} from 'node:crypto';
export const COOKIE='bk_admin';
function secret(){const s=process.env.SESSION_SECRET;if(!s||s.length<32)throw Error('SESSION_SECRET must contain at least 32 characters');return s;}
export function safeEqual(a:string,b:string){return timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());}
export function token(){const body=Buffer.from(JSON.stringify({exp:Date.now()+8*3600000})).toString('base64url');return body+'.'+createHmac('sha256',secret()).update(body).digest('base64url');}
export function verify(value:string){try{const [body,sig,...extra]=value.split('.');if(extra.length||!body||!sig)return false;if(!safeEqual(sig,createHmac('sha256',secret()).update(body).digest('base64url')))return false;const p=JSON.parse(Buffer.from(body,'base64url').toString());return typeof p.exp==='number'&&p.exp>Date.now()&&p.exp<=Date.now()+8*3600000;}catch{return false;}}
export async function admin(){return verify((await cookies()).get(COOKIE)?.value||'');}
