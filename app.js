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

class TaskClassifier {
  constructor() {
    this.keywords = {
      refactor: ["refactor", "refactoring", "restructure", "reorganize", "clean up", "improve code"],
      debug: ["debug", "fix", "error", "bug", "issue", "problem", "not working", "broken"],
      create: ["create", "new", "add", "build", "make", "generate", "implement"],
      optimize: ["optimize", "performance", "faster", "efficient", "speed up", "improve performance"],
      explain: ["explain", "what does", "how does", "understand", "clarify", "documentation"],
      architecture: ["architecture", "design", "structure", "pattern", "organize", "system design"]
    };

    this.aiSpecialties = {
      "GPT-4o": ["general", "create", "debug", "explain"],
      "GPT-4o-backup": ["general", "create", "debug"],
      "DeepSeek": ["refactor", "optimize", "debug"],
      "Qwen": ["refactor", "architecture", "create"],
      "Qwen-backup": ["refactor", "architecture"],
      "Gemini": ["create", "architecture"],
      "Mistral": ["optimize"],
      "Llama": ["debug"],
      "Perplexity": ["explain"],
      "You.com": ["debug", "create"]
    };
  }

  classifyTask(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const scores = {};
    
    for (const [category, keywords] of Object.entries(this.keywords)) {
      scores[category] = keywords.reduce((score, keyword) => {
        return score + (lowerPrompt.includes(keyword) ? 1 : 0);
      }, 0);
    }

    const primaryTask = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0][0];

    return {
      primary: primaryTask,
      scores,
      allCategories: Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .map(([cat, _]) => cat)
    };
  }

  selectAIs(taskClassification, count = 5) {
    const { primary, allCategories } = taskClassification;
    const relevantCategories = allCategories.length > 0 ? allCategories : [primary];
    
    const aiScores = Object.entries(this.aiSpecialties).map(([aiName, specialties]) => {
      let score = 0;
      
      if (specialties.includes(primary)) score += 3;
      
      relevantCategories.forEach(category => {
        if (specialties.includes(category)) score += 1;
      });
      
      if (specialties.includes("general")) score += 0.5;
      
      return { aiName, score, specialties };
    });

    aiScores.sort((a, b) => b.score - a.score);
    
    return aiScores.slice(0, count).map(ai => ai.aiName);
  }

  routePrompt(prompt) {
    const classification = this.classifyTask(prompt);
    const targetAIs = this.selectAIs(classification, 5);
    
    return {
      classification,
      targetAIs,
      confidence: classification.scores[classification.primary] || 0
    };
  }
}

class AIWorker {
  constructor(id, name, specialty, responseVariation = 1.0) {
    this.id = id;
    this.name = name;
    this.specialty = specialty;
    this.responseVariation = responseVariation;
    this.connector = new RealAIConnector();
  }

  async sendPrompt({ prompt, contextFiles }) {
    const baseDelay = 800 + Math.random() * 1200;
    await delay(baseDelay * this.responseVariation);
    
    const summary = contextFiles
      .map((file) => `• ${file.path} (${file.content.length} chars)`)
      .join("\n");

    try {
      // Try to get real AI response
      const enhancedPrompt = this.buildSpecializedPrompt(prompt, summary);
      const realResponse = await this.connector.sendPrompt({
        prompt: enhancedPrompt,
        contextFiles
      });

      return {
        aiName: this.name,
        content: `${this.name} (${this.specialty} specialist) response:\n\n${realResponse}`,
        timestamp: Date.now(),
        specialty: this.specialty,
        isRealAI: true
      };
    } catch (error) {
      // Fallback to intelligent response
      const specialtyNote = this.getSpecialtyResponse(prompt);
      
      return {
        aiName: this.name,
        content: `${this.name} (${this.specialty} specialist) response:\n\n${specialtyNote}\n\nPrompt: ${prompt.slice(0, 150)}${prompt.length > 150 ? "..." : ""}\n\nContext files (${contextFiles.length}):\n${summary || "none"}\n\nℹ️ Note: Running in offline mode. Configure API keys for real AI responses.`,
        timestamp: Date.now(),
        specialty: this.specialty,
        isRealAI: false
      };
    }
  }

  buildSpecializedPrompt(prompt, contextSummary) {
    const specialtyContext = this.getSpecialtyContext();
    
    return `You are ${this.name}, a ${this.specialty} specialist AI assistant.

Your specialty: ${specialtyContext}

User prompt: ${prompt}

Context files:
${contextSummary}

Please provide a comprehensive response focusing on your ${this.specialty} expertise. Include specific recommendations, code examples, and actionable insights.`;
  }

