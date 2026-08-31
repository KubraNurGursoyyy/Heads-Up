import type { FeedItem, Watch } from '../../types';

export type DemoState = {
  version: 1;
  watches: Watch[];
  feed: FeedItem[];
};
