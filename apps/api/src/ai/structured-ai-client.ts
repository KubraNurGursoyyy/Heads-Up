import type { StructuredJsonSchema } from './ai.types';

export abstract class StructuredAiClient {
  abstract isAvailable(): boolean;

  abstract generate<T>(
    instructions: string,
    input: string,
    schema: StructuredJsonSchema,
  ): Promise<T>;
}
