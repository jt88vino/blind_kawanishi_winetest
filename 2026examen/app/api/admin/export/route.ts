import {admin, init, sql, json} from '@/lib/server';
import {EXAMS, TYPES, type Exam, type Question} from '@/lib/exam';
import {csv} from '@/lib/csv';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!await admin()) return json({error:'管理者のみ操作できます。'},403);
  const url = new URL(request.url), exam = url.searchParams.get('exam') as Exam, mode = url.searchParams.get('mode');
  if (!Object.hasOwn(EXAMS,exam) || !['summary','answers'].includes(mode || '')) return json({error:'出力条件が不正です。'},400);
  try {
    await init();
    const q = sql();
    let rows: unknown[][];
    if (mode === 'answers') {
      const data = await q.query('SELECT created,answers FROM bk_submissions WHERE exam=$1 ORDER BY created,device',[exam]);
      rows = [['回答番号','回答日時（日本時間）','試験区分','問題ID','問題名','種類','生産国','ブドウ品種','ヴィンテージ','飲料名']];
      data.forEach((s:any,i:number) => {
        const date = new Date(s.created).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',hour12:false});
        s.answers.forEach((a:any) => rows.push([i+1,date,EXAMS[exam],a.id,a.label,TYPES[a.type as Question['type']],a.values.country,a.values.grape,a.values.year,a.values.drink]));
      });
    } else {
      const data = await q.query(`SELECT a->>'id' AS id,a->>'label' AS label,a->>'type' AS type,f.key AS field,f.value AS value,count(*)::int AS n FROM bk_submissions s CROSS JOIN LATERAL jsonb_array_elements(s.answers) a CROSS JOIN LATERAL jsonb_each_text(a->'values') f WHERE s.exam=$1 GROUP BY a->>'id',a->>'label',a->>'type',f.key,f.value ORDER BY id,field,n DESC,value`,[exam]);
      const totals = new Map<string,number>();
      for (const r of data) {const key=JSON.stringify([r.id,r.field]);totals.set(key,(totals.get(key)||0)+r.n);}
      const labels:Record<string,string>={country:'生産国',grape:'ブドウ品種',year:'ヴィンテージ',drink:'飲料名'};
      rows=[['試験区分','問題ID','問題名','種類','項目','選択肢','回答数','項目の総回答数','割合（%）']];
      for(const r of data){const total=totals.get(JSON.stringify([r.id,r.field]))!;rows.push([EXAMS[exam],r.id,r.label,TYPES[r.type as Question['type']],labels[r.field],r.value,r.n,total,(r.n/total*100).toFixed(2)]);}
    }
    return new Response(csv(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="2026examen-${exam}-${mode}-${new Date().toISOString().slice(0,10)}.csv"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  } catch {return json({error:'CSVを作成できませんでした。時間をおいて再試行してください。'},503);}
}
