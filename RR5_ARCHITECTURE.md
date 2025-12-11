# RR-5 Architecture & Implementation Details

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│         (Command Palette + Conversation History)               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                     StanzifyApp                                 │
│  (UI Controller + Command Handlers)                            │
│                                                                  │
│  - promptRecursiveRefinement()  → Calls RecursiveRefinementEngine
│  - promptParallelTracks()       → Calls ParallelRefinementTracks
│  - appendMessage()              → Updates conversation history
└────────────────┬────────────────────────────────────────────────┘
                 │
         ┌───────┴───────┐
         ↓               ↓
    ┌──────────┐   ┌──────────────┐
    │ RR5      │   │ Parallel     │
    │Engine    │   │ Tracks       │
    └────┬─────┘   └──────┬───────┘
         │                │
         └────────┬───────┘
                  ↓
    ┌──────────────────────────────────┐
    │   AI Orchestration Core          │
    │                                  │
    │  - TaskClassifier                │
    │  - AIPoolManager                 │
    │  - ResponseMerger                │
    │  - ComplexityAnalyzer            │
    └──────────────────────────────────┘
```

---

## Core Classes

### 1. ComplexityAnalyzer

**Purpose**: Analyze prompt complexity to determine adaptive round count

**Key Methods**:
```javascript
async analyzeComplexity(prompt: string): {
  complexity: number,      // 1-10 scale
  rounds: number,          // 2, 3, or 5
  difficulty: string       // "simple", "medium", "complex"
}
```

**Algorithm**:
1. Scan prompt for keywords in three categories
2. Assign points based on category matches
3. Apply adjustments (complex +2, medium +1, simple -1)
4. Clamp to 1-10 range
5. Map score to rounds:
   - 1-3 → 2 rounds
   - 4-7 → 3 rounds
   - 8-10 → 5 rounds

**Keyword Categories**:
```javascript
{
  complex: ["auth", "database", "system", "architecture", "infrastructure"],
  medium: ["api", "integration", "component", "function", "refactor"],
  simple: ["button", "style", "css", "color", "simple", "fix", "small"]
}
```

### 2. RecursiveRefinementEngine

**Purpose**: Execute multi-round refinement with self-critique and improvement

**Key Methods**:
```javascript
async recursiveRefine(
  prompt: string,
  contextFiles: File[],
  adaptiveRounds: boolean = false
): {
  finalCode: string,
  refinementHistory: string[],
  roundData: RoundData[],
  totalRounds: number
}

async executeRound(
  prompt: string,
  code: string,
  roundNumber: number,
  maxRounds: number,
  contextFiles: File[],
  roundPurpose: string,
  selectedAIs: string[]
): RoundData

async getQualityScore(code: string): number  // 0-10
```

**Round Execution Flow**:

Round N:
```
┌─────────────────────────────┐
│ buildRoundPrompt(code)      │ Build context-aware prompt
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│ aiPoolManager.executeParallel(                  │ Execute selected AIs
│   refinedPrompt,                                │
│   selectedAIs,                                  │
│   contextFiles                                  │
│ )                                               │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│ responseMerger.merge(                           │ Combine responses
│   responses,                                    │
│   taskType,                                     │
│   "balanced"                                    │
│ )                                               │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────┐
│ extractCode(mergedResult)   │ Get code from response
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Return RoundData            │
│ + Code for next round       │
└─────────────────────────────┘
```

**Round Purposes**:

| Round | Purpose | AIs | Prompt Content |
|-------|---------|-----|---|
| 1 | Generate | 5 | Original prompt |
| 2 | Critique | 3 | Version 1 + "What's wrong?" |
| 3 | Improve | 3 | Version 1 + critiques |
| 4 | Validate | 1 | Version 2 + "Is it better?" |
| 5 | Polish | 2 | Version 2 + suggestions |

**Quality Scoring**:

```javascript
metrics = {
  length: min(codeLength / 1000, 2),     // 0-2 points
  completeness: hasFunctions ? 1 : 0.5,  // 0-1 points
  documentation: commentRatio,            // 0-1 points
  structure: hasProperBraces ? 1 : 0      // 0-1 points
}

