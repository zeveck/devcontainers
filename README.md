# Multi-AI Browser Control Dev Container

A pre-configured Visual Studio Code development environment for containerized agentic coding, giving Claude, Codex, and Gemini **direct control of a web browser** through the Playwright CLI.

Clone the repo, open it in VS Code, "Reopen in Container", and once it's set up you auth the agent and start coding — with Playwright able to test workflows, verify features render as intended, and take screenshots your agent can actually interpret.

**The whole payload is the `.devcontainer/` folder.** Everything else in this repo is documentation and housekeeping — so you can also just copy that one folder into a project of your own. See [Using It in Your Own Project](#using-it-in-your-own-project).

## The Core Concept

**This is NOT about automated testing.** This environment gives AI assistants a browser to control during development. Your AIs become web-aware development partners who can:

- Navigate to any URL and interact with live websites
- Click buttons, fill forms, and navigate through applications
- Take screenshots and analyze visual layouts
- Debug your web apps by actually using them
- Extract data from websites for processing
- Test user flows in real-time

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Open in Container
1. Clone this repo and open the folder in VS Code
2. VS Code detects the `.devcontainer` folder and prompts you to reopen in a container
3. Click "Reopen in Container", or use Command Palette → "Dev Containers: Reopen in Container"
4. Wait for automatic setup (~2-3 minutes the first time) — this installs the agentic coding tools, the Playwright CLI, and the Chromium browser

### Start an AI and prompt for browser control
```bash
# With Claude Code (recommended)
claude

# With Gemini CLI
gemini

# With Codex CLI
codex
```

## Using It in Your Own Project

You don't need to work inside this repo. Copy the one folder into any project:

```bash
cp -r /path/to/devcontainers/.devcontainer /path/to/your-project/
```

Then open your project in VS Code and "Reopen in Container". `setup.sh` installs everything into the container at create time and writes what it needs into the workspace, so there's nothing else to copy and nothing to keep in sync.

Two paths it generates in your workspace are worth adding to your project's `.gitignore`:

```gitignore
.playwright/
.claude/skills/playwright-cli/
.claude/settings.local.json
```

(Scoped rather than ignoring `.claude/` wholesale, so you can still commit your own project config — `settings.json`, custom agents, project skills.)

## Using It Without VS Code (`dc`)

`.devcontainer/dc` is a small wrapper around [`@devcontainers/cli`](https://github.com/devcontainers/cli) that drives the same container from your terminal — no VS Code, no "Reopen in Container".

**Requires** Docker, Node 18+, and ideally `npm i -g @devcontainers/cli` (without it, `dc` falls back to `npx`, which works but is slower on every call).

### Install

```bash
.devcontainer/dc install          # macOS / Linux
.devcontainer\dc.cmd install      # Windows (CMD or PowerShell)
```

That copies `dc` to `~/.local/share/dc` and puts a shim on your PATH (`~/.local/bin` on macOS/Linux, `%LOCALAPPDATA%\Programs\dc` on Windows, where it also registers the PATH entry — open a new terminal afterwards). The installed copy is **project-agnostic**: it finds the nearest `.devcontainer/devcontainer.json` by walking up from wherever you are, so it works in any project, not just this one.

- `dc install <name>` installs under a different name. Worth knowing: `dc` is also the POSIX desk calculator, present by default on macOS and many Linux distros, and installing to `~/.local/bin` will shadow it.
- `dc install --link` points the shim at this repo instead of copying, so edits take effect immediately.
- `dc uninstall` removes it.

### Commands

```
dc up [--rebuild] [--no-cache]   create/start the container
dc build                         build the image
dc shell                         interactive shell inside it
dc exec <cmd> [args...]          run a command inside it
dc claude|codex|gemini|pw [...]  run an agent inside it
dc down / dc rm                  stop / stop and remove
dc status / dc logs [--follow]   inspect
dc doctor                        check prerequisites
```

Everything that runs inside the container goes through a **login** shell. That is not cosmetic: `claude` resolves via `~/.profile` and `codex`, `gemini`, and `playwright-cli` via `/etc/profile.d`, none of which a bare `devcontainer exec` sources — without it they are "command not found".

`dc down`, `rm`, `status`, and `logs` go through `docker` filtered on the `devcontainer.local_folder` label, because the devcontainer CLI itself has no teardown or listing commands.

## What's Included

### Browser Control Stack
- **Playwright CLI** (`@playwright/cli`) — token-efficient browser automation commands
- **Chromium Browser** — pre-configured for headless operation (works on both x86_64 and ARM)

### AI Assistants with Browser Access
- **Claude Code** — Anthropic's CLI, with the `playwright-cli` skill preinstalled (it will ask permission the first time it drives the browser)
- **Codex CLI** — OpenAI's Codex
- **Gemini CLI** — Google's AI assistant

### Development Environment
- **Python 3.12** — available for development
- **Node.js 24** — JavaScript/TypeScript support
- **GitHub CLI** — `gh` for repos, PRs, and issues
- **GitLab CLI** — `glab` for the same against GitLab
- **VS Code Extensions** — Python and Pylint pre-configured

### Agent Skills
- **`playwright-cli`** — browser automation and Playwright test authoring for Claude; `setup.sh` installs it from upstream at container-create time, so it's always current

## Quick Examples

### Using Claude
```bash
# Start Claude
claude

# First-time authentication (follow prompts)
# Claude will prompt you to authenticate
# Complete the OAuth flow in your browser and copy over the OAuth code
# Claude securely stores credentials for future use

# Ask Claude to interact with a webpage
"Create a simple HTML file called helloPlaywright.html with a colorful heading saying 'Hello Playwright!', then use playwright-cli to take a screenshot of it."
```

Claude will create the file, open it in the browser, and capture a screenshot!

For detailed authentication setup, see the [official Claude Code setup guide](https://docs.claude.com/en/docs/claude-code/setup).

### Using Gemini
```bash
# Start Gemini CLI
gemini

# Authentication may be required (follow prompts)

# Ask Gemini to interact with a webpage
"Create an HTML file called simpleForm.html with a form with field validation, then use playwright-cli to navigate to it and take a screenshot"
```

### Using Codex
```bash
# Start Codex CLI
codex

# Authentication may be required (follow prompts)

# Ask Codex to analyze a webpage
"Create a simple HTML file called helloPlaywright.html with a colorful heading saying 'Hello Playwright!', then use playwright-cli to take a screenshot of it."
```

### Running Multiple AI Sessions
You can run different AI assistants in separate terminals:
```bash
# Terminal 1
claude

# Terminal 2
gemini

# Terminal 3
codex
```

## Configuration

The container's configuration lives in `.devcontainer/`, which you can edit to customize the setup as desired. It's recommended you inspect the files there to familiarize yourself with what'll be available.

### What `setup.sh` does
During container creation, `setup.sh` runs in this order:
1. Installs Claude Code via the native installer
2. Configures a custom npm registry, if `NPM_REGISTRY` is set (see below)
3. Installs the Codex CLI and Gemini CLI
4. Installs the GitLab CLI (`glab`) from its latest release, matching the container's architecture
5. Installs `@playwright/cli` globally
6. Writes the browser config below to `.playwright/cli.config.json` (the default discovery path)
7. Runs `playwright-cli install --skills`, which initializes the workspace and copies the Playwright CLI skill to `.claude/skills/playwright-cli/`
8. Runs `playwright-cli install-browser chromium --with-deps`, which fetches the exact Chromium revision the CLI pins, plus the headless shell and ffmpeg, plus the OS-level packages Docker images lack
9. Verifies the browser actually launches, failing the build loudly if it can't

`gh` comes from the `github-cli` devcontainer feature. `glab` has no official feature, so step 4 fetches the release binary directly — and is the one step that is deliberately non-fatal, since it's a convenience and `gitlab.com` may be blocked on restricted networks.

Step 7 deliberately does the browser work in a single command. Installing Chromium via stable `playwright` as well would pull a *different* pinned revision — a few hundred MB that never gets launched.

Run `playwright-cli --help` to see all available browser commands.

### Browser Settings (`.playwright/cli.config.json`)
```json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "headless": true,
      "args": ["--no-sandbox"]
    }
  },
  "outputDir": ".playwright/output"
}
```

The `--no-sandbox` flag is required because Chromium's OS-level sandbox needs `CAP_SYS_ADMIN`, which Docker containers don't have. The container itself provides isolation.

Chromium is used rather than Chrome because Chrome lacks native ARM Linux builds, which breaks on Apple Silicon Macs running ARM containers.

Both this file and `.claude/skills/playwright-cli/` are generated at container-create time and are gitignored — don't edit them expecting the changes to stick, and don't commit them. Because `setup.sh` rewrites the config on every container create, customize it there rather than in the generated file.

## Optional Add-ons

This container deliberately ships no agent skills of its own beyond the `playwright-cli` skill that `setup.sh` installs. Skills you want are worth pulling from their own source rather than vendoring copies here, so they stay current:

- **[social-seo-skill](https://github.com/zeveck/social-seo-skill)** — SEO and social sharing for web apps: meta tags, Open Graph, Twitter cards, social card images (captured with Playwright), structured data, PWA support. Copy `SKILL.md` and `reference.md` into `.claude/skills/social-seo/` in your workspace.

## Authenticating gh and glab

Run `auth` inside the container:

```bash
auth            # picks GitHub or GitLab from this repo's git remote
auth --gh
auth --glab
auth --both
auth --force    # replace an existing login
```

It links you to the right token page with the required scopes, takes the pasted token without echoing it, and signs the CLI in.

It uses a Personal Access Token rather than `gh auth login`'s browser flow on purpose. GitHub issues one OAuth token per app per user, so every `gh auth login` **invalidates the token in every other container** — with several containers they keep logging each other out. PATs are independent, and any number can be live at once.

Nothing mounts credentials, so a rebuild loses the login and you re-run `auth`.

## Corporate Networks / Custom npm Registry

If your network blocks access to `registry.npmjs.org`, set `NPM_REGISTRY` on your host and `devcontainer.json` forwards it in:

```bash
export NPM_REGISTRY=https://your-artifactory.example.com/api/npm/npm-repos/
```

Or hard-code it in `devcontainer.json`:

```json
"containerEnv": { "NPM_REGISTRY": "https://your-artifactory.example.com/api/npm/npm-repos/" }
```

`setup.sh` detects the variable and configures npm before installing any packages. If unset, npm uses the public registry as normal.

It is deliberately `containerEnv` rather than `remoteEnv`: `setup.sh` runs as a lifecycle command, and whether `remoteEnv` reaches lifecycle commands varies by Dev Containers version — a silent skip here would send every install to the blocked public registry.

## Disclaimer

This development container is provided **as-is** for experimental and educational purposes. It may contain bugs, compatibility issues, or other problems. Use at your own risk. This is not production-ready software and no warranties are provided. AI CLI tools and browser automation packages are rapidly evolving and may break or change behavior unexpectedly.
