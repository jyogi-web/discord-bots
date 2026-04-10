// ガチャ演出の動作確認用デバッグ設定。
// true にすると /gacha 実行のたびに低レア→高レアの順で各演出が確定で出る。
// 最高レア演出の次はまた最低レアから繰り返す。
// 本番運用時は必ず false に戻すこと。
export const GACHA_DEBUG = false;

// デバッグ時に再生する演出の順番（低レア → 高レア）。
export type DebugScenario =
  | 'n0'       // 0文字一致（N）
  | 'n1'       // 1文字一致（N）
  | 'r2'       // 2文字一致（R）
  | 'r3'       // 3文字一致（R）
  | 'sr'       // 4文字一致（SR）
  | 'ssr'      // 5文字一致（SSR・スタンプ送信あり）
  | 'legend'   // 7文字全揃い（殿堂入り演出）
  | 'reversed'; // 7文字逆位置

export const DEBUG_SCENARIO_ORDER: DebugScenario[] = [
  'n0',
  'n1',
  'r2',
  'r3',
  'sr',
  'ssr',
  'legend',
  'reversed',
];