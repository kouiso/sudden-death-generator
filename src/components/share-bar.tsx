export interface ShareBarProps {
  output: string;
  copyStatus: "idle" | "success" | "error";
  onCopy: () => void;
  linkCopyStatus: "idle" | "success" | "error";
  onCopyLink: () => void;
  /** 入力が長すぎてURLに載せると復元を保証できない場合、リンクコピーそのものを止める。 */
  linkCopyDisabled: boolean;
  /**
   * X/LINE のシェアURLが安全な長さの上限を超える場合、リンクをそもそも開けなくする。
   * パーマリンクの上限（MAX_PERMALINK_QUERY_LENGTH）と同じ基準で判定した結果を
   * 呼び出し側（app.tsx）から受け取る。X/LINE のURLは常に本体出力（枠のパディング込み）
   * を丸ごと載せるため、リンクコピー用のパーマリンク（入力テキストのみ）よりも
   * 長くなりやすく、パーマリンク側では安全と判定された入力でもこちらは超過しうる
   * （自己レビューで指摘: パーマリンクだけ上限を設けてX/LINEシェアには無かった不整合）。
   */
  shareDisabled: boolean;
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

const SHARE_DISABLED_TITLE = "入力が長すぎるため、この方法では共有できません";

export function ShareBar({
  output,
  copyStatus,
  onCopy,
  linkCopyStatus,
  onCopyLink,
  linkCopyDisabled,
  shareDisabled,
}: ShareBarProps) {
  return (
    <div>
      <div className="share-bar">
        <button type="button" className="share-button share-button--copy" onClick={onCopy}>
          📋 {copyStatus === "success" ? "コピー済み" : "コピー"}
        </button>
        <a
          className="share-button share-button--x"
          // href を外すだけでは pointer-events:none を敷いていないマウス操作で単にページ内
          // アンカーへ飛ぶだけの不具合になる。onClick で確実に無効化する。
          href={shareDisabled ? undefined : buildXShareUrl(output)}
          target="_blank"
          rel="noreferrer"
          aria-disabled={shareDisabled}
          tabIndex={shareDisabled ? -1 : undefined}
          title={shareDisabled ? SHARE_DISABLED_TITLE : undefined}
          onClick={(event) => {
            if (shareDisabled) event.preventDefault();
          }}
        >
          𝕏 でシェア
        </a>
        <a
          className="share-button share-button--line"
          href={shareDisabled ? undefined : buildLineShareUrl(output)}
          target="_blank"
          rel="noreferrer"
          aria-disabled={shareDisabled}
          tabIndex={shareDisabled ? -1 : undefined}
          title={shareDisabled ? SHARE_DISABLED_TITLE : undefined}
          onClick={(event) => {
            if (shareDisabled) event.preventDefault();
          }}
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
      {/*
       * shareDisabled と linkCopyDisabled は独立した基準（前者は本体出力の長さ、後者は
       * 入力テキストの長さ）で判定しており、同時に true になり得る。片方だけ表示すると、
       * もう一方も無効なのに理由が説明文から消えてユーザーが混乱する
       * （CodeRabbit 指摘: 長文入力で両方無効になる帯域を実測して確認した不具合）。
       * 該当する理由を全部つなげて表示する。
       */}
      <p className="share-note">
        ※ X・LINE は等幅フォントで表示されないため、貼り付け先で AA がズレる場合があります。
        {shareDisabled && " ※ 入力が長すぎるため、X・LINEでの共有はできません。"}
        {linkCopyDisabled && " ※ 入力が長すぎるため、リンクでの共有はできません。"}
        {!shareDisabled &&
          !linkCopyDisabled &&
          " ※ リンクをコピーすると、入力内容とオプションを復元できる URL を共有できます。"}
      </p>
    </div>
  );
}
