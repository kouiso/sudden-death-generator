import { useMemo, useState } from "preact/hooks";
import { renderSuddenDeath, type ShapeKind } from "./core";
import { Editor } from "./components/editor";
import { Preview } from "./components/preview";
import { ShapePicker } from "./components/shape-picker";
import { ShareBar } from "./components/share-bar";
import { Toast } from "./components/toast";
import { useClipboard } from "./hooks/use-clipboard";
import { useTheme } from "./hooks/use-theme";

export function App() {
  const [text, setText] = useState("");
  const [shape, setShape] = useState<ShapeKind>("normal");
  const [vertical, setVertical] = useState(false);
  const [padding, setPadding] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const { status: copyStatus, copy } = useClipboard();

  // 短冊は紙の短冊自体が縦長なので、常に縦書きとして扱う（UI 上もチェックボックスを無効化する）。
  const effectiveVertical = shape === "tanzaku" ? true : vertical;

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
          verticalDisabled={shape === "tanzaku"}
          onTextChange={setText}
          onVerticalChange={setVertical}
          onPaddingChange={setPadding}
        />

        <div>
          <span className="field-label">スタイル選択</span>
          <ShapePicker value={shape} onChange={setShape} />
        </div>

        <Preview output={output} />

        <ShareBar output={output} copyStatus={copyStatus} onCopy={() => copy(output)} />
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

      {copyStatus !== "idle" && (
        <Toast
          status={copyStatus}
          message={copyStatus === "success" ? "コピーしました" : "コピーに失敗しました"}
        />
      )}
    </div>
  );
}
