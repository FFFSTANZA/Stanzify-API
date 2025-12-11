# Phase 4: Recursive Refinement (RR-5 Algorithm)
## Weeks 10-12: Multi-track Adaptive Code Refinement

## Overview

Phase 4 implements the **RR-5 Algorithm** - a sophisticated 5-round recursive refinement process that iteratively improves code quality by:
1. Generating initial solutions
2. Identifying weaknesses through critique
3. Applying improvements
4. Cross-validating changes
5. Final polishing

### Key Features
- **Week 10**: Fixed 5-round refinement loop
- **Week 11**: Adaptive round detection based on task complexity
- **Week 12**: Parallel refinement tracks (3 evolution paths)

---

## Week 10: The Refinement Loop

### The 5-Round Process

The recursive refinement engine executes a structured 5-round process where each round has a specific purpose:

**Round 1: Initial Generation**
- Sends the original prompt to 5 selected AIs
- Generates the initial code solution (Version 1)
- Focus: Creating a functional baseline

**Round 2: Self-Critique**
- Sends Version 1 back to 3 different AIs
- Each AI critiques from their specialty angle:
  - GPT: "What's suboptimal about this code?"
  - Qwen: "How can this be more efficient?"
  - DeepSeek: "What edge cases are missing?"
- Collects quality critiques

**Round 3: Apply Improvements**
- Sends Version 1 + collected critiques to 3 improvement-focused AIs
- DeepSeek: "Improve the code based on these critiques"
- Mistral: "Refactor with these improvements"
- Produces Version 2

**Round 4: Cross-Validation**
- Sends Version 2 to a fresh AI (Gemini)
- Validates improvements: "Is it better? Any remaining issues?"
- Generates final suggestions

**Round 5: Final Polish**
- Sends Version 2 + validation suggestions to GPT
- Polishes: consistency, clarity, optimization, comments
- Produces Version 3 (final code)

### RecursiveRefinementEngine Class

```javascript
class RecursiveRefinementEngine {
  async recursiveRefine(prompt, contextFiles, adaptiveRounds = false)
  async executeRound(prompt, code, roundNumber, maxRounds, contextFiles, roundPurpose, selectedAIs)
  async getQualityScore(code)  // Returns 0-10 quality rating
}
```

### Usage Example

```javascript
const engine = new RecursiveRefinementEngine(
  taskClassifier,
  aiPoolManager,
  responseMerger
);

const result = await engine.recursiveRefine(
  "create a button component",
  contextFiles,
  false  // Use fixed 5 rounds
);

console.log(result.finalCode);        // Refined code
console.log(result.totalRounds);      // Rounds executed
console.log(result.refinementHistory); // Step-by-step log
```

---

## Week 11: Adaptive Refinement

### Complexity Analysis

The `ComplexityAnalyzer` evaluates task complexity (1-10) to determine optimal round count:

- **Score 1-3 (Simple)**: 2 rounds
  - Examples: button styling, CSS fix, simple HTML
  - Fast iteration sufficient for straightforward tasks

- **Score 4-7 (Medium)**: 3 rounds
  - Examples: API integration, component logic, refactoring
  - Standard refinement for typical development tasks

- **Score 8-10 (Complex)**: 5 rounds
  - Examples: authentication system, database design, architecture
  - Full refinement for complex systems

### Smart Round Detection

```javascript
const complexity = await analyzer.analyzeComplexity(prompt);
// Returns: { complexity: 7, rounds: 3, difficulty: "medium" }

const rounds = complexity.rounds;  // Use this for adaptive refinement
```

### Early Exit Logic

Even in 5-round mode, the engine can exit early if quality is sufficient:

```javascript
for (let round = 1; round <= rounds; round++) {
  const score = await this.getQualityScore(code);
  
  if (score >= 9.5) {
    break;  // Already perfect, no need to continue
  }
}
```

### When to Use Adaptive Refinement

Use adaptive refinement when:
- Task complexity is unknown
- Want to avoid over-processing simple tasks
- Need balance between quality and execution time
- Running refinement on diverse task types

