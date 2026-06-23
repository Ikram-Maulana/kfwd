import { Box, Text, useInput } from "ink";
import { useState } from "react";

export interface MultiSelectProps<T> {
  items: T[];
  labelOf: (item: T) => string;
  onSubmit: (selected: T[]) => void;
  runningOf: (item: T) => boolean;
}

export function MultiSelect<T>({
  items,
  labelOf,
  runningOf,
  onSubmit,
}: MultiSelectProps<T>) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set<number>()
  );

  useInput((input, key) => {
    if (key.return) {
      onSubmit(items.filter((it, i) => !runningOf(it) && selected.has(i)));
      return;
    }
    if (input === " ") {
      setSelected((prev) => {
        const next = new Set(prev);
        const idx = items.findIndex((it, i) => !(runningOf(it) || next.has(i)));
        if (idx !== -1) {
          next.add(idx);
          return next;
        }
        for (let i = 0; i < items.length; i++) {
          if (!runningOf(items[i] as T)) {
            next.delete(i);
            break;
          }
        }
        return next;
      });
      return;
    }
    if (input === "a") {
      setSelected((prev) => {
        const allSelected = items.every(
          (it, i) => runningOf(it) || prev.has(i)
        );
        if (allSelected) {
          return new Set<number>();
        }
        return new Set<number>(
          items.reduce<number[]>((acc, it, i) => {
            if (!runningOf(it)) {
              acc.push(i);
            }
            return acc;
          }, [])
        );
      });
      return;
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((it, i) => {
        const running = runningOf(it);
        const checked = running || selected.has(i);
        return (
          <Text key={labelOf(it)}>
            {checked ? "●" : "○"} {labelOf(it)}
            {running ? "  ·running·" : ""}
          </Text>
        );
      })}
      <Text dimColor>space=toggle a=all enter=confirm</Text>
    </Box>
  );
}
