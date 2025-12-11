# Phase 4: Recursive Refinement Documentation Index

## Quick Navigation

### For First-Time Users
Start here: **PHASE4_SUMMARY.md**
- Quick overview of what Phase 4 does
- Three refinement modes explained
- Key features and benefits

### For Using the Feature
Read: **RR5_USAGE_EXAMPLES.md**
- 7 detailed real-world examples
- Decision tree: "Which mode should I use?"
- Tips, tricks, and workflows
- Expected results for each scenario

### For Understanding How It Works
Study: **PHASE4_RECURSIVE_REFINEMENT.md**
- Complete feature documentation
- Week 10 (5-round loop)
- Week 11 (adaptive refinement)
- Week 12 (parallel tracks)
- Configuration and customization

### For Technical Details
Reference: **RR5_ARCHITECTURE.md**
- System architecture diagram
- Core class descriptions
- Data structures
- Integration with existing classes
- Error handling
- Extension points for modifications

### For Testing
Follow: **TEST_RECURSIVE_REFINEMENT.md**
- 10 comprehensive test cases
- Manual testing procedures
- Performance benchmarks
- Automated test scenarios
- Browser compatibility checklist

## File Structure

```
/home/engine/project/
├── app.js                              (Main application)
│   ├── ComplexityAnalyzer             (NEW)
│   ├── RecursiveRefinementEngine      (NEW)
│   ├── ParallelRefinementTracks       (NEW)
│   ├── StanzifyApp                    (UPDATED)
│   └── ... (existing classes)
│
└── Documentation/
    ├── PHASE4_SUMMARY.md              (THIS FILE's context)
    ├── PHASE4_RECURSIVE_REFINEMENT.md (Complete documentation)
    ├── RR5_ARCHITECTURE.md            (Technical details)
    ├── RR5_USAGE_EXAMPLES.md          (Usage guide)
    ├── TEST_RECURSIVE_REFINEMENT.md   (Testing guide)
    ├── PHASE4_INDEX.md                (You are here)
    │
    ├── README.md                      (Project overview)
    ├── PHASE2_ORCHESTRATION.md        (Phase 2 docs)
    ├── EXAMPLE_USAGE.md               (General usage)
    ├── TEST_ORCHESTRATION.md          (Phase 2 tests)
    ├── IMPLEMENTATION_SUMMARY.md      (Phase 2 summary)
    └── ... (other project files)
```

## Quick Reference

### Three Refinement Modes

| Feature | Fixed 5-Round | Adaptive | Parallel Tracks |
|---------|---|---|---|
| **Rounds** | Always 5 | 2/3/5 based on complexity | 3×3 (3 tracks in parallel) |
| **Time** | 30-45s | 15-45s | 20-30s |
| **Best For** | Known complex tasks | Mixed workloads | Comparing approaches |
| **Command** | "RR-5: 5-Round..." | "RR-5: Adaptive..." | "RR-5: Parallel..." |
| **Output** | 1 refined version | 1 adaptive version | 3 different versions |

### New Commands (via Command Palette ⌘K)

1. **RR-5: 5-Round Recursive Refinement (Fixed)**
   - Full 5-stage refinement
   - All rounds execute
   - Best for known complex tasks

2. **RR-5: Adaptive Refinement (Auto-Complexity)**
   - Auto-detect task complexity
   - Execute 2, 3, or 5 rounds
   - Best for mixed workloads

3. **RR-5: Parallel Refinement Tracks (3 Paths)**
   - 3 evolution paths in parallel
   - Performance vs Readability vs Balanced
   - Best for comparing approaches

4. **View Last Refinement Result**
   - Review previous refinement
   - See summary of last run
   - Check rounds and output

## Implementation Checklist

### Core Classes ✓
- [x] ComplexityAnalyzer - Analyzes task complexity
- [x] RecursiveRefinementEngine - Manages 5-round refinement
- [x] ParallelRefinementTracks - Manages 3 parallel tracks

### Integration ✓
- [x] Added to StanzifyApp constructor
- [x] New methods: promptRecursiveRefinement()
- [x] New methods: promptParallelTracks()
- [x] New methods: viewLastRefinementResult()
- [x] Updated getCommands() with 4 new commands
- [x] Conversation history integration

### Features ✓
- [x] Week 10: 5-round refinement loop
- [x] Week 11: Adaptive complexity detection
- [x] Week 12: Parallel refinement tracks
- [x] Quality scoring (0-10)
- [x] Early exit logic (>= 9.5)
- [x] AI routing by round

### Documentation ✓
- [x] PHASE4_SUMMARY.md
- [x] PHASE4_RECURSIVE_REFINEMENT.md
- [x] RR5_ARCHITECTURE.md
- [x] RR5_USAGE_EXAMPLES.md
- [x] TEST_RECURSIVE_REFINEMENT.md
- [x] PHASE4_INDEX.md (this file)

