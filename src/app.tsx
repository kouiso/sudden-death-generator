import { useEffect, useMemo, useState } from "preact/hooks";
import { renderSuddenDeath, type ShapeKind } from "./core";
import { buildPermalinkQuery, isPermalinkQueryTooLong, parsePermalink } from "./core/permalink";
import { Editor } from "./components/editor";
import { Preview } from "./components/preview";
import { ShapePicker } from "./components/shape-picker";
import { ShareBar } from "./components/share-bar";
import { Toast } from "./components/toast";
import { useClipboard } from "./hooks/use-clipboard";
import { useTheme } from "./hooks/use-theme";

// マウント時に1回だけ読む。以降の状態変更は下の useEffect が URL 側へ反映する
// （URL → state は初期表示のみ。逆方向の state → URL は常に同期する片方向フロー）。
const initialPermalink = parsePermalink(location.search);

export function App() {
  const [text, setText] = useState(initialPermalink.text ?? "");
  const [shape, setShape] = useState<ShapeKind>(initialPermalink.shape ?? "normal");
  const [vertical, setVertical] = useState(initialPermalink.vertical ?? false);
  const [padding, setPadding] = useState(initialPermalink.padding ?? false);
  const [theme, toggleTheme] = useTheme();
  const { status: copyStatus, copy } = useClipboard();
  const { status: linkCopyStatus, copy: copyLink } = useClipboard();

  // パーマリンクのクエリ文字列。URL同期・リンクコピーの両方でこの値を直接使う
  // （リンクコピー時に location.href を読むと、下の debounce 中は古い値を掴む恐れがあるため）。
  const permalinkQuery = useMemo(
    () => buildPermalinkQuery({ text, shape, vertical, padding }),
    [text, shape, vertical, padding],
  );
  const permalinkHref = `${location.origin}${location.pathname}${permalinkQuery ? `?${permalinkQuery}` : ""}`;
  // 長文入力はpercent-encodingで膨らみ、一部環境のURL長制限に引っかかって開けない
  // 可能性がある。「復元できる保証のないリンク」を共有できると見せかけないため、
  // 上限超過時はURL同期・コピーの両方を行わない（Codex bot 指摘）。
  const permalinkTooLong = isPermalinkQueryTooLong(permalinkQuery);

  // 入力・オプションの変更を URL に同期する（ブックマーク・共有用のパーマリンク）。
  // 履歴を汚さないよう pushState ではなく replaceState を使う。IME変換中やタイピング中に
  // 呼ぶたびに実行すると、ブラウザの History API レート制限（短時間の連続呼び出しで
  // SecurityError）に達しうるため、300ms のデバウンスを挟む（Codex bot 指摘）。
  // 上限超過時は同期を止めるだけでなく location.search を空にする。以前の短い入力で
  // 同期済みのパーマリンクを放置すると、その後長文を貼り付けても URL は古い短い入力の
  // ままになり、その URL をリロード・ブックマーク・手動コピーすると現在の入力ではなく
  // 古い入力が復元される（fresh evidence、Codex bot 指摘）。
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = permalinkTooLong ? location.pathname : `${location.pathname}${permalinkQuery ? `?${permalinkQuery}` : ""}`;
      try {
        history.replaceState(null, "", next);
      } catch (error) {
        console.error("URLの同期に失敗しました", error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [permalinkQuery, permalinkTooLong]);

  // 短冊は紙の短冊自体が縦長なので、常に縦書きとして扱う（UI 上もチェックボックスを無効化する）。
  // ストレスは内部でジグザグ蓄積ラインを組む都合上、縦書きオプションの影響を受けない
  // （render.ts のコメント参照）ため、同様にチェックボックスを無効化する。無効化しないと
  // チェックを切り替えても見た目が変わらないのに permalink には vertical=1 が残る
  // という不整合が起きる（Codex bot 指摘）。
  const effectiveVertical = shape === "tanzaku" ? true : vertical;
  const verticalDisabled = shape === "tanzaku" || shape === "stress";
  const verticalDisabledHint =
    shape === "tanzaku" ? "（短冊は常に縦書き）" : shape === "stress" ? "（ストレスには影響しません）" : "";

  // 純粋関数なので useMemo だけで生成ボタン無しのリアルタイムプレビューが成立する。
  const output = useMemo(
    () => renderSuddenDeath(text, { shape, vertical: effectiveVertical, padding }),
    [text, shape, effectiveVertical, padding],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">＞　突然の死　＜</h1>
          <p className="app-subtitle">入力すると即プレビュー。生成ボタンは不要です。</p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
        </button>
      </header>

      <div className="card">
        <Editor
          text={text}
          vertical={effectiveVertical}
          padding={padding}
          verticalDisabled={verticalDisabled}
          verticalDisabledHint={verticalDisabledHint}
          onTextChange={setText}
          onVerticalChange={setVertical}
          onPaddingChange={setPadding}
        />

        <div>
          <span className="field-label">スタイル選択</span>
          <ShapePicker value={shape} onChange={setShape} />
        </div>

        <Preview output={output} />

        <ShareBar
          output={output}
          copyStatus={copyStatus}
          onCopy={() => copy(output)}
          linkCopyStatus={linkCopyStatus}
          onCopyLink={() => copyLink(permalinkHref)}
          linkCopyDisabled={permalinkTooLong}
        />

        {copyStatus !== "idle" && (
          <Toast
            status={copyStatus}
            message={copyStatus === "success" ? "コピーしました" : "コピーに失敗しました"}
          />
        )}
        {copyStatus === "idle" && linkCopyStatus !== "idle" && (
          <Toast
            status={linkCopyStatus}
            message={linkCopyStatus === "success" ? "リンクをコピーしました" : "リンクのコピーに失敗しました"}
          />
        )}
      </div>

      <footer className="app-footer">
        <p>
          Preact + Farm + TypeScript で構築。参考:{" "}
          <a href="https://www.osstech.co.jp/cgi-bin/echo-sd" target="_blank" rel="noreferrer">
            echo-sd
          </a>{" "}
          /{" "}
          <a href="https://totuzennosi.sacnoha.com/" target="_blank" rel="noreferrer">
            突然の死ジェネレーター
          </a>
        </p>
      </footer>
    </div>
  );
}
