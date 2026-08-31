import type { FeedItem, Watch } from '../../types';

export type DemoState = {
  version: 2;
  watches: Watch[];
  feed: FeedItem[];
};
