import { ConflictException, Injectable } from '@nestjs/common';
import { requiredTermsKey } from '../common/required-terms';
import { sameTextInsensitive } from '../common/text-normalization';
import { WatchesRepository } from './watches.repository';

@Injectable()
export class WatchUniquenessService {
  constructor(private readonly repository: WatchesRepository) {}

  async assertUnique(userId: string, prompt: string, requiredTerms: string[], excludeId?: string) {
    const existing = await this.repository.matchKeys(userId, excludeId);
    const duplicate = existing.some(
      watch =>
        sameTextInsensitive(watch.prompt, prompt) &&
        requiredTermsKey(watch.requiredTerms) === requiredTermsKey(requiredTerms),
    );

    if (duplicate) {
      throw new ConflictException('Bu takip ve kesin kelime seçimi zaten mevcut.');
    }
  }
}
