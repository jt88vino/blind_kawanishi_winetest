const assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/exam.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:m.exports});
assert.deepEqual(JSON.parse(JSON.stringify(m.exports.CORRECT_ANSWERS)),{
 sommelier:[
  {grape:'リースリング',country:'ドイツ',year:'2024'},
  {grape:'トロンテス',country:'アルゼンチン',year:'2024'},
  {grape:'カベルネ・ソーヴィニヨン',country:'オーストラリア',year:'2022'},
  {drink:'マデイラ'},
  {drink:'テキーラ'},
 ],
 expert:[
  {grape:'シャルドネ',country:'アメリカ',year:'2024'},
  {grape:'ゲヴュルツトラミネール',country:'フランス',year:'2024'},
  {grape:'ネッビオーロ',country:'イタリア',year:'2020'},
  {grape:'メルロ',country:'日本',year:'2023'},
  {drink:'ラム'},
 ],
});
console.log('PASS: 2026 sommelier and wine expert correct answers');
