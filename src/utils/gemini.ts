export interface GeminiConfig {
  apiKey: string;
  selectedModel: string;
}

export const GEMINI_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Preview)',
    tag: 'Default - Nhanh & Mượt',
    description: 'Tốc độ phản hồi cực nhanh, tối ưu cho tương tác thời gian thực và chấm phát âm/viết.',
    recommended: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    tag: 'Chính xác & Sâu sắc',
    description: 'Khả năng suy luận sư phạm chuyên sâu, giải thích chi tiết ngữ pháp và ngữ cảnh giao tiếp.',
    recommended: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Dự phòng ổn định',
    description: 'Model ổn định với hạn mức quota cao, đảm bảo hoạt động liên tục khi hai model trên quá tải.',
    recommended: false,
  },
] as const;

export const DEFAULT_MODEL = 'gemini-3-flash-preview';

export const FALLBACK_CHAIN = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

const STORAGE_KEY_API_KEY = 'gemini_api_key';
const STORAGE_KEY_MODEL = 'gemini_selected_model';

// System default API key provided via environment variable (e.g. Vercel or .env)
export const SYSTEM_DEFAULT_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return SYSTEM_DEFAULT_API_KEY;
  const userCustom = localStorage.getItem(STORAGE_KEY_API_KEY);
  if (userCustom && userCustom.trim()) {
    return userCustom.trim();
  }
  return SYSTEM_DEFAULT_API_KEY;
}

export function isUsingSystemApiKey(): boolean {
  if (typeof window === 'undefined') return Boolean(SYSTEM_DEFAULT_API_KEY);
  const userCustom = localStorage.getItem(STORAGE_KEY_API_KEY);
  return !userCustom?.trim() && Boolean(SYSTEM_DEFAULT_API_KEY);
}

export function hasConfiguredApiKey(): boolean {
  return Boolean(getStoredApiKey());
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  }
}

export function getStoredModel(): string {
  if (typeof window === 'undefined') return DEFAULT_MODEL;
  return localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL;
}

export function setStoredModel(model: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_MODEL, model);
}

export interface GenerationResult {
  text: string;
  modelUsed: string;
  retriedModels: string[];
}

export interface FallbackAttemptStatus {
  model: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

/**
 * Executes a Gemini prompt with automatic fallback across models.
 * If the current model encounters an error (e.g. 429 quota exhausted, 503 unavailable),
 * it immediately retries with the next model in the fallback chain.
 */
export async function generateWithFallback(
  prompt: string,
  options?: {
    systemInstruction?: string;
    onStatusChange?: (statuses: FallbackAttemptStatus[]) => void;
  }
): Promise<GenerationResult> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING: Chưa cấu hình Gemini API Key. Vui lòng nhấn "Thiết lập API Key" trên thanh điều hướng.');
  }

  const selectedModel = getStoredModel();
  
  // Build ordered chain: selectedModel first, followed by others in FALLBACK_CHAIN
  const chain = [selectedModel, ...FALLBACK_CHAIN.filter((m) => m !== selectedModel)];
  
  const statuses: FallbackAttemptStatus[] = chain.map((m) => ({
    model: m,
    status: 'pending',
  }));

  const retriedModels: string[] = [];
  let lastError = '';

  for (let i = 0; i < chain.length; i++) {
    const currentModel = chain[i];
    try {
      if (options?.onStatusChange) {
        options.onStatusChange([...statuses]);
      }

      const text = await callGeminiApi(currentModel, apiKey, prompt, options?.systemInstruction);

      statuses[i].status = 'success';
      if (options?.onStatusChange) {
        options.onStatusChange([...statuses]);
      }

      return {
        text,
        modelUsed: currentModel,
        retriedModels,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      lastError = errMsg;
      statuses[i].status = 'failed';
      statuses[i].error = errMsg;
      retriedModels.push(currentModel);

      if (options?.onStatusChange) {
        options.onStatusChange([...statuses]);
      }
      // Continue to next model in chain
    }
  }

  // All models failed: throw raw API error as required by AI_INSTRUCTIONS.md
  throw new Error(`Tất cả các model đều thất bại. Chi tiết lỗi từ API: ${lastError}`);
}

async function callGeminiApi(
  model: string,
  apiKey: string,
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  if (systemInstruction) {
    body.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorDetail = `Mã lỗi HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error?.message) {
        errorDetail = `${errJson.error.message} (Code: ${errJson.error.code || response.status}, Status: ${errJson.error.status || 'ERROR'})`;
      }
    } catch {
      // non-json response
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('API không trả về nội dung hợp lệ.');
  }

  return text;
}
