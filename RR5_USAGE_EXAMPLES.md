# RR-5 Recursive Refinement: Usage Examples

## Quick Reference

### Three Refinement Modes

| Mode | Command | Best For | Time | Rounds |
|------|---------|----------|------|--------|
| **Fixed** | `RR-5: 5-Round Recursive...` | Known complex tasks | 30-45s | 5 |
| **Adaptive** | `RR-5: Adaptive Refinement...` | Mixed workloads | 15-45s | 2/3/5 |
| **Parallel Tracks** | `RR-5: Parallel Refinement...` | Comparing approaches | 20-30s | 3×3 rounds |

---

## Example 1: Simple Component (Adaptive Refinement)

### Scenario
You need a reusable button component quickly. Task complexity is low, so adaptive refinement will be efficient.

### Steps

1. **Enter Prompt**:
   ```
   Create a reusable button component with hover states and click handlers
   ```

2. **Run Command**:
   - Press ⌘K (or Ctrl+K)
   - Select "RR-5: Adaptive Refinement (Auto-Complexity)"

3. **What Happens**:
   - System analyzes: "simple component" → complexity 2
   - Executes 2 rounds (not 5)
   - Round 1: Generates initial button
   - Round 2: Refines/adds styling
   - Total time: ~15 seconds

4. **Output**:
   ```javascript
   const Button = ({ label, onClick, variant = 'primary' }) => (
     <button
       className={`btn btn-${variant}`}
       onClick={onClick}
       onMouseEnter={() => { /* hover state */ }}
       onMouseLeave={() => { /* reset state */ }}
     >
       {label}
     </button>
   );
   ```

### Why Adaptive Works Here
- Task is straightforward
- 2 rounds sufficient for quality
- No need for full 5-round process
- Quick turnaround (15 seconds vs 40)

---

## Example 2: API Integration (Adaptive Refinement)

### Scenario
Building a medium-complexity feature: fetching user data from an API with error handling.

### Steps

1. **Enter Prompt**:
   ```
   Add user data fetching with error handling and loading states. Include retry logic.
   ```

2. **Run Command**:
   - Press ⌘K
   - Select "RR-5: Adaptive Refinement (Auto-Complexity)"

3. **What Happens**:
   - System analyzes: "API, error handling, loading" → complexity 6
   - Executes 3 rounds (balanced approach)
   - Round 1: Initial API integration
   - Round 2: Identify missing error handling
   - Round 3: Improve robustness and UX
   - Total time: ~25 seconds

4. **Output**:
   ```javascript
   async function fetchUserData(userId) {
     const [data, loading, error] = useUserData(userId);
     
     try {
       return await retryFetch(`/api/users/${userId}`, {
         maxRetries: 3,
         backoffMs: 1000
       });
     } catch (err) {
       handleError(err);
       throw err;
     }
   }
   ```

### Why Adaptive Works Here
- Complexity clear from keywords: "API", "error handling"
- 3 rounds perfect for medium complexity
- Covers generation, critique, improvement
- No over-processing needed

---

## Example 3: Full System (Fixed 5-Round Refinement)

### Scenario
You need a complete, production-ready authentication system. Complexity is high and known upfront.

### Steps

1. **Enter Prompt**:
   ```
   Design a complete JWT-based authentication system with refresh tokens,
   secure cookie handling, role-based access control, and logout functionality
   ```

2. **Run Command**:
   - Press ⌘K
   - Select "RR-5: 5-Round Recursive Refinement (Fixed)"

3. **What Happens**:
   - **Round 1** (15s): Generates initial auth system architecture
   - **Round 2** (15s): Identifies gaps (edge cases, security issues, performance)
   - **Round 3** (15s): Applies security improvements based on critiques
   - **Round 4** (15s): Cross-validates: "Is it production-ready? Remaining issues?"
   - **Round 5** (15s): Final polish, documentation, optimization
   - Total time: ~40 seconds

4. **Evolution**:
   ```
   Round 1 Output:
   - Basic JWT implementation
   - Login/logout endpoints
   - Simple auth middleware

   Round 2 Critiques:
   - Missing refresh token logic
   - No CSRF protection
   - Error messages too verbose
   - Performance: No token caching

   Round 3 Improvements:
   + Refresh token rotation
   + CSRF token validation
   + Better error handling
   + Token caching mechanism

   Round 4 Validation:
   ✓ Better, but add password reset
   ✓ Consider 2FA for future
   ✓ Rate limiting on login

   Round 5 Polish:
   + Production-grade error handling
   + Comprehensive logging
   + Security headers
   + Full documentation
   ```

