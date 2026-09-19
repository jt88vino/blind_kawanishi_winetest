const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bk-tests-'));
try{
 for(const name of ['exam','options','csv']) fs.writeFileSync(path.join(dir,name+'.js'),ts.transpileModule(fs.readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
 const {choices,normalizeOptions}=require(path.join(dir,'options.js'));
 const {csv,csvCell}=require(path.join(dir,'csv.js'));
 const white={id:'1',label:'第1問',type:'white'};
 assert.ok(choices(white).grape.includes('シャルドネ'));
 assert.ok(choices({...white,type:'red'}).grape.includes('メルロ'));
 const edited={...white,options:{grape:[' 新しい品種 '],country:['日本'],year:['2026']}};
 assert.deepEqual(normalizeOptions(edited),{country:['日本'],grape:['新しい品種'],year:['2026']});
 assert.deepEqual(normalizeOptions({...white,type:'spirit',options:{drink:['新しい飲料']}}),{drink:['新しい飲料']});
 assert.throws(()=>normalizeOptions({...white,options:{grape:[]}}));
 assert.throws(()=>normalizeOptions({...white,options:{grape:['A',' A ']}}));
 assert.throws(()=>normalizeOptions({...white,options:{grape:['A\nB']}}));
 assert.throws(()=>normalizeOptions({...white,options:{year:['x'.repeat(101)]}}));
 assert.equal(csvCell('a,"b"'),'"a,""b"""');
 for(const value of ['=1+1','+1','-1','@SUM(A1)','  =1','\ttext'])assert.ok(csvCell(value).startsWith('"\''));
 assert.equal(csv([['国','品種'],['日本','甲州']]),'\ufeff"国","品種"\r\n"日本","甲州"\r\n');
 console.log('PASS: legacy/default/custom choices, validation, CSV quoting, BOM, formula protection');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
