# Dev Container for AI Coding Agents

A development container that's ready to work in, with Claude Code, Codex CLI, and Gemini CLI already installed and set up. Open a project, start an agent, get on with it.

It all runs locally, on your own hardware. The difference is that the agents and their tools live inside the container rather than on your system, and they only see the project you opened.

## Contents

- [What's inside](#whats-inside)
- [Getting started](#getting-started)
- [What ends up in your project](#what-ends-up-in-your-project)
- [The `dc` command](#the-dc-command)
- [Signing in to GitHub and GitLab](#signing-in-to-github-and-gitlab)
- [Keeping agent history across rebuilds](#keeping-agent-history-across-rebuilds)
- [Reaching a server in the container](#reaching-a-server-in-the-container)
- [Letting an agent use a browser](#letting-an-agent-use-a-browser)
- [Changing how it's set up](#changing-how-its-set-up)

## What's inside

- Claude Code, Codex CLI, and Gemini CLI
- Python 3.12 and Node.js 24
- `gh` and `glab` for GitHub and GitLab, with a helper that signs you in
- Chromium, which agents drive through the Playwright CLI
- `dc`, an optional command for running all this without VS Code

## Getting started

There are two ways in, and they give you the same container. Use VS Code if you want an editor attached to it, or `dc` if you live in a terminal.

Either way you need two things:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (on Linux, plain Docker works too), and it has to actually be running.
- The `.devcontainer` folder in your project. Clone this repo or [download it as a ZIP](https://github.com/zeveck/devcontainers/archive/refs/heads/main.zip), then copy the `.devcontainer` folder into your project folder.

### With VS Code

You'll also want [VS Code](https://code.visualstudio.com/) and its [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

1. Open the project folder in VS Code.
2. VS Code will offer to "Reopen in Container". Click it. (If it doesn't ask, open the Command Palette and choose *Dev Containers: Reopen in Container*.)
3. Go make coffee. The first build takes a few minutes.
4. Open a terminal in VS Code and type `claude`, or `codex`, or `gemini`.

### Without VS Code

This repo includes `dc`, a little command-line tool that starts the container and runs agents inside it, straight from your terminal. It's a small Node program, so you'll need [Node.js](https://nodejs.org/). You'll also want the dev containers CLI, which is the thing that actually builds and starts containers:

```bash
npm i -g @devcontainers/cli
```

That one is technically optional. Without it `dc` downloads the same tool on the fly, which works but adds a few seconds to every command.

Install `dc` itself from the project folder. This is once per machine, not per project — skip it if you've done it before, or rerun it to pick up a newer version:

```powershell
.\.devcontainer\dc install     # Windows
```
```bash
./.devcontainer/dc install      # macOS and Linux
```

That puts a copy of `dc` on your PATH, so it works from anywhere and keeps working even if you delete the project it came from. Then:

```bash
dc up          # first build takes a few minutes
dc claude      # or dc codex, dc gemini
```

(If typing `dc` says the command isn't found, open a new terminal and try again.)

There's more `dc` can do, listed under [the `dc` command](#the-dc-command).

### Either way

Each agent asks you to sign in the first time you run it. Follow the prompts.

## What ends up in your project

Building the container adds two folders to your project as it goes: `.playwright/`, holding the browser's config and any screenshots it takes, and `.claude/skills/playwright-cli/`, the skill Claude uses to drive the browser. Both are written fresh on every build. Claude adds `.claude/settings.local.json` as well, once you start approving permissions.

Whether those belong in git is up to you. The first two are rebuilt from scratch every time, so committing them mostly adds noise, and the third is particular to you rather than the project. If you'd rather not track them:

```gitignore
.playwright/
.claude/skills/playwright-cli/
.claude/settings.local.json
```

## The `dc` command

`dc` drives the container from a terminal, with no VS Code involved. Installing it is covered [above](#without-vs-code).

Once installed you can type `dc` anywhere. It picks up whichever project you're currently sitting in.

```
dc up          create and start the container   (--rebuild to start over, --fresh to also clear agent history)
dc build       rebuild the image                (--no-cache to ignore the cache)
dc shell       open a shell inside it
dc claude      run Claude inside it             (also codex, gemini, pw)
dc exec ...    run any command inside it
dc down        stop it                          (dc rm deletes it too, dc rm --volumes also its agent data)
dc volumes     saved agent history              (see below)
dc forward     reach a port in the container    (see below)
dc status      show this project's container
dc logs        show its output                  (--follow to keep watching)
dc doctor      check your setup
```

When something won't start, run `dc doctor` first. It checks Docker, Node, and your project, and tells you which one is the problem.

One thing to watch for on macOS and Linux: they already ship a small calculator program called `dc`, and this will hide it. If you use it, install under a different name with `dc install <name>`. To remove everything, run `dc uninstall` (with the name, if you installed under one).

## Signing in to GitHub and GitLab

This step is optional. The container includes `gh` and `glab`, the GitHub and GitLab command-line tools, which agents can use to create pull requests, work with issues, and so on. If you don't plan on that, skip this section — and you almost certainly want one of the two, not both.

The normal sign-ins work fine from inside the container: `gh auth login` shows a code to type into github.com in your browser, and you're in. The one catch is that GitHub allows a single `gh auth login` per account, so signing in from a second container quietly logs the first one out. If you only ever run one container at a time, that will never bother you.

If it does bother you, the container includes `auth`, which signs in with an access token instead — one token works in any number of containers at once:

```bash
auth            # figures out GitHub or GitLab from your project's git remote
auth --gh
auth --glab
auth --both
auth --force    # replace a login you already have
auth --logout   # sign out
```

It sends you to the right page to create the token, then takes the token you paste back and signs you in.

Either way, rebuilding a container signs you out, since logins aren't stored outside it. Sign in again and carry on. And `auth --logout` only affects the container you're in — the token stays valid, so anywhere else you've used it keeps working.

## Keeping agent history across rebuilds

Rebuilding a container normally throws away everything inside it. So that your agents pick up where they left off, each project keeps the agents' own folders in Docker volumes, which outlive rebuilds:

| Folder | What's kept |
|---|---|
| `~/.claude` | Claude Code sessions (`claude --resume`), memory, settings, plugins, and prompt history |
| `~/.codex` | Codex CLI sessions, history, and settings |
| `~/.gemini` | Gemini CLI chats, checkpoints, and settings |

Sign-ins are the exception. Every rebuild deletes the agents' login files before anything starts, so after a rebuild you run `/login` in Claude (and sign in to Codex or Gemini if you use them), and everything else is as you left it. A login only lasts as long as the container it was made in, rather than piling up across rebuilds. `gh` and `glab` aren't kept either, so sign in to those again too.

Each project gets its own volumes, so containers for different projects can't see each other's history. `dc` handles them for you:

```
dc volumes            list this project's saved agent data
dc up --rebuild       rebuild and keep it
dc up --fresh         rebuild with empty agent folders (asks first)
dc rm                 remove the container; the data stays for the next dc up
dc rm --volumes       remove the container and delete its data (asks first)
dc volumes --rm       delete the data of a container you've already removed (asks first)
dc volumes --prune    delete saved data no container uses (asks first)
```

The commands that delete ask first; add `--yes` to skip the question, for example in a script. Docker can't delete a volume while a container is using it, even a stopped one, so `dc volumes --rm` refuses while the container exists; `dc rm --volumes` removes both. To clear the data and carry on working, use `dc up --fresh`.

*Rebuild Container* in VS Code keeps the data too, and the `dc` commands work on containers VS Code made, so use `dc up --fresh` from a terminal when you want a clean slate.

A few things to know:

- **Moving or renaming the project folder starts fresh.** The volume names come from the folder's path, so the moved project gets new ones. The old data stays with the old container: `dc status` from the new location lists every dev container on the machine, so remove the one with the old path (`docker rm <id>`) and then `dc volumes --prune` deletes its data.
- **The logins in an abandoned project stay put.** They're deleted when a container is next created, so a project you remove with `dc rm` (or *Remove Container* in VS Code) and never start again keeps its last login in its volume. To remove a project for good, use `dc rm --volumes`. `dc volumes --rm` deletes a project's saved data, logins included; `dc volumes --prune` deletes it for every project with no container.
- **Docker's own cleanup can delete them.** `docker volume prune --all` removes every volume no container is using, which includes these whenever a project's container is removed (on Docker older than 23, plain `docker volume prune` does too). Don't run it if you want the history.
- **Sessions are kept as written.** Anything pasted into a session, or printed during one, stays in its history. Logins are deleted, but a key you typed into a settings file yourself (such as the `env` block of Claude's `settings.json`, or `~/.gemini/.env`) is kept like any other setting.

Without `dc`, the volumes are named `agent-claude-<id>`, `agent-codex-<id>`, and `agent-gemini-<id>`; `docker volume ls` lists them and `docker volume rm` deletes them once their container is removed.

## Reaching a server in the container

When something in the container serves on a port, such as a dev server on 8999, `dc forward` makes it reachable at `localhost` on your machine:

```
dc forward 8999        forward it now, and every time the container starts
dc forward             list this project's forwards
dc forward --rm 8999   stop forwarding it
```

Then open `http://localhost:8999` in your browser. Forwards are remembered per project on your machine, not in the repo, so nothing gets committed. They stop when the container stops, and `dc up` starts them again and says so. If you started the container some other way (VS Code, Docker Desktop), run `dc forward` to start them. You can forward several ports at once (`dc forward 3000 8999`), and the server can listen on the container's own localhost; it doesn't need `--host 0.0.0.0`.

If the port is already in use on your machine, `dc forward` says so rather than failing quietly. It keeps the forward and picks it up as soon as the port is free; `dc forward` shows where each one stands, and `dc forward --rm 8999` drops it.

VS Code forwards ports on its own, so this is for when you use `dc`. If you'd rather have a port fixed in the container's configuration, add `"appPort": [8999]` to `devcontainer.json` and rebuild; that one is set when the container is created, and the server inside does need to listen on `0.0.0.0`.

## Letting an agent use a browser

Chromium is installed, and Claude has a skill for driving it. You don't need to configure anything. Try starting Claude and pasting this in:

> Create an HTML file called hello.html with a colorful heading saying 'Hello Playwright!', then use playwright-cli to take a screenshot of it.

You'll get the file, and a screenshot of it rendered in a real browser.

It's more useful on real work: point an agent at your dev server and ask it to walk through signup, or to check whether a page still looks right on a phone-sized screen. Run `playwright-cli --help` for everything it can do.

## Changing how it's set up

The whole configuration is a handful of files in `.devcontainer/`:

- `devcontainer.json` sets the base image, VS Code extensions, and container options
- `setup.sh` installs the agents, the browser, and the command-line tools
- `on-create.sh` runs first on each build: it fixes folder ownership and deletes saved agent logins
- `auth` is the sign-in helper
- `dc`, `dc.cmd`, `dc.ps1`, and `dc.mjs` make up the `dc` command

To add or remove software, edit `setup.sh` and rebuild the container.

If your network blocks npmjs.org, point `NPM_REGISTRY` somewhere else in `devcontainer.json` and setup will use it for every install:

```json
"containerEnv": { "NPM_REGISTRY": "https://your-registry.example.com/api/npm/npm-repos/" }
```

## Disclaimer

This is provided as-is, for experimenting and learning. Expect rough edges. It isn't production software and comes with no warranty. The AI tools and browser packages it installs change frequently and occasionally break.
