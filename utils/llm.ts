import * as SecureStore from 'expo-secure-store';
import { addLlmLog } from '../db/queries';

const GEMINI_KEY_STORAGE_KEY = 'settings.gemini_api_key';
const GEMINI_API_BASES = [
  'https://generativelanguage.googleapis.com/v1',
  'https://generativelanguage.googleapis.com/v1beta',
];
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

export type GeminiConnectionResult = {
  ok: boolean;
  message: string;
};

export type OrganizedNote = {
  title: string;
  summary: string;
  flashcards: Array<{ front: string; back: string }>;
};

const normalize = (value: string): string => value.trim();

function sanitizeText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = normalize(value);
  return cleaned || fallback;
}

function normalizeFlashcards(value: unknown): Array<{ front: string; back: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const front = sanitizeText((item as { front?: unknown }).front, '');
      const back = sanitizeText((item as { back?: unknown }).back, '');
      if (!front || !back) {
        return null;
      }
      return { front, back };
    })
    .filter((card): card is { front: string; back: string } => Boolean(card));

  return cleaned;
}

function extractJsonObject(rawText: string): string {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return rawText;
  }
  return rawText.slice(start, end + 1);
}

type GeminiRequestResult = {
  response: Response;
  model: string;
};

async function runGeminiRequest(apiKey: string, payload: unknown): Promise<GeminiRequestResult> {
  let lastError: Error | null = null;

  for (const baseUrl of GEMINI_API_BASES) {
    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.status === 404) {
          continue;
        }

        return { response, model };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error('Gemini request failed: no compatible model endpoint found.');
}

function mapApiError(status: number, fallbackMessage: string): Error {
  if (status === 401 || status === 403) {
    return new Error('Invalid API key.');
  }
  if (status === 429) {
    return new Error('Gemini rate limit reached. Please try again later.');
  }
  if (status >= 500) {
    return new Error('Gemini service is temporarily unavailable.');
  }
  return new Error(fallbackMessage);
}

export async function getGeminiApiKey(): Promise<string | null> {
  const value = await SecureStore.getItemAsync(GEMINI_KEY_STORAGE_KEY);
  const key = value ? normalize(value) : '';
  return key || null;
}

export async function saveGeminiApiKey(key: string): Promise<void> {
  const normalized = normalize(key);
  if (!normalized) {
    throw new Error('API key cannot be empty.');
  }
  await SecureStore.setItemAsync(GEMINI_KEY_STORAGE_KEY, normalized);
}

export async function clearGeminiApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(GEMINI_KEY_STORAGE_KEY);
}

export async function testGeminiConnection(inputKey?: string): Promise<GeminiConnectionResult> {
  const apiKey = normalize(inputKey ?? '') || (await getGeminiApiKey());
  if (!apiKey) {
    return { ok: false, message: 'No API key saved.' };
  }

  try {
    const response = await fetch(`${GEMINI_API_BASES[0]}/models?key=${encodeURIComponent(apiKey)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const body = await response.text();
      const fallbackMessage = body || 'Could not verify Gemini API key.';
      const mapped = mapApiError(response.status, fallbackMessage);
      return { ok: false, message: mapped.message };
    }

    return { ok: true, message: 'Gemini connection looks good.' };
  } catch {
    return { ok: false, message: 'Network error while testing Gemini connection.' };
  }
}

export async function organizeNoteWithGemini(inputText: string): Promise<OrganizedNote> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API key configured.');
  }

  const normalizedInput = normalize(inputText);
  if (!normalizedInput) {
    throw new Error('Input text is empty.');
  }

  const prompt = [
    'You are an assistant that turns study notes into structured output.',
    'Return valid JSON only. Do not wrap in markdown.',
    'Schema:',
    '{',
    '  "title": "string",',
    '  "summary": "string",',
    '  "flashcards": [',
    '    { "front": "string", "back": "string" }',
    '  ]',
    '}',
    'Requirements:',
    '- Keep title concise.',
    '- Keep summary to 1-3 sentences.',
    '- Generate 3 to 8 high-quality flashcards.',
    '- Avoid duplicate flashcards.',
    '',
    'Input note:',
    normalizedInput,
  ].join('\n');

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  let usedModel: string | null = null;

  try {
    const { response, model } = await runGeminiRequest(apiKey, payload);
    usedModel = model;

    if (!response.ok) {
      const body = await response.text();
      throw mapApiError(response.status, body || 'Gemini did not return a successful response.');
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Gemini returned an empty response.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonObject(rawText));
    } catch {
      throw new Error('Gemini returned invalid JSON.');
    }

    const title = sanitizeText((parsed as { title?: unknown }).title, 'Untitled note');
    const summary = sanitizeText((parsed as { summary?: unknown }).summary, '');
    const flashcards = normalizeFlashcards((parsed as { flashcards?: unknown }).flashcards);

    if (!summary && flashcards.length === 0) {
      throw new Error('Gemini response was missing summary and flashcards.');
    }

    try {
      addLlmLog({
        provider: 'gemini',
        model: usedModel,
        operation: 'organize_note',
        status: 'success',
        inputChars: normalizedInput.length,
        outputChars: rawText.length,
      });
    } catch {}

    return {
      title,
      summary: summary || 'Summary unavailable.',
      flashcards,
    };
  } catch (error) {
    try {
      addLlmLog({
        provider: 'gemini',
        model: usedModel,
        operation: 'organize_note',
        status: 'error',
        inputChars: normalizedInput.length,
        outputChars: 0,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } catch {}

    throw error;
  }
}