5. **Final Output**:
   Full, production-ready auth system

### Why Fixed 5-Round Works Here
- High complexity demands thorough refinement
- Want all 5 stages: generate → critique → improve → validate → polish
- Time investment justified for critical system
- Better quality outcome than shortcuts

---

## Example 4: Algorithm Optimization (Parallel Tracks)

### Scenario
You have a sorting algorithm and want to compare three approaches:
- Fastest implementation
- Most readable code
- Balanced solution

### Steps

1. **Enter Prompt**:
   ```
   Implement a sorting algorithm optimized for large datasets
   ```

2. **Run Command**:
   - Press ⌘K
   - Select "RR-5: Parallel Refinement Tracks (3 Paths)"

3. **What Happens**:
   All 3 tracks execute in parallel (simultaneously):
   
   **Track A: Performance-Optimized**
   - AIs: DeepSeek, Mistral
   - Focus: Speed, efficiency, memory
   - Output: Quicksort with partitioning optimization

   **Track B: Readability-Optimized**
   - AIs: GPT-4o, Perplexity
   - Focus: Clean, documented, maintainable
   - Output: Well-commented merge sort with clear logic

   **Track C: Balanced**
   - AIs: Qwen, Gemini, Llama
   - Focus: Performance + readability + robustness
   - Output: Hybrid approach (adaptive quicksort)

   Total time: ~25 seconds (all parallel)

4. **Outputs Comparison**:

   **Track A** - Performance-Optimized:
   ```javascript
   // Ultra-optimized quicksort with in-place partitioning
   function quickSort(arr, low = 0, high = arr.length - 1) {
     // Uses native JS optimizations, minimal memory
     // Result: O(n log n) average, ~1ms for 10k items
   }
   ```

   **Track B** - Readability-Optimized:
   ```javascript
   // Clear, well-documented merge sort
   /**
    * Sorts array using merge sort algorithm
    * @param {number[]} arr - Array to sort
    * @returns {number[]} Sorted array
    */
   function mergeSort(arr) {
     // Clear step-by-step implementation
     // Excellent for teaching/maintenance
   }
   ```

   **Track C** - Balanced:
   ```javascript
   // Adaptive algorithm that chooses best approach
   function smartSort(arr) {
     if (arr.length < 10) return insertionSort(arr);
     if (isPartiallySorted(arr)) return insertionSort(arr);
     return quickSort(arr);
   }
   ```

5. **Decision Making**:
   - **Choose Track A** if: Performance is critical, willing to sacrifice readability
   - **Choose Track B** if: Code maintenance/clarity most important
   - **Choose Track C** if: Want balanced, production-ready code
   - **Hybrid**: Take Track C as base, add Track A's optimization insights

### Why Parallel Tracks Work Here
- Directly compare different approaches
- Get all 3 in time similar to fixed 5-round
- Easy to choose based on project needs
- Can extract best ideas from each

---

## Example 5: Database Schema (Fixed 5-Round)

### Scenario
Designing a complex database schema for an e-commerce platform.

### Steps

1. **Enter Prompt**:
   ```
   Design a PostgreSQL schema for an e-commerce platform with products, orders,
   inventory, reviews, and user accounts. Include proper indexing, foreign keys,
   and normalization.
   ```

2. **Run Command**:
   - Select "RR-5: 5-Round Recursive Refinement (Fixed)"

3. **Evolution**:
   
   **Round 1**: Initial schema
   - Basic tables: users, products, orders, order_items
   
   **Round 2**: Critique identifies gaps
   - Missing inventory tracking
   - No review/rating system
   - No foreign key constraints
   - Performance: Missing indexes
   
   **Round 3**: Improvements applied
   - Add inventory table
   - Add reviews table
   - Add proper constraints
   - Add performance indexes
   
   **Round 4**: Validation check
   - Properly normalized?
   - Handles concurrent orders?
   - Scalable?
   - Missing audit log?
   
   **Round 5**: Final polish
   - Add audit/timestamp columns
   - Add triggers for inventory
   - Add check constraints
   - Production-grade documentation

4. **Final Schema**:
   Complete, normalized, indexed schema ready for production

---

## Example 6: React Component Library (Adaptive Refinement)

### Scenario
Creating a set of reusable React components.

### Steps

1. **Enter Prompt**:
   ```
   Create a set of reusable React components: Input, Button, Card, Modal.
   Each should support props for styling, variants, and accessibility features.
   ```

2. **Run Command**:
   - Select "RR-5: Adaptive Refinement (Auto-Complexity)"

3. **Result**:
   - Complexity: 7 (multiple components, accessibility)
   - Rounds: 3
   - Time: ~25 seconds