  getSpecialtyContext() {
    const contexts = {
      general: "You provide well-rounded, comprehensive solutions across all programming domains with expertise in best practices, design patterns, and clean code principles.",
      refactor: "You specialize in code refactoring, focusing on improving code structure, readability, maintainability, and adherence to SOLID principles and design patterns.",
      debug: "You excel at debugging and troubleshooting. You systematically analyze problems, identify root causes, and provide precise fixes with detailed explanations.",
      optimize: "You focus on performance optimization, including algorithm efficiency, memory usage, computational complexity, and runtime performance improvements.",
      architecture: "You specialize in software architecture and system design, recommending scalable patterns, proper separation of concerns, and maintainable structures.",
      create: "You excel at creating new features and components, following best practices, clean architecture, and modern development patterns."
    };
    
    return contexts[this.specialty] || contexts.general;
  }

  getSpecialtyResponse(prompt) {
    const responses = {
      general: "I provide well-rounded, comprehensive solutions across various programming tasks.",
      refactor: "I analyze code for refactoring opportunities. Based on the prompt, I would recommend restructuring for better maintainability, reducing complexity, and improving readability.",
      debug: "I systematically debug issues by examining error patterns, testing edge cases, and providing step-by-step troubleshooting guidance.",
      optimize: "I identify performance bottlenecks and suggest optimizations including algorithmic improvements, memory management, and efficient data structures.",
      architecture: "I design scalable architectures using proven patterns, considering separation of concerns, dependency injection, and maintainable structures.",
      create: "I create robust features following best practices, including proper error handling, validation, and clean code principles."
    };
    
    return responses[this.specialty] || responses.general;
  }
}

class AIPoolManager {
  constructor() {
    this.workers = new Map();
    this.initializeWorkers();
  }

  initializeWorkers() {
    const workerConfigs = [
      { id: "worker-1", name: "GPT-4o", specialty: "general", variation: 1.0 },
      { id: "worker-2", name: "GPT-4o-backup", specialty: "general", variation: 1.1 },
      { id: "worker-3", name: "DeepSeek", specialty: "optimize", variation: 0.9 },
      { id: "worker-4", name: "Qwen", specialty: "refactor", variation: 1.0 },
      { id: "worker-5", name: "Qwen-backup", specialty: "refactor", variation: 1.05 },
      { id: "worker-6", name: "Gemini", specialty: "architecture", variation: 1.2 },
      { id: "worker-7", name: "Mistral", specialty: "optimize", variation: 0.8 },
      { id: "worker-8", name: "Llama", specialty: "debug", variation: 1.0 },
      { id: "worker-9", name: "Perplexity", specialty: "general", variation: 1.1 },
      { id: "worker-10", name: "You.com", specialty: "create", variation: 0.95 }
    ];

    workerConfigs.forEach(config => {
      const worker = new AIWorker(config.id, config.name, config.specialty, config.variation);
      this.workers.set(config.name, worker);
    });
  }

  async executeParallel(prompt, targetAIs, contextFiles) {
    const promises = targetAIs.map(aiName => {
      const worker = this.workers.get(aiName);
      if (!worker) {
        return Promise.resolve({
          aiName,
          content: `Worker ${aiName} not found`,
          timestamp: Date.now(),
          specialty: "unknown",
          error: true
        });
      }
      return worker.sendPrompt({ prompt, contextFiles });
    });

    const results = await Promise.all(promises);
    
    return {
      responses: results,
      timestamp: Date.now(),
      prompt,
      aiCount: targetAIs.length
    };
  }

  getWorker(name) {
    return this.workers.get(name);
  }

  getAllWorkers() {
    return Array.from(this.workers.values());
  }
}

class ResponseMerger {
  constructor() {
    this.expertWeights = {
      refactor: { "DeepSeek": 3, "Qwen": 2.5, "Qwen-backup": 2 },
      debug: { "Llama": 3, "GPT-4o": 2.5, "DeepSeek": 2 },
      optimize: { "DeepSeek": 3, "Mistral": 2.5 },
      architecture: { "Qwen": 3, "Gemini": 2.5 },
      create: { "GPT-4o": 3, "Gemini": 2.5, "You.com": 2 },
      explain: { "GPT-4o": 3, "Perplexity": 2.5 }
    };
  }

  analyzeResponses(responses) {
    const analysis = {
      totalResponses: responses.length,
      bySpecialty: {},
      contentLengths: [],
      timestamps: []
    };

    responses.forEach(response => {
      if (!analysis.bySpecialty[response.specialty]) {
        analysis.bySpecialty[response.specialty] = [];
      }
      analysis.bySpecialty[response.specialty].push(response);
      analysis.contentLengths.push(response.content.length);
      analysis.timestamps.push(response.timestamp);
    });

    return analysis;
  }

