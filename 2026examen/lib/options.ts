import {COUNTRIES, WHITE, RED, YEARS, SPIRITS, type Question} from './exam';
export type Choices = {country: string[]; grape: string[]; year: string[]; drink: string[]};
export const choiceFields = (type: Question['type']): (keyof Choices)[] => type === 'spirit' ? ['drink'] : ['country','grape','year'];
export function choices(q: Question): Choices {
  return {country: COUNTRIES, grape: (q.type === 'white' ? WHITE : RED).concat(['その他','わからない']), year: YEARS, drink: SPIRITS, ...q.options};
}
export function normalizeOptions(q: Question): Partial<Choices> {
  const source = choices(q), result: Partial<Choices> = {};
  for (const field of choiceFields(q.type)) {
    const list = source[field];
    if (!Array.isArray(list) || list.length < 1 || list.length > 200 || list.some(v => typeof v !== 'string' || !v.trim() || v.trim().length > 100 || /[\r\n\x00-\x1f]/.test(v))) throw Error('選択肢は各項目1〜200件、1件100文字以内で入力してください。');
    const cleaned = list.map(v => v.trim());
    if (new Set(cleaned).size !== cleaned.length) throw Error('同じ項目に重複した選択肢があります。');
    result[field] = cleaned;
  }
  return result;
}

export type SharedChoices = Record<Question['type'], Partial<Choices>>;
export function defaultSharedChoices(): SharedChoices {
  return Object.fromEntries(['white','red','spirit'].map(type=>[type,normalizeOptions({id:'',label:'',type:type as Question['type']})])) as SharedChoices;
}
export function normalizeSharedChoices(input: SharedChoices): SharedChoices {
  if (!input || typeof input !== 'object') throw Error('選択肢が不正です。');
  return Object.fromEntries(['white','red','spirit'].map(type=>{
    if (!input[type as Question['type']]) throw Error('3種類すべての選択肢を設定してください。');
    return [type,normalizeOptions({id:'',label:'',type:type as Question['type'],options:input[type as Question['type']]})];
  })) as SharedChoices;
}
