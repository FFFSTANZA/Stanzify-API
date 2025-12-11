# Stanzify – Phase 1 Foundation

This repository hosts the **Phase 1 foundation** for Stanzify, a browser-based orchestration IDE that will eventually manage and automate interactions with dozens of AI interfaces. The current milestone focuses on providing a solid shell that mimics a lightweight cloud IDE and demonstrates the state-management expectations for later AI automation work.

## Whats Included

### Three-Panel Workspace
- **Left panel** – Prompt composer, conversation history, command palette controls, and a fully interactive virtual file tree.
- **Center panel** – Monaco Editor (loaded via CDN) with basic language inference per file extension.
- **Right panel** – Live iframe preview that renders the current project (auto-includes CSS and JS assets).

### Virtual File System
- Create, rename, and delete files and folders.
- Import zipped projects or GitHub repositories (via URL) directly into the in-browser workspace using JSZip.
- Maintain a context-aware file selection to indicate which files should be bundled for AI prompts.

### State Management
- All workspace information (files, expanded folders, context selections, active file, and conversation history) is persisted in **IndexedDB** via the `idb` helper.
- Conversation history uses a mock “GPT-4o mini” connector that simulates asynchronous responses, providing the scaffolding for real connectors in later phases.

### Context + Token Awareness
- Active context files are summarized in the left panel along with a simple token estimator, preparing the UI for future prompt-building flows.

## Tech Stack
- **HTML / CSS / Vanilla JavaScript** (single-page app)
- **Monaco Editor** (CDN)
- **IndexedDB** via [`idb`](https://github.com/jakearchibald/idb)
- **JSZip** for ZIP + GitHub imports

## Getting Started
No build system is required. Open `index.html` in any modern browser (Chrome/Edge/Firefox). All dependencies are loaded from CDNs.

```bash
# In a static web server context
$ cd /path/to/repo
$ python -m http.server 8080
# Visit http://localhost:8080
```

> **Tip:** Because the app relies on IndexedDB, run it via `http://` or `https://` rather than the `file://` protocol to avoid browser security restrictions.

## Next Steps
Phase 2 will introduce real browser automation connectors (ChatGPT, DeepSeek, Qwen) and expand the orchestration logic. The current codebase has been structured so the automation layer can plug into the existing state manager, context builder, and command system with minimal refactoring.
