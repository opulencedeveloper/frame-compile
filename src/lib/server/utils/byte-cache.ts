// An in-memory cache of byte buffers that evicts the least recently used
// entries once their total size passes a limit.
export class ByteCache {
  // Map keeps insertion order; re-inserting on read makes it LRU order.
  private readonly entries = new Map<string, Buffer>();
  private totalBytes = 0;

  constructor(
    private readonly maxBytes: number,
    private readonly maxEntryBytes: number,
  ) {}

  public get(key: string): Buffer | undefined {
    const value = this.entries.get(key);
    if (value) {
      this.entries.delete(key);
      this.entries.set(key, value);
    }
    return value;
  }

  // Entries over maxEntryBytes aren't kept: one large video would otherwise
  // push out hundreds of small files.
  public set(key: string, value: Buffer) {
    if (value.length > this.maxEntryBytes) return;
    this.delete(key);
    this.entries.set(key, value);
    this.totalBytes += value.length;

    for (const [oldestKey] of this.entries) {
      if (this.totalBytes <= this.maxBytes) break;
      this.delete(oldestKey);
    }
  }

  private delete(key: string) {
    const existing = this.entries.get(key);
    if (!existing) return;
    this.entries.delete(key);
    this.totalBytes -= existing.length;
  }
}
