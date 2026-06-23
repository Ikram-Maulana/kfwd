export type ResourceType = "service" | "pod" | "deployment";

export interface Forward {
  localPort: number;
  name: string;
  remotePort: number;
  type: ResourceType;
}

export interface Config {
  forwards: Forward[];
  kubeContext?: string;
  namespace: string;
}

export interface RunState {
  cmdline: string[];
  pid: number;
  startedAt: number;
}

export type StatusKind = "running" | "stopped";

const NAME_RE = /^[a-z0-9-]+$/;
const PORTS_RE = /^(\d+):(\d+)$/;
export const VALID_TYPES: ReadonlySet<ResourceType> = new Set([
  "service",
  "pod",
  "deployment",
]);

export function parsePorts(input: string): {
  localPort: number;
  remotePort: number;
} {
  const m = PORTS_RE.exec(input.trim());
  if (!m) {
    throw new Error(`invalid port format: "${input}" (expected "l:r")`);
  }
  const localPort = Number(m[1]);
  const remotePort = Number(m[2]);
  if (localPort < 1 || localPort > 65_535) {
    throw new Error(`local port out of range: ${localPort}`);
  }
  if (remotePort < 1 || remotePort > 65_535) {
    throw new Error(`remote port out of range: ${remotePort}`);
  }
  return { localPort, remotePort };
}

export function validateForward(f: Forward, existing: Forward[]): Forward {
  if (!NAME_RE.test(f.name)) {
    throw new Error(`invalid name "${f.name}" (use [a-z0-9-]+)`);
  }
  if (!VALID_TYPES.has(f.type)) {
    throw new Error(`invalid type "${f.type}" (use service|pod|deployment)`);
  }
  if (
    !Number.isInteger(f.localPort) ||
    f.localPort < 1 ||
    f.localPort > 65_535
  ) {
    throw new Error(`invalid localPort: ${f.localPort}`);
  }
  if (
    !Number.isInteger(f.remotePort) ||
    f.remotePort < 1 ||
    f.remotePort > 65_535
  ) {
    throw new Error(`invalid remotePort: ${f.remotePort}`);
  }
  if (existing.some((e) => e.name === f.name)) {
    throw new Error(`name "${f.name}" already exists`);
  }
  const owner = existing.find((e) => e.localPort === f.localPort);
  if (owner) {
    throw new Error(`localPort ${f.localPort} already used by "${owner.name}"`);
  }
  return f;
}

export function validateConfig(c: Config): Config {
  if (!c.namespace || typeof c.namespace !== "string") {
    throw new Error("namespace is required");
  }
  if (!Array.isArray(c.forwards)) {
    throw new Error("forwards must be an array");
  }
  const acc: Forward[] = [];
  for (const f of c.forwards) {
    validateForward(f, acc);
    acc.push(f);
  }
  return c;
}
