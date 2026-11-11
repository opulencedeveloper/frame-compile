// Runs async tasks at most `concurrency` at a time, in the order they were
// added. Each run() resolves when its own task has finished.
export class TaskQueue {
  private active = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly concurrency: number) {}

  public async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.concurrency) {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    this.active += 1;
    try {
      return await task();
    } finally {
      this.active -= 1;
      this.waiting.shift()?.();
    }
  }
}
