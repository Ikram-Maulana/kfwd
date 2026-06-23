#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
  \u001b[1;36mUSAGE\u001b[0m
    $ \u001b[1mkfwd add\u001b[0m \u001b[36m[name] [l:r]\u001b[0m

  \u001b[1;36mOPTIONS\u001b[0m
    \u001b[1;33m--type\u001b[0m          Resource type: service|pod|deployment \u001b[90m(default: pod)\u001b[0m
    \u001b[1;33m--namespace\u001b[0m     Kubernetes namespace
    \u001b[1;33m--context\u001b[0m       Kubernetes context
    \u001b[1;33m--interactive\u001b[0m   Open the TUI form instead of positional args
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
    case "--help":
    case "-h":
      console.log(HELP);
      return;
    default:
      throw new Error(`unknown command: ${cmd}`);
  }
}

const HELP = `
\u001b[36m ____  __._____________      __________   
|    |/ _|\\_   _____/  \\    /  \\______ \\  
|      <   |    __) \\   \\/\\/   /|    |  \\ 
|    |  \\  |     \\   \\        / |    \`   \\
|____|__ \\ \\___  /    \\__/\\  / /_______  /
        \\/     \\/          \\/          \\/ \u001b[0m

  \u001b[1;36mUSAGE\u001b[0m
    $ \u001b[1mkfwd\u001b[0m \u001b[36m<command>\u001b[0m \u001b[90m[...]\u001b[0m

  \u001b[1;36mCOMMANDS\u001b[0m
    \u001b[1;33madd\u001b[0m \u001b[36m[name] [l:r]\u001b[0m      \u001b[90m➔\u001b[0m Save a port forward rule
    \u001b[1;33mremove\u001b[0m \u001b[36m<name>\u001b[0m        \u001b[90m➔\u001b[0m Delete a rule + kill running pid
    \u001b[1;33mstart\u001b[0m               \u001b[90m➔\u001b[0m TUI multi-select ➔ spawn detached
    \u001b[1;33mstop\u001b[0m                \u001b[90m➔\u001b[0m TUI multi-select ➔ kill
    \u001b[1;33mstatus\u001b[0m              \u001b[90m➔\u001b[0m Table of all rules + run state
`;

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  const [, , cmd, ...rest] = process.argv;
  await dispatch([cmd ?? "", ...rest], {
    add,
    remove,
    start,
    status,
    stop,
  });
}
