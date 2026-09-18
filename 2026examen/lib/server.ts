import {neon} from '@neondatabase/serverless';
import {initial,type Exam} from './exam';
export {admin} from './auth';
let ready:Promise<void>|undefined;
export function sql(){const url=process.env.DATABASE_URL;if(!url)throw Error('DATABASE_URL is not configured');return neon(url);}
export async function init(){if(!ready)ready=(async()=>{const q=sql();await q.query(`CREATE TABLE IF NOT EXISTS bk_settings(exam TEXT PRIMARY KEY, revision INTEGER NOT NULL, questions JSONB NOT NULL)`);await q.query(`CREATE TABLE IF NOT EXISTS bk_submissions(device UUID PRIMARY KEY,exam TEXT NOT NULL,answers JSONB NOT NULL,created TIMESTAMPTZ NOT NULL DEFAULT now())`);await q.query('CREATE INDEX IF NOT EXISTS bk_submissions_exam_idx ON bk_submissions(exam)');await q.query(`CREATE TABLE IF NOT EXISTS bk_login_limits(key TEXT PRIMARY KEY, attempts INTEGER NOT NULL,reset_at TIMESTAMPTZ NOT NULL)`);})().catch(e=>{ready=undefined;throw e});return ready;}
export async function config(exam:Exam){await init();const q=sql();await q.query('INSERT INTO bk_settings(exam,revision,questions) VALUES($1,1,$2::jsonb) ON CONFLICT DO NOTHING',[exam,JSON.stringify(initial(exam))]);const rows=await q.query('SELECT * FROM bk_settings WHERE exam=$1',[exam]);return rows[0];}
export const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export function originOk(r:Request){const origin=r.headers.get('origin');if(!origin)return false;try{return new URL(origin).host===(r.headers.get('host')||new URL(r.url).host)}catch{return false}}
export function device(r:Request){return r.headers.get('cookie')?.match(/(?:^|; )bk_device=([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:;|$)/)?.[1]||null;}
