# Phase 3: Verification Layer - Quick Start Guide

## What's New

Phase 3 adds automatic code verification, quality scoring, and error fixing before code is shown to users. Everything runs in the browser using CDN-hosted tools.

## Key Features

### 1. **Real-Time Code Validation**
- ESLint checks for code quality issues
- Prettier formatting suggestions
- TypeScript type checking
- Displays errors in a floating panel on the right side of the editor

### 2. **Automatic Quality Scoring**
Evaluates code on 4 dimensions:
- **Readability** (9/10): Clear variable names, good organization
- **Performance** (8/10): Efficient algorithms, optimized loops
- **Security** (9/10): No injection risks, safe patterns
- **Best Practices** (8/10): DRY principle, SOLID patterns

Aggregate score shows overall code quality with color-coded display (green=excellent, blue=very good, orange=fair).

### 3. **Auto-Fix Pipeline**
Automatically fixes errors in up to 3 attempts:
1. Validates code
2. Classifies errors (syntax, type, logic, performance, security)
3. Routes to best AI specialist
4. Generates and applies fix
5. Validates result
6. Returns to user if successful

Smart routing:
- **Syntax errors** → Qwen
- **Type errors** → GPT-4o  
- **Logic errors** → DeepSeek
- **Performance issues** → DeepSeek
- **Security issues** → Qwen

### 4. **Test Generation & Execution**
- Automatically generates Jest unit tests
- Tests cover happy paths, edge cases, error handling
- Displays pass/fail results in verification panel
- Fallback to basic test templates if needed

### 5. **Learning System**
- Tracks which AI is best at fixing which error types
- Stores success rates in localStorage
- Automatically improves AI routing over time
- View statistics anytime

## Using the Verification Layer

### Open Command Palette
Press **Ctrl+K** (or **Cmd+K** on Mac) to open the command palette.

### Available Commands

1. **Toggle Code Verification** - Turn verification on/off
2. **Run Verification Check** - Manually validate current code
3. **Auto-Fix Errors** - Fix errors in current file (up to 3 attempts)
4. **Generate & Run Tests** - Create and run tests for current code
5. **Auto-Fix Statistics** - View learning data and success rates

### Automatic Verification

Verification runs automatically when you edit code:
1. Editor shows green checkmark if no errors
2. Editor shows red errors if problems found
3. Quality score updates asynchronously (if valid)
4. All displayed in floating panel on right

### Manual Commands

**Example 1: Fix a broken file**
```
1. Edit a JavaScript file with errors
2. Press Ctrl+K
3. Select "Auto-Fix Errors"
4. Watch the progress bar as AI fixes up to 3 times
5. See the result in the auto-fix panel
```

**Example 2: Generate tests**
```
1. Edit a JavaScript file with functions
2. Press Ctrl+K
3. Select "Generate & Run Tests"
4. Tests are created and executed
5. See pass/fail results in test panel
```

**Example 3: Check quality**
```
1. Edit code
2. If no validation errors, quality score appears automatically
3. Hover over metrics to see breakdowns
4. Read suggestions for improvement
```

## UI Panels

### Verification Panel (bottom-right)
Fixed panel showing:
- **Quality Score**: Circular display with breakdown (9/10)
- **Validation**: Error list with types and locations
- **Tests**: Pass/fail summary and errors
- **Auto-Fix**: Progress and results

### Colors & Indicators
- 🟢 Green: Excellent/Good score
- 🔵 Blue: Very Good score
- 🟠 Orange: Fair score
- 🔴 Red: Validation errors

## How It Works

### Validation Flow
```
Code in Editor
    ↓
ESLint Check
    ↓
TypeScript Check (if .ts/.tsx)
    ↓
Syntax Check
    ↓
Display Errors ← If found
    ↓
Quality Assessment ← If valid
    ↓
Display Quality Score
```

### Auto-Fix Flow
```
Code with Errors
    ↓
Classify Error Type
    ↓
Route to Best AI
    ↓
Generate Fix Prompt
    ↓
Execute Fix
    ↓
Validate Result
    ↓
Success? ← Yes → Return
         ← No → Retry (max 3)
```

