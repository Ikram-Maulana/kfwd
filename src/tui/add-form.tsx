import { Box, type Key, Text, useInput } from "ink";
import { useState } from "react";
import { type ResourceType, TYPES } from "@/types";
import { ASCII_LOGO } from "./logo";

type Step = "name" | "type" | "namespace" | "local" | "remote" | "confirm";

interface Draft {
  localPort?: number;
  name?: string;
  namespace?: string;
  remotePort?: number;
  type?: ResourceType;
}

type Resolved = import("@/types").FormResult;

export interface AddFormProps {
  defaults?: {
    name?: string;
    type?: ResourceType;
    localPort?: number;
    remotePort?: number;
    namespace?: string;
  };
  onSubmit: (v: Resolved | null) => void;
}

const PORT_MIN = 1;
const PORT_MAX = 65_535;

function validPort(s: string): number | null {
  const n = Number(s);
  if (!Number.isInteger(n) || n < PORT_MIN || n > PORT_MAX) {
    return null;
  }
  return n;
}

function nextStep(s: Step): Step {
  switch (s) {
    case "name":
      return "type";
    case "type":
      return "namespace";
    case "namespace":
      return "local";
    case "local":
      return "remote";
    case "remote":
      return "confirm";
    case "confirm":
      return "confirm";
    default:
      return s;
  }
}

function applyDraft(d: Draft, step: Step, buffer: string): Draft {
  switch (step) {
    case "name":
      return { ...d, name: buffer };
    case "type": {
      const raw = buffer.trim();
      if (TYPES.includes(raw as ResourceType)) {
        return { ...d, type: raw as ResourceType };
      }
      return d;
    }
    case "namespace": {
      const raw = buffer.trim();
      return { ...d, namespace: raw === "" ? undefined : raw };
    }
    case "local": {
      const n = validPort(buffer);
      return n === null ? d : { ...d, localPort: n };
    }
    case "remote": {
      const n = validPort(buffer);
      return n === null ? d : { ...d, remotePort: n };
    }
    case "confirm":
      return d;
    default:
      return d;
  }
}

function isValidTransition(step: Step, buffer: string): boolean {
  switch (step) {
    case "name":
      return buffer.trim().length > 0;
    case "type":
      return TYPES.includes(buffer.trim() as ResourceType);
    case "namespace":
      return true; // Skippable/optional
    case "local":
    case "remote":
      return validPort(buffer) !== null;
    case "confirm":
      return true;
    default:
      return false;
  }
}

function buildResolved(d: Draft): Resolved {
  return {
    localPort: d.localPort ?? 0,
    name: d.name ?? "",
    namespace: d.namespace,
    remotePort: d.remotePort ?? 0,
    type: d.type ?? "pod",
  };
}

const DEFAULTS: Draft = {};

function getCurrentTypeIndex(val: string): number {
  const idx = TYPES.indexOf(val as ResourceType);
  return idx === -1 ? 0 : idx;
}

interface ReturnKeyAction {
  error?: string | null;
  nextBuffer?: string;
  nextDraft?: Draft;
  nextStep?: Step;
  submitValue?: Resolved | null;
}

function processReturnKey(
  step: Step,
  buffer: string,
  draft: Draft
): ReturnKeyAction {
  if (step === "confirm") {
    const answer = buffer.trim();
    return {
      submitValue: answer === "y" ? buildResolved(draft) : null,
    };
  }

  let currentVal = buffer;
  if (step === "type" && buffer === "") {
    currentVal = "pod";
  }

  if (isValidTransition(step, currentVal)) {
    return {
      nextDraft: applyDraft(draft, step, currentVal),
      nextStep: nextStep(step),
      nextBuffer: "",
      error: null,
    };
  }

  let error: string | null = null;
  if (step === "name") {
    error = "Name cannot be empty.";
  } else if (step === "type") {
    error = "Invalid resource type. Select service, pod, or deployment.";
  } else if (step === "local" || step === "remote") {
    error = "Invalid port. Enter an integer between 1 and 65535.";
  }

  return { error };
}

function processArrowKey(step: Step, buffer: string, key: Key): string | null {
  if (step !== "type") {
    return null;
  }
  const isArrow =
    key.leftArrow || key.upArrow || key.rightArrow || key.downArrow;
  if (!isArrow) {
    return null;
  }

  const currentIdx = getCurrentTypeIndex(buffer);
  let nextIdx = currentIdx;
  if (key.leftArrow || key.upArrow) {
    nextIdx = currentIdx > 0 ? currentIdx - 1 : TYPES.length - 1;
  } else if (key.rightArrow || key.downArrow) {
    nextIdx = currentIdx < TYPES.length - 1 ? currentIdx + 1 : 0;
  }
  return TYPES[nextIdx] as string;
}

function applyReturnAction(
  action: ReturnKeyAction,
  setDraft: React.Dispatch<React.SetStateAction<Draft>>,
  setStep: React.Dispatch<React.SetStateAction<Step>>,
  setBuffer: React.Dispatch<React.SetStateAction<string>>
) {
  if (action.nextDraft) {
    setDraft(action.nextDraft);
  }
  if (action.nextStep) {
    setStep(action.nextStep);
  }
  if (action.nextBuffer !== undefined) {
    setBuffer(action.nextBuffer);
  }
}

interface StepPromptProps {
  active: boolean;
  label: string;
  value: React.ReactNode;
}

function StepPrompt({ active, label, value }: StepPromptProps) {
  return (
    <Box flexDirection="row" marginBottom={0.5}>
      <Box width={3}>
        <Text bold color="yellow">
          {active ? " ❯ " : "   "}
        </Text>
      </Box>
      <Box width={18}>
        <Text bold={active} color={active ? "white" : "gray"}>
          {label}
        </Text>
      </Box>
      <Box>{value}</Box>
    </Box>
  );
}

