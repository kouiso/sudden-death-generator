export interface PreviewProps {
  output: string;
}

export function Preview({ output }: PreviewProps) {
  return (
    <div>
      <span className="field-label">プレビュー</span>
      <div className="preview-panel" role="region" aria-label="生成結果">
        <div className="preview-scroll">
          <pre className="preview-pre">{output}</pre>
        </div>
      </div>
    </div>
  );
}
