let globalPageName = 'Unknown';

export function setClientPage(page: string) {
  globalPageName = page;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions {
  baseURL: string;
  getToken?: () => string | null | undefined;
  onUnauthorized?: () => void;
}

export interface RequestOptions extends RequestInit {
  tokenOverride?: string | null;
  signal?: AbortSignal;
}

export function createApiClient(opts: ApiClientOptions) {
  const base = opts.baseURL.replace(/\/+$/, '');

  async function request<T>(method: HttpMethod, url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const fullUrl = `${base}${url}`;
    const headers: Record<string, string> = {
      'X-Client-Page': globalPageName,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    };

    const token = options.tokenOverride ?? opts.getToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const started = performance.now();
    console.log(`[API] ${method} ${fullUrl} (page=${globalPageName}) -> start`);
    let res: Response;
    try {
      res = await fetch(fullUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: options.signal,
        ...options,
      });
    } catch (e: unknown) {
      const dur = Math.round(performance.now() - started);
      const msg = messageFromUnknown(e);
      console.error(`[API] ${method} ${fullUrl} (page=${globalPageName}) -> network error after ${dur}ms`, msg);
      throw normalizeError(e);
    }

    const duration = Math.round(performance.now() - started);
    const status = res.status;
    if (!res.ok) {
      if (status === 401 && opts.onUnauthorized) {
        try { opts.onUnauthorized(); } catch (_e) { void _e; }
      }
      const text = await res.text();
      console.error(`[API] ${method} ${fullUrl} (page=${globalPageName}) -> fail ${status} in ${duration}ms: ${text}`);
      throw normalizeHttpError(status, text);
    }
    console.log(`[API] ${method} ${fullUrl} (page=${globalPageName}) -> ok ${status} in ${duration}ms`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json() as Promise<T>;
    }
    return (await res.text()) as unknown as T;
  }

  return {
    get: <T>(url: string, options?: RequestOptions) => request<T>('GET', url, undefined, options),
    post: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>('POST', url, body, options),
    put:  <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', url, body, options),
    patch:<T>(url: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', url, body, options),
    delete:<T>(url: string, options?: RequestOptions) => request<T>('DELETE', url, undefined, options),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

type ApiError = Error & { code?: number; status?: number };

function normalizeHttpError(status: number, message: string): ApiError {
  const code = status;
  let msg = message || `HTTP ${status}`;
  if (status === 401) msg = '登录过期，请重新登录';
  else if (status === 403) msg = '无权限访问该资源';
  else if (status === 404) msg = '资源不存在';
  else if (status >= 500) msg = '服务异常，请稍后重试';
  const error = new Error(msg) as ApiError;
  error.code = code;
  error.status = status;
  return error;
}

function normalizeError(e: unknown): ApiError {
  const error = new Error(messageFromUnknown(e) || '网络错误，请检查连接') as ApiError;
  error.code = 0;
  return error;
}

function messageFromUnknown(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return String(e);
  } catch {
    return 'Unknown error';
  }
}
