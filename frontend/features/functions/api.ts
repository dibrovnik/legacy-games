export async function fetchApi<T = any>(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: BodyInit | null;
  } = {},
  token?: string,
): Promise<T | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const { method = 'GET', body = null, headers: customHeaders = {} } = options;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData && !customHeaders['Content-Type']
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...customHeaders,
    'Cache-Control': 'no-cache',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    ...(body !== undefined ? { body } : {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, config);

  if (!response.ok) {
    // Можно прочесть тело ошибки для логов:
    let errText: string;
    try {
      errText = await response.text();
    } catch {
      errText = response.statusText;
    }
    throw new Error(`Ошибка запроса ${response.status}: ${errText}`);
  }

  // Пытаемся прочитать ответ как текст
  const text = await response.text();

  // Если тело пустое — возвращаем null
  if (!text) {
    return null;
  }

  // Иначе парсим JSON
  return JSON.parse(text) as T;
}
