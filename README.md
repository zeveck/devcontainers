# Dev Container for AI Coding Agents

A development container that's ready to work in, with Claude Code, Codex CLI, and Gemini CLI already installed and set up. Open a project, start an agent, get on with it.

Nothing gets installed on your own machine, and the agents only see the project you opened.

## Why you'd want this

The main reason is that you can let an agent off the leash. It runs inside the container, where it can reach your project and the internet but not the rest of your computer. If you've been reluctant to let one work unsupervised, this is a reasonable place to try.

The second reason is that you stop setting things up. Copy one folder into a project and you get the same tools every time, on every machine, instead of installing a CLI here and forgetting it there.

Having all three agents together turns out to be useful too. Ask the same question in three terminals when you want a second opinion, or when one of them is down. And because a browser is installed, an agent can open the page it just changed and actually look at it rather than guessing.

## What's inside

- Claude Code, Codex CLI, and Gemini CLI
- Python 3.12 and Node.js 24
- `gh` and `glab` for GitHub and GitLab, with a helper that signs you in
- Chromium, which agents drive through the Playwright CLI
- `dc`, an optional command for running all this without VS Code

## Getting started

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), [VS Code](https://code.visualstudio.com/), and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers). Check that Docker is actually running.

Then:

1. Clone this repo and open the folder in VS Code.
2. VS Code will offer to "Reopen in Container". Click it. (If it doesn't ask, open the Command Palette and choose *Dev Containers: Reopen in Container*.)
3. Go make coffee. The first build takes a few minutes.
4. Open a terminal in VS Code and type `claude`, or `codex`, or `gemini`.

Each agent asks you to sign in the first time you run it. Follow the prompts.

That's the whole thing. From here you'd normally copy the setup into a project of your own, which is the next section.

## Using it on your own projects

The container is one folder. Copy it wherever you want it:

```bash
cp -r /path/to/devcontainers/.devcontainer /path/to/your-project/
```

Open that project in VS Code, reopen in container, and you're set. Everything installs itself.

It leaves a couple of working folders behind in your project. Add them to your `.gitignore`:

```gitignore
.playwright/
.claude/skills/playwright-cli/
.claude/settings.local.json
```

## Signing in to GitHub and GitLab

Run `auth` and it will walk you through it:

```bash
auth            # figures out GitHub or GitLab from your project's git remote
auth --gh
auth --glab
auth --both
auth --force    # replace a login you already have
auth --logout   # sign out
```

It sends you to the right page to create an access token, then takes the token you paste back and signs you in.

Two quirks are worth knowing about. The first is why `auth` uses a token instead of the normal browser sign-in: GitHub allows only one `gh auth login` per account, so signing in from a second container quietly logs you out of the first. If you work in several containers they'll keep knocking each other offline. Access tokens don't behave that way, and one token works everywhere at once.

The second is that rebuilding a container signs you out again, since logins aren't stored outside it. Run `auth` and carry on.

Signing out with `auth --logout` only affects the container you're in. The token stays valid, so anywhere else you've used it keeps working.

## Letting an agent use a browser

Chromium is installed, and Claude has a skill for driving it. You don't need to configure anything. Try starting Claude and pasting this in:

> Create an HTML file called hello.html with a colorful heading saying 'Hello Playwright!', then use playwright-cli to take a screenshot of it.

You'll get the file, and a screenshot of it rendered in a real browser.

It's more useful on real work: point an agent at your dev server and ask it to walk through signup, or to check whether a page still looks right on a phone-sized screen. Run `playwright-cli --help` for everything it can do.

The browser's settings live in `.playwright/cli.config.json`:

```json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": { "headless": true, "args": ["--no-sandbox"] }
  },
  "outputDir": ".playwright/output"
}
```

`--no-sandbox` is necessary inside Docker. Chromium is used rather than Chrome because Chrome has no ARM build, so it would fail on Apple Silicon Macs.

Careful with that file: it gets rewritten every time the container is created, so edits disappear. Change it in `setup.sh` instead. Same goes for `.claude/skills/playwright-cli/`.

## Skipping VS Code with `dc`

If you'd rather stay in a terminal, `dc` runs the same container without VS Code involved. You'll need Docker and Node 18 or newer. Installing the dev containers CLI as well (`npm i -g @devcontainers/cli`) is optional but makes every command noticeably faster.

To install, run this from the project folder:

```powershell
.\.devcontainer\dc install     # Windows
```
```bash
./.devcontainer/dc install      # macOS and Linux
```

On Windows, open a fresh terminal afterwards or it won't find the command yet.

After that you can type `dc` anywhere. It picks up whichever project you're currently sitting in.

```
dc up          create and start the container   (--rebuild to start over)
dc build       rebuild the image                (--no-cache to ignore the cache)
dc shell       open a shell inside it
dc claude      run Claude inside it             (also codex, gemini, pw)
dc exec ...    run any command inside it
dc down        stop it                          (dc rm deletes it too)
dc status      show this project's container
dc logs        show its output                  (--follow to keep watching)
dc doctor      check your setup
```

When something won't start, run `dc doctor` first. It checks Docker, Node, and your project, and tells you which one is the problem.

One thing to watch for on macOS and Linux: they already ship a small calculator program called `dc`, and this will hide it. If you use it, install under a different name with `dc install <name>`. To remove everything, run `dc uninstall`.

## Changing how it's set up

The whole configuration is a handful of files in `.devcontainer/`:

- `devcontainer.json` sets the base image, VS Code extensions, and container options
- `setup.sh` installs the agents, the browser, and the command-line tools
- `auth` is the sign-in helper
- `dc`, `dc.cmd`, `dc.ps1`, and `dc.mjs` make up the `dc` command

To add or remove software, edit `setup.sh` and rebuild the container.

If your network blocks npmjs.org, set `NPM_REGISTRY` before starting the container and it will be used for every install:

```bash
export NPM_REGISTRY=https://your-registry.example.com/api/npm/npm-repos/
```

You can also write it straight into `devcontainer.json`:

```json
"containerEnv": { "NPM_REGISTRY": "https://your-registry.example.com/api/npm/npm-repos/" }
```

## Add-ons

Claude comes with one skill already installed, `playwright-cli`, which is what lets it drive the browser. Another one you might want:

- [social-seo-skill](https://github.com/zeveck/social-seo-skill) handles meta tags, Open Graph, Twitter cards, social preview images, and PWA support. Copy `SKILL.md` and `reference.md` into `.claude/skills/social-seo/`.

## Disclaimer

This is provided as-is, for experimenting and learning. Expect rough edges. It isn't production software and comes with no warranty. The AI tools and browser packages it installs change frequently and occasionally break.
