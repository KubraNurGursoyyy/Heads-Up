import { Injectable } from '@nestjs/common';
import { StructuredAiClient } from './structured-ai-client';
import type { StructuredJsonSchema } from './ai.types';

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

@Injectable()
export class GeminiClientService extends StructuredAiClient {
  private unavailableUntil = 0;

  isAvailable() {
    return Boolean(process.env.GEMINI_API_KEY) && Date.now() >= this.unavailableUntil;
  }

  async generate<T>(instructions: string, input: string, schema: StructuredJsonSchema): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error('Gemini is not available');
    }

    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${instructions}\n\nGirdi:\n${input}` }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
        },
      }),
    });

    if (!response.ok) {
      const body = (await response.text()).slice(0, 500);
      if (response.status === 429) {
        this.unavailableUntil = Date.now() + 10 * 60 * 1000;
        throw new Error('Gemini rate limit reached; local fallback will be used temporarily');
      }
      throw new Error(`Gemini ${response.status}: ${body}`);
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new Error('Gemini response did not contain text');
    }

    return JSON.parse(text) as T;
  }
}
