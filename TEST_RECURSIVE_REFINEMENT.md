# Testing Guide: Phase 4 Recursive Refinement

## Quick Start Testing

### Setup
1. Open the Stanzify app
2. Create some context files or select existing files
3. Enter a prompt in the "Ask the orchestra" section
4. Access refinement features via Command Palette (⌘K)

---

## Test Cases

### Test 1: Fixed 5-Round Refinement

**Objective**: Verify 5-round refinement executes all rounds correctly

**Steps**:
1. Enter prompt: "create a simple hello world button with click handler"
2. Open Command Palette (⌘K)
3. Select "RR-5: 5-Round Recursive Refinement (Fixed)"
4. Observe conversation history

**Expected Results**:
- System message: "Starting Fixed 5-Round Recursive Refinement..."
- Status updates: "Initiating refinement rounds..."
- 5 rounds of AI responses/processing
- System message: "✅ Refinement complete! (5 rounds)"
- Refinement history shown:
  - Round 1: Generate the initial solution
  - Round 2: Identify suboptimal parts
  - Round 3: Apply improvements
  - Round 4: Cross-validate
  - Round 5: Final polish
- Final assistant message with refined code block
- All within ~30-45 seconds

**Pass Criteria**:
- [ ] All 5 rounds execute
- [ ] No errors in conversation
- [ ] Refined code visible in final message
- [ ] Quality score estimated (9.5+)

---

### Test 2: Adaptive Complexity-Based Refinement

**Objective**: Verify adaptive rounds based on complexity analysis

**Test 2a: Simple Task (2 rounds)**
1. Enter prompt: "style a button with blue color"
2. Open Command Palette (⌘K)
3. Select "RR-5: Adaptive Refinement (Auto-Complexity)"
4. Observe execution

**Expected Results**:
- Complexity analysis: score 1-3
- Only 2 rounds execute (not 5)
- Faster completion (~15 seconds)
- System message shows "2 rounds"

**Pass Criteria**:
- [ ] Only 2 rounds execute
- [ ] Faster than fixed 5-round
- [ ] Completion message shows "2 rounds"

**Test 2b: Medium Task (3 rounds)**
1. Enter prompt: "add user login form with validation"
2. Open Command Palette (⌘K)
3. Select "RR-5: Adaptive Refinement (Auto-Complexity)"

**Expected Results**:
- Complexity analysis: score 4-7
- 3 rounds execute
- Moderate completion time (~20 seconds)
- System message shows "3 rounds"

**Pass Criteria**:
- [ ] 3 rounds execute
- [ ] Reasonable execution time
- [ ] Completion message shows "3 rounds"

**Test 2c: Complex Task (5 rounds)**
1. Enter prompt: "design a complete REST API authentication system with JWT tokens"
2. Open Command Palette (⌘K)
3. Select "RR-5: Adaptive Refinement (Auto-Complexity)"

**Expected Results**:
- Complexity analysis: score 8-10
- 5 rounds execute (all)
- Longer completion time (~40 seconds)
- System message shows "5 rounds"

**Pass Criteria**:
- [ ] 5 rounds execute
- [ ] Complete refinement with all stages
- [ ] Completion message shows "5 rounds"

---

### Test 3: Parallel Refinement Tracks

**Objective**: Verify 3 parallel tracks execute simultaneously

**Steps**:
1. Enter prompt: "optimize a bubble sort algorithm for performance"
2. Open Command Palette (⌘K)
3. Select "RR-5: Parallel Refinement Tracks (3 Paths)"
4. Observe execution and results

**Expected Results**:
- System message: "Launching 3 Parallel Refinement Tracks..."
- Lists the 3 tracks:
  - Track A: Performance-Optimized
  - Track B: Readability-Optimized
  - Track C: Balanced
- Status: "Executing in parallel..."
- Completion in ~20-30 seconds (parallel execution)
- 3 assistant messages, each with:
  - Track name
  - Final code for that track
  - Focus area for that track
