import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import type { Config, Forward } from "@/types";
import { validateConfig, validateForward } from "@/types";

const EMPTY_CONFIG: Config = {
  namespace: "default",
  kubeContext: undefined,
  forwards: [],
};

export class ConfigStore {
  readonly path: string;
  constructor(path: string) {
    this.path = path;
  }

  load(): Config {
    if (!existsSync(this.path)) {
      return { ...EMPTY_CONFIG, forwards: [] };
    }
    let raw: string;
    try {
      raw = readFileSync(this.path, "utf8");
    } catch (e) {
      throw new Error(
        `failed to read config at ${this.path}: ${(e as Error).message}`
      );
    }
    try {
      return validateConfig(JSON.parse(raw));
    } catch {
      const ts = Date.now();
      const bak = `${this.path}.bak.${ts}`;
      renameSync(this.path, bak);
      console.warn(
        `kfwd: config at ${this.path} was corrupt; backed up to ${bak} and starting fresh`
      );
      return { ...EMPTY_CONFIG, forwards: [] };
    }
  }

  save(c: Config): void {
    validateConfig(c);
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, `${JSON.stringify(c, null, 2)}\n`, "utf8");
  }

  add(f: Forward): void {
    const c = this.load();
    validateForward(f, c.forwards);
    this.save({ ...c, forwards: [...c.forwards, f] });
  }

  removeByName(name: string): Forward | null {
    const c = this.load();
    const idx = c.forwards.findIndex((f) => f.name === name);
    if (idx === -1) {
      return null;
    }
    const target = c.forwards[idx] as Forward;
    c.forwards.splice(idx, 1);
    this.save(c);
    return target;
  }
}
