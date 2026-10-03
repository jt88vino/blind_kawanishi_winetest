export const WHITE=['アリゴテ','アルバリニョ','ヴィオニエ','ゲヴュルツトラミネール','甲州','シャルドネ','シュナン・ブラン','グリューナー・ヴェルトリーナー','セミヨン','ソーヴィニヨン・ブラン','トロンテス','ピノ・グリ / ピノ・グリージョ','ミュスカデ','リースリング'];
export const RED=['アリアニコ','カベルネ・フラン','カベルネ・ソーヴィニヨン','ガメイ','カルメネール','グルナッシュ','サンジョベーゼ','シラー / シラーズ','ジンファンデル','ツヴァイゲルト','テンプラニーリョ','ネッビオーロ','バーベラ','ピノ・ノワール','ブラウフレンキッシュ','マルベック','マスカット・ベーリーA','メルロ'];
export const COUNTRIES=['フランス','イタリア','スペイン','ドイツ','オーストリア','ポルトガル','アメリカ','カナダ','チリ','アルゼンチン','オーストラリア','ニュージーランド','南アフリカ','日本','ハンガリー','ギリシャ','ジョージア','その他','わからない'];
export const YEARS=Array.from({length:8},(_,i)=>String(2025-i));
export const SPIRITS=['ジン','ウォッカ','ラム','テキーラ','ウイスキー','バーボン','コニャック','アルマニャック','カルヴァドス','グラッパ','マール','キルシュ','アクアヴィット','焼酎（芋）','焼酎（麦）','焼酎（米）','泡盛','日本酒','梅酒','紹興酒','ポート','シェリー','マデイラ','ヴェルモット','カンパリ','シャルトリューズ（緑）','シャルトリューズ（黄）','ベネディクティン','ドランブイ','コアントロー','グラン・マルニエ','アマレット','サンブーカ','ペルノ','クレーム・ド・カシス','その他','わからない'];
export const EXAMS={sommelier:'ソムリエ',expert:'ワインエキスパート'};
// 2026年度の回答受付は終了。公開ページでは両試験の最終集計を表示する。
export const ACCEPTING_RESPONSES=false;
export type Exam=keyof typeof EXAMS;
export type CorrectAnswer={grape:string,country:string,year:string}|{drink:string};
export const CORRECT_ANSWERS:Record<Exam,CorrectAnswer[]>={
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
};
export type Question={id:string,type:'white'|'red'|'spirit',label:string,options?:Partial<{country:string[],grape:string[],year:string[],drink:string[]}>};
export const TYPES={white:'白ワイン',red:'赤ワイン',spirit:'その他の飲料'};
export const initial=(e:Exam):Question[]=>(e==='sommelier'?['white','white','red','spirit','spirit']:['white','white','red','red','spirit']).map((type,i)=>({id:e+'-'+i,type:type as Question['type'],label:'第'+(i+1)+'問'}));
