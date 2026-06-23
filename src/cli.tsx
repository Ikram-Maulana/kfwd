#!/usr/bin/env node
import meow from "meow";
import { type AddInput, add } from "./commands/add.js";
import { remove } from "./commands/remove.js";
import { start } from "./commands/start.js";
import { status } from "./commands/status.js";
import { stop } from "./commands/stop.js";

export interface Handlers {
  add: (input: AddInput) => Promise<void> | void;
  remove: (name: string) => Promise<void> | void;
  start: () => Promise<void> | void;
  status: () => Promise<void> | void;
  stop: () => Promise<void> | void;
}

export async function dispatch(argv: string[], h: Handlers): Promise<void> {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "add": {
      const cli = meow(
        `
  Usage
    $ kfwd add [name] [l:r]

  Options
    --type          Resource type: service|pod|deployment (default: service)
    --namespace     Kubernetes namespace
    --context       Kubernetes context
    --interactive   Open the TUI form instead of positional args
`,
        {
          importMeta: import.meta,
          flags: {
            context: { type: "string" },
            interactive: { type: "boolean" },
            namespace: { type: "string" },
            type: { type: "string" },
          },
        }
      );
      await h.add({
        name: rest[0],
        ports: rest[1],
        type: cli.flags.type,
        namespace: cli.flags.namespace,
        context: cli.flags.context,
        interactive: cli.flags.interactive,
      });
      return;
    }
    case "remove":
      await h.remove(String(rest[0] ?? ""));
      return;
    case "start":
      await h.start();
      return;
    case "stop":
      await h.stop();
      return;
    case "status":
      await h.status();
      return;
    case "":
    case undefined:
    case "help":
      console.log(HELP);
      return;
    default:
      throw new Error(`unknown command: ${cmd}`);
  }
}

const HELP = `
  Usage
    $ kfwd <command> [...]

  Commands
    add [name] [l:r]    Save a forward rule
    remove <name>       Delete a rule + kill running pid
    start               TUI multi-select → spawn detached
    stop                TUI multi-select → kill
    status              Table of all rules + run state
`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , cmd, ...rest] = process.argv;
  await dispatch([cmd ?? "", ...rest], {
    add,
    remove,
    start,
    status,
    stop,
  });
}
