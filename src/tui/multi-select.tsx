import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { ASCII_LOGO } from "./logo";

export interface MultiSelectProps<T> {
  allowRunningSelection?: boolean;
  items: T[];
  labelOf: (item: T) => string;
  onSubmit: (selected: T[]) => void;
  runningOf: (item: T) => boolean;
  title?: string;
}

export function MultiSelect<T>({
  items,
  labelOf,
  runningOf,
  onSubmit,
  allowRunningSelection = false,
  title,
}: MultiSelectProps<T>) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set<number>()
  );
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.return) {
      onSubmit(
        items.filter(
          (it, i) =>
            (allowRunningSelection || !runningOf(it)) && selected.has(i)
        )
      );
      return;
    }

    if (key.upArrow) {
      setCursor((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      return;
    }

    if (key.downArrow) {
      setCursor((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      return;
    }

    if (input === " ") {
      const isRunning = runningOf(items[cursor] as T);
      if (!isRunning || allowRunningSelection) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(cursor)) {
            next.delete(cursor);
          } else {
            next.add(cursor);
          }
          return next;
        });
      }
      return;
    }

    if (input === "a") {
      setSelected((prev) => {
        const selectableIdxs = items.reduce<number[]>((acc, it, i) => {
          if (!runningOf(it) || allowRunningSelection) {
            acc.push(i);
          }
          return acc;
        }, []);

        const allSelected = selectableIdxs.every((i) => prev.has(i));
        if (allSelected) {
          const next = new Set(prev);
          for (const i of selectableIdxs) {
            next.delete(i);
          }
          return next;
        }
        const next = new Set(prev);
        for (const i of selectableIdxs) {
          next.add(i);
        }
        return next;
      });
      return;
    }
  });

  const headerTitle = title ?? "SELECT PORT FORWARD RULES";

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" marginBottom={1} paddingLeft={1}>
        <Text color="cyan">{ASCII_LOGO}</Text>
        <Text bold color="cyan">
          ➔ {headerTitle.toUpperCase()}
        </Text>
      </Box>

      <Box marginBottom={1} paddingLeft={4}>
        <Text bold color="white" dimColor>
          {"NAME".padEnd(25)} {"TARGET RESOURCE".padEnd(32)} {"PORTS"}
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {items.map((it, i) => {
          const running = runningOf(it);
          const checked = selected.has(i);
          const isCursor = i === cursor;

          let statusChar = "☐";
          let statusColor = "gray";
          if (running && !allowRunningSelection) {
            statusChar = "●";
            statusColor = "green";
          } else if (checked) {
            statusChar = "☑";
            statusColor = "cyan";
          }

          let textColor = "white";
          if (!isCursor && running && !allowRunningSelection) {
            textColor = "gray";
          }

          return (
            <Box flexDirection="row" key={labelOf(it)}>
              <Box width={3}>
                <Text bold={isCursor} color="yellow">
                  {isCursor ? " ❯ " : "   "}
                </Text>
              </Box>

              <Box width={4}>
                <Text bold={isCursor} color={statusColor}>
                  {statusChar}
                </Text>
              </Box>

              <Box flexGrow={1}>
                <Text
                  bold={isCursor}
                  color={textColor}
                  dimColor={
                    !(
                      isCursor ||
                      checked ||
                      (running && !allowRunningSelection)
                    )
                  }
                >
                  {labelOf(it)}
                </Text>
              </Box>

              {running && (
                <Box marginLeft={2}>
                  <Text color="green" dimColor={!isCursor}>
                    [running]
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box
        borderDimColor
        borderStyle="single"
        flexDirection="column"
        paddingLeft={1}
        paddingRight={1}
      >
        <Text dimColor>
          <Text bold color="cyan">
            ↑/↓
          </Text>{" "}
          Navigate •{" "}
          <Text bold color="cyan">
            Space
          </Text>{" "}
          Toggle •{" "}
          <Text bold color="cyan">
            A
          </Text>{" "}
          Toggle All •{" "}
          <Text bold color="cyan">
            Enter
          </Text>{" "}
          Confirm
        </Text>
      </Box>
    </Box>
  );
}
