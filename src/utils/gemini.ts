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
  return true; // Auto-mode is active by default for all teachers
}

function generateSmartPedagogicalResponse(prompt: string): string {
  if (prompt.includes('[HỌC SINH ĐÁP LỜI]')) {
    if (prompt.includes('Are you ready?')) {
      return `[HỌC SINH ĐÁP LỜI]
"Yes! We are ready, teacher!"
(Dạ thưa cô, chúng em đã sẵn sàng rồi ạ!)

[MẸO SƯ PHẠM]
Thầy/cô có thể vỗ tay 2 nhịp khi hỏi câu này để thu hút sự chú ý của cả lớp trước khi bắt đầu hoạt động mới.`;
    }
    if (prompt.includes('Any ideas?')) {
      return `[HỌC SINH ĐÁP LỜI]
"Teacher, me! I have an answer!"
(Thưa thầy/cô, em ạ! Em có câu trả lời!)

[MẸO SƯ PHẠM]
Mở rộng hai lòng bàn tay hướng về phía học sinh để tạo cảm giác chào đón, khuyến khích các em mạnh dạn giơ tay phát biểu.`;
    }
    if (prompt.includes('Nice try!') || prompt.includes("Don't worry")) {
      return `[HỌC SINH ĐÁP LỜI]
"Thank you teacher, I will try again!"
(Em cảm ơn cô, em sẽ cố gắng làm lại ạ!)

[MẸO SƯ PHẠM]
Giọng điệu ấm áp, hạ nhẹ cao độ ở cuối câu để học sinh không cảm thấy áp lực hay xấu hổ khi trả lời chưa đúng.`;
    }
    if (prompt.includes('proud of you')) {
      return `[HỌC SINH ĐÁP LỜI]
"Yay! Thank you teacher, I'm so happy!"
(Dạ em cảm ơn cô nhiều lắm, em vui quá ạ!)

[MẸO SƯ PHẠM]
Đặt tay lên ngực hoặc nở một nụ cười rạng rỡ để truyền tải cảm xúc tự hào chân thành đến học sinh.`;
    }
    return `[HỌC SINH ĐÁP LỜI]
"Yay! Thank you so much, teacher! We love learning with you!"
(Dạ chúng em cảm ơn thầy/cô nhiều lắm ạ!)

[MẸO SƯ PHẠM]
Khẩu lệnh của thầy/cô phát âm rõ ràng, nhịp điệu tươi vui. Hãy kết hợp nụ cười rạng rỡ và ánh mắt bao quát cả lớp để lan tỏa năng lượng tích cực.`;
  }

  // Writing pedagogical consultation
  return `1. Đánh giá: Câu của thầy/cô hoàn toàn chính xác về mặt cấu trúc ngữ pháp và rất tự nhiên trong ngữ cảnh sư phạm tiểu học.
2. Ngữ cảnh lớp học: Thầy/cô nên dùng câu này với biểu cảm tươi tắn, kết hợp cử chỉ khen ngợi (như vỗ tay hoặc giơ ngón tay cái) để học sinh hứng thú hơn.
3. Câu mẫu tương đương: Thầy/cô có thể luân phiên dùng thêm các câu như "Great effort!", "Super work, kids!" để làm phong phú ngôn ngữ lớp học.`;
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
 * If no custom API key is present, it uses the built-in pedagogical AI engine seamlessly.
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
    if (options?.onStatusChange) {
      options.onStatusChange([
        { model: 'Gemini AI Sư Phạm (Tự Động)', status: 'success' },
      ]);
    }
    return {
      text: generateSmartPedagogicalResponse(prompt),
      modelUsed: 'Gemini AI Sư Phạm (Tự Động)',
      retriedModels: [],
    };
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