score = (sum of metrics / 4) × 10  // 0-10
```

### 3. ParallelRefinementTracks

**Purpose**: Generate 3 different evolution paths in parallel

**Key Methods**:
```javascript
async executeParallelTracks(
  prompt: string,
  contextFiles: File[]
): {
  tracks: TrackResult[],
  timestamp: number,
  prompt: string
}

async executeTrack(
  trackName: string,
  prompt: string,
  contextFiles: File[],
  ais: string[],
  focus: string
): TrackResult
```

**Track Configuration**:

```javascript
const trackConfigs = {
  A: {
    name: "Performance-Optimized",
    ais: ["DeepSeek", "Mistral"],
    focus: "speed, efficiency, memory optimization"
  },
  B: {
    name: "Readability-Optimized",
    ais: ["GPT-4o", "Perplexity"],
    focus: "clean, maintainable, well-documented code"
  },
  C: {
    name: "Balanced",
    ais: ["Qwen", "Gemini", "Llama"],
    focus: "balance between all factors"
  }
}
```

**Parallel Execution**:

```
User Prompt
    ↓
┌───┴───┬───────┬───────┐
│       │       │       │
↓       ↓       ↓       ↓
Track A Track B Track C (Parallel)
│       │       │
↓       ↓       ↓
Results (All in ~20-30s)
```

Each track runs 3 refinement rounds:
1. Round 1: Initial generation with focus
2. Round 2: Improve with focus emphasis
3. Round 3: Final refinement with focus

---

## Integration with Existing Classes

### TaskClassifier

**Used by**: RecursiveRefinementEngine, ParallelRefinementTracks

**For**: 
- Classifying task type (refactor/debug/create/optimize/explain/architecture)
- Selecting appropriate AIs based on specialties
- Different AI pools for different rounds

**Example**:
```javascript
const classification = this.taskClassifier.classifyTask(prompt);
// { primary: "refactor", scores: {...}, allCategories: [...] }

const aiPool = this.taskClassifier.selectAIs(classification, 5);
// ["DeepSeek", "Qwen", "Llama", "GPT-4o", "Mistral"]
```

### AIPoolManager

**Used by**: RecursiveRefinementEngine, ParallelRefinementTracks

**For**:
- Executing prompts in parallel across AI pool
- Providing 10 permanent AI workers

**Example**:
```javascript
const result = await this.aiPoolManager.executeParallel(
  "refined prompt",
  ["DeepSeek", "Mistral"],
  contextFiles
);
// { responses: [...], timestamp, prompt, aiCount }
```

### ResponseMerger

**Used by**: RecursiveRefinementEngine, ParallelRefinementTracks

**For**:
- Merging multiple AI responses into single output
- Applying merge strategy (balanced/democratic/expert)

**Example**:
```javascript
const merged = this.responseMerger.merge(
  responses,
  taskType,
  "balanced"
);
// { strategy, content, responses, analysis, ... }
```

---

## Data Structures

### RoundData

```javascript
{
  round: number,              // 1-5
  purpose: string,            // "Generate initial solution"
  prompt: string,             // Refined prompt for this round
  responses: Response[],      // Individual AI responses
  merged: MergedResponse,     // Combined response
  code: string                // Extracted code
}
```

### TrackResult

```javascript
{
  track: string,              // "Track A: Performance-Optimized"
  finalCode: string,          // Final code for this track
  history: RoundData[],       // 3 rounds of refinement
  focus: string               // Focus area for track
}
```

### RefinementResult

```javascript
// For fixed/adaptive refinement
{
  finalCode: string,
  refinementHistory: string[],  // User-friendly messages
  roundData: RoundData[],       // Detailed round data
  totalRounds: number
}

// For parallel tracks
{
  tracks: TrackResult[],        // 3 track results
  timestamp: number,
  prompt: string
}
```

---

## Message Flow in UI

### Fixed/Adaptive Refinement

```
User → Enter Prompt
     → Command: "RR-5: 5-Round Recursive Refinement"
        ↓
