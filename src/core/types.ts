/** 生成する枠の形状。短冊は常に縦書きになる（紙の短冊自体が縦長のため）。 */
export type ShapeKind = "normal" | "square" | "tanzaku" | "stress";

export interface RenderOptions {
  shape: ShapeKind;
  /** 縦書き表示。short冊 (tanzaku) では常に真として扱われる。 */
  vertical: boolean;
  /** 枠の内側上下に余白行を1行追加する。 */
  padding: boolean;
}

/** 半角=1 / 全角=2 の表示幅。 */
export type CharWidth = 1 | 2;

/** 枠を構成する8種の飾り文字。top/bottom の繰り返し単位は必ず表示幅2で統一する
 *  （render.ts の枠幅計算が「繰り返し単位=幅2」を前提にしているため）。 */
export interface FrameGlyphs {
  topLeft: string;
  top: string;
  topRight: string;
  left: string;
  right: string;
  bottomLeft: string;
  bottom: string;
  bottomRight: string;
}
