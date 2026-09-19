export type Combination={id:string,values:Record<string,string>,n:number,total:number,rank:number};
export const combinationQuery=`WITH grouped AS (
 SELECT a->>'id' AS id,a->'values' AS values,count(*)::int AS n
 FROM bk_submissions s CROSS JOIN LATERAL jsonb_array_elements(s.answers) a
 WHERE s.exam=$1 GROUP BY a->>'id',a->'values'
), ranked AS (
 SELECT *,sum(n) OVER(PARTITION BY id)::int AS total,
 dense_rank() OVER(PARTITION BY id ORDER BY n DESC)::int AS rank FROM grouped
) SELECT * FROM ranked WHERE rank<=3 ORDER BY id,rank,values::text`;
export const chartColors=['#773753','#ba8350','#508a88','#7988b0','#d4d0d8'];
export function chartSegments(rows:{value:string,n:number}[]){
 const sorted=[...rows].sort((a,b)=>b.n-a.n||a.value.localeCompare(b.value,'ja'));
 return sorted.length<=5?sorted:[...sorted.slice(0,4),{value:'上記以外（合計）',n:sorted.slice(4).reduce((s,x)=>s+x.n,0)}];
}

export const resetQuery=`WITH removed AS (DELETE FROM bk_submissions RETURNING device,exam,answers,created)
 INSERT INTO bk_submission_archive(batch,device,exam,answers,created)
 SELECT $1::uuid,device,exam,answers,created FROM removed RETURNING device`;