interface InstructionsProps {
  step: Step;
}

function Instructions({ step }: InstructionsProps) {
  return (
    <Box borderDimColor borderStyle="single" paddingLeft={1} paddingRight={1}>
      <Text dimColor>
        {step === "type" && (
          <Text>
            Use{" "}
            <Text bold color="cyan">
              ←/→/↑/↓
            </Text>{" "}
            arrows to select, then{" "}
            <Text bold color="cyan">
              Enter
            </Text>
          </Text>
        )}
        {step === "namespace" && (
          <Text>
            Type namespace or press{" "}
            <Text bold color="cyan">
              Enter
            </Text>{" "}
            to skip (defaults to active context)
          </Text>
        )}
        {step === "confirm" && (
          <Text>
            Type{" "}
            <Text bold color="cyan">
              y
            </Text>{" "}
            to confirm or{" "}
            <Text bold color="cyan">
              n
            </Text>{" "}
            to cancel, then{" "}
            <Text bold color="cyan">
              Enter
            </Text>
          </Text>
        )}
        {step !== "type" && step !== "namespace" && step !== "confirm" && (
          <Text>
            Type value and press{" "}
            <Text bold color="cyan">
              Enter
            </Text>
          </Text>
        )}
      </Text>
    </Box>
  );
}

export function AddForm({ defaults = DEFAULTS, onSubmit }: AddFormProps) {
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState<Draft>(() => defaults);
  const [buffer, setBuffer] = useState("");
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    setError(null);

    if (key.return) {
      const action = processReturnKey(step, buffer, draft);
      if (action.submitValue !== undefined) {
        onSubmit(action.submitValue);
        return;
      }
      if (action.error) {
        setError(action.error);
      } else {
        applyReturnAction(action, setDraft, setStep, setBuffer);
      }
      return;
    }

    if (key.backspace || key.delete) {
      setBuffer((b) => b.slice(0, -1));
      return;
    }

    const nextTypeValue = processArrowKey(step, buffer, key);
    if (nextTypeValue !== null) {
      setBuffer(nextTypeValue);
      return;
    }

    if (input && !key.meta && !key.ctrl) {
      setBuffer((b) => b + input);
    }
  });

  let namespaceValue: React.ReactNode = null;
  if (step === "namespace") {
    namespaceValue = (
      <Text bold color="cyan">
        {buffer}_
      </Text>
    );
  } else if (draft.namespace !== undefined) {
    namespaceValue = <Text color="green">{draft.namespace}</Text>;
  } else if (step !== "name" && step !== "type") {
    namespaceValue = (
      <Text color="gray" dimColor>
        [default context]
      </Text>
    );
  }

  let localPortValue: React.ReactNode = null;
  if (step === "local") {
    localPortValue = (
      <Text bold color="cyan">
        {buffer}_
      </Text>
    );
  } else if (draft.localPort !== undefined) {
    localPortValue = <Text color="green">{draft.localPort}</Text>;
  }

  let remotePortValue: React.ReactNode = null;
  if (step === "remote") {
    remotePortValue = (
      <Text bold color="cyan">
        {buffer}_
      </Text>
    );
  } else if (draft.remotePort !== undefined) {
    remotePortValue = <Text color="green">{draft.remotePort}</Text>;
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" marginBottom={1} paddingLeft={1}>
        <Text color="cyan">{ASCII_LOGO}</Text>
        <Text bold color="cyan">
          ➔ ADD PORT FORWARD RULE
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <StepPrompt
          active={step === "name"}
          label="Rule Name:"
          value={
            step === "name" ? (
              <Text bold color="cyan">
                {buffer}_
              </Text>
            ) : (
              <Text color="green">{draft.name ?? ""}</Text>
            )
          }
        />

        <StepPrompt
          active={step === "type"}
          label="Resource Type:"
          value={
            step === "type" ? (
              <Box flexDirection="row">
                {TYPES.map((t) => {
                  const isSelected =
                    buffer === t || (buffer === "" && t === "pod");
                  return (
                    <Box
                      borderColor={isSelected ? "cyan" : "gray"}
                      borderStyle="round"
                      key={t}
                      marginRight={2}
                      paddingLeft={1}
                      paddingRight={1}
                    >
                      <Text
                        bold={isSelected}
                        color={isSelected ? "cyan" : "gray"}
                      >
                        {t}
                      </Text>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Text color="green">{draft.type ?? ""}</Text>
            )
          }
        />

        <StepPrompt
          active={step === "namespace"}
          label="Namespace (opt):"
          value={namespaceValue}
        />

        <StepPrompt
          active={step === "local"}
          label="Local Port:"
          value={localPortValue}
        />

        <StepPrompt
          active={step === "remote"}
          label="Remote Port:"
          value={remotePortValue}
        />

        {step === "confirm" && (
          <Box flexDirection="row" marginTop={1}>
            <Box width={3}>
              <Text bold color="yellow">
                {" "}
                ❯{" "}
              </Text>
            </Box>
            <Box>
              <Text bold color="white">
                Confirm and save rule? (y/n) ›{" "}
                <Text color="cyan">{buffer}_</Text>
              </Text>
            </Box>
          </Box>
        )}
      </Box>

      {error && (
        <Box marginBottom={1} paddingLeft={3}>
          <Text bold color="red">
            ✗ {error}
          </Text>
        </Box>
      )}

      <Instructions step={step} />
    </Box>
  );
}
