import { useEffect, useRef, useState } from "preact/hooks";

export interface PreviewProps {
  output: string;
}

// 生成ボタンが無くキー入力ごとに即再描画されるため、aria-live を output に直結すると
// 1文字ごとに読み上げが走ってうるさい。かといって role="region" だけでは内容の変化を
// 能動的に通知しないため、変更が続いている間は待ち、止まってから一度だけ知らせる
// （Codex bot 指摘）。読み上げ対象は AA そのもの（記号の羅列で意味を成さない）ではなく、
// 行数だけを含む短い要約にする。
const ANNOUNCE_DEBOUNCE_MS = 600;

// 行数だけを含む要約にした結果、直前と行数が同じ更新（例: 1文字消して1文字打つ）だと
// 生成される文字列そのものが前回と一致する。Preact は同一文字列への再セットでDOMの
// テキストノードを実際には更新しないため、スクリーンリーダーはDOM変化を検知できず
// 2回目以降まったく読み上げない（自己レビューで実測した不具合）。可聴内容は変えず、
// 末尾に見た目に影響しないゼロ幅スペースを都度反転させて付与し、DOM上のテキストを
// 確実に変化させることで再読み上げを起こす（スクリーンリーダー向けの一般的な手当て）。
function buildAnnouncement(lineCount: number, tick: boolean): string {
  return `プレビューを更新しました（${lineCount}行）${tick ? "​" : ""}`;
}

export function Preview({ output }: PreviewProps) {
  const [announcement, setAnnouncement] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef(false);

  useEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const lineCount = output.split("\n").length;
      tickRef.current = !tickRef.current;
      setAnnouncement(buildAnnouncement(lineCount, tickRef.current));
    }, ANNOUNCE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [output]);

  return (
    <div>
      <span className="field-label">プレビュー</span>
      <div className="preview-panel" role="region" aria-label="生成結果">
        <div className="preview-scroll">
          <pre className="preview-pre">{output}</pre>
        </div>
      </div>
      <span className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