- Final system message: "✅ All 3 tracks completed!"
- Recommendation to choose track based on priorities

**Pass Criteria**:
- [ ] 3 separate code outputs visible
- [ ] Each with different focus
- [ ] Track A emphasizes performance
- [ ] Track B emphasizes readability
- [ ] Track C is balanced
- [ ] All complete in ~30 seconds (parallel timing)

**Example Verification**:
- Track A code might use optimized algorithms
- Track B code might have more comments/documentation
- Track C code is somewhere in between

---

### Test 4: Conversation History

**Objective**: Verify refinement results persist in conversation history

**Steps**:
1. Run Test 1 (5-round refinement)
2. Scroll up in conversation history
3. Verify all messages are present
4. Run Test 3 (parallel tracks)
5. Scroll down to see all messages

**Expected Results**:
- All system messages present
- All refinement code visible
- Messages in chronological order
- Metadata attached to refinement messages

**Pass Criteria**:
- [ ] History shows all rounds/tracks
- [ ] Can scroll through complete refinement
- [ ] Code blocks visible and readable

---

### Test 5: View Last Refinement Result

**Objective**: Verify can review previous refinement results

**Steps**:
1. Run Test 1 (5-round refinement)
2. Open Command Palette (⌘K)
3. Select "View Last Refinement Result"
4. Review the alert/summary

**Expected Results**:
- Summary of last refinement shown:
  - Total rounds: 5
  - Refinement history
  - Final code length
- For parallel tracks, shows all 3 track summaries

**Pass Criteria**:
- [ ] Alert displays refinement info
- [ ] Correct number of rounds shown
- [ ] Code length displayed

---

### Test 6: Error Handling

**Objective**: Verify graceful error handling

**Test 6a: Empty Prompt**
1. Open Command Palette (⌘K)
2. Select "RR-5: 5-Round Recursive Refinement (Fixed)"
3. Confirm without entering a prompt

**Expected Result**:
- Alert: "Please enter a prompt first"
- No refinement starts

**Pass Criteria**: [ ] Alert appears, no execution

**Test 6b: View Result Before Running**
1. Open Command Palette (⌘K)
2. Select "View Last Refinement Result" (without running refinement)

**Expected Result**:
- Alert: "No refinement result available. Run a refinement first."

**Pass Criteria**: [ ] Alert appears

---

### Test 7: Integration with Context Files

**Objective**: Verify refinement uses selected context files

**Steps**:
1. Create multiple test files in workspace
2. Select specific files as context (via checkboxes)
3. Run refinement with prompt referencing file contents
4. Observe execution

**Expected Results**:
- Refinement processes include selected files
- AIs can reference context files in responses
- Final refined code incorporates file context

**Pass Criteria**:
- [ ] Context files included in execution
- [ ] Refinement considers file structure
- [ ] Output makes sense for given context

---

### Test 8: Task Classification

**Objective**: Verify correct AI routing based on task type

**Steps**:
1. Run multiple refinements with different prompt types:
   - "refactor this code for performance"
   - "debug the authentication system"
   - "create a new user profile component"
2. Check which AIs are selected

**Expected Results**:
- Refactor prompts route to refactoring specialists
- Debug prompts route to debug specialists  
- Create prompts route to creation specialists
- Different prompts select different AI pools

**Pass Criteria**:
- [ ] AI selection changes based on task type
- [ ] Specialists are assigned to relevant tasks

---

### Test 9: Performance Benchmarks

**Objective**: Verify execution times match expectations

**Steps**:
1. Time Test 1 (fixed 5-round)
2. Time Test 2a (adaptive 2-round)
3. Time Test 3 (parallel tracks)

**Expected Times**:
- Fixed 5-round: 30-45 seconds
- Adaptive 2-round: 15-20 seconds
- Adaptive 3-round: 20-30 seconds
- Adaptive 5-round: 30-45 seconds
- Parallel tracks: 20-30 seconds (all 3 in parallel)

**Pass Criteria**:
- [ ] Parallel tracks faster than 5x sequential
- [ ] Adaptive simple tasks complete quickly
- [ ] Times reasonable for mock responses