4. **Output**:
   - All 4 components with proper prop interfaces
   - Accessibility attributes included
   - Variant support (size, color, disabled states)
   - Proper TypeScript types
   - Example usage documentation

---

## Example 7: Testing Refinement Results

### Steps

1. **Run any refinement** (e.g., adaptive button component)

2. **Save the result**:
   - Copy refined code from conversation
   - Or click in conversation and save

3. **View result later**:
   - Open Command Palette (⌘K)
   - Select "View Last Refinement Result"
   - Get summary of what was refined

---

## Decision Tree: Which Mode to Use?

```
START: I need refined code
    ↓
Do I know the task complexity?
    ├─ NO → Use ADAPTIVE
    │       (Auto-detects: simple/medium/complex)
    │       Good for: Quick turnaround, unknown tasks
    │
    └─ YES
         ↓
    Is task SIMPLE? (button, style, simple logic)
         ├─ YES → Use ADAPTIVE or Fixed 2-round
         │        (Either way, ~15s)
         │
         └─ NO
              ↓
         Is task MEDIUM? (API, component, feature)
              ├─ YES → Use ADAPTIVE
              │        (3 rounds, ~25s)
              │
              └─ NO (COMPLEX: auth, DB, architecture)
                   ↓
              Want to COMPARE approaches?
                   ├─ YES → Use PARALLEL TRACKS
                   │        (Performance vs Readability vs Balanced)
                   │        Time: ~25s
                   │
                   └─ NO → Use FIXED 5-ROUND
                          (All 5 stages of refinement)
                          Time: ~40s
```

---

## Tips & Tricks

### Tip 1: Be Specific in Prompts
**Good**: "Create a memoized fibonacci function with unit tests"
**Bad**: "fibonacci function"

More specificity → better AI routing → better refinement

### Tip 2: Include Context
Select relevant files as context:
- Reference files help AIs understand structure
- Enables AIs to consider existing patterns
- Better integration with codebase

### Tip 3: Use Parallel Tracks for Learning
Want to see different approaches? Use parallel tracks:
- See performance-optimized version
- See readability-optimized version
- Learn from the differences
- Choose what matches your style

### Tip 4: Early Exit in Adaptive
Adaptive mode can exit early if quality reaches 9.5/10:
- Fast for already-good tasks
- Doesn't waste time on over-refinement
- Monitor refinement history for early exit

### Tip 5: Review All Rounds
Check the refinement history:
- See what each round improved
- Understand evolution of code
- Learn from AI feedback

### Tip 6: Save Best Results
After refinement:
1. Copy code to a new file in workspace
2. Test it
3. Keep for reference
4. View history with "View Last Refinement Result"

---

## Common Workflows

### Workflow A: Code Review & Improvement
1. Have existing code
2. Prompt: "Review and improve this code for [specific aspect]"
3. Use Fixed 5-Round for thorough refinement
4. Compare original vs refined

### Workflow B: Feature Exploration
1. Have feature requirement
2. Use Parallel Tracks to see 3 approaches
3. Choose preferred approach
4. Use Adaptive to refine chosen track

### Workflow C: Learning New Pattern
1. Prompt: "Show me a React Context pattern for state management"
2. Use Parallel Tracks to see:
   - Most performant implementation
   - Most readable/understandable version
   - Balanced production-ready version
3. Learn from all 3 examples

### Workflow D: Production Deployment
1. Have almost-ready feature
2. Use Fixed 5-Round for thorough refinement
3. Output is production-ready
4. Deploy with confidence

---

## Expected Results by Mode

### Fixed 5-Round
- Most thorough refinement
- All 5 stages executed
- Best for critical code
- Time: 30-45 seconds

### Adaptive
- Balanced approach
- Complexity-aware rounds
- Good for general work
- Time: 15-45 seconds depending on complexity

### Parallel Tracks
- 3 different solutions
- Compare and contrast
- Best for decision-making
- Time: 20-30 seconds (parallel execution)

---

## Troubleshooting

### "Refinement seems slow"
- Parallel Tracks: 20-30s is normal (3 parallel tracks)
- Fixed 5-Round: 30-45s is normal (5 sequential rounds)
- Adaptive: 15-45s depending on complexity

### "Refined code doesn't look different"
- Check refinement history in system messages
- Mock AIs have limited variation
- Real AI integration will show more difference

### "Want to see individual AI responses"
- Currently merged into combined result
- Can view in conversation history
- Look for orchestration metadata

### "Can't see refined code"
- Scroll down in conversation
- Look for messages with code blocks (```...```)
- Use "View Last Refinement Result" command
