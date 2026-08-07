import { useCallback, useEffect, useRef, useState } from "preact/hooks";

export interface ClipboardState {
  status: "idle" | "success" | "error";
  copy: (text: string) => Promise<void>;
}

/** クリップボードコピーの成否を state で持つ。旧実装の alert() を廃してトースト表示に切り替える。 */
export function useClipboard(resetDelayMs = 2000): ClipboardState {
  const [status, setStatus] = useState<ClipboardState["status"]>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // copy() を連打すると古い呼び出しの writeText が後から解決し、新しい呼び出しの
  // 結果を上書きすることがある。呼び出しごとに世代番号を振り、完了時に「自分が
  // 最新の呼び出しか」を確認してから状態を更新することでこれを防ぐ。
  const versionRef = useRef(0);
  const mountedRef = useRef(true);

  const copy = useCallback(
    async (text: string) => {
      const version = ++versionRef.current;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      let nextStatus: ClipboardState["status"];
      try {
        await navigator.clipboard.writeText(text);
        nextStatus = "success";
      } catch (error) {
        // エラーを握り潰さずログに残す（旧実装の alert() は使わない）。
        console.error("クリップボードへのコピーに失敗しました", error);
        nextStatus = "error";
      }

      // アンマウント後、または自分より新しい copy() 呼び出しが既に走っていれば何もしない。
      if (!mountedRef.current || version !== versionRef.current) {
        return;
      }
      setStatus(nextStatus);
      timerRef.current = setTimeout(() => {
        if (mountedRef.current && version === versionRef.current) {
          setStatus("idle");
        }
      }, resetDelayMs);
    },
    [resetDelayMs],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { status, copy };
}
