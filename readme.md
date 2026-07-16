<h1 align="center">kfwd</h1>

<p align="center">
  <strong>Save. Start. Forget.</strong><br>
  Named <code>kubectl port-forward</code> rules as background processes.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#commands">Commands</a> •
  <a href="#local-development">Local Dev</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Quick Start

**Install globally:**

```bash
npm install --global @ikrammaulana/kfwd
```

**Or run instantly with npx:**

```bash
npx @ikrammaulana/kfwd
```

**Save a forward rule and start it:**

```bash
kfwd add my-app 8080:80 --namespace=default
kfwd start
```

That's it. Your service is now forwarded in the background.

---

## Features

| Feature | Description |
|---------|-------------|
| **Named Rules** | Save port-forward configs with friendly names |
| **Background Processes** | Runs detached — no terminal tab clutter |
| **TUI Interface** | Interactive multi-select to start/stop forwards |
| **Resource Types** | Forward to `service`, `pod`, or `deployment` |
| **Namespace Support** | Target any namespace with `--namespace` |
| **Context Support** | Switch clusters with `--context` |
| **Status Monitoring** | See all rules and their run state at a glance |
| **Graceful Shutdown** | SIGTERM → SIGKILL fallback for clean stops |

---

## Commands

```
kfwd <command> [...]
```

| Command | Description |
|---------|-------------|
| `add [name] [l:r]` | Save a forward rule (TUI form if name/ports omitted) |
| `remove [name]` | Delete a rule + kill running process (TUI multi-select if name omitted) |
| `start [--all]` | TUI multi-select → spawn detached (`--all` starts every stopped forward) |
| `stop [--all]` | TUI multi-select → kill (`--all` kills every running forward) |
| `status` | Table of all rules + run state |
| `help` | Show help |

### Options for `add`

| Flag | Description | Default |
|------|-------------|---------|
| `--type` | Resource type: `service`, `pod`, `deployment` | `pod` |
| `--namespace` | Kubernetes namespace (skippable in TUI form) | `default` |
| `--context` | Kubernetes context | current context |
| `--interactive` | Open TUI form instead of positional args | `false` |

### Options for `start` / `stop`

| Flag | Description |
|------|-------------|
| `--all`, `-a` | Operate on every configured forward without TUI |

---

## Examples

```bash
# Save a pod forward (defaults to pod type)
kfwd add debug-pod 3000:3000

# Save a service forward explicitly
kfwd add my-app 8080:80 --type=service

# Save a pod forward in staging namespace
kfwd add staging-app 8080:80 --namespace=staging

# Save with specific kube context
kfwd add prod-db 5432:5432 --context=production

# Start selected forwards via TUI
kfwd start

# Start all stopped forwards (no TUI)
kfwd start --all

# Check what's running
kfwd status

# Stop selected forwards via TUI
kfwd stop

# Stop all running forwards (no TUI)
kfwd stop --all

# Remove a rule
kfwd remove my-app
```

---

## Local Development

Want to contribute or run kfwd from source?

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 11
- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured with a cluster

### Setup

```bash
# Clone the repo
git clone https://github.com/Ikram-Maulana/kfwd.git
cd kfwd

# Install dependencies
pnpm install

# Build
pnpm build

# Run from source
pnpm start -- add my-app 8080:80
```

### Development Mode

```bash
# Watch mode — rebuilds on file changes
pnpm dev

# In another terminal
pnpm start -- status
```

### Testing

```bash
# Run tests
pnpm test

# Lint & format check
pnpm check

# Auto-fix issues
pnpm fix
```

---

## How It Works

1. **Save** — `kfwd add` stores your rule in a local config file
2. **Start** — `kfwd start` opens a TUI, you select rules, spawns `kubectl port-forward` as detached processes
3. **Monitor** — `kfwd status` shows all rules and whether they're running
4. **Stop** — `kfwd stop` opens a TUI, you select running forwards, sends SIGTERM then SIGKILL

Each forward runs as a background process with logs stored locally. No terminal tabs needed.

---

## Contributing

Contributions welcome! Here's how:

1. Fork the repo
2. Create a branch (`git checkout -b feat/my-feature`)
3. Commit (`git commit -m 'add my feature'`)
4. Push (`git push origin feat/my-feature`)
5. Open a Pull Request

Please run `pnpm check` and `pnpm test` before submitting.

---

## License

[MIT](LICENSE) © [Ikram Maulana](https://github.com/Ikram-Maulana)