**Command Palette**: `RR-5: Adaptive Refinement (Auto-Complexity)`

---

## Week 12: Parallel Refinement Tracks

### Three Evolutionary Paths

Instead of one refinement path, create 3 parallel tracks, each optimizing for different goals:

#### Track A: Performance-Optimized
- **AIs**: DeepSeek + Mistral
- **Focus**: Speed, efficiency, memory optimization, algorithmic improvements
- **Output**: Fastest, most optimized code
- **Best for**: Performance-critical features, algorithms

#### Track B: Readability-Optimized
- **AIs**: GPT-4o + Perplexity
- **Focus**: Clean, maintainable, well-documented code, naming conventions
- **Output**: Most understandable, best documented code
- **Best for**: Core features, team collaboration, long-term maintenance

#### Track C: Balanced
- **AIs**: Qwen + Gemini + Llama
- **Focus**: Balance between all factors (performance, readability, robustness)
- **Output**: Versatile, general-purpose code
- **Best for**: Production code with diverse requirements

### ParallelRefinementTracks Class

```javascript
class ParallelRefinementTracks {
  async executeParallelTracks(prompt, contextFiles)
  // Returns:
  // {
  //   tracks: [
  //     { track: "Track A: Performance-Optimized", finalCode: "...", focus: "..." },
  //     { track: "Track B: Readability-Optimized", finalCode: "...", focus: "..." },
  //     { track: "Track C: Balanced", finalCode: "...", focus: "..." }
  //   ]
  // }
}
```

### Parallel Execution

All 3 tracks execute simultaneously using `Promise.all()`:

```javascript
const trackA = this.executeTrack("Track A", prompt, contextFiles, [...], "performance");
const trackB = this.executeTrack("Track B", prompt, contextFiles, [...], "readability");
const trackC = this.executeTrack("Track C", prompt, contextFiles, [...], "balanced");

const results = await Promise.all([trackA, trackB, trackC]);
```

### User Selection

After receiving 3 code versions, users can:
1. **Choose based on needs**: Pick the track that best matches their priorities
2. **Hybrid approach**: Combine best parts from each track
3. **Review differences**: See how different focus areas affect code

**Command Palette**: `RR-5: Parallel Refinement Tracks (3 Paths)`

---

## Integration with UI

### Command Palette Commands

Access refinement features via Command Palette (⌘K):

1. **RR-5: 5-Round Recursive Refinement (Fixed)**
   - Executes exactly 5 rounds
   - Traditional refinement approach
   - Best for known complex tasks

2. **RR-5: Adaptive Refinement (Auto-Complexity)**
   - Analyzes prompt complexity
   - Uses 2/3/5 rounds based on complexity
   - Best for mixed workloads

3. **RR-5: Parallel Refinement Tracks (3 Paths)**
   - Generates 3 different evolution paths
   - Parallel execution for speed
   - Best for comparing approaches

4. **View Last Refinement Result**
   - Display summary of last refinement
   - Quick reference for completed refinements

### Conversation History

Refinement results appear in conversation history as:
- System messages for process status
- Assistant messages with refined code
- Metadata tracking rounds, type, tracks, etc.

---

## AI Pool Routing

### AI Selection by Round

Each round selects AIs based on their specialties:

| Round | Purpose | Selected AIs | Count |
|-------|---------|--------------|-------|
| 1 | Generation | Top specialists for task | 5 |
| 2 | Critique | Diverse perspectives | 3 |
| 3 | Improvement | Refactoring + optimization experts | 3 |
| 4 | Validation | Fresh perspective | 1 |
| 5 | Polish | General + specialist | 2 |

### Track AI Assignment

- **Track A (Performance)**: DeepSeek, Mistral
- **Track B (Readability)**: GPT-4o, Perplexity
- **Track C (Balanced)**: Qwen, Gemini, Llama

---

## Quality Scoring

The `getQualityScore()` method evaluates code on:

