import type { Route } from "./+types/home";
import { useState, useCallback, useMemo } from "react";

type ShapeType = "normal" | "square" | "tanzaku" | "stress";

interface ShapeOption {
  value: ShapeType;
  label: string;
  icon: string;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { value: "normal", label: "通常", icon: "📝" },
  { value: "square", label: "四角形", icon: "⬜" },
  { value: "tanzaku", label: "短冊", icon: "🎋" },
  { value: "stress", label: "ストレス", icon: "💢" },
];

const HALF_WIDTH_START = 0x20;
const HALF_WIDTH_END = 0x7e;
const HALF_KANA_START = 0xff61;
const HALF_KANA_END = 0xff9f;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "＞　突然の死　＜ ジェネレーター" },
    { name: "description", content: "突然の死ジェネレーター" },
  ];
}

const getCharWidth = (char: string): number => {
  const code = char.charCodeAt(0);
  if (
    (code >= HALF_WIDTH_START && code <= HALF_WIDTH_END) ||
    (code >= HALF_KANA_START && code <= HALF_KANA_END)
  ) {
    return 1;
  }
  return 2;
};

const getLineWidth = (line: string): number => {
  let width = 0;
  for (const char of line) {
    width += getCharWidth(char);
  }
  return width;
};

const getMaxLineWidth = (lines: string[]): number => {
  let maxWidth = 0;
  for (const line of lines) {
    const width = getLineWidth(line);
    if (width > maxWidth) {
      maxWidth = width;
    }
  }
  return maxWidth;
};

const padLine = (line: string, targetWidth: number): string => {
  const currentWidth = getLineWidth(line);
  const spacesNeeded = targetWidth - currentWidth;
  const fullWidthSpaces = Math.max(0, Math.floor(spacesNeeded / 2));
  return line + "　".repeat(fullWidthSpaces);
};

const parseInputLines = (input: string): string[] => {
  return input.split("\n").filter((line) => line.trim().length > 0);
};

const generateNormal = (lines: string[]): string => {
  if (lines.length === 0) return "";

  const maxWidth = getMaxLineWidth(lines);
  const targetWidth = maxWidth + (maxWidth % 2);
  const borderRepeatCount = Math.ceil(maxWidth / 2) + 1;

  const top = `＿${"人".repeat(borderRepeatCount)}＿`;
  const bottom = `￣${"Y^".repeat(borderRepeatCount)}￣`;

  const middleLines = lines.map((line) => `＞　${padLine(line, targetWidth)}＜`);

  return [top, ...middleLines, bottom].join("\n");
};

const generateSquare = (lines: string[]): string => {
  if (lines.length === 0) return "";

  const maxWidth = getMaxLineWidth(lines);
  const targetWidth = maxWidth + (maxWidth % 2);
  const borderRepeatCount = Math.ceil(targetWidth / 2) + 1;

  const top = `┌${"─".repeat(borderRepeatCount)}┐`;
  const bottom = `└${"─".repeat(borderRepeatCount)}┘`;

  const middleLines = lines.map((line) => `│　${padLine(line, targetWidth)}│`);

  return [top, ...middleLines, bottom].join("\n");
};

const generateTanzaku = (lines: string[]): string => {
  if (lines.length === 0) return "";

  const reversedLines = [...lines].reverse();
  const maxWidth = getMaxLineWidth(reversedLines);
  const borderRepeatCount = Math.ceil(maxWidth / 2) + 1;

  const top = `┏${"━".repeat(borderRepeatCount - 1)}-┷-${"━".repeat(borderRepeatCount - 1)}┓`;
  const bottom = `┗${"━".repeat(borderRepeatCount * 2)}┛`;

  const result: string[] = [top];

  for (const line of reversedLines) {
    const chars = line.split("");
    const spacedChars = chars.flatMap((char, index) =>
      index < chars.length - 1 ? [char, "　"] : [char]
    );
    result.push(`┃ ${spacedChars.join("")} ┃`);
  }

  result.push(bottom);
  return result.join("\n");
};

const generateStress = (lines: string[]): string => {
  if (lines.length === 0) return "";

  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    result.push(lines[i]);
    if (i < lines.length - 1) {
      result.push("　　　　↘");
    }
  }

  const lastLine = lines[lines.length - 1];
  result.push("　　　　↘");
  result.push(`　　　${lastLine}`);
  result.push("　　　　↙");

  const suddenDeathPart = generateNormal([lastLine]);
  result.push(suddenDeathPart);

  return result.join("\n");
};

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [shape, setShape] = useState<ShapeType>("normal");
  const [vertical, setVertical] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const shouldBeVertical = useMemo(
    () => vertical || shape === "tanzaku",
    [vertical, shape]
  );

  const handleGenerate = useCallback(() => {
    const lines = parseInputLines(inputText);
    if (lines.length === 0) {
      setGeneratedText("");
      return;
    }

    let result = "";

    switch (shape) {
      case "normal":
        result = generateNormal(lines);
        break;
      case "square":
        result = generateSquare(lines);
        break;
      case "tanzaku":
        result = generateTanzaku(lines);
        break;
      case "stress":
        result = generateStress(lines);
        break;
      default:
        result = generateNormal(lines);
    }

    setGeneratedText(result);
  }, [inputText, shape]);

  const handleCopy = useCallback(async () => {
    if (!generatedText) return;

    try {
      await navigator.clipboard.writeText(generatedText);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
      alert("コピーに失敗しました");
    }
  }, [generatedText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
          <header>
            <h1 className="text-4xl font-bold text-center text-slate-800 dark:text-white font-mono">
              ＞　突然の死　＜
            </h1>
            <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-2">
              テキストを入力して、突然の死を生成しよう
            </p>
          </header>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                テキスト入力
              </span>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg font-mono text-base resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                rows={4}
                placeholder="ここにテキストを入力..."
                aria-label="テキスト入力欄"
              />
            </label>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={vertical}
                  onChange={(e) => setVertical(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="縦書き表示"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                  縦書き表示
                </span>
              </label>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                スタイル選択
              </legend>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SHAPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                      shape === option.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shape"
                      value={option.value}
                      checked={shape === option.value}
                      onChange={(e) => setShape(e.target.value as ShapeType)}
                      className="sr-only"
                      aria-label={option.label}
                    />
                    <span className="text-xl" aria-hidden="true">
                      {option.icon}
                    </span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              onClick={handleGenerate}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg font-mono text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              ＞　ジェネレート　＜
            </button>

            {generatedText && (
              <div className="space-y-4" role="region" aria-label="生成結果">
                <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-lg p-6 min-h-[200px] overflow-x-auto">
                  <pre
                    className={`font-mono text-base leading-relaxed text-slate-900 dark:text-white ${
                      shouldBeVertical ? "vertical-rl" : ""
                    }`}
                    style={
                      shouldBeVertical
                        ? { writingMode: "vertical-rl", textOrientation: "upright" }
                        : {}
                    }
                    aria-label="生成されたテキスト"
                  >
                    {generatedText}
                  </pre>
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg font-mono shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  aria-label="テキストをコピー"
                >
                  📋　コピー
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-slate-600 dark:text-slate-400 text-sm">
          <p>Made with React Router v7</p>
        </footer>
      </div>

      {showCopyToast && (
        <div
          className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">コピーしました！</span>
        </div>
      )}
    </div>
  );
}
