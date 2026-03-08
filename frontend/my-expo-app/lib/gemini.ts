const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash'; // use when 2.5-flash hits free-tier quota
const MAX_IMAGE_BASE64_BYTES = 5 * 1024 * 1024; // ~5MB

function formatQuotaError(status: number, body: string): string {
    if (status !== 429) return body || `Gemini API error: ${status}`;
    try {
        const json = JSON.parse(body);
        const msg = json?.error?.message ?? json?.message ?? body;
        if (typeof msg === 'string' && msg.includes('quota')) {
            return 'Daily free limit reached (20 requests per model). Resets at midnight PT. Try again later or add billing at Google AI Studio.';
        }
        return msg;
    } catch {
        return 'Daily free limit reached. Try again later.';
    }
}

export function normalizeApiKey(raw: string | undefined): string {
    if (raw == null || raw === '') return '';
    return String(raw).replace(/^["']|["']$/g, '').trim();
}

export async function requestGeminiSuggestion(
    title: string,
    description: string,
    apiKey: string
): Promise<string> {
    if (!apiKey) throw new Error('Gemini API key is not set.');
    const systemInstruction = {
        parts: [{ text: 'You are a verification coach. Given a habit title and description, suggest one specific photo the user should upload as proof that the task was completed. For example: Coding → photo of the GitHub commit history showing todays commits with timestamps. Studying → photo of notes or textbook pages with todays date written on the page. Gym → photo of a workout summary screen from a fitness app showing duration. The photo should be simple to take and clearly show evidence of the task . Reply in 2-3 short sentences describing the exact photo to take, with no preamble or extra explanation.' }],
    };
    const contents = [
        {
            role: 'user',
            parts: [{ text: `Title: ${title}\nDescription: ${description}` }],
        },
    ];
    const body = {
        systemInstruction,
        contents,
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
    };
    let lastErr = '';
    for (const model of [MODEL, FALLBACK_MODEL]) {
        const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const errText = await res.text();
        if (res.ok) {
            const data = JSON.parse(errText);
            const candidate = data?.candidates?.[0];
            const parts = candidate?.content?.parts;
            let fullText = '';
            if (Array.isArray(parts)) {
                for (const part of parts) {
                    if (part?.text != null) fullText += String(part.text);
                }
            }
            const trimmed = fullText.trim();
            if (trimmed) return trimmed;
            throw new Error('No suggestion from Gemini');
        }
        lastErr = formatQuotaError(res.status, errText);
        if (res.status !== 429) break;
    }
    throw new Error(lastErr);
}

export async function verifyPhotoWithGemini(
    imageBase64: string,
    mimeType: string,
    taskText: string,
    apiKey: string
): Promise<string> {
    if (!apiKey) throw new Error('Gemini API key is not set.');
    const sizeBytes = (imageBase64.length * 3) / 4;
    if (sizeBytes > MAX_IMAGE_BASE64_BYTES) {
        throw new Error('Image is too large. Please use a smaller or more compressed photo.');
    }
    const url = `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const systemInstruction = {
        parts: [{
            text: 'You are a photo verification assistant. The user will send a photo to verify they completed a task. If the image is clearly relevant to the task (e.g. shows the activity or proof described), reply with only the word "true". Otherwise reply with only the word "false". No other text.',
        }],
    };
    const contents = [
        {
            role: 'user',
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType || 'image/jpeg',
                        data: imageBase64,
                    },
                },
                {
                    text: `Task to verify: "${taskText}". Is this image relevant proof? Reply only "true" or "false".`,
                },
            ],
        },
    ];
    const body = {
        systemInstruction,
        contents,
        generationConfig: {
            maxOutputTokens: 128,
            temperature: 0.2,
        },
        // Relax safety so verification isn't blocked for benign photos
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH' },
        ],
    };
    let lastErr = '';
    for (const model of [MODEL, FALLBACK_MODEL]) {
        const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const errText = await res.text();
        if (!res.ok) {
            lastErr = formatQuotaError(res.status, errText);
            if (res.status !== 429) break;
            continue;
        }
        const data = JSON.parse(errText);
        const candidate = data?.candidates?.[0];
        const blockReason = data?.promptFeedback?.blockReason ?? candidate?.finishReason;
        if (blockReason && blockReason !== 'STOP') {
            throw new Error(`Gemini could not process the image (${blockReason}). Try a different photo.`);
        }
        const parts = candidate?.content?.parts;
        let text: string | null = null;
        if (Array.isArray(parts)) {
            for (const part of parts) {
                if (part?.text != null && String(part.text).trim() !== '') {
                    text = String(part.text).trim();
                    break;
                }
            }
        }
        if (text == null) {
            const hint = candidate ? ` finishReason: ${candidate.finishReason ?? 'unknown'}` : ' (no candidates)';
            throw new Error(`No verification result from Gemini.${hint} Try another photo.`);
        }
        return text.toLowerCase();
    }
    throw new Error(lastErr || 'Gemini verification failed.');
}
