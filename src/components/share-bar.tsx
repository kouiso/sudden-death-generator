export interface ShareBarProps {
  output: string;
  copyStatus: "idle" | "success" | "error";
  onCopy: () => void;
}

function buildXShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function buildLineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}

export function ShareBar({ output, copyStatus, onCopy }: ShareBarProps) {
  return (
    <div>
      <div className="share-bar">
        <button type="button" className="share-button share-button--copy" onClick={onCopy}>
          📋 {copyStatus === "success" ? "コピー済み" : "コピー"}
        </button>
        <a
          className="share-button share-button--x"
          href={buildXShareUrl(output)}
          target="_blank"
          rel="noreferrer"
        >
          𝕏 でシェア
        </a>
        <a
          className="share-button share-button--line"
          href={buildLineShareUrl(output)}
          target="_blank"
          rel="noreferrer"
        >
          LINE で送信
        </a>
      </div>
      <p className="share-note">
        ※ X・LINE は等幅フォントで表示されないため、貼り付け先で AA がズレる場合があります。
      </p>
    </div>
  );
}
