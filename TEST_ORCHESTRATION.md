# Testing Multi-AI Orchestration

## How to Test

1. Open the app in a browser at `http://localhost:8080`
2. The app should load with "🎭 Orchestrate AIs" button visible
3. Try these test prompts:

### Test 1: Refactoring Task
```
Prompt: "Refactor this code to make it more maintainable"

Expected:
- Classification: refactor
- Routed to: DeepSeek, Qwen, Mistral (or similar)
- 5 AI responses appear
- Merged response shows strategy used
```

### Test 2: Debug Task
```
Prompt: "Fix the bug where the button doesn't work"

Expected:
- Classification: debug
- Routed to: GPT-4o, Llama, DeepSeek
- Individual responses from debugging specialists
```

### Test 3: Create New Feature
```
Prompt: "Create a new user profile component"

Expected:
- Classification: create
- Routed to: GPT-4o, Gemini, Qwen, You.com
- Multiple implementation approaches
```

### Test 4: Performance Optimization
```
Prompt: "Optimize this function for better performance"

Expected:
- Classification: optimize
- Routed to: DeepSeek, Mistral
- Performance-focused suggestions
```

### Test 5: Architecture Discussion
```
Prompt: "Design the architecture for a chat system"

Expected:
- Classification: architecture
- Routed to: Qwen, Gemini
- High-level design patterns
```

## Command Palette Testing

Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to open command palette:

1. **Toggle Multi-AI Orchestration**
   - Toggles between orchestration mode and single AI mode
   - Button text changes accordingly

2. **Merge Strategy: [current]**
   - Cycles through: balanced → democratic → expert → balanced
   - Shows description of each strategy

3. **View AI Pool Status**
   - Shows all 10 AI workers
   - Displays their specialties

## Verification Checklist

- [ ] App loads without errors
- [ ] Button shows "🎭 Orchestrate AIs"
- [ ] Orchestration info panel visible
- [ ] Test prompt routes to correct AIs
- [ ] System messages appear during orchestration
- [ ] Multiple AI responses collected
- [ ] Merged response displayed with strategy info
- [ ] Individual AI responses visible in history
- [ ] Command palette commands work
- [ ] Toggle orchestration on/off works
- [ ] Merge strategy cycling works
- [ ] AI pool status displays correctly

## Conversation Panel Expected Output

After sending a prompt, you should see:

1. **User message**: Your prompt
2. **System message**: Task classification and routing info
3. **System message**: Orchestration completion status
4. **Assistant message**: Merged response with AI count and strategy
5. **AI-individual messages**: 5+ individual AI responses

Each message should have:
- Appropriate styling and colors
- Timestamp
- Correct role label
- Proper formatting

## Performance Notes

- Orchestration should complete in 1-2 seconds (mock mode)
- All responses should appear smoothly
- Conversation should auto-scroll to newest message
- No console errors

## Common Issues

### If orchestration doesn't work:
1. Check browser console for errors
2. Verify IndexedDB is enabled
3. Clear browser cache and reload
4. Check that all CDN scripts loaded

### If responses don't appear:
1. Check conversation panel height
2. Verify auto-scroll is working
3. Look for JavaScript errors
4. Ensure message rendering logic is working

## Success Criteria

✅ Task classification correctly identifies prompt type
✅ Smart routing selects appropriate AIs
✅ Parallel execution completes successfully
✅ Response merging produces coherent output
✅ UI updates show orchestration progress
✅ Individual responses are accessible
✅ Command palette controls work
✅ Performance is acceptable
