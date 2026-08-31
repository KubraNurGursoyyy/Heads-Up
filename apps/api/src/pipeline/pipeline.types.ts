export type ProcessWatchOptions = {
  historical?: boolean;
};

export type ProcessWatchResult =
  | { skipped: true }
  | {
      discovered: number;
      attached: number;
      pushed: number;
      historical: boolean;
    };
