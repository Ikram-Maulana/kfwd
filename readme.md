<p align="center">
  <img src="https://img.shields.io/badge/kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes">
  <img src="https://img.shields.io/npm/v/kfwd?style=for-the-badge&logo=npm&logoColor=white&color=CB3837" alt="npm version">
  <img src="https://img.shields.io/npm/dm/kfwd?style=for-the-badge&logo=npm&logoColor=white&color=CB3837" alt="npm downloads">
  <img src="https://img.shields.io/github/license/Ikram-Maulana/kfwd?style=for-the-badge&color=blue" alt="license">
  <img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen?style=for-the-badge&logo=node.js&logoColor=white" alt="node version">
</p>

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
npm install --global kfwd
```

**Or run instantly with npx:**

```bash
npx kfwd
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
| `add [name] [l:r]` | Save a forward rule |
| `remove <name>` | Delete a rule + kill running process |
| `start` | TUI multi-select → spawn detached |
| `stop` | TUI multi-select → kill |
| `status` | Table of all rules + run state |
| `help` | Show help |

### Options for `add`

| Flag | Description | Default |
|------|-------------|---------|
| `--type` | Resource type: `service`, `pod`, `deployment` | `service` |
| `--namespace` | Kubernetes namespace | `default` |
| `--context` | Kubernetes context | current context |
| `--interactive` | Open TUI form instead of positional args | `false` |

---

## Examples

```bash
# Save a service forward
kfwd add my-app 8080:80

# Save a pod forward in staging
kfwd add debug-pod 3000:3000 --type=pod --namespace=staging

# Save with specific kube context
kfwd add prod-db 5432:5432 --context=production

# Start selected forwards via TUI
kfwd start

# Check what's running
kfwd status

# Stop selected forwards via TUI
kfwd stop

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
