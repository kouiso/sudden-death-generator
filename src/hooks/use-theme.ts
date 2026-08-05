import { useCallback, useEffect, useState } from "preact/hooks";

type Theme = "light" | "dark";

const STORAGE_KEY = "sudden-death-theme";

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // プライベートブラウジング等で localStorage が使えない環境向けのフォールバック。
    return null;
  }
}

function systemPrefersDark(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

/** ダーク/ライトの手動切り替え。未指定なら OS の prefers-color-scheme に追従する。 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? (systemPrefersDark() ? "dark" : "light"));
  // 「未指定なら OS に追従」を保つため、ユーザーが一度も手動切り替えしていない間は
  // localStorage に書かない。無条件に書くと OS 由来の初期値が「明示的な選択」として
  // 永続化されてしまい、次回訪問時に OS のテーマ変更を無視するようになる不具合があった
  // （実装コードレビューで発見、Codex bot 指摘）。
  const [hasManualPreference, setHasManualPreference] = useState(() => readStoredTheme() !== null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!hasManualPreference) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // 保存できなくても表示自体は継続できるので無視する。
    }
  }, [theme, hasManualPreference]);

  // 手動選択が無い間は、セッション中の OS テーマ変更（時間帯によるダークモード自動切替等）にも追従する。
  useEffect(() => {
    if (hasManualPreference || typeof matchMedia !== "function") return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [hasManualPreference]);

  const toggle = useCallback(() => {
    setHasManualPreference(true);
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return [theme, toggle];
}