---

### Test 10: Refinement Metadata

**Objective**: Verify refinement messages contain proper metadata

**Steps**:
1. Run a refinement
2. Open browser DevTools
3. Inspect conversation history in console
4. Check message properties

**Expected Metadata Structure**:
```javascript
// Fixed/Adaptive refinement message
{
  role: "assistant",
  content: "REFINED CODE...",
  refinement: true,
  refinementRounds: 5,
  refinementType: "fixed" || "adaptive",
  timestamp: <number>
}

// Parallel track refinement message
{
  role: "assistant",
  content: "Track X - FINAL CODE...",
  refinement: true,
  refinementType: "parallel-track",
  trackName: "Track A: Performance-Optimized",
  trackIndex: 0,
  timestamp: <number>
}
```

**Pass Criteria**:
- [ ] Metadata properties present
- [ ] Values correct for refinement type
- [ ] Timestamp included

---

## Automated Test Scenarios

### Scenario 1: End-to-End Refinement
```
1. Enter: "create a todo list component"
2. Run: Adaptive refinement
3. Verify: Appropriate rounds executed
4. Check: Code in conversation history
5. Confirm: View last result works
```

### Scenario 2: Parallel Comparison
```
1. Enter: "write a search algorithm"
2. Run: Parallel tracks
3. Verify: 3 outputs received
4. Compare: Performance vs readability vs balanced
5. Choose: Best track for use case
```

### Scenario 3: Complex System Design
```
1. Enter: "design a microservices architecture"
2. Run: Fixed 5-round refinement
3. Verify: All 5 rounds execute
4. Review: Each round's contribution
5. Extract: Final polished design
```

---

## Performance Testing

### Load Testing
- Run multiple refinements in sequence
- Verify no memory leaks
- Check conversation history doesn't degrade performance

### Stress Testing
- Enter very long prompts (1000+ chars)
- Use large context files (100KB+)
- Verify graceful handling

### Concurrent Testing
- Run refinements on multiple browser tabs
- Verify IndexedDB state management works
- Check conversation history syncs correctly

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

Verify:
- [ ] All commands accessible
- [ ] Refinements complete
- [ ] History persists
- [ ] UI responsive

---

## Rollback/Recovery Testing

### Test State Persistence
1. Run a refinement
2. Close browser
3. Reopen app
4. Verify:
   - Conversation history preserved
   - Refinement messages present
   - Last refinement viewable

---

## Known Limitations to Test Around

1. **Mock AI Responses**: Responses are simulated, not real
2. **Token Limits**: Mock doesn't enforce token limits
3. **Real APIs**: Integration with real AI APIs not yet implemented
4. **Performance**: Timing depends on mock delay settings (800-2000ms per response)

---

## Testing Checklist

### Core Features
- [ ] Fixed 5-round refinement works
- [ ] Adaptive refinement with complexity detection
- [ ] Parallel tracks with 3 outputs
- [ ] View last refinement command
- [ ] Error handling for empty prompts

### Integration
- [ ] Works with selected context files
- [ ] Conversation history integration
- [ ] Task classification & AI routing
- [ ] Metadata storage in messages

### Performance
- [ ] Execution times reasonable
- [ ] Parallel faster than sequential
- [ ] No UI freezing during refinement
- [ ] Memory usage acceptable

### UI/UX
- [ ] Command palette shows all 4 commands
- [ ] Status messages clear and helpful
- [ ] Refined code visible and formatted
- [ ] Results can be scrolled and reviewed

### Data Integrity
- [ ] Last result viewable
- [ ] History persists across sessions
- [ ] No data loss during execution
- [ ] Proper error messages shown

---

## Reporting Issues

When reporting test failures, include:
1. Exact prompt used
2. Refinement type (fixed/adaptive/parallel)
3. Expected behavior
4. Actual behavior
5. Browser/OS
6. Console errors (if any)
7. Timing (how long it took)
8. Whether AI pool had issues
