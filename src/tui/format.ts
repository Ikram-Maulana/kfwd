import type { Forward } from "@/types";

export const forwardLabel = (f: Forward): string => {
  const name = f.name.padEnd(25);
  const target = `${f.type}/${f.name}`.padEnd(32);
  return `${name}  ${target}  ${f.localPort} ➔ ${f.remotePort}`;
};
