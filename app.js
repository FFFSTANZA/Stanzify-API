const monacoLoader = new Promise((resolve, reject) => {
  const waitForRequire = () => {
    if (window.require) {
      window.require.config({
        paths: {
          vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
        },
      });
      window.require(["vs/editor/editor.main"], () => {
        resolve(window.monaco);
      });
    } else {
      setTimeout(waitForRequire, 20);
    }
  };
  waitForRequire();
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const debounce = (fn, wait = 400) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
};

const normalizePath = (input = "/") => {
  if (!input) return "/";
  let path = input.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+/g, "/");
  if (path.length > 1 && path.endsWith("/")) {
    path = path.replace(/\/+$/, "");
  }
  return path || "/";
};

const splitPath = (path = "/") => normalizePath(path)
  .split("/")
  .filter(Boolean);

const joinPath = (segments = []) => {
  if (!segments.length) return "/";
  return `/${segments.filter(Boolean).join("/")}`;
};

const extensionToLanguage = (path = "") => {
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".scss")) return "scss";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".md")) return "markdown";
  return "plaintext";
};

const estimateTokens = (text = "") => {
  if (!text.length) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
};

const deepCopy = (payload) => JSON.parse(JSON.stringify(payload));

const DEFAULT_FILES = [
  {
    path: "/index.html",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Stanzify Sandbox</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="hero">
      <h1>Welcome to Stanzify</h1>
      <p>Edit any file on the left to see changes reflected instantly.</p>
      <button id="cta">I'm interactive</button>
    </main>
    <script src="main.js"></script>
  </body>
</html>`
  },
  {
    path: "/styles.css",
    content: `:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #05060b;
  color: #f6fff9;
}

body {
  margin: 0;
  min-height: 100vh;
}

main.hero {
  display: grid;
  place-items: center;
  text-align: center;
  padding: 64px 16px;
}

button#cta {
  border: none;
  background: #40b3ff;
  color: #05060b;
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}
`
  },
  {
    path: "/main.js",
    content: `const button = document.getElementById('cta');