1. **Length**: Appropriate code size (0-2 points)
2. **Completeness**: Has functions/classes (0-1 points)
3. **Documentation**: Comment density (0-1 points)
4. **Structure**: Proper syntax/braces (0-1 point)

**Score Range**: 0-10
- 0-3: Poor quality
- 4-6: Adequate
- 7-8: Good
- 9-10: Excellent

Early exit triggers at >= 9.5

---

## Data Flow

```
User Prompt
    ↓
Refinement Type Selection (Fixed/Adaptive/Parallel)
    ↓
Complexity Analysis (if Adaptive)
    ↓
Round 1: Generate Initial Version
    ↓ (Round 2-5 or fewer if adaptive/early exit)
Round 2: Critique
Round 3: Improve
Round 4: Validate
Round 5: Polish
    ↓
Quality Score Check (early exit if >= 9.5)
    ↓
Return Final Code + Metadata
    ↓
Display in Conversation History
```

---

## Performance Considerations

### Timing
- Fixed 5-round: ~30-45 seconds (5 parallel executions)
- Adaptive: ~15-45 seconds depending on complexity
- Parallel tracks: ~20-30 seconds (3 tracks in parallel)

### Token Usage
- Each round processes prompt + code + context
- Round 2-5 include previous outputs (context grows)
- Parallel tracks: 3x AI calls in parallel

### Optimization Tips
1. Use adaptive refinement for mixed workloads
2. Parallel tracks give 3 options in similar time as fixed 5-round
3. Early exit reduces time for already-good code

---

## Example Workflows

### Workflow 1: Quick Button Component

Input: "Create a styled button component"
- Complexity: 2
- Adaptive rounds: 2
- Output: Quick, solid button code
- Time: ~10 seconds

### Workflow 2: API Integration

Input: "Add user authentication API integration"
- Complexity: 6
- Adaptive rounds: 3
- Output: Well-integrated, documented code
- Time: ~20 seconds

### Workflow 3: Full System Design

Input: "Design a complete payment processing system"
- Complexity: 9
- Fixed 5 rounds OR Adaptive: 5 rounds
- Output: Production-ready architecture
- Time: ~40 seconds

### Workflow 4: Compare Approaches

Input: "Build a data sorting algorithm"
- Use Parallel Tracks to get:
  - Track A: Fastest algorithm
  - Track B: Most readable implementation
  - Track C: Balanced approach
- Choose or combine best aspects
- Time: ~30 seconds for 3 options

---

## Configuration

### Customize Round Purposes

Edit `buildRoundPrompt()` in RecursiveRefinementEngine:

```javascript
const prompts = {
  1: "Your custom generation prompt",
  2: "Your custom critique prompt",
  3: "Your custom improvement prompt",
  4: "Your custom validation prompt",
  5: "Your custom polish prompt"
};
```

### Customize Track Focus

Edit `executeParallelTracks()` in ParallelRefinementTracks:

```javascript
const trackA = this.executeTrack(
  "Custom Track Name",
  prompt,
  contextFiles,
  ["AI1", "AI2"],  // Select AIs
  "custom focus area"
);
```

---

## Testing

### Test Case 1: Fixed Refinement
```
Command: RR-5: 5-Round Recursive Refinement (Fixed)
Prompt: "create a button component"
Expected: 5 rounds, system messages, refined code
```

### Test Case 2: Adaptive Refinement
```
Command: RR-5: Adaptive Refinement (Auto-Complexity)
Prompt: "design a full authentication system"
Expected: Complexity analysis, 5 rounds, early exit if quality good
```

### Test Case 3: Parallel Tracks
```
Command: RR-5: Parallel Refinement Tracks (3 Paths)
Prompt: "optimize this loop"
Expected: 3 track results, each with different focus
```

---

## Limitations & Future Improvements

### Current
- Mock AI responses (ready for real integration)
- Fixed AI pool (10 workers)
- No persistent refinement history

### Future
- Real AI integration via APIs
- Dynamic AI pool allocation
- Refinement history persistence
- User-customizable track definitions
- A/B comparison UI for track results
- Incremental refinement (refine existing code)
