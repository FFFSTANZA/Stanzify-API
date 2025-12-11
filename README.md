# Stanzify – Multi-AI Orchestration Platform

This repository hosts **Stanzify**, a browser-based orchestration IDE that manages and coordinates interactions with multiple AI models in parallel. Currently implementing **Phase 2: Multi-AI Orchestration**, which enables intelligent routing, parallel execution, and sophisticated response merging across 5-10 AI models simultaneously.

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

## Phase 2: Multi-AI Orchestration ✅

### What's New
Phase 2 introduces a complete multi-AI orchestration system:

#### Week 4: Task Classifier
- **Keyword Detection**: Analyzes prompts to identify task types (refactor, debug, create, optimize, explain, architecture)
- **Smart Routing**: Automatically selects the best 5 AIs for each task based on their specialties
- **Confidence Scoring**: Ranks AIs by relevance to the task

#### Week 5: Parallel Execution Engine
- **AI Pool Manager**: 10 permanent AI workers (GPT-4o, DeepSeek, Qwen, Gemini, Mistral, Llama, Perplexity, You.com)
- **Parallel Dispatcher**: Executes prompts across multiple AIs simultaneously using Promise.all()
- **Response Collector**: Gathers, timestamps, and tags all responses

#### Week 6: Response Merger
- **Multi-Response Analyzer**: Compares outputs and identifies commonalities
- **Voting Algorithm**: Determines consensus across AI responses
- **3 Merge Strategies**: 
  - Balanced (default): Combines expert opinion with democratic consensus
  - Democratic: Majority voting - what most AIs agree on
  - Expert: Trusts the specialist AI for the task type
- **Enhanced UI**: View merged results plus individual AI responses

### Usage
1. Type your prompt in the text area
2. Click "🎭 Orchestrate AIs" button
3. Watch as 5+ AIs process your request in parallel
4. Review the merged response and individual outputs

Use `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to access:
- Toggle Multi-AI Orchestration on/off
- Switch between merge strategies
- View AI pool status

### Documentation
- **[PHASE2_ORCHESTRATION.md](PHASE2_ORCHESTRATION.md)**: Complete feature documentation
- **[EXAMPLE_USAGE.md](EXAMPLE_USAGE.md)**: Detailed usage examples and workflows
- **[TEST_ORCHESTRATION.md](TEST_ORCHESTRATION.md)**: Testing guide and verification
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**: Technical implementation details

## Next Steps
Phase 3 will integrate real AI providers (OpenAI, Anthropic, Google, etc.) to replace the current mock implementations, enabling actual multi-AI orchestration with streaming responses and advanced features like caching, analytics, and collaborative workflows.