### Quality Assessment Flow
```
Code (valid)
    ↓
┌─ GPT-4o: Readability Score
├─ DeepSeek: Performance Score
├─ Qwen: Security Score
└─ Gemini: Best Practices Score
    ↓
Calculate Aggregate (average)
    ↓
Display with color coding
```

## Learning System

The auto-fix pipeline learns from experience:

**Example Scenario:**
- First time fixing a syntax error: Routes to all AIs
- Qwen fixes it successfully: Success rate increases
- Next syntax error: Preferentially routes to Qwen
- After 10 fixes: "Qwen fixed 8/10 syntax errors → 80% success"

View current statistics:
1. Press Ctrl+K
2. Select "Auto-Fix Statistics"
3. See success rates per AI per error type

## Customization

### Disable Verification
Press Ctrl+K → "Toggle Code Verification" → OFF

### Change Validation Rules
Edit rules in `verification/code-validator.js`:
- Line 149-155: ESLint rules
- Line 191-196: Prettier options

### Add Custom Checks
Extend any verification class:
```javascript
class CodeValidator {
  // Add custom validation method
  async validateCustom(code) {
    // Your logic here
  }
}
```

## Performance

- **Validation**: ~300ms (ESLint + TypeScript)
- **Quality Assessment**: ~2-5 seconds (parallel AI)
- **Auto-Fix**: ~3-10 seconds per attempt (AI response)
- **Tests**: ~2-4 seconds (AI generation)

These are with mock AIs. Real AI integration will be slower.

## Troubleshooting

### Verification Panel Not Showing
- Check if verification is enabled (command palette)
- Reload page: F5
- Check browser console for errors

### ESLint/Prettier Not Loading
- Check internet connection (CDN access needed)
- Try different file type (JS vs TS)
- Console shows "Failed to load" warnings if CDN fails

### Auto-Fix Stuck
- Cancel and try again
- Check file syntax isn't completely broken
- Try smaller files first

### No Quality Score
- Code must be valid (no errors) for assessment
- Code must be >50 characters
- Wait 2-5 seconds for parallel AI evaluation

## Files Structure

```
/home/engine/project/
├── index.html                          # Main UI
├── app.js                              # Main application
├── styles.css                          # UI styling
├── verification/
│   ├── code-validator.js               # ESLint, Prettier, TypeScript
│   ├── syntax-checker.js               # Syntax validation
│   ├── test-generator.js               # Test creation & execution
│   ├── auto-fix-pipeline.js            # Error fixing with learning
│   ├── quality-scorer.js               # Multi-dimensional analysis
│   └── verification-ui.js              # UI components
├── PHASE3_VERIFICATION.md              # Detailed documentation
└── PHASE3_QUICKSTART.md                # This file
```

## Next Steps

1. **Test It**: Edit code and watch verification run
2. **Fix Errors**: Use auto-fix to resolve issues
3. **Generate Tests**: Create test cases automatically
4. **Monitor Quality**: Watch quality score improve as you refine code
5. **Check Statistics**: See which AIs are best at different tasks

## API Usage (for developers)

### Programmatic Verification
```javascript
// From StanzifyApp instance
const result = await app.codeValidator.validateAndFormat(code, 'test.js');
console.log(result.errors);
```

### Quality Assessment
```javascript
const assessment = await app.qualityScorer.assessCode(code);
console.log(assessment.aggregate.score); // e.g., "8.5"
```

### Auto-Fix
```javascript
const fixed = await app.autoFixPipeline.generateWithValidation(prompt, code);
console.log(fixed.code); // Fixed code
```

### Test Generation
```javascript
const testResult = await app.testGenerator.generateAndTest(code);
console.log(testResult.execution.results.passed); // Number of tests passed
```

## Support

For issues or questions:
1. Check browser console (F12)
2. Review PHASE3_VERIFICATION.md for detailed docs
3. Check individual module comments for API details

---

**Happy coding! The verification layer has your back.** 🚀
