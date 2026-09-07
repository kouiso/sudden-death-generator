export interface EditorProps {
  text: string;
  vertical: boolean;
  padding: boolean;
  verticalDisabled: boolean;
  /** チェックボックス無効時に添える理由（短冊=常に縦書き、ストレス=縦書きの影響を受けない、等）。 */
  verticalDisabledHint: string;
  onTextChange: (text: string) => void;
  onVerticalChange: (value: boolean) => void;
  onPaddingChange: (value: boolean) => void;
}

export function Editor({
  text,
  vertical,
  padding,
  verticalDisabled,
  verticalDisabledHint,
  onTextChange,
  onVerticalChange,
  onPaddingChange,
}: EditorProps) {
  return (
    <div>
      <label className="field-label" htmlFor="sd-input">
        テキスト入力
      </label>
      <textarea
        id="sd-input"
        className="editor-textarea"
        rows={4}
        placeholder="ここにテキストを入力…（空のままなら「突然の死」を表示）"
        value={text}
        onInput={(e) => onTextChange(e.currentTarget.value)}
      />
      <div className="option-row option-row--spaced">
        <label className="checkbox-label" title="ショートカットキー: V">
          <input
            type="checkbox"
            checked={vertical}
            disabled={verticalDisabled}
            accessKey="v"
            onChange={(e) => onVerticalChange(e.currentTarget.checked)}
          />
          縦書き表示{verticalDisabled ? verticalDisabledHint : ""}
        </label>
        <label className="checkbox-label" title="ショートカットキー: P">
          <input
            type="checkbox"
            checked={padding}
            accessKey="p"
            onChange={(e) => onPaddingChange(e.currentTarget.checked)}
          />
          余白
        </label>
      </div>
    </div>
  );
}
