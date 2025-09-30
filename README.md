# Visual Studio Code + Docker Development Containers

This is a repository of pre-configured Visual Studio Code development environments for containerized agentic coding. They require you have Visual Studio Code with the Dev Containers extension and Docker Desktop installed and running.

## Available Environments

### `playwright-mcp-claude-codex-gemini-python`
Multiple AI assistants can directly control web browsers and interpret screenshots:

- **Browser Control**: Playwright MCP server provides direct browser automation
- **AI Assistants**: Claude Code, Codex CLI, and Gemini CLI with browser access
- **Development Stack**: Python 3.12, Node.js 22
- **Pre-configured Agents**: Specialized Claude agents that work behind the scenes

### `playwright-mcp-with-claude-python`
Claude Code can directly control web browsers and interpret screenshots:

- **Browser Control**: Playwright MCP server for direct browser automation
- **AI Assistant**: Claude Code with full browser control capabilities
- **Development Stack**: Python 3.12, Node.js 22
- **Pre-configured Agents**: Specialized Claude agents that work behind the scenes

## Using with VS Code Dev Containers

### Prerequisites
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Getting Started
1. Open VS Code
2. Install the Dev Containers extension if not already installed
3. Open the folder containing your desired environment (e.g., `playwright-mcp-claude-codex-gemini-python`)
4. VS Code will detect the `.devcontainer` folder and prompt you to reopen in container
5. Click "Reopen in Container" or use Command Palette → "Dev Containers: Reopen in Container"
6. The container will automatically initialize itself, which may include installing agentic coding tools, MCP servers, browsers, and the like.

The configuration for each container is in its `.devcontainer` folder, which you could edit to customize the setup as desired. It's recommended you inspect the files there to familiarize yourself with what'll be available.

## Environment Naming Convention

Each environment name communicates exactly what's included:

- **`playwright`** - Browser automation framework (provides browser control)
- **`mcp`** - Model Context Protocol (enables AI-to-browser communication)
- **`claude`** - Anthropic's Claude Code with browser access
- **`codex`** - OpenAI's Codex CLI (if package exists)
- **`gemini`** - Google's Gemini CLI
- **`python`** - Python 3.12 runtime included

## More Info

Each environment folder contains its own README with specific setup instructions, known limitations, and usage examples tailored to that environment's capabilities.

## Disclaimer

These development containers are provided **as-is** for experimental and educational purposes. They may contain bugs, compatibility issues, or other problems. Use at your own risk. This is not production-ready software and no warranties are provided. AI CLI tools and MCP servers are rapidly evolving and may break or change behavior unexpectedly.
