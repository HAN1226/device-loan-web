import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseRequestResult<T, P extends unknown[] = []> {
  data: T | null;
  loading: boolean;
  error: { code?: number; message: string } | null;
  run: (...args: P) => Promise<T | null>;
  reset: () => void;
}

export function useRequest<T, P extends unknown[] = []>(
  fn: (signal: AbortSignal, ...args: P) => Promise<T>,
  initialData: T | null = null
): UseRequestResult<T, P> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code?: number; message: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(async (...args: P) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    try {
      const result = await fn(controller.signal, ...args);
      if (!mountedRef.current || controller.signal.aborted) return null;
      setData(result);
      return result;
    } catch (e: unknown) {
      if (controller.signal.aborted || !mountedRef.current) return null;
      const normalized = {
        code: extractCode(e),
        message: extractMessage(e),
      };
      setError(normalized);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fn]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return { data, loading, error, run, reset };
}

function extractMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try { return String(e); } catch { return '请求失败'; }
}

function extractCode(e: unknown): number | undefined {
  if (e && typeof e === 'object') {
    const anyObj = e as Record<string, unknown>;
    const code = anyObj['code'];
    const status = anyObj['status'];
    if (typeof code === 'number') return code;
    if (typeof status === 'number') return status;
  }
  return undefined;
}
