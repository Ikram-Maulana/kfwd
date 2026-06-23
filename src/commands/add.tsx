import { ConfigStore } from "@/config";
import { AddForm } from "@/tui/add-form";
import {
  parsePorts,
  type ResourceType,
  VALID_TYPES,
  validateForward,
} from "@/types";

export interface AddInput {
  context?: string;
  interactive?: boolean;
  name?: string;
  namespace?: string;
  ports?: string;
  type?: string;
}

export interface AddDeps {
  cfg: ConfigStore;
  collectForm?: () => Promise<{
    name: string;
    type: ResourceType;
    localPort: number;
    remotePort: number;
  } | null>;
  stdout?: (s: string) => void;
}

async function defaultCollectForm(): Promise<{
  name: string;
  type: ResourceType;
  localPort: number;
  remotePort: number;
} | null> {
  const { render } = await import("ink");
  return new Promise((resolve) => {
    const { unmount } = render(
      <AddForm
        onSubmit={(v) => {
          unmount();
          resolve(v);
        }}
      />
    );
  });
}

export async function add(
  input: AddInput,
  deps: Partial<AddDeps> = {}
): Promise<void> {
  const { pathsFromEnv } = await import("../paths.js");
  const p = pathsFromEnv();
  const cfg = deps.cfg ?? new ConfigStore(p.configFile);
  const out = deps.stdout ?? ((s) => console.log(s));
  const collect = deps.collectForm ?? defaultCollectForm;

  let resolved: {
    name: string;
    type: ResourceType;
    localPort: number;
    remotePort: number;
  };
  if (!(input.name && input.ports) || input.interactive) {
    const v = await collect();
    if (!v) {
      out("kfwd: add cancelled");
      return;
    }
    resolved = v;
  } else {
    const { localPort, remotePort } = parsePorts(input.ports);
    const raw = input.type ?? "service";
    if (!VALID_TYPES.has(raw as ResourceType)) {
      throw new Error(`invalid type "${raw}" (use service|pod|deployment)`);
    }
    resolved = {
      name: input.name,
      type: raw as ResourceType,
      localPort,
      remotePort,
    };
  }

  const c = cfg.load();
  const updated = {
    ...c,
    forwards: [...c.forwards, resolved],
    namespace: input.namespace ?? c.namespace,
    kubeContext: input.context ?? c.kubeContext,
  };
  validateForward(resolved, c.forwards);
  cfg.save(updated);
  out(
    `kfwd: saved "${resolved.name}" (${resolved.type}/${resolved.name} ${resolved.localPort}→${resolved.remotePort})`
  );
}