  extractCodeBlocks(content) {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const blocks = content.match(codeBlockRegex) || [];
    return blocks.map(block => block.replace(/```[\w]*\n?/g, '').trim());
  }

  findCommonalities(responses) {
    const allCodeBlocks = responses.map(r => this.extractCodeBlocks(r.content));
    
    const commonPhrases = [];
    responses.forEach((response, idx) => {
      const words = response.content.toLowerCase().split(/\s+/);
      const phrases = [];
      
      for (let i = 0; i < words.length - 2; i++) {
        phrases.push(words.slice(i, i + 3).join(' '));
      }
      
      phrases.forEach(phrase => {
        let count = 0;
        responses.forEach((r, i) => {
          if (i !== idx && r.content.toLowerCase().includes(phrase)) {
            count++;
          }
        });
        
        if (count >= Math.ceil(responses.length * 0.5)) {
          commonPhrases.push(phrase);
        }
      });
    });

    return {
      codeBlocks: allCodeBlocks,
      commonPhrases: [...new Set(commonPhrases)].slice(0, 10),
      agreementLevel: commonPhrases.length > 5 ? "high" : commonPhrases.length > 2 ? "medium" : "low"
    };
  }

  democraticMerge(responses) {
    const analysis = this.analyzeResponses(responses);
    const commonalities = this.findCommonalities(responses);
    
    const majorityResponse = responses.reduce((acc, response) => {
      return response.content.length > acc.content.length ? response : acc;
    }, responses[0]);

    return {
      strategy: "democratic",
      content: `MERGED RESPONSE (Democratic - ${responses.length} AIs consulted)\n\n` +
               `Agreement Level: ${commonalities.agreementLevel.toUpperCase()}\n\n` +
               `Common insights:\n${commonalities.commonPhrases.slice(0, 5).map(p => `• ${p}`).join('\n')}\n\n` +
               `Base response:\n${majorityResponse.content}\n\n` +
               `Note: This synthesis represents the consensus of ${responses.length} AI models.`,
      analysis,
      commonalities
    };
  }

  expertMerge(responses, taskType) {
    const weights = this.expertWeights[taskType] || {};
    
    let bestResponse = responses[0];
    let bestScore = 0;

    responses.forEach(response => {
      const weight = weights[response.aiName] || 1;
      const score = weight * (1 + response.content.length / 1000);
      
      if (score > bestScore) {
        bestScore = score;
        bestResponse = response;
      }
    });

    return {
      strategy: "expert",
      content: `MERGED RESPONSE (Expert - ${bestResponse.aiName} selected as specialist)\n\n` +
               `Task Type: ${taskType}\n` +
               `Expert: ${bestResponse.aiName} (${bestResponse.specialty})\n` +
               `Confidence Score: ${bestScore.toFixed(2)}\n\n` +
               `${bestResponse.content}\n\n` +
               `Note: This AI was selected as the top specialist for ${taskType} tasks.`,
      expert: bestResponse.aiName,
      score: bestScore
    };
  }

  balancedMerge(responses, taskType) {
    const democratic = this.democraticMerge(responses);
    const expert = this.expertMerge(responses, taskType);
    
    return {
      strategy: "balanced",
      content: `MERGED RESPONSE (Balanced Approach)\n\n` +
               `Combining democratic consensus with expert opinion for optimal results.\n\n` +
               `TOP EXPERT RECOMMENDATION (${expert.expert}):\n${expert.content}\n\n` +
               `CONSENSUS VIEW:\n${democratic.content}`,
      democratic,
      expert
    };
  }

  merge(responses, taskType, strategy = "balanced") {
    if (!responses || responses.length === 0) {
      return { strategy: "none", content: "No responses to merge", responses: [] };
    }

    if (responses.length === 1) {
      return {
        strategy: "single",
        content: responses[0].content,
        responses
      };
    }

    let result;
    switch (strategy) {
      case "democratic":
        result = this.democraticMerge(responses);
        break;
      case "expert":
        result = this.expertMerge(responses, taskType);
        break;
      case "balanced":
      default:
        result = this.balancedMerge(responses, taskType);
        break;
    }

    result.responses = responses;
    result.taskType = taskType;
    
    return result;
  }
}

class ComplexityAnalyzer {
  async analyzeComplexity(prompt) {
    const keywords = {
      simple: ["button", "style", "css", "color", "simple", "fix", "small"],
      medium: ["api", "integration", "component", "function", "refactor", "improve"],
      complex: ["auth", "database", "system", "architecture", "infrastructure"]
    };

    const lowerPrompt = prompt.toLowerCase();
    
    let score = 5;
    
    keywords.complex.forEach(keyword => {
      if (lowerPrompt.includes(keyword)) score = Math.min(10, score + 2);
    });
    
    keywords.medium.forEach(keyword => {
      if (lowerPrompt.includes(keyword)) score = Math.min(10, score + 1);
    });
    
    keywords.simple.forEach(keyword => {
      if (lowerPrompt.includes(keyword)) score = Math.max(1, score - 1);
    });

    score = Math.min(10, Math.max(1, score));
    
    let rounds = 3;
    if (score <= 3) rounds = 2;
    else if (score >= 8) rounds = 5;
    
    return {
      complexity: score,
      rounds,
      difficulty: score <= 3 ? "simple" : score <= 7 ? "medium" : "complex"
    };
  }
}

class RecursiveRefinementEngine {
  constructor(taskClassifier, aiPoolManager, responseMerger) {
    this.taskClassifier = taskClassifier;
    this.aiPoolManager = aiPoolManager;
    this.responseMerger = responseMerger;
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  async executeRound(prompt, code, roundNumber, maxRounds, contextFiles, roundPurpose, selectedAIs) {
    const refinedPrompt = this.buildRoundPrompt(prompt, code, roundNumber, roundPurpose);
    
    const executionResult = await this.aiPoolManager.executeParallel(
      refinedPrompt,
      selectedAIs,
      contextFiles
    );

    const mergedResult = this.responseMerger.merge(
      executionResult.responses,
      "refactor",
      "balanced"
    );

    return {
      round: roundNumber,
      purpose: roundPurpose,
      prompt: refinedPrompt,
      responses: executionResult.responses,
      merged: mergedResult,
      code: this.extractCode(mergedResult.content)
    };
  }

  buildRoundPrompt(originalPrompt, currentCode, roundNumber, purpose) {
    const prompts = {
      1: `Original request: ${originalPrompt}\n\nGenerate the initial solution.`,
      2: `Original code:\n\`\`\`\n${currentCode}\n\`\`\`\n\n${purpose}`,
      3: `Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nApply these critiques and improvements.`,
      4: `Original request: ${originalPrompt}\n\nImproved code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nCompare and validate: Is this better? What issues remain?`,
      5: `Final code:\n\`\`\`\n${currentCode}\n\`\`\`\n\n${purpose}`
    };
    
    return prompts[roundNumber] || prompts[1];
  }

  extractCode(content) {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const blocks = content.match(codeBlockRegex) || [];
    if (blocks.length > 0) {
      return blocks[0].replace(/```[\w]*\n?/g, '').trim();
    }
    return content.slice(0, 500);
  }

  async getQualityScore(code) {
    const metrics = {
      length: Math.min(code.length / 1000, 2),
      completeness: code.includes("function") || code.includes("class") ? 1 : 0.5,
      documentation: (code.match(/\/\//g) || []).length / Math.max(code.split('\n').length / 10, 1),
      structure: code.includes("{") && code.includes("}") ? 1 : 0
    };

    const score = (metrics.length + metrics.completeness + metrics.documentation + metrics.structure) / 4 * 10;
    return Math.min(10, score);
  }

  async recursiveRefine(prompt, contextFiles, adaptiveRounds = false) {
    const classification = this.taskClassifier.classifyTask(prompt);
    let code = "";
    let rounds = 5;

    if (adaptiveRounds) {
      const complexity = await this.complexityAnalyzer.analyzeComplexity(prompt);
      rounds = complexity.rounds;
    }

    const refinementHistory = [];
    const roundData = [];

    const selectedAIs = {
      1: this.taskClassifier.selectAIs(classification, 5),
      2: this.taskClassifier.selectAIs(classification, 3),
      3: this.taskClassifier.selectAIs(classification, 3),
      4: this.taskClassifier.selectAIs(classification, 1),
      5: this.taskClassifier.selectAIs(classification, 2)
    };

    for (let round = 1; round <= rounds; round++) {
      let purposeText = "";
      switch (round) {
        case 1:
          purposeText = "Generate the initial solution based on the request.";
          break;
        case 2:
          purposeText = "Identify what's suboptimal, inefficient, or missing.";
          break;
        case 3:
          purposeText = "Improve the code based on the identified critiques.";
          break;
        case 4:
          purposeText = "Validate the improvements. Is it better? What issues remain?";
          break;
        case 5:
          purposeText = "Apply final polish for consistency, clarity, and optimization.";
          break;
      }

      const roundResult = await this.executeRound(
        prompt,
        code,
        round,
        rounds,
        contextFiles,
        purposeText,
        selectedAIs[round]
      );

      code = roundResult.code || code;
      roundData.push(roundResult);
      refinementHistory.push(`Round ${round}: ${purposeText}`);

      if (round < rounds) {
        const score = await this.getQualityScore(code);
        if (score >= 9.5) {
          refinementHistory.push(`✓ Quality score ${score.toFixed(1)}/10 - Early exit triggered`);
          break;
        }
      }
    }

    return {
      finalCode: code,
      refinementHistory,
      roundData,
      totalRounds: roundData.length
    };
  }
}

class ParallelRefinementTracks {
  constructor(taskClassifier, aiPoolManager, responseMerger) {
    this.taskClassifier = taskClassifier;
    this.aiPoolManager = aiPoolManager;
    this.responseMerger = responseMerger;
    this.refinementEngine = new RecursiveRefinementEngine(
      taskClassifier,
      aiPoolManager,
      responseMerger
    );
  }

  async executeTrack(trackName, prompt, contextFiles, ais, focus) {
    const modifiedPrompt = `${prompt}\n\nFocus: ${focus}`;
    const classification = this.taskClassifier.classifyTask(prompt);

    let code = "";
    const trackHistory = [];

    for (let round = 1; round <= 3; round++) {
      const roundPrompt = round === 1 
        ? modifiedPrompt 
        : `Previous code:\n\`\`\`\n${code}\n\`\`\`\n\nImprove further with focus on: ${focus}`;

      const executionResult = await this.aiPoolManager.executeParallel(
        roundPrompt,
        ais,
        contextFiles
      );

      const mergedResult = this.responseMerger.merge(
        executionResult.responses,
        classification.primary,
        "balanced"
      );

      code = this.refinementEngine.extractCode(mergedResult.content) || code;
      trackHistory.push({
        round,
        merged: mergedResult.content,
        code
      });
    }

    return {
      track: trackName,
      finalCode: code,
      history: trackHistory,
      focus
    };
  }

  async executeParallelTracks(prompt, contextFiles) {
    const trackA = this.executeTrack(
      "Track A: Performance-Optimized",
      prompt,
      contextFiles,
      ["DeepSeek", "Mistral"],
      "speed, efficiency, memory optimization"
    );

    const trackB = this.executeTrack(
      "Track B: Readability-Optimized",
      prompt,
      contextFiles,
      ["GPT-4o", "Perplexity"],
      "clean, maintainable, well-documented code"
    );

    const trackC = this.executeTrack(
      "Track C: Balanced",
      prompt,
      contextFiles,
      ["Qwen", "Gemini", "Llama"],
      "balance between all factors"
    );

    const results = await Promise.all([trackA, trackB, trackC]);

    return {
      tracks: results,
      timestamp: Date.now(),
      prompt
    };
  }
}

class RealAIConnector {
  constructor() {
    this.id = "real-ai-connector";
    this.label = "AI Connector (Real Integration)";
    this.apiKey = this.getApiKey();
    this.baseURL = this.getBaseURL();
  }

  getApiKey() {
    // Check localStorage first, then environment, then prompt user
    return localStorage.getItem('ai_api_key') || 
           window.AI_API_KEY || 
           this.promptForApiKey();
  }

  getBaseURL() {
    const provider = localStorage.getItem('ai_provider') || 
                    window.AI_PROVIDER || 
                    'openai';
    
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com';
      case 'huggingface':
        return 'https://api-inference.huggingface.co/models';
      default:
        return 'https://api.openai.com/v1';
    }
  }

  promptForApiKey() {
    const apiKey = prompt('Enter your AI API key (OpenAI, Anthropic, etc.):');
    if (apiKey) {
      localStorage.setItem('ai_api_key', apiKey);
      return apiKey;
    }
    return null;
  }

  async sendPrompt({ prompt, contextFiles }) {
    if (!this.apiKey) {
      return this.fallbackResponse(prompt, contextFiles);
    }

    try {
      const summary = contextFiles
        .map((file) => `• ${file.path} (${file.content.length} chars)`)
        .join("\n");

      const enhancedPrompt = this.buildEnhancedPrompt(prompt, contextFiles, summary);
      
      const response = await this.makeAPIRequest(enhancedPrompt);
      
      if (response.error) {
        return this.fallbackResponse(prompt, contextFiles, response.error);
      }

      return response.content;
    } catch (error) {
      console.warn('AI API request failed:', error);
      return this.fallbackResponse(prompt, contextFiles, error.message);
    }
  }

  buildEnhancedPrompt(originalPrompt, contextFiles, fileSummary) {
    return `You are an expert code assistant. The user is asking for help with their code.

User Request: ${originalPrompt}

Context Files (${contextFiles.length}):
${fileSummary || "No additional context files"}

Please provide a detailed, helpful response that directly addresses their request. Include code examples where relevant and explain your reasoning.`;
  }

  async makeAPIRequest(prompt) {
    try {
      const provider = localStorage.getItem('ai_provider') || 'openai';
      
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(prompt);
        case 'anthropic':
          return await this.callAnthropic(prompt);
        case 'huggingface':
          return await this.callHuggingFace(prompt);
        default:
          return await this.callOpenAI(prompt);
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  async callOpenAI(prompt) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error?.message || 'OpenAI API request failed' };
    }

    const data = await response.json();
    return { content: data.choices[0]?.message?.content || 'No response generated' };
  }