if (button) {
  button.addEventListener('click', () => {
    button.textContent = 'Clicked!';
  });
}
`
  },
];

class VirtualFileSystem {
  constructor(tree) {
    this.root = tree || { name: "root", type: "folder", children: [] };
  }

  static createDefault() {
    const vfs = new VirtualFileSystem();
    DEFAULT_FILES.forEach((file) => {
      vfs.addFile(file.path, file.content);
    });
    return vfs;
  }

  toJSON() {
    return deepCopy(this.root);
  }

  ensureFolder(path = "/") {
    const segments = splitPath(path);
    let current = this.root;
    segments.forEach((segment) => {
      if (!current.children) current.children = [];
      let next = current.children.find(
        (child) => child.name === segment && child.type === "folder"
      );
      if (!next) {
        next = { name: segment, type: "folder", children: [] };
        current.children.push(next);
      }
      current = next;
    });
    return current;
  }

  getNode(path = "/") {
    const normalized = normalizePath(path);
    if (normalized === "/") return this.root;
    const segments = splitPath(normalized);
    let current = this.root;
    for (const segment of segments) {
      if (!current.children) return null;
      current = current.children.find((child) => child.name === segment);
      if (!current) return null;
    }
    return current;
  }

  addFile(path, content = "") {
    const normalized = normalizePath(path);
    const segments = splitPath(normalized);
    if (!segments.length) throw new Error("Invalid file path");
    const fileName = segments.pop();
    const folderPath = joinPath(segments);
    const folder = this.ensureFolder(folderPath);
    if (!folder.children) folder.children = [];
    let existing = folder.children.find((child) => child.name === fileName);
    if (existing) {
      if (existing.type !== "file") throw new Error("Path already a folder");
      existing.content = content;
    } else {
      existing = { name: fileName, type: "file", content };
      folder.children.push(existing);
    }
    return normalized;
  }

  updateFile(path, content) {
    const node = this.getNode(path);
    if (node && node.type === "file") {
      node.content = content;
    }
  }

  rename(path, newName) {
    if (!newName) return;
    const normalized = normalizePath(path);
    if (normalized === "/") return;
    const segments = splitPath(normalized);
    const targetName = segments.pop();
    const parentPath = joinPath(segments);
    const parent = this.getNode(parentPath);
    if (!parent || !parent.children) return;
    if (parent.children.some((child) => child.name === newName)) {
      throw new Error("Name already exists in folder");
    }
    const node = parent.children.find((child) => child.name === targetName);
    if (node) {
      node.name = newName;
    }
    return joinPath([...segments, newName]);
  }

  delete(path) {
    const normalized = normalizePath(path);
    if (normalized === "/") return;
    const segments = splitPath(normalized);
    const name = segments.pop();
    const parentPath = joinPath(segments);
    const parent = this.getNode(parentPath);
    if (!parent || !parent.children) return;
    parent.children = parent.children.filter((child) => child.name !== name);
  }

  getAllFiles(node = this.root, parentPath = "") {
    const currentPath = parentPath || "/";
    let files = [];
    if (node.type === "file") {
      return [{ path: currentPath, node }];
    }
    if (!node.children) return files;
    node.children
      .slice()
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      })
      .forEach((child) => {
        const childPath = currentPath === "/" ? `/${child.name}` : `${currentPath}/${child.name}`;
        files = files.concat(this.getAllFiles(child, childPath));
      });
    return files;
  }

  firstFilePath() {
    const files = this.getAllFiles();
    return files.length ? files[0].path : null;
  }
}

class StateManager {
  constructor() {
    if (!window.idb) {
      throw new Error("idb library not available");
    }
    this.dbPromise = window.idb.openDB("stanzify-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("state")) {
          db.createObjectStore("state");
        }
      },
    });
  }

  async getSnapshot() {
    const db = await this.dbPromise;
    return db.get("state", "workspace");
  }

  async saveSnapshot(snapshot) {
    const db = await this.dbPromise;
    await db.put("state", snapshot, "workspace");
  }

  async clear() {
    const db = await this.dbPromise;
    await db.delete("state", "workspace");
  }
}

class MockGPTConnector {
  constructor() {
    this.id = "mock-gpt4o";
    this.label = "GPT-4o mini (mock)";
  }

  async sendPrompt({ prompt, contextFiles }) {
    await delay(600 + Math.random() * 400);
    const summary = contextFiles
      .map((file) => `• ${file.path} (${file.content.length} chars)`)
      .join("\n");
    return `Mock connector (${this.label}) received your prompt.\n\nPrompt preview:\n${prompt.slice(0, 200)}\n\nContext files (${contextFiles.length}):\n${summary || "none supplied"}\n\nNext: replace this mock with a real browser automation connector.`;
  }
}

class StanzifyApp {
  constructor() {
    this.stateManager = new StateManager();
    this.fileSystem = VirtualFileSystem.createDefault();
    this.activeFilePath = "/index.html";
    this.contextPaths = new Set(["/index.html", "/styles.css", "/main.js"]);
    this.expandedPaths = new Set(["/"]);
    this.conversationHistory = [];
    this.models = new Map();
    this.connector = new MockGPTConnector();
    this.elements = {};
    this.previewDirty = false;
    this.refreshPreviewDebounced = debounce(() => this.refreshPreview(), 500);
    this.persistStateDebounced = debounce(() => this.persistState(), 400);
  }

  async init() {
    this.cacheElements();
    this.bindStaticEvents();
    await this.restoreState();
    await this.initializeEditor();
    this.renderTree();
    this.renderConversation();
    this.renderContextSummary();
    this.updateTokenEstimate();
    this.refreshPreview();
  }

  cacheElements() {
    this.elements = {
      promptInput: document.getElementById("prompt-input"),
      sendPromptBtn: document.getElementById("send-prompt-btn"),
      clearPromptBtn: document.getElementById("clear-prompt-btn"),
      tokenCount: document.getElementById("token-count"),
      conversationList: document.getElementById("conversation-list"),
      clearHistoryBtn: document.getElementById("clear-history-btn"),
      fileTree: document.getElementById("file-tree"),
      activeFileLabel: document.getElementById("active-file-label"),
      newFileBtn: document.getElementById("new-file-btn"),
      newFolderBtn: document.getElementById("new-folder-btn"),
      importZipBtn: document.getElementById("import-zip-btn"),
      importGithubBtn: document.getElementById("import-github-btn"),
      zipInput: document.getElementById("zip-input"),
      contextSummary: document.getElementById("context-summary"),
      contextAllBtn: document.getElementById("context-all-btn"),
      contextSmartBtn: document.getElementById("context-smart-btn"),
      contextMinBtn: document.getElementById("context-min-btn"),
      commandBtn: document.getElementById("command-palette-btn"),
      refreshPreviewBtn: document.getElementById("refresh-preview-btn"),
      previewFrame: document.getElementById("preview-frame"),
      paletteOverlay: document.getElementById("palette-overlay"),
      paletteInput: document.getElementById("palette-input"),
      paletteResults: document.getElementById("palette-results"),
      paletteClose: document.getElementById("palette-close"),
    };
  }

  bindStaticEvents() {
    this.elements.clearPromptBtn.addEventListener("click", () => {
      this.elements.promptInput.value = "";
      this.updateTokenEstimate();
    });

    this.elements.promptInput.addEventListener("input", () => {
      this.updateTokenEstimate();
    });

    this.elements.sendPromptBtn.addEventListener("click", () => this.handlePromptSend());

    this.elements.clearHistoryBtn.addEventListener("click", () => {
      if (confirm("Clear conversation history?")) {
        this.conversationHistory = [];
        this.renderConversation();
        this.persistStateDebounced();
      }
    });

    this.elements.newFileBtn.addEventListener("click", () => this.promptNewFile());
    this.elements.newFolderBtn.addEventListener("click", () => this.promptNewFolder());
    this.elements.importZipBtn.addEventListener("click", () => this.elements.zipInput.click());
    this.elements.importGithubBtn.addEventListener("click", () => this.promptGitHubImport());

    this.elements.zipInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) {
        this.handleZipImport(file);
        this.elements.zipInput.value = "";
      }
    });

    this.elements.contextAllBtn.addEventListener("click", () => this.applyContextPreset("full"));
    this.elements.contextSmartBtn.addEventListener("click", () => this.applyContextPreset("smart"));
    this.elements.contextMinBtn.addEventListener("click", () => this.applyContextPreset("minimal"));

    this.elements.fileTree.addEventListener("click", (event) => this.handleTreeClick(event));
    this.elements.fileTree.addEventListener("change", (event) => this.handleTreeChange(event));

    this.elements.commandBtn.addEventListener("click", () => this.openCommandPalette());
    this.elements.paletteClose.addEventListener("click", () => this.closeCommandPalette());
    this.elements.paletteOverlay.addEventListener("click", (event) => {
      if (event.target === this.elements.paletteOverlay) {
        this.closeCommandPalette();
      }
    });

    this.elements.paletteInput.addEventListener("input", () => this.renderCommandResults());
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        this.toggleCommandPalette();
        return;
      }
      if (event.key === "Escape" && !this.elements.paletteOverlay.classList.contains("hidden")) {
        this.closeCommandPalette();
      }
    });

    this.elements.refreshPreviewBtn.addEventListener("click", () => this.refreshPreview());
  }

  async restoreState() {
    const snapshot = await this.stateManager.getSnapshot();
    if (snapshot) {
      this.fileSystem = new VirtualFileSystem(snapshot.tree);
      this.activeFilePath = snapshot.activeFilePath || this.fileSystem.firstFilePath() || "/";
      this.contextPaths = new Set(snapshot.contextPaths || []);
      this.expandedPaths = new Set(snapshot.expandedPaths || ["/"]);
      this.conversationHistory = snapshot.conversationHistory || [];
    } else {
      this.fileSystem = VirtualFileSystem.createDefault();
      this.activeFilePath = "/index.html";
      this.contextPaths = new Set(["/index.html", "/styles.css", "/main.js"]);
      this.expandedPaths = new Set(["/"]);
      this.conversationHistory = [];
    }
    if (!this.fileSystem.getNode(this.activeFilePath)) {
      const fallback = this.fileSystem.firstFilePath();
      if (fallback) this.activeFilePath = fallback;
    }
  }

  async initializeEditor() {
    const monaco = await monacoLoader;
    this.monaco = monaco;
    this.editor = monaco.editor.create(document.getElementById("editor"), {
      theme: "vs-dark",
      fontSize: 14,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollbar: { verticalScrollbarSize: 8 },
    });

    this.editor.onDidChangeModelContent(() => {
      const model = this.editor.getModel();
      if (!model) return;
      const path = model.uri.path.replace(/^\//, "/");
      const content = model.getValue();
      this.fileSystem.updateFile(path, content);
      this.refreshPreviewDebounced();
      this.updateTokenEstimate();
      this.persistStateDebounced();
    });

    if (this.activeFilePath) {
      this.openFileInEditor(this.activeFilePath);
    }
  }

  createModelForPath(path) {
    const node = this.fileSystem.getNode(path);
    if (!node || node.type !== "file") return null;
    const uri = this.monaco.Uri.parse(`inmemory:${path}`);
    const model = this.monaco.editor.createModel(
      node.content || "",
      extensionToLanguage(path),
      uri
    );
    this.models.set(path, model);
    return model;
  }

  openFileInEditor(path) {
    if (!this.monaco) return;
    let model = this.models.get(path);
    const node = this.fileSystem.getNode(path);
    if (!node || node.type !== "file") return;
    if (!model) {
      model = this.createModelForPath(path);
    } else if (model.getValue() !== node.content) {
      model.setValue(node.content || "");
    }
    if (model) {
      this.editor.setModel(model);
      this.elements.activeFileLabel.textContent = path;
    }
  }

  cleanupModelsForRename(targetPath, isFolder) {
    const affected = [...this.models.keys()].filter((modelPath) => {
      if (modelPath === targetPath) return true;
      if (isFolder && modelPath.startsWith(`${targetPath}/`)) return true;
      return false;
    });
    affected.forEach((modelPath) => {
      const model = this.models.get(modelPath);
      if (model) model.dispose();
      this.models.delete(modelPath);
    });
  }

  handleTreeClick(event) {
    const toggle = event.target.closest(".tree-toggle");
    const rename = event.target.closest(".action-rename");
    const remove = event.target.closest(".action-delete");
    const row = event.target.closest(".tree-row");
    if (!row) return;
    const path = row.dataset.path;
    if (toggle) {
      this.toggleFolder(path);
      return;
    }
    if (rename) {
      this.promptRename(path);
      return;
    }
    if (remove) {
      this.promptDelete(path);
      return;
    }
    const node = this.fileSystem.getNode(path);
    if (node?.type === "folder") {
      this.toggleFolder(path);
    } else if (node?.type === "file") {
      this.activeFilePath = path;
      this.openFileInEditor(path);
      this.refreshPreviewDebounced();
      this.updateTokenEstimate();
      this.persistStateDebounced();
      this.renderTree();
    }
  }

  handleTreeChange(event) {
    if (!event.target.classList.contains("context-checkbox")) return;
    const row = event.target.closest(".tree-row");
    if (!row) return;
    const path = row.dataset.path;
    if (event.target.checked) {
      this.contextPaths.add(path);
    } else {
      this.contextPaths.delete(path);
    }
    this.renderContextSummary();
    this.updateTokenEstimate();
    this.persistStateDebounced();
  }

  toggleFolder(path) {
    if (this.expandedPaths.has(path)) {
      this.expandedPaths.delete(path);
    } else {
      this.expandedPaths.add(path);
    }
    this.renderTree();
    this.persistStateDebounced();
  }

  renderTree() {
    const container = this.elements.fileTree;
    container.innerHTML = "";
    const build = (node, currentPath = "/", depth = 0) => {
      if (currentPath !== "/") {
        const row = document.createElement("div");
        row.className = "tree-row";
        row.dataset.path = currentPath;
        row.dataset.type = node.type;
        row.style.paddingLeft = `${depth * 12}px`;
        if (this.activeFilePath === currentPath) {
          row.classList.add("active");
        }

        if (node.type === "folder") {
          const toggleBtn = document.createElement("button");
          toggleBtn.className = "tree-toggle";
          toggleBtn.textContent = this.expandedPaths.has(currentPath) ? "▾" : "▸";
          row.appendChild(toggleBtn);
        } else {
          const spacer = document.createElement("span");
          spacer.style.display = "inline-block";
          spacer.style.width = "14px";
          row.appendChild(spacer);
        }

        if (node.type === "file") {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "context-checkbox";
          checkbox.checked = this.contextPaths.has(currentPath);
          row.appendChild(checkbox);
        } else {
          const spacer = document.createElement("span");
          spacer.style.width = "18px";
          row.appendChild(spacer);
        }

        const label = document.createElement("span");
        label.className = "tree-label";
        label.textContent = node.name;
        row.appendChild(label);

        const actions = document.createElement("div");
        actions.className = "tree-actions";
        const renameBtn = document.createElement("button");
        renameBtn.className = "action-rename";
        renameBtn.textContent = "✎";
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "action-delete";
        deleteBtn.textContent = "✕";
        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);
        row.appendChild(actions);

        container.appendChild(row);
      }

      if (node.children && this.expandedPaths.has(currentPath)) {
        node.children
          .slice()
          .sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === "folder" ? -1 : 1;
          })
          .forEach((child) => {
            const childPath = currentPath === "/" ? `/${child.name}` : `${currentPath}/${child.name}`;
            build(child, childPath, depth + 1);
          });
      }
    };

    build(this.fileSystem.root, "/", 0);
  }

  promptNewFile() {
    const input = prompt("Enter file path (e.g. src/app.tsx):");
    if (!input) return;
    const normalized = normalizePath(input);
    try {
      this.fileSystem.addFile(normalized, "");
      this.expandedPaths.add(joinPath(splitPath(normalized).slice(0, -1)) || "/");
      this.renderTree();
      this.persistStateDebounced();
    } catch (error) {
      alert(error.message);
    }
  }

  promptNewFolder() {
    const input = prompt("Enter folder path (e.g. src/components):");
    if (!input) return;
    const normalized = normalizePath(input);
    this.fileSystem.ensureFolder(normalized);
    this.expandedPaths.add(normalized);
    this.renderTree();
    this.persistStateDebounced();
  }

  promptRename(path) {
    const node = this.fileSystem.getNode(path);
    if (!node) return;
    const newName = prompt("Rename to:", node.name);
    if (!newName || newName === node.name) return;
    try {
      const updatedPath = this.fileSystem.rename(path, newName.trim());
      const remapPath = (value) => {
        if (!value) return value;
        if (value === path) return updatedPath;
        if (node.type === "folder" && value.startsWith(`${path}/`)) {
          return value.replace(path, updatedPath);
        }
        return value;
      };

      const remapSet = (inputSet) => new Set([...inputSet].map((entry) => remapPath(entry) || entry));
      const possibleActive = remapPath(this.activeFilePath);
      if (possibleActive && possibleActive !== this.activeFilePath) {
        this.activeFilePath = possibleActive;
      }
      this.contextPaths = remapSet(this.contextPaths);
      this.expandedPaths = remapSet(this.expandedPaths);
      this.cleanupModelsForRename(path, node.type === "folder");
      this.renderTree();
      this.renderContextSummary();
      if (this.activeFilePath && this.activeFilePath !== "/") {
        this.openFileInEditor(this.activeFilePath);
      }
      this.persistStateDebounced();
    } catch (error) {
      alert(error.message);
    }
  }

  promptDelete(path) {
    const node = this.fileSystem.getNode(path);
    if (!node) return;
    if (!confirm(`Delete ${node.type} "${path}"?`)) return;
    this.fileSystem.delete(path);
    [...this.contextPaths].forEach((selectedPath) => {
      if (selectedPath === path || selectedPath.startsWith(`${path}/`)) {
        this.contextPaths.delete(selectedPath);
      }
    });
    if (this.activeFilePath === path) {
      this.activeFilePath = this.fileSystem.firstFilePath() || "/";
      if (this.activeFilePath !== "/") {
        this.openFileInEditor(this.activeFilePath);
      }
    }
    this.renderTree();
    this.renderContextSummary();
    this.refreshPreviewDebounced();
    this.persistStateDebounced();
  }

  async handleZipImport(file) {
    if (!window.JSZip) {
      alert("JSZip not loaded");
      return;
    }
    const zip = await window.JSZip.loadAsync(file);
    const entries = Object.keys(zip.files);
    const rootPrefix = this.detectZipRoot(entries);
    for (const entryName of entries) {
      const entry = zip.files[entryName];
      const normalizedPath = this.stripLeadingDirectory(entryName, rootPrefix);
      if (!normalizedPath) continue;
      if (entry.dir) {
        this.fileSystem.ensureFolder(normalizedPath);
        continue;
      }
      const content = await entry.async("string");
      this.fileSystem.addFile(normalizedPath, content);
    }
    this.renderTree();
    this.refreshPreview();
    this.persistStateDebounced();
  }

  detectZipRoot(entries = []) {
    const usable = entries
      .map((name) => name.split("/").filter(Boolean))
      .filter((parts) => parts.length && parts[0] !== "__MACOSX");
    if (!usable.length) return null;
    const candidate = usable[0][0];
    const allShare = usable.every((parts) => parts[0] === candidate);
    return allShare ? candidate : null;
  }

  stripLeadingDirectory(entryName, rootPrefix) {
    const segments = entryName.split("/").filter(Boolean);
    if (!segments.length) return null;
    if (segments[0] === "__MACOSX") return null;
    if (rootPrefix && segments[0] === rootPrefix) {
      segments.shift();
    }
    if (!segments.length) return null;
    return `/${segments.join("/")}`;
  }

  async promptGitHubImport() {
    const url = prompt("GitHub repo URL (optionally append /tree/branch):");
    if (!url) return;
    const parsed = this.parseGitHubUrl(url.trim());
    if (!parsed) {
      alert("Invalid GitHub URL");
      return;
    }
    try {
      const archiveUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/zipball/${parsed.ref || "main"}`;
      const response = await fetch(archiveUrl);
      if (!response.ok) throw new Error(`GitHub responded with ${response.status}`);
      const blob = await response.blob();
      await this.handleZipImport(blob);
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
  }

  parseGitHubUrl(url) {
    try {
      const u = new URL(url);
      if (!u.hostname.includes("github.com")) return null;
      const [, owner, repo, maybeTree, branch] = u.pathname.split("/");
      if (!owner || !repo) return null;
      if (maybeTree === "tree" && branch) {
        return { owner, repo, ref: branch };
      }
      return { owner, repo, ref: "main" };
    } catch (error) {
      return null;
    }
  }

  applyContextPreset(preset) {
    if (preset === "full") {
      this.contextPaths = new Set(this.fileSystem.getAllFiles().map((file) => file.path));
    } else if (preset === "smart") {
      const bundle = new Set();
      if (this.activeFilePath && this.activeFilePath !== "/") {
        bundle.add(this.activeFilePath);
      }
      this.fileSystem.getAllFiles().forEach(({ path }) => {
        if (path.endsWith("index.html") || path.endsWith("styles.css") || path.endsWith("main.js")) {
          bundle.add(path);
        }
      });
      this.contextPaths = bundle;
    } else {
      this.contextPaths = new Set();
    }
    this.renderContextSummary();
    this.updateTokenEstimate();
    this.persistStateDebounced();
  }

  renderContextSummary() {
    const container = this.elements.contextSummary;
    container.innerHTML = "";
    const validPaths = [...this.contextPaths].filter((path) => {
      const node = this.fileSystem.getNode(path);
      return node && node.type === "file";
    });
    if (validPaths.length !== this.contextPaths.size) {
      this.contextPaths = new Set(validPaths);
      this.persistStateDebounced();
    }
    if (!this.contextPaths.size) {
      container.innerHTML = `<p class="eyebrow">No files selected.</p>`;
      return;
    }
    [...this.contextPaths]
      .sort()
      .forEach((path) => {
        const node = this.fileSystem.getNode(path);
        const chip = document.createElement("div");
        chip.className = "context-chip";
        chip.innerHTML = `<span>${path}</span><span>${node?.content?.length || 0} chars</span>`;
        container.appendChild(chip);
      });
  }

  updateTokenEstimate() {
    const prompt = this.elements.promptInput.value || "";
    const contextText = [...this.contextPaths]
      .map((path) => this.fileSystem.getNode(path)?.content || "")
      .join("\n");
    this.elements.tokenCount.textContent = estimateTokens(prompt + contextText).toLocaleString();
  }

  renderConversation() {
    const container = this.elements.conversationList;
    container.innerHTML = "";
    if (!this.conversationHistory.length) {
      container.innerHTML = `<p class="eyebrow">No conversation yet.</p>`;
      return;
    }
    this.conversationHistory.slice(-12).forEach((message) => {
      const node = document.createElement("div");
      node.className = `message ${message.role}`;
      const header = document.createElement("div");
      header.className = "message-header";
      const role = message.role === "user" ? "You" : "GPT-4o mini";
      header.innerHTML = `<span>${role}</span><span>${new Date(message.timestamp).toLocaleTimeString()}</span>`;
      const body = document.createElement("div");
      body.className = "message-body";
      body.textContent = message.content;
      node.appendChild(header);
      node.appendChild(body);
      container.appendChild(node);
    });
  }

  async handlePromptSend() {
    const prompt = this.elements.promptInput.value.trim();
    if (!prompt) return;
    this.appendMessage({ role: "user", content: prompt });
    this.setPromptBusy(true);
    try {
      const contextFiles = [...this.contextPaths].map((path) => ({
        path,
        content: this.fileSystem.getNode(path)?.content || "",
      }));
      const response = await this.connector.sendPrompt({ prompt, contextFiles });
      this.appendMessage({ role: "assistant", content: response });
    } catch (error) {
      this.appendMessage({ role: "assistant", content: `Error: ${error.message}` });
    } finally {
      this.setPromptBusy(false);
    }
  }

  appendMessage(message) {
    this.conversationHistory.push({ ...message, timestamp: Date.now() });
    this.renderConversation();
    this.persistStateDebounced();
  }

  setPromptBusy(isBusy) {
    this.elements.sendPromptBtn.disabled = isBusy;
    this.elements.sendPromptBtn.textContent = isBusy ? "Routing..." : "Send to GPT-4o mini";
  }

  buildPreviewDocument() {
    const preferredHtml = this.activeFilePath?.endsWith(".html") ? this.activeFilePath : null;
    let targetPath = preferredHtml;
    if (!targetPath) {
      const html = this.fileSystem.getAllFiles().find((file) => file.path.endsWith(".html"));
      if (html) targetPath = html.path;
    }
    if (!targetPath) {
      return "<style>body{font-family:sans-serif;padding:2rem;color:#111}</style><p>No HTML entry point yet.</p>";
    }
    const htmlNode = this.fileSystem.getNode(targetPath);
    let doc = htmlNode?.content || "";
    const css = this.fileSystem
      .getAllFiles()
      .filter((file) => file.path.endsWith(".css"))
      .map((file) => `<style data-path="${file.path}">${file.node.content}</style>`)
      .join("\n");
    const scripts = this.fileSystem
      .getAllFiles()
      .filter((file) => file.path.endsWith(".js") || file.path.endsWith(".ts"))
      .map((file) => `<script type="module" data-path="${file.path}">${file.node.content}</script>`)
      .join("\n");

    if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `${css}</head>`);
    } else {
      doc = `<head>${css}</head>` + doc;
    }
    if (doc.includes("</body>")) {
      doc = doc.replace("</body>", `${scripts}</body>`);
    } else {
      doc += scripts;
    }
    return doc;
  }

  refreshPreview() {
    const doc = this.buildPreviewDocument();
    this.elements.previewFrame.srcdoc = doc;
  }

  async persistState() {
    const snapshot = {
      tree: this.fileSystem.toJSON(),
      activeFilePath: this.activeFilePath,
      contextPaths: [...this.contextPaths],
      expandedPaths: [...this.expandedPaths],
      conversationHistory: this.conversationHistory,
    };
    await this.stateManager.saveSnapshot(snapshot);
  }

  toggleCommandPalette() {
    if (this.elements.paletteOverlay.classList.contains("hidden")) {
      this.openCommandPalette();
    } else {
      this.closeCommandPalette();
    }
  }

  openCommandPalette() {
    this.elements.paletteOverlay.classList.remove("hidden");
    this.elements.paletteOverlay.setAttribute("aria-hidden", "false");
    this.elements.paletteInput.value = "";
    this.renderCommandResults();
    setTimeout(() => this.elements.paletteInput.focus(), 10);
  }

  closeCommandPalette() {
    this.elements.paletteOverlay.classList.add("hidden");
    this.elements.paletteOverlay.setAttribute("aria-hidden", "true");
  }

  renderCommandResults() {
    const query = this.elements.paletteInput.value.trim().toLowerCase();
    const commands = this.getCommands().filter((command) =>
      command.label.toLowerCase().includes(query)
    );
    this.elements.paletteResults.innerHTML = "";
    commands.forEach((command) => {
      const li = document.createElement("li");
      li.textContent = command.label;
      li.addEventListener("click", () => {
        this.closeCommandPalette();
        command.action();
      });
      this.elements.paletteResults.appendChild(li);
    });
  }

  getCommands() {
    return [
      { label: "Create file", action: () => this.promptNewFile() },
      { label: "Create folder", action: () => this.promptNewFolder() },
      { label: "Import from ZIP", action: () => this.elements.zipInput.click() },
      { label: "Import from GitHub", action: () => this.promptGitHubImport() },
      { label: "Full context", action: () => this.applyContextPreset("full") },
      { label: "Smart context", action: () => this.applyContextPreset("smart") },
      { label: "Minimal context", action: () => this.applyContextPreset("minimal") },
      {
        label: "Reset workspace",
        action: async () => {
          if (confirm("Reset workspace to defaults?")) {
            await this.stateManager.clear();
            window.location.reload();
          }
        },
      },
    ];
  }
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new StanzifyApp();
    app.init();
  } catch (error) {
    console.error("Failed to start Stanzify", error);
    alert(error.message);
  }
});
