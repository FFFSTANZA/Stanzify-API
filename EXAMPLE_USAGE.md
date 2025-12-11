# Multi-AI Orchestration - Example Usage

## Quick Start

1. Open `index.html` in your browser
2. You'll see the **Multi-AI Orchestration** interface with:
   - Prompt input area
   - "🎭 Orchestrate AIs" button
   - Orchestration info panel
   - Conversation history
   - File workspace

## Example Workflow

### Example 1: Refactoring Code

**Your Input:**
```
Refactor the modal component to improve code readability and maintainability
```

**What Happens:**
1. **Task Classification** analyzes the prompt
   - Detects keywords: "refactor", "improve", "readability", "maintainability"
   - Primary task: `refactor`
   - Confidence score: 4 (4 matching keywords)

2. **Smart Routing** selects optimal AIs:
   ```
   Selected AIs: DeepSeek, Qwen, Qwen-backup, Mistral, GPT-4o
   ```
   - DeepSeek: Refactor specialist (score: 3.5)
   - Qwen: Refactor specialist (score: 3.5)
   - Qwen-backup: Refactor specialist (score: 3.0)
   - Mistral: Optimize specialist (score: 1.5)
   - GPT-4o: General purpose (score: 0.5)

3. **Parallel Execution** sends prompt to all 5 AIs simultaneously
   - Each AI processes independently
   - Responses collected as they arrive
   - Total time: ~1-2 seconds (mock) / 30-60 seconds (real)

4. **Response Merging** combines results:
   ```
   Strategy: Balanced
   - Expert opinion: DeepSeek (refactor specialist)
   - Democratic consensus: What most AIs agree on
   - Agreement level: HIGH (multiple AIs suggest similar approaches)
   ```

5. **Output Display:**
   - **System Message**: "Task Classification: refactor | Routing to: DeepSeek, Qwen..."
   - **Merged Response**: Combined best practices from all AIs
   - **Individual Responses**: Each AI's unique perspective
   - **Completion Message**: "✅ Orchestration complete! 5 AIs responded"

### Example 2: Debugging an Error

**Your Input:**
```
Debug why the submit button throws an error when clicked
```

**Orchestration Process:**

```
Task Classification:
- Primary: debug
- Keywords found: ["debug", "error"]

Smart Routing:
- Llama (debug specialist) - Score: 3.5
- GPT-4o (general + debug) - Score: 3.5
- DeepSeek (debug capable) - Score: 2.0
- GPT-4o-backup (general) - Score: 1.5
- You.com (code + debug) - Score: 2.0

Parallel Execution:
✓ Llama: "As a debugging specialist, I would check event listeners..."
✓ GPT-4o: "The error likely comes from missing null checks..."
✓ DeepSeek: "I'd optimize the error handling while fixing..."
✓ GPT-4o-backup: "Try wrapping the click handler in try-catch..."
✓ You.com: "Search shows this is a common DOM timing issue..."

Response Merging (Expert Strategy):
Expert Selected: Llama (debug specialist)
Confidence Score: 8.73
Final Output: Llama's response + supporting insights from others
```

### Example 3: Creating New Feature

**Your Input:**
```
Create a new dark mode toggle component with smooth transitions
```

**Orchestration Flow:**

```
📊 Classification:
   Task: create
   Secondary: architecture (detected "component")

🎯 Routing Decision:
   Primary picks: GPT-4o, Gemini, You.com
   Secondary picks: Qwen, DeepSeek
   Final: GPT-4o, Gemini, You.com, Qwen, DeepSeek

⚡ Parallel Execution Results:
   • GPT-4o (0.95s): Comprehensive implementation with hooks
   • Gemini (1.15s): Clean architecture with state management
   • You.com (0.82s): Modern solution with CSS variables
   • Qwen (1.02s): Well-structured component design
   • DeepSeek (0.88s): Optimized performance approach

🔀 Merging (Balanced Strategy):
   Common Elements:
   ✓ All suggest useState for theme state
   ✓ 4/5 recommend localStorage persistence
   ✓ 3/5 include CSS transition properties
   ✓ All use CSS variables for theming
   
   Expert Pick: Gemini (architecture specialist)
   Democratic Consensus: HIGH agreement
   
   Final Output: 
   - Gemini's architecture as base
   - GPT-4o's implementation details
   - You.com's modern CSS approach
   - Performance tips from DeepSeek
```

## Merge Strategies Explained

### 1. Balanced Strategy (Default)
Combines expert opinion with democratic voting:

```javascript
// Pseudocode
balanced = {
  baseArchitecture: expertAI.response,
  implementation: democraticConsensus.commonPatterns,
  edgeCases: uniqueInsights.fromAllAIs
}
```

**Use When:** You want comprehensive coverage with specialist insight

### 2. Democratic Strategy
Majority rules - uses what most AIs agree on:

