import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { DataStore } from "yt-cast-receiver";

const DATA_DIR = path.join(
  os.homedir(),
  ".config",
  "yt-music-caster"
);

const DATA_FILE = path.join(
  DATA_DIR,
  "receiver-data.json"
);

export class PersistentDataStore extends DataStore {
  constructor() {
    super();

    this.data = {};
  }

  async init() {
    await fs.mkdir(DATA_DIR, {
      recursive: true
    });

    try {
      const contents = await fs.readFile(
        DATA_FILE,
        "utf8"
      );

      this.data = JSON.parse(contents);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }

      this.data = {};
      await this.save();
    }
  }

  async set(key, value) {
    this.data[key] = value;

    await this.save();
  }

  async get(key) {
    return this.data[key] ?? null;
  }

  async save() {
    const tempFile = `${DATA_FILE}.tmp`;

    await fs.writeFile(
      tempFile,
      JSON.stringify(this.data, null, 2),
      "utf8"
    );

    await fs.rename(
      tempFile,
      DATA_FILE
    );
  }

  async clear() {
    this.data = {};

    await this.save();
  }
}