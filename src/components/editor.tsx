export interface EditorProps {
  text: string;
  vertical: boolean;
  padding: boolean;
  verticalDisabled: boolean;
  onTextChange: (text: string) => void;
  onVerticalChange: (value: boolean) => void;
  onPaddingChange: (value: boolean) => void;
}

export function Editor({
  text,
  vertical,
  padding,
  verticalDisabled,
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
          縦書き表示{verticalDisabled ? "（短冊は常に縦書き）" : ""}
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
