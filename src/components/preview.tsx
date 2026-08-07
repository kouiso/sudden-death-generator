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

export function Preview({ output }: PreviewProps) {
  const [announcement, setAnnouncement] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const lineCount = output.split("\n").length;
      setAnnouncement(`プレビューを更新しました（${lineCount}行）`);
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