```javascript
// Pseudocode
democratic = {
  content: mostFrequentPatterns,
  confidence: agreementPercentage,
  dissent: uniqueSuggestions
}
```

**Use When:** You want the most common, battle-tested approach

### 3. Expert Strategy
Trusts the specialist AI for the task:

```javascript
// Pseudocode
expert = {
  primary: specialistAI.response,
  weight: expertiseScore * contentQuality,
  supporting: otherAIs.relevant.points
}
```

**Use When:** You trust specialist knowledge over consensus

## Command Palette Examples

### Toggle Orchestration
```
⌘K → "Toggle Multi-AI"

Before: 🎭 Orchestrate AIs (5-10 AIs in parallel)
After:  Send to GPT-4o mini (Single AI mode)
```

### Change Merge Strategy
```
⌘K → "Merge Strategy"

Cycle: balanced → democratic → expert → balanced

Each shows description:
- Balanced: "Combines expert opinion with democratic consensus"
- Democratic: "Uses majority voting - what most AIs agree on"
- Expert: "Trusts the specialist AI most suited for the task"
```

### View AI Pool
```
⌘K → "View AI Pool Status"

Output:
AI Pool Manager
10 workers ready:

• GPT-4o (general)
• GPT-4o-backup (general)
• DeepSeek (optimize)
• Qwen (refactor)
• Qwen-backup (refactor)
• Gemini (architecture)
• Mistral (optimize)
• Llama (debug)
• Perplexity (general)
• You.com (create)
```

## Conversation Panel Anatomy

After orchestration, you'll see:

```
┌─────────────────────────────────────────┐
│ You                    3:45:23 PM        │
│ Refactor the modal component...         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ System                 3:45:23 PM        │
│ 🎯 Task Classification: refactor        │
│ 🤖 Routing to: DeepSeek, Qwen, Mistral..│
│ ⚡ Executing in parallel...             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🎭 Merged (5 AIs · balanced) 3:45:25 PM │
│ MERGED RESPONSE (Balanced Approach)     │
│                                          │
│ Combining democratic consensus with...  │
│ [Full merged response content]          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ System                 3:45:25 PM        │
│ ✅ Orchestration complete! 5 AIs...    │
│ 📊 View individual responses below      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ DeepSeek (optimize)    3:45:24 PM       │
│ [DeepSeek's individual response]        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Qwen (refactor)        3:45:24 PM       │
│ [Qwen's individual response]            │
└─────────────────────────────────────────┘

... (3 more individual responses)
```

## Real-World Scenarios

### Scenario 1: Large Refactoring
You need to refactor a complex component. Orchestration helps by:
- Getting multiple architectural perspectives
- Seeing different refactoring patterns
- Identifying common best practices
- Spotting edge cases one AI might miss

### Scenario 2: Tricky Bug
A subtle bug that's hard to diagnose. Benefits:
- Multiple debugging approaches
- Different angle on the problem
- Higher chance of finding root cause
- Validation of solution across specialists

### Scenario 3: New Feature Design
Building something from scratch. Advantages:
- Various implementation strategies
- Different architecture patterns
- Performance considerations from specialists
- Consensus on best practices

## Tips for Best Results

1. **Be Specific in Prompts**
   - ❌ "Fix this"
   - ✅ "Debug why the form validation fails on submit"

2. **Include Task Keywords**
   - Use words like: refactor, debug, create, optimize, explain
   - Helps classification accuracy

3. **Choose Right Strategy**
   - Complex problems → Balanced
   - Standard patterns → Democratic
   - Specialized tasks → Expert

4. **Review Individual Responses**
   - Don't just read merged result
   - Check individual insights
   - Look for unique approaches

5. **Experiment with Context**
   - Add relevant files to context
   - Helps AIs understand codebase
   - Improves response quality

## Performance Expectations

### Mock Mode (Current):
- Classification: <10ms
- Routing: <5ms
- Parallel execution: 1-2 seconds
- Merging: 10-50ms
- Total: ~2 seconds

### Real AI Mode (Future):
- Classification: <10ms
- Routing: <5ms
- Parallel execution: 30-60 seconds (API calls)
- Merging: 50-100ms
- Total: ~30-60 seconds

## Troubleshooting

### No AIs Selected
- Check if orchestration is enabled
- Verify prompt has recognizable keywords
- Try more specific task description

### Merging Fails
- Ensure at least 2 responses received
- Check console for errors
- Try different merge strategy

### Slow Performance
- Normal in real AI mode (30-60s)
- Mock mode should be 1-2s
- Check network if using real APIs

## Next Steps

1. **Try All Task Types**
   - Refactor, debug, create, optimize, explain, architecture

2. **Test Each Merge Strategy**
   - Compare balanced vs democratic vs expert

3. **Explore Command Palette**
   - ⌘K for quick access to all features

4. **Review Individual Responses**
   - Learn from different AI perspectives

5. **Integrate with Real AIs**
   - Replace mock workers with real API calls
   - Maintain same interface