  async callAnthropic(prompt) {
    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error?.message || 'Anthropic API request failed' };
    }

    const data = await response.json();
    return { content: data.content[0]?.text || 'No response generated' };
  }

  async callHuggingFace(prompt) {
    const model = localStorage.getItem('hf_model') || 'microsoft/DialoGPT-medium';
    
    const response = await fetch(`${this.baseURL}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 1000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { error: 'Hugging Face API request failed: ' + error };
    }

    const data = await response.json();
    return { content: Array.isArray(data) ? data[0]?.generated_text || 'No response generated' : data.generated_text || 'No response generated' };
  }

  fallbackResponse(prompt, contextFiles, error = null) {
    const summary = contextFiles
      .map((file) => `• ${file.path} (${file.content.length} chars)`)
      .join("\n");

    let response = `AI Assistant Response\n\n`;
    if (error) {
      response += `⚠️ API Error: ${error}\n\n`;
      response += `Falling back to offline mode.\n\n`;
    } else {
      response += `Running in offline/development mode.\n\n`;
    }

    response += `Prompt: ${prompt.slice(0, 200)}${prompt.length > 200 ? "..." : ""}\n\n`;
    response += `Context files (${contextFiles.length}):\n${summary || "none supplied"}\n\n`;
    response += `💡 Tip: Configure an AI API key in localStorage to enable real AI responses:\n`;
    response += `localStorage.setItem('ai_api_key', 'your-api-key')\n`;
    response += `localStorage.setItem('ai_provider', 'openai|anthropic|huggingface')\n\n`;
    response += `I'm analyzing your code and providing guidance based on best practices...`;

    return response;
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
    this.connector = new RealAIConnector();
    this.taskClassifier = new TaskClassifier();
    this.aiPoolManager = new AIPoolManager();
    this.responseMerger = new ResponseMerger();
    this.recursiveRefinementEngine = new RecursiveRefinementEngine(
      this.taskClassifier,
      this.aiPoolManager,
      this.responseMerger
    );
    this.parallelRefinementTracks = new ParallelRefinementTracks(
      this.taskClassifier,
      this.aiPoolManager,
      this.responseMerger
    );
    this.orchestrationEnabled = true;
    this.lastOrchestrationResult = null;
    this.mergeStrategy = "balanced";
    this.refinementMode = "none";
    this.lastRefinementResult = null;
    this.elements = {};
    this.previewDirty = false;
    this.refreshPreviewDebounced = debounce(() => this.refreshPreview(), 500);
    this.persistStateDebounced = debounce(() => this.persistState(), 400);
    
    // Phase 3: Verification Layer
    this.codeValidator = new CodeValidator();
    this.syntaxChecker = new SyntaxChecker();
    this.testGenerator = new TestGenerator(this.aiPoolManager);
    this.autoFixPipeline = new AutoFixPipeline(this.aiPoolManager, this.codeValidator, this.syntaxChecker);
    this.qualityScorer = new QualityScorer(this.aiPoolManager);
    this.verificationUI = new VerificationUI();
    this.verificationEnabled = true;
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
    
    // Initialize verification layer UI
    await this.initializeVerificationLayer();
  }
  
  async initializeVerificationLayer() {
    // Initialize verification code validators
    await this.codeValidator.initializeTools();
    
    // Load test generator tools
    await this.testGenerator.loadJest();
    
    // Load auto-fix statistics
    this.autoFixPipeline.loadStatistics();
    
    // Initialize verification UI
    this.verificationUI.initialize(this.elements.editorPanel);
    
    // Set up editor change listener for verification
    if (this.editor) {
      this.editor.onDidChangeModelContent(() => {
        if (this.verificationEnabled) {
          this.runVerificationCheck();
        }
      });
    }
  }
  
  async runVerificationCheck() {
    if (!this.verificationEnabled || !this.editor) return;
    
    const model = this.editor.getModel();
    if (!model) return;
    
    const code = model.getValue();
    const filePath = model.uri.path;
    
    // Run validation
    const validation = await this.codeValidator.validateAndFormat(code, filePath);
    this.verificationUI.displayValidation(validation);
    
    // If no validation errors, run quality assessment
    if (validation.isValid && code.length > 50) {
      this.verificationUI.showLoading('quality');
      try {
        const assessment = await this.qualityScorer.assessCode(code);
        this.verificationUI.displayQuality(assessment);
      } catch (error) {
        console.warn('Quality assessment failed:', error);
      }
    }
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
      editorPanel: document.querySelector(".editor-panel"),
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
    this.conversationHistory.slice(-20).forEach((message) => {
      const node = document.createElement("div");
      node.className = `message ${message.role}`;
      
      const header = document.createElement("div");
      header.className = "message-header";
      
      let roleName = "Unknown";
      if (message.role === "user") {
        roleName = "You";
      } else if (message.role === "assistant") {
        roleName = message.orchestrated 
          ? `🎭 Merged (${message.aiCount} AIs · ${message.strategy})` 
          : "GPT-4o mini";
      } else if (message.role === "ai-individual") {
        roleName = `${message.aiName} (${message.specialty})`;
      } else if (message.role === "system") {
        roleName = "System";
      }
      
      header.innerHTML = `<span>${roleName}</span><span>${new Date(message.timestamp).toLocaleTimeString()}</span>`;
      
      const body = document.createElement("div");
      body.className = "message-body";
      body.style.whiteSpace = "pre-wrap";
      body.textContent = message.content;
      
      node.appendChild(header);
      node.appendChild(body);
      container.appendChild(node);
    });
    
    container.scrollTop = container.scrollHeight;
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

      if (this.orchestrationEnabled) {
        const routing = this.taskClassifier.routePrompt(prompt);
        const { classification, targetAIs } = routing;
        
        this.appendMessage({
          role: "system",
          content: `🎯 Task Classification: ${classification.primary}\n🤖 Routing to: ${targetAIs.join(", ")}\n⚡ Executing in parallel...`
        });

        this.setPromptStatus(`Orchestrating ${targetAIs.length} AIs...`);
        
        const executionResult = await this.aiPoolManager.executeParallel(
          prompt,
          targetAIs,
          contextFiles
        );

        this.setPromptStatus("Merging responses...");
        
        const mergedResult = this.responseMerger.merge(
          executionResult.responses,
          classification.primary,
          this.mergeStrategy
        );

        this.lastOrchestrationResult = {
          ...mergedResult,
          routing,
          executionResult
        };

        this.appendMessage({
          role: "assistant",
          content: mergedResult.content,
          orchestrated: true,
          aiCount: targetAIs.length,
          taskType: classification.primary,
          strategy: mergedResult.strategy
        });

        this.appendMessage({
          role: "system",
          content: `✅ Orchestration complete! ${executionResult.responses.length} AIs responded.\n📊 View individual responses in conversation history.`
        });

        executionResult.responses.forEach((response, idx) => {
          this.appendMessage({
            role: "ai-individual",
            content: response.content,
            aiName: response.aiName,
            specialty: response.specialty,
            timestamp: response.timestamp
          });
        });
      } else {
        const response = await this.connector.sendPrompt({ prompt, contextFiles });
        this.appendMessage({ role: "assistant", content: response });
      }
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
    if (!isBusy) {
      this.elements.sendPromptBtn.textContent = this.orchestrationEnabled 
        ? "🎭 Orchestrate AIs" 
        : "Send to GPT-4o mini";
    }
  }

  setPromptStatus(status) {
    this.elements.sendPromptBtn.textContent = status;
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
        label: `${this.orchestrationEnabled ? "✓" : "○"} Toggle Multi-AI Orchestration`,
        action: () => {
          this.orchestrationEnabled = !this.orchestrationEnabled;
          this.setPromptBusy(false);
          alert(`Multi-AI Orchestration ${this.orchestrationEnabled ? "ENABLED" : "DISABLED"}\n\n${this.orchestrationEnabled ? "Prompts will be routed to 5-10 AIs in parallel" : "Using single AI mode"}`);
        }
      },
      {
        label: `Merge Strategy: ${this.mergeStrategy}`,
        action: () => {
          const strategies = ["balanced", "democratic", "expert"];
          const currentIdx = strategies.indexOf(this.mergeStrategy);
          const nextIdx = (currentIdx + 1) % strategies.length;
          this.mergeStrategy = strategies[nextIdx];
          alert(`Merge Strategy changed to: ${this.mergeStrategy.toUpperCase()}\n\n${this.getMergeStrategyDescription(this.mergeStrategy)}`);
        }
      },
      {
        label: "View AI Pool Status",
        action: () => {
          const workers = this.aiPoolManager.getAllWorkers();
          const status = workers.map(w => `• ${w.name} (${w.specialty})`).join('\n');
          alert(`AI Pool Manager\n\n${workers.length} workers ready:\n\n${status}`);
        }
      },
      // Phase 3: Verification Layer Commands
      {
        label: `${this.verificationEnabled ? "✓" : "○"} Toggle Code Verification`,
        action: () => {
          this.verificationEnabled = !this.verificationEnabled;
          if (this.verificationEnabled) {
            this.verificationUI.show();
            this.runVerificationCheck();
          } else {
            this.verificationUI.hide();
          }
          alert(`Code Verification ${this.verificationEnabled ? "ENABLED" : "DISABLED"}`);
        }
      },
      {
        label: "Run Verification Check",
        action: () => {
          this.runVerificationCheck();
        }
      },
      {
        label: "Auto-Fix Errors",
        action: async () => {
          const model = this.editor?.getModel();
          if (!model) {
            alert("No file open in editor");
            return;
          }
          
          const code = model.getValue();
          this.verificationUI.displayAutoFixProgress(1, 3);
          
          const result = await this.autoFixPipeline.generateWithValidation("", code);
          this.verificationUI.displayAutoFixComplete(result);
          
          if (result.success) {
            model.setValue(result.formatted || result.code);
          }
        }
      },
      {
        label: "Generate & Run Tests",
        action: async () => {
          const model = this.editor?.getModel();
          if (!model) {
            alert("No file open in editor");
            return;
          }
          
          const code = model.getValue();
          const result = await this.testGenerator.generateAndTest(code);
          this.verificationUI.displayTestResults(result.execution);
        }
      },
      {
        label: "Auto-Fix Statistics",
        action: () => {
          const stats = this.autoFixPipeline.getStatistics();
          const report = Object.entries(stats)
            .map(([type, stat]) => `${type}: ${stat.aiName} (${stat.successRate} success, ${stat.attempts} attempts)`)
            .join('\n');
          alert(`Auto-Fix Learning Statistics:\n\n${report}`);
        }
      },
      {
        label: "RR-5: 5-Round Recursive Refinement (Fixed)",
        action: () => this.promptRecursiveRefinement(false)
      },
      {
        label: "RR-5: Adaptive Refinement (Auto-Complexity)",
        action: () => this.promptRecursiveRefinement(true)
      },
      {
        label: "RR-5: Parallel Refinement Tracks (3 Paths)",
        action: () => this.promptParallelTracks()
      },
      {
        label: "View Last Refinement Result",
        action: () => this.viewLastRefinementResult()
      },
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

  async promptRecursiveRefinement(adaptive = false) {
    const prompt = this.elements.promptInput.value.trim();
    if (!prompt) {
      alert("Please enter a prompt first");
      return;
    }

    this.appendMessage({
      role: "system",
      content: `🔄 Starting ${adaptive ? "Adaptive" : "Fixed 5-Round"} Recursive Refinement...\n${adaptive ? "Analyzing complexity..." : "Beginning 5-round refinement..."}`
    });

    this.setPromptBusy(true);

    try {
      const contextFiles = [...this.contextPaths].map((path) => ({
        path,
        content: this.fileSystem.getNode(path)?.content || "",
      }));

      this.setPromptStatus("Initiating refinement rounds...");

      const result = await this.recursiveRefinementEngine.recursiveRefine(
        prompt,
        contextFiles,
        adaptive
      );

      this.lastRefinementResult = result;

      this.appendMessage({
        role: "system",
        content: `✅ Refinement complete! (${result.totalRounds} rounds)\n\nHistory:\n${result.refinementHistory.join("\n")}`
      });

      this.appendMessage({
        role: "assistant",
        content: `REFINED CODE (v${result.totalRounds}):\n\n\`\`\`\n${result.finalCode}\n\`\`\``,
        refinement: true,
        refinementRounds: result.totalRounds,
        refinementType: adaptive ? "adaptive" : "fixed"
      });

    } catch (error) {
      this.appendMessage({
        role: "assistant",
        content: `Refinement error: ${error.message}`
      });
    } finally {
      this.setPromptBusy(false);
    }
  }

  async promptParallelTracks() {
    const prompt = this.elements.promptInput.value.trim();
    if (!prompt) {
      alert("Please enter a prompt first");
      return;
    }

    this.appendMessage({
      role: "system",
      content: "🎭 Launching 3 Parallel Refinement Tracks...\n• Track A: Performance-Optimized\n• Track B: Readability-Optimized\n• Track C: Balanced\n\nExecuting in parallel..."
    });

    this.setPromptBusy(true);

    try {
      const contextFiles = [...this.contextPaths].map((path) => ({
        path,
        content: this.fileSystem.getNode(path)?.content || "",
      }));

      this.setPromptStatus("Executing parallel tracks...");

      const result = await this.parallelRefinementTracks.executeParallelTracks(
        prompt,
        contextFiles
      );

      this.lastRefinementResult = result;

      result.tracks.forEach((track, idx) => {
        this.appendMessage({
          role: "assistant",
          content: `${track.track} - FINAL CODE:\n\n\`\`\`\n${track.finalCode}\n\`\`\`\n\nFocus: ${track.focus}`,
          refinement: true,
          refinementType: "parallel-track",
          trackName: track.track,
          trackIndex: idx
        });
      });

      this.appendMessage({
        role: "system",
        content: "✅ All 3 tracks completed! Review above for each evolution path.\n\nRecommendation: Choose the track that best fits your project's priorities (performance, readability, or balance)."
      });

    } catch (error) {
      this.appendMessage({
        role: "assistant",
        content: `Parallel tracks error: ${error.message}`
      });
    } finally {
      this.setPromptBusy(false);
    }
  }

  viewLastRefinementResult() {
    if (!this.lastRefinementResult) {
      alert("No refinement result available. Run a refinement first.");
      return;
    }

    const result = this.lastRefinementResult;
    
    if (result.tracks) {
      const summary = result.tracks.map(track => 
        `${track.track}:\n${track.finalCode.slice(0, 200)}...`
      ).join("\n\n");
      alert(`Last Refinement (Parallel Tracks):\n\n${summary}`);
    } else if (result.refinementHistory) {
      alert(`Last Refinement Result:\n\nRounds: ${result.totalRounds}\n\nHistory:\n${result.refinementHistory.join("\n")}\n\nFinal code length: ${result.finalCode.length} chars`);
    }
  }

  getMergeStrategyDescription(strategy) {
    const descriptions = {
      balanced: "Combines expert opinion with democratic consensus for optimal results",
      democratic: "Uses majority voting - what most AIs agree on wins",
      expert: "Trusts the specialist AI most suited for the task type"
    };
    return descriptions[strategy] || "Unknown strategy";
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
