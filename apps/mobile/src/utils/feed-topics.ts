export type FeedWatchOption = {
  id: string;
  topic: string;
  category: string;
  requiredTerms?: string[] | null;
};

function sameText(a: string, b: string) {
  return a.toLocaleLowerCase('tr-TR') === b.toLocaleLowerCase('tr-TR');
}

export function buildFeedTopicOptions(
  watches: FeedWatchOption[],
  category: string | null,
): FeedWatchOption[] {
  return watches
    .filter(watch => !category || sameText(watch.category, category))
    .slice()
    .sort((a, b) => {
      const topicOrder = a.topic.localeCompare(b.topic, 'tr', { sensitivity: 'base' });
      return topicOrder || a.id.localeCompare(b.id);
    });
}
