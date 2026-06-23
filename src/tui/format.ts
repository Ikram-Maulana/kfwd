import type { Forward } from "@/types";

export const forwardLabel = (f: Forward): string =>
  `${f.name}  ${f.type}/${f.name}  ${f.localPort}→${f.remotePort}`;