### Testing ✓
- [x] 10 test cases documented
- [x] Manual testing procedures
- [x] Performance benchmarks
- [x] Error handling scenarios

## Common Questions

### Q: Which mode should I use?
**A:** See decision tree in RR5_USAGE_EXAMPLES.md
- Simple tasks → Use Adaptive (2 rounds)
- Complex known → Use Fixed (5 rounds)
- Want to compare → Use Parallel Tracks

### Q: How long does refinement take?
**A:** See performance benchmarks in RR5_ARCHITECTURE.md
- Simple adaptive: 15-20s
- Medium adaptive: 20-30s
- Complex fixed: 30-45s
- Parallel tracks: 20-30s (all 3 parallel)

### Q: Can I see the refinement history?
**A:** Yes! Check conversation history for:
- System messages with progress
- Individual round purposes
- Final refined code
- Metadata about refinement

### Q: How do I customize refinement?
**A:** See RR5_ARCHITECTURE.md > Extension Points
- Customize round prompts
- Add new tracks
- Change AI assignments
- Modify quality metrics

### Q: Are these real AIs?
**A:** Currently using mock implementations
- Ready for real AI integration
- See RR5_ARCHITECTURE.md for integration points
- Just replace AIWorker sendPrompt() with real API calls

## Getting Started

### 1. Open the app
- Load index.html in browser
- Wait for Monaco Editor to load

### 2. Try a refinement
- Enter a prompt (e.g., "create a button component")
- Press ⌘K to open Command Palette
- Select "RR-5: Adaptive Refinement (Auto-Complexity)"
- Watch the refinement execute in real-time

### 3. See the results
- System messages show progress
- Final code appears in conversation
- Use "View Last Refinement Result" to review

### 4. Compare approaches
- Enter an optimization prompt
- Select "RR-5: Parallel Refinement Tracks"
- Get 3 versions in ~30 seconds
- Compare performance vs readability tradeoffs

## Architecture Overview

### Class Hierarchy
```
ComplexityAnalyzer
  └─ analyzeComplexity(prompt)
  └─ returns: complexity score + round count

RecursiveRefinementEngine
  ├─ complexityAnalyzer (internal)
  ├─ recursiveRefine(prompt, files, adaptive)
  ├─ executeRound(...)
  └─ getQualityScore(code)

ParallelRefinementTracks
  ├─ refinementEngine (internal)
  ├─ executeParallelTracks(prompt, files)
  └─ executeTrack(name, prompt, files, ais, focus)

StanzifyApp
  ├─ recursiveRefinementEngine
  ├─ parallelRefinementTracks
  ├─ promptRecursiveRefinement()
  ├─ promptParallelTracks()
  └─ viewLastRefinementResult()
```

### Data Flow
```
User Prompt
    ↓
Choose Refinement Mode (Fixed/Adaptive/Parallel)
    ↓
Complexity Analysis (if Adaptive)
    ↓
Execute Rounds (1-5 or 3×3)
    ↓
Quality Scoring
    ↓
Return Results
    ↓
Display in Conversation
```

## Key Files

### Code
- **app.js** - 1932 lines, includes all Phase 4 implementation

### Documentation
- **PHASE4_SUMMARY.md** - High-level overview
- **PHASE4_RECURSIVE_REFINEMENT.md** - Complete feature docs
- **RR5_ARCHITECTURE.md** - Technical implementation
- **RR5_USAGE_EXAMPLES.md** - Practical examples
- **TEST_RECURSIVE_REFINEMENT.md** - Testing guide
- **PHASE4_INDEX.md** - This navigation file

## Support & Troubleshooting

### Refinement seems slow
- Check expected times in RR5_ARCHITECTURE.md
- Parallel tracks naturally take 20-30s
- Fixed 5-round naturally takes 30-45s

### Code doesn't look different
- Mock AIs have limited variation
- Real AI integration will show more difference
- Check refinement history to see improvements per round

### Want to add new feature
- See RR5_ARCHITECTURE.md > Extension Points
- Can add custom tracks or round purposes
- Easy to customize for your needs

### Found a bug
- Check TEST_RECURSIVE_REFINEMENT.md for known issues
- Review error scenarios section
- Test case procedures for validation

## Next Steps

1. **Try it out** - Run a simple refinement test
2. **Read examples** - See RR5_USAGE_EXAMPLES.md
3. **Understand it** - Study RR5_ARCHITECTURE.md
4. **Test it** - Follow TEST_RECURSIVE_REFINEMENT.md
5. **Customize it** - Extend with your own ideas

---

**Phase 4 Status**: ✅ Complete
**Last Updated**: December 11, 2024
**Version**: 1.0
