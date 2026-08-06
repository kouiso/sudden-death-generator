export interface ShareBarProps {
  output: string;
  copyStatus: "idle" | "success" | "error";
  onCopy: () => void;
  linkCopyStatus: "idle" | "success" | "error";
  onCopyLink: () => void;
  /** 入力が長すぎてURLに載せると復元を保証できない場合、リンクコピーそのものを止める。 */
  linkCopyDisabled: boolean;
}

function buildXShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function buildLineShareUrl(text: string): string {
  // LINE 公式ドキュメントが現在案内する共有スキームは R/share?text=。
  // 旧 R/msg/text/ は非掲載でクライアントによっては共有ピッカーが開かない
  // (実機で開かないため Codex bot 指摘を受け確認・修正)。
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

export function ShareBar({ output, copyStatus, onCopy, linkCopyStatus, onCopyLink, linkCopyDisabled }: ShareBarProps) {
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
        <button
          type="button"
          className="share-button share-button--link"
          onClick={onCopyLink}
          disabled={linkCopyDisabled}
          title={linkCopyDisabled ? "入力が長すぎるためリンクを生成できません" : undefined}
        >
          🔗 {linkCopyStatus === "success" ? "コピー済み" : "リンクをコピー"}
        </button>
      </div>
      <p className="share-note">
        ※ X・LINE は等幅フォントで表示されないため、貼り付け先で AA がズレる場合があります。
        {linkCopyDisabled
          ? " ※ 入力が長すぎるため、リンクでの共有はできません。"
          : " ※ リンクをコピーすると、入力内容とオプションを復元できる URL を共有できます。"}
      </p>
    </div>
  );
}
