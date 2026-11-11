import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ISnapshotSink } from "./interface";

// Writes a captured site to a local folder, laid out as a static site.
export class DirectorySnapshotSink implements ISnapshotSink {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  public async write(relativePath: string, body: Uint8Array): Promise<void> {
    const target = path.resolve(this.root, relativePath);
    // Paths come from crawled URLs: never write outside the folder.
    if (!target.startsWith(this.root + path.sep)) {
      throw new Error(`Refused to write outside the snapshot folder: ${relativePath}`);
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
  }
}