StanzifyApp.promptRecursiveRefinement()
        ↓
System Message: "Starting Fixed 5-Round Refinement..."
        ↓
RecursiveRefinementEngine.recursiveRefine()
        ↓
System Message: "✅ Refinement complete! (5 rounds)"
               + Refinement history
        ↓
Assistant Message: "REFINED CODE (v5):\n```\n...\n```"
                   + Metadata: { refinement: true, refinementRounds: 5, ... }
```

### Parallel Tracks

```
User → Enter Prompt
     → Command: "RR-5: Parallel Refinement Tracks"
        ↓
StanzifyApp.promptParallelTracks()
        ↓
System Message: "Launching 3 Parallel Refinement Tracks..."
        ↓
ParallelRefinementTracks.executeParallelTracks()
        ↓
Assistant Message #1: "Track A: Performance-Optimized - FINAL CODE:..."
                      + Metadata: { refinement: true, trackName: "Track A", ... }
        ↓
Assistant Message #2: "Track B: Readability-Optimized - FINAL CODE:..."
                      + Metadata: { refinement: true, trackName: "Track B", ... }
        ↓
Assistant Message #3: "Track C: Balanced - FINAL CODE:..."
                      + Metadata: { refinement: true, trackName: "Track C", ... }
        ↓
System Message: "✅ All 3 tracks completed!"
```

---

## State Management

### StanzifyApp Refinement State

```javascript
class StanzifyApp {
  // Refinement-specific properties
  refinementMode: string;           // "none", "fixed", "adaptive", "parallel"
  lastRefinementResult: object;     // Last refinement result for viewing
  
  // Methods
  promptRecursiveRefinement(adaptive);
  promptParallelTracks();
  viewLastRefinementResult();
}
```

### Conversation History Message Types

```javascript
// Refinement-specific metadata
{
  role: "assistant",
  content: "...",
  refinement: true,
  refinementRounds: 5,
  refinementType: "fixed" | "adaptive" | "parallel-track",
  refinementComplexity?: number,
  trackName?: string,
  trackIndex?: number,
  timestamp: number
}
```

### Persistence

Refinement state is **not** persisted to IndexedDB by default. Only conversation history is saved, which includes refinement messages.

To add persistence of refinement results:
1. Store lastRefinementResult in snapshot
2. Include refinementMode in state
3. Restore on app initialization

---

## AI Pool Routing Strategy

### Round-Based Routing

```javascript
const selectedAIs = {
  1: taskClassifier.selectAIs(classification, 5),    // Top 5 for generation
  2: taskClassifier.selectAIs(classification, 3),    // Top 3 for critique
  3: taskClassifier.selectAIs(classification, 3),    // Top 3 for improvement
  4: taskClassifier.selectAIs(classification, 1),    // Top 1 for validation
  5: taskClassifier.selectAIs(classification, 2)     // Top 2 for polish
}
```

### Specialty Mapping

Each AI has specialties from TaskClassifier.aiSpecialties:

```javascript
{
  "GPT-4o": ["general", "create", "debug", "explain"],
  "DeepSeek": ["refactor", "optimize", "debug"],
  "Qwen": ["refactor", "architecture", "create"],
  "Gemini": ["create", "architecture"],
  "Mistral": ["optimize"],
  "Llama": ["debug"],
  "Perplexity": ["explain"],
  "You.com": ["debug", "create"]
}
```

For Round 2 (critique), system selects AIs with:
1. High scores for detecting "problems"
2. Different perspectives
3. Complementary specialties

---

## Performance Characteristics

### Timing Analysis

```
Fixed 5-Round:
  Round 1: 1.6 AI calls × (800-2000ms) = ~1.6s
  Round 2: 0.6 AI calls × (800-2000ms) = ~1.2s (parallel)
  Round 3: 0.6 AI calls × (800-2000ms) = ~1.2s (parallel)
  Round 4: 0.2 AI calls × (800-2000ms) = ~0.4s (parallel)
  Round 5: 0.4 AI calls × (800-2000ms) = ~0.8s (parallel)
  Total Serialization Time: ~5.2s AI calls
  Total Wall Time: ~30-45s (with UI overhead)

