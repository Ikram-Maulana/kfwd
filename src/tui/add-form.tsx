import { Box, Text, useInput } from "ink";
import { useState } from "react";
import type { ResourceType } from "@/types";

type Step = "name" | "type" | "local" | "remote" | "confirm";

interface Draft {
  localPort?: number;
  name?: string;
  remotePort?: number;
  type?: ResourceType;
}

interface Resolved {
  localPort: number;
  name: string;
  remotePort: number;
  type: ResourceType;
}

const TYPES: ResourceType[] = ["service", "pod", "deployment"];

export interface AddFormProps {
  defaults?: {
    name?: string;
    type?: ResourceType;
    localPort?: number;
    remotePort?: number;
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
    remotePort: d.remotePort ?? 0,
    type: d.type ?? "service",
  };
}

function handleConfirm(
  answer: string,
  draft: Draft,
  onSubmit: (v: Resolved | null) => void
): void {
  if (answer === "y") {
    onSubmit(buildResolved(draft));
  } else if (answer === "n") {
    onSubmit(null);
  }
}

const DEFAULTS: Draft = {};

export function AddForm({ defaults = DEFAULTS, onSubmit }: AddFormProps) {
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState<Draft>(() => defaults);
  const [buffer, setBuffer] = useState("");

  useInput((input, key) => {
    if (key.return) {
      if (step === "confirm") {
        handleConfirm(buffer.trim(), draft, onSubmit);
        return;
      }
      if (isValidTransition(step, buffer)) {
        setDraft((d) => applyDraft(d, step, buffer));
        setStep(nextStep(step));
        setBuffer("");
      }
      return;
    }
    if (key.backspace || key.delete) {
      setBuffer((b) => b.slice(0, -1));
      return;
    }
    setBuffer((b) => b + input);
  });

  return (
    <Box flexDirection="column">
      <Text>name: {draft.name ?? "_"}</Text>
      <Text>type: {draft.type ?? "_"}</Text>
      <Text>localPort: {draft.localPort ?? "_"}</Text>
      <Text>remotePort: {draft.remotePort ?? "_"}</Text>
      <Text>&gt; {buffer}</Text>
      <Text dimColor>step: {step}</Text>
    </Box>
  );
}
