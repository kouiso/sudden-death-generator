import { useCallback, useEffect, useRef, useState } from "preact/hooks";

export interface ClipboardState {
  status: "idle" | "success" | "error";
  copy: (text: string) => Promise<void>;
}

/** クリップボードコピーの成否を state で持つ。旧実装の alert() を廃してトースト表示に切り替える。 */
export function useClipboard(resetDelayMs = 2000): ClipboardState {
  const [status, setStatus] = useState<ClipboardState["status"]>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      try {
        await navigator.clipboard.writeText(text);
        setStatus("success");
      } catch (error) {
        // エラーを握り潰さずログに残す（旧実装の alert() は使わない）。
        console.error("クリップボードへのコピーに失敗しました", error);
        setStatus("error");
      }
      timerRef.current = setTimeout(() => setStatus("idle"), resetDelayMs);
    },
    [resetDelayMs],
  );

  // アンマウント後に setStatus が呼ばれるのを防ぐ。
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { status, copy };
}