Parallel Tracks:
  Track A × 3 rounds: ~5s (sequential)
  Track B × 3 rounds: ~5s (sequential)
  Track C × 3 rounds: ~5s (sequential)
  Total (parallel): ~20-30s (all execute simultaneously)

Adaptive (Simple - 2 rounds):
  Round 1: ~1.6s AI calls
  Round 2: ~1.2s AI calls
  Total: ~15-20s

Adaptive (Medium - 3 rounds):
  Round 1: ~1.6s AI calls
  Round 2: ~1.2s AI calls
  Round 3: ~1.2s AI calls
  Total: ~20-30s

Adaptive (Complex - 5 rounds):
  Same as Fixed 5-Round: ~30-45s
```

### Memory Usage

- Each refinement result: ~50-100KB (code + metadata)
- Conversation history per refinement: ~5 messages × 10-50KB = ~50-250KB
- Typical session: 10-20 refinements = ~1-5MB

---

## Error Handling

### Error Scenarios

1. **Empty Prompt**
   - Caught: Before refinement starts
   - Action: Alert user
   - No AI calls made

2. **AI Pool Error**
   - Caught: In executeParallel
   - Action: Include error in response
   - Continue with other AIs

3. **Merge Error**
   - Caught: In responseMerger.merge
   - Action: Fallback to first response
   - Log error to console

4. **Context File Access**
   - Caught: When reading files
   - Action: Skip missing files
   - Continue with available context

### Recovery

All errors:
- Displayed in conversation
- Logged to console (dev)
- Prevent UI freeze (async)
- Allow retry (run refinement again)

---

## Extension Points

### Add New Refinement Mode

```javascript
// 1. Add to getCommands()
{
  label: "RR-5: Custom Mode",
  action: () => this.promptCustomRefinement()
}

// 2. Implement handler
async promptCustomRefinement() {
  const result = await customRefinementLogic();
  this.appendMessage({ role: "assistant", content: result.finalCode, ... });
}

// 3. Can use existing engines or create new
```

### Customize Round Purposes

Edit `RecursiveRefinementEngine.buildRoundPrompt()`:

```javascript
const prompts = {
  1: "Your custom prompt for round 1",
  2: "Your custom prompt for round 2",
  // ...
}
```

### Add New Track

Edit `ParallelRefinementTracks.executeParallelTracks()`:

```javascript
const trackD = this.executeTrack(
  "Track D: Custom Focus",
  prompt,
  contextFiles,
  ["AI1", "AI2"],
  "custom focus area"
);

const results = await Promise.all([trackA, trackB, trackC, trackD]);
```

---

## Testing Strategy

### Unit Tests (Would be added)

```javascript
// ComplexityAnalyzer
test('analyzeComplexity simple task returns 2 rounds')
test('analyzeComplexity complex task returns 5 rounds')

// RecursiveRefinementEngine
test('recursiveRefine executes 5 rounds for fixed mode')
test('recursiveRefine executes adaptive rounds correctly')
test('getQualityScore returns 0-10')

// ParallelRefinementTracks
test('executeParallelTracks returns 3 track results')
test('tracks execute in parallel')
```

### Integration Tests (Would be added)

```javascript
test('Full refinement flow from prompt to result')
test('Parallel tracks all complete')
test('Results appear in conversation')
test('View last result works')
```

### E2E Tests (Manual)

See TEST_RECURSIVE_REFINEMENT.md

---

## Future Enhancements

### Real AI Integration
- Replace mock AIWorker with real API calls
- Support multiple AI providers (OpenAI, Claude, etc.)
- Add token counting and rate limiting

### Advanced Features
- Incremental refinement (refine existing code)
- Custom refinement pipelines (user-defined rounds)
- A/B comparison UI for track results
- Refinement history with diff view
- Refinement rollback (revert to previous version)

### Performance
- Cache refinement results
- Streaming responses (instead of waiting for completion)
- Progressive refinement (show intermediate results)

### UX
- Visual progress indicator
- Estimated time remaining
- Early exit explanation
- Quality score visualization
