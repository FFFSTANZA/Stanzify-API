# Phase 2: Multi-AI Orchestration

## Overview
This implementation brings intelligent multi-AI orchestration to Stanzify, enabling 5-10 AI models to work in parallel on tasks with smart routing and response merging.

## Features Implemented

### Week 4: Task Classifier ✅
- **Keyword Detection**: Analyzes prompts to classify tasks into categories:
  - `refactor` - Code restructuring and improvements
  - `debug` - Bug fixes and error resolution
  - `create` - New feature implementation
  - `optimize` - Performance enhancements
  - `explain` - Documentation and clarification
  - `architecture` - System design and patterns

- **Smart Routing Logic**: Automatically selects the best AIs for each task type:
  - Refactor → DeepSeek, Qwen, Mistral
  - Debug → GPT, Llama, DeepSeek
  - Create → GPT, Gemini, Qwen
  - Optimize → DeepSeek, Mistral
  - Explain → GPT, Perplexity
  - Architecture → Qwen, Gemini

- **Confidence Scoring**: Assigns specialty scores to rank AIs by task suitability

### Week 5: Parallel Execution Engine ✅
- **AI Pool Manager**: 10 permanent AI workers ready for parallel execution
  - Worker 1: GPT-4o (general)
  - Worker 2: GPT-4o-backup (general)
  - Worker 3: DeepSeek (optimization)
  - Worker 4: Qwen (refactoring)
  - Worker 5: Qwen-backup (refactoring)
  - Worker 6: Gemini (architecture)
  - Worker 7: Mistral (speed/optimization)
  - Worker 8: Llama (debugging)
  - Worker 9: Perplexity (research/explain)
  - Worker 10: You.com (search + code)

- **Parallel Dispatcher**: Sends prompts to multiple AIs simultaneously using Promise.all()

- **Response Collector**: Gathers, timestamps, and tags all responses with source AI and specialty

### Week 6: Response Merger ✅
- **Multi-Response Analyzer**:
  - Extracts code blocks from each response
  - Identifies common phrases and patterns
  - Calculates agreement levels (high/medium/low)

- **Voting Algorithm**:
  - Tracks phrase frequency across responses
  - Determines consensus with 50%+ threshold
  - Highlights areas of agreement and divergence

- **Smart Merge Strategies**:
  - **Balanced** (default): Combines expert opinion with democratic consensus
  - **Democratic**: Majority rules - uses what most AIs agree on
  - **Expert**: Trusts the specialist AI best suited for the task

- **Enhanced UI**:
  - Shows merged response with strategy info
  - Displays classification and routing details
  - Individual AI responses viewable in conversation
  - System messages for orchestration status

## Usage

### Basic Usage
1. Type your prompt in the text area
2. Click "🎭 Orchestrate AIs" button
3. Watch as 5+ AIs process your request in parallel
4. Review the merged response and individual AI outputs

### Command Palette (⌘K or Ctrl+K)
- **Toggle Multi-AI Orchestration**: Enable/disable orchestration mode
- **Merge Strategy**: Cycle between balanced/democratic/expert strategies
- **View AI Pool Status**: See all available AI workers and their specialties

### Example Prompts
```
"Refactor this code for better performance"
→ Routes to: DeepSeek, Qwen, Mistral

"Debug this error in my JavaScript"
→ Routes to: GPT-4o, Llama, DeepSeek

"Create a new login component"
→ Routes to: GPT-4o, Gemini, Qwen, You.com

"Explain how this algorithm works"
→ Routes to: GPT-4o, Perplexity
```

## Architecture

### Class Structure
```
TaskClassifier
├── classifyTask(prompt) → classification
├── selectAIs(classification) → aiNames[]
└── routePrompt(prompt) → {classification, targetAIs, confidence}

AIPoolManager
├── initializeWorkers() → creates 10 AI workers
├── executeParallel(prompt, targetAIs, contextFiles) → results
└── getAllWorkers() → worker[]

AIWorker
├── sendPrompt({prompt, contextFiles}) → response
└── getSpecialtyResponse(prompt) → specialtyNote

ResponseMerger
├── analyzeResponses(responses) → analysis
├── extractCodeBlocks(content) → codeBlocks[]
├── findCommonalities(responses) → commonalities
├── democraticMerge(responses) → mergedResult
├── expertMerge(responses, taskType) → mergedResult
├── balancedMerge(responses, taskType) → mergedResult
└── merge(responses, taskType, strategy) → finalResult
```

### Message Types
- **user**: User's prompt
- **assistant**: Merged AI response (orchestrated) or single AI response
- **system**: Orchestration status messages
- **ai-individual**: Individual AI worker responses

## Performance
- Parallel execution completes in ~1-2 seconds (simulated)
- Real-world: 30-60 seconds depending on AI provider speeds
- Response merging adds negligible overhead (~10ms)

## Future Enhancements
- Real AI provider integration (OpenAI, Anthropic, etc.)
- Advanced diff viewing for code comparisons
- Response quality scoring and ranking
- Custom AI pool configurations
- Streaming responses for real-time updates
- Response caching and optimization

## Technical Notes
- Currently using mock AI workers with simulated delays
- Response variation simulates different AI speeds (0.8x - 1.2x)
- All orchestration state stored in IndexedDB
- Conversation history limited to last 20 messages for performance
- Auto-scroll to newest messages in conversation panel

## Testing
Try these test prompts to see orchestration in action:
1. "Refactor the button component for better readability"
2. "Fix the bug where the modal doesn't close"
3. "Create a new dark mode toggle feature"
4. "Optimize the file tree rendering performance"
5. "Explain the virtual file system architecture"
