# AI Browser Control Dev Container

A ready-made development environment where Claude, Codex, and Gemini can **drive a real web browser** — click through your app, fill in forms, and take screenshots they can actually look at.

Everything runs inside a Docker container, so it doesn't touch your machine's setup.

## What you get

- **Three AI assistants** — Claude Code, Codex CLI, Gemini CLI
- **A browser they can control** — Chromium, driven through the Playwright CLI
- **A working dev environment** — Python 3.12, Node.js 24, `gh` (GitHub) and `glab` (GitLab)
- **`dc`** — an optional command for using the container without VS Code

This is for *development*, not automated test suites. Your assistant can open your app, use it like a person would, see what's on screen, and tell you what's broken.

## Quick start

You'll need [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running), [VS Code](https://code.visualstudio.com/), and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

1. Clone this repo and open the folder in VS Code.
2. When VS Code offers to **"Reopen in Container"**, click it. (Or: Command Palette → *Dev Containers: Reopen in Container*.)
3. Wait a few minutes while it installs everything.
4. Open a terminal in VS Code and start an assistant:

```bash
claude      # or: codex, gemini
```

The first time, it will ask you to sign in — follow the prompts.

### Try it

Ask Claude:

> Create an HTML file called hello.html with a colorful heading saying 'Hello Playwright!', then use playwright-cli to take a screenshot of it.

It will write the file, open it in the browser, and show you the screenshot.

You can run several assistants at once — just open a separate terminal for each.

## Signing in to GitHub and GitLab

Run `auth` inside the container:

```bash
auth            # picks GitHub or GitLab based on this project's git remote
auth --gh       # GitHub only
auth --glab     # GitLab only
auth --both
auth --force    # replace a login you already have
auth --logout   # sign out
```

It points you at the right page to create a token, then takes the token you paste and signs you in.

Two things to know:

- **It uses a token instead of the usual browser sign-in.** GitHub only allows one `gh auth login` session per account, so signing in from a second container logs you out of the first. Tokens don't have that problem — you can use the same one everywhere at once.
- **Rebuilding the container signs you out**, because logins aren't saved outside it. Just run `auth` again.

`auth --logout` only signs out *this* container. It doesn't cancel the token, so your other containers keep working.

## Using it in your own project

You don't have to work inside this repo. Copy one folder into any project:

```bash
cp -r /path/to/devcontainers/.devcontainer /path/to/your-project/
```

Open your project in VS Code and "Reopen in Container". That's it — everything installs itself.

The container creates a couple of working folders in your project. Add these to your `.gitignore`:

```gitignore
.playwright/
.claude/skills/playwright-cli/
.claude/settings.local.json
```

## Using it without VS Code: `dc`

`dc` runs the same container straight from your terminal.

**You'll need** Docker and Node 18+. Also recommended: `npm i -g @devcontainers/cli` (without it `dc` still works, but every command is slower).

### Install it

```bash
.devcontainer/dc install               # macOS / Linux
```
```powershell
.\.devcontainer\dc install             # Windows PowerShell
.\.devcontainer\dc.cmd install         # Windows CMD
```

**On Windows, open a new terminal afterwards** — that's when the new PATH takes effect.

After installing, just type `dc` from anywhere. It works in whatever project you're currently in, not only this one.

### Commands

```
dc up          create and start the container   (--rebuild to start fresh)
dc build       rebuild the image                (--no-cache to skip the cache)
dc shell       open a shell inside it
dc claude      run Claude inside it             (also: codex, gemini, pw)
dc exec ...    run any command inside it
dc down        stop it                          (dc rm also deletes it)
dc status      show the container for this project
dc logs        show its output                  (--follow to keep watching)
dc doctor      check that everything's set up right
```

If something isn't working, `dc doctor` is the place to start — it checks Docker, Node, and the project setup, and tells you what's missing.

Other options: `dc install <name>` installs under a different name — worth doing on macOS and Linux, where `dc` is already the name of a built-in calculator. `dc uninstall` removes it.

## Customizing

Everything lives in the `.devcontainer/` folder:

| File | What it does |
|---|---|
| `devcontainer.json` | Base image, VS Code extensions, container settings |
| `setup.sh` | Installs the assistants, the browser, and the CLIs |
| `auth` | The sign-in helper |
| `dc`, `dc.cmd`, `dc.ps1`, `dc.mjs` | The `dc` command (one entry point per shell) |

To change what gets installed, edit `setup.sh` and rebuild the container.

### Browser settings

The browser is configured in `.playwright/cli.config.json`:

```json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": { "headless": true, "args": ["--no-sandbox"] }
  },
  "outputDir": ".playwright/output"
}
```

`--no-sandbox` is required inside Docker. Chromium is used rather than Chrome because Chrome has no ARM build, which would break on Apple Silicon Macs.

This file is rewritten every time the container is created, so change it in `setup.sh` rather than editing it directly. The same goes for `.claude/skills/playwright-cli/`.

Run `playwright-cli --help` to see everything the browser tools can do.

## If your network blocks npmjs.org

Set `NPM_REGISTRY` on your machine before starting the container:

```bash
export NPM_REGISTRY=https://your-registry.example.com/api/npm/npm-repos/
```

Or put it directly in `devcontainer.json`:

```json
"containerEnv": { "NPM_REGISTRY": "https://your-registry.example.com/api/npm/npm-repos/" }
```

Setup uses it for every install. If it isn't set, the public registry is used as normal.

## Add-ons

This container includes one Claude skill (`playwright-cli`, installed automatically). Others worth adding:

- **[social-seo-skill](https://github.com/zeveck/social-seo-skill)** — meta tags, Open Graph, Twitter cards, social preview images, and PWA support for web apps. Copy `SKILL.md` and `reference.md` into `.claude/skills/social-seo/`.

## Disclaimer

Provided **as-is** for experimental and educational purposes. It may contain bugs or compatibility problems — use at your own risk. This is not production software and no warranties are provided. AI CLI tools and browser automation packages change quickly and may break unexpectedly.
