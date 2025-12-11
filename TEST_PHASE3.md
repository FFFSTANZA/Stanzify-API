# Phase 3 Verification Layer - Test Guide

## Manual Testing Checklist

### 1. Application Launch
- [ ] Page loads without errors in browser console
- [ ] Monaco editor appears
- [ ] Left panel shows files and context
- [ ] Verification panel appears bottom-right
- [ ] All UI elements visible

### 2. Code Validation
- [ ] Open a JavaScript file in editor
- [ ] Validation panel shows "✓ No validation errors"
- [ ] Edit code to introduce an error (missing semicolon)
- [ ] Error appears in validation panel
- [ ] Error shows type, message, and line number
- [ ] Quality score hidden when errors present
- [ ] Fix the error
- [ ] Error disappears
- [ ] Quality score reappears

### 3. Quality Scoring
- [ ] Write clean code
- [ ] Quality score appears with circular display
- [ ] Score shows 1-10 value
- [ ] Breakdown shows readability, performance, security, best practices
- [ ] Color coding appears (green for good)
- [ ] Metrics are in 1-10 range
- [ ] Aggregate score is average of metrics

### 4. Verification Commands (Ctrl+K)
- [ ] "Toggle Code Verification" toggles on/off
- [ ] "Run Verification Check" runs validation
- [ ] "Auto-Fix Errors" appears and is clickable
- [ ] "Generate & Run Tests" appears and is clickable
- [ ] "Auto-Fix Statistics" shows learning data

### 5. Auto-Fix Pipeline
- [ ] Open a file with syntax errors
- [ ] Run "Auto-Fix Errors" from command palette
- [ ] Progress bar appears showing attempt 1/3
- [ ] Auto-fix panel shows "Attempt 1 of 3..."
- [ ] After completion:
  - [ ] If successful: "✅ Code fixed in N attempt(s)"
  - [ ] If unsuccessful: "⚠️ Could not fix after 3 attempts"
- [ ] Fixed code replaces broken code in editor
- [ ] Success message appears in panel

### 6. Test Generation
- [ ] Open a file with functions
- [ ] Run "Generate & Run Tests" from command palette
- [ ] Test panel shows loading state
- [ ] Tests appear with pass/fail results
- [ ] Shows "X passed, Y failed, Z total"
- [ ] Test errors listed if any failed

### 7. Learning System
- [ ] Run auto-fix multiple times on different error types
- [ ] View "Auto-Fix Statistics" from command palette
- [ ] Statistics show:
  - [ ] Error type (syntax, type, logic, etc.)
  - [ ] AI name assigned to that type
  - [ ] Success rate percentage
  - [ ] Number of attempts

### 8. UI Panels
- [ ] **Quality Section**:
  - [ ] Circular score display with color
  - [ ] Score value centered
  - [ ] Breakdown metrics below
  - [ ] Each metric shows name and score

- [ ] **Validation Section**:
  - [ ] Status indicator (green/red dot)
  - [ ] Error count
  - [ ] Error list with types
  - [ ] Line numbers shown
  - [ ] Max 5 errors shown with count

- [ ] **Test Section**:
  - [ ] Shows passed/failed/total
  - [ ] Green for passed, red for failed
  - [ ] Test errors listed
  - [ ] "No tests" message when none

- [ ] **Auto-Fix Section**:
  - [ ] Progress bar during fixing
  - [ ] Attempt counter
  - [ ] Success/warning message after
  - [ ] Expandable history

### 9. Command Palette Integration
- [ ] Open palette with Ctrl+K
- [ ] Search for "verification" filters commands
- [ ] Search for "auto-fix" shows related commands
- [ ] Commands execute correctly when selected
- [ ] Palette closes after command execution

### 10. Edge Cases
- [ ] Empty file: no validation errors, no quality score
- [ ] Very large file (>10KB): validation completes
- [ ] TypeScript file (.ts): TypeScript checks run
- [ ] React/JSX file: appropriate linting rules apply
- [ ] Code with eval(): Security score reflects warning
- [ ] Code with innerHTML: Security score reflects warning

### 11. Persistence
- [ ] Reload page (F5)
- [ ] Auto-fix statistics preserved
- [ ] Editor content preserved
- [ ] File tree expanded/collapsed state preserved
- [ ] Verification enabled/disabled state works

### 12. Performance
- [ ] Validation completes within 1 second
- [ ] Quality assessment completes within 5 seconds
- [ ] Auto-fix completes within 15 seconds (3 attempts)
- [ ] No browser freeze during operations
- [ ] Panel responsive to user interaction

### 13. Browser Compatibility
Test in:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 14. Error Recovery
- [ ] Disable verification and re-enable
- [ ] Auto-fix on file with completely broken code
- [ ] Generate tests on file with no functions
- [ ] Refresh page during validation
- [ ] Clear browser cache and reload

---

## Automated Test Scenarios

### Scenario 1: Simple JavaScript File
```javascript
function add(a, b) {
  return a + b;
}
```
**Expected**:
- ✓ No validation errors
- Quality score appears (8+/10)
- Tests can be generated
- Auto-fix has nothing to fix

### Scenario 2: File with Syntax Error
```javascript
function add(a, b) {
  return a + b
}  // Missing semicolon
```
**Expected**:
- ✗ Shows semicolon error
- Quality score hidden
- Auto-fix can fix the error
- After fix: ✓ No errors

### Scenario 3: TypeScript File
```typescript
function greet(name: string): string {
  return `Hello, ${name}`;
}
```
**Expected**:
- ✓ No TypeScript errors
- Quality score appears
- Tests can be generated

### Scenario 4: File with Type Error
```typescript
function multiply(a: number, b: number): number {
  return a + "string";  // Type error
}
```
**Expected**:
- ✗ Shows type error
- Error message includes TypeScript diagnostic
- Auto-fix routes to GPT-4o (type specialist)

### Scenario 5: Performance Issue
```javascript
for (let i = 0; i < 100; i++) {
  for (let j = 0; j < 100; j++) {
    console.log(i * j);
  }
}
```
**Expected**:
- ✓ No validation errors
- Quality score shows performance < 7
- Auto-fix can suggest improvements

### Scenario 6: Security Issue
```javascript
const code = userInput;
eval(code);  // Security risk
```
**Expected**:
- Security score low (< 5)
- Security vulnerabilities highlighted
- Recommendations suggest safer alternatives

---

## Test Results Recording

When testing, record:

```
Platform: [Browser/Version]
Date: [Date]
Tester: [Name]

✓ = Pass
✗ = Fail
? = Untested

Core Features:
  ✓ Application launches
  ✓ Code validation works
  ✓ Quality scoring works
  ✓ Auto-fix pipeline works
  ✓ Test generation works
  ✓ Learning system tracks stats

UI/UX:
  ✓ Panels display correctly
  ✓ Colors appropriate
  ✓ Interactions responsive
  ✓ No layout issues

Performance:
  ✓ < 1 second validation
  ✓ < 5 second quality assessment
  ✓ < 15 second auto-fix

Issues Found:
  [List any problems]

Notes:
  [Any observations]
```

---

## Performance Benchmarks

### Baseline (Mock AIs)
- Validation: 300-500ms
- Quality Assessment: 2-5 seconds (simulated)
- Auto-Fix Single Attempt: 0.8-2 seconds
- Auto-Fix Full (3 attempts): 3-10 seconds
- Test Generation: 1-2 seconds

### Expected with Real AIs
- Quality Assessment: 5-15 seconds
- Auto-Fix: 5-30 seconds per attempt
- Test Generation: 5-10 seconds

---

## Regression Testing

Before considering Phase 3 complete:

- [ ] Phase 2 orchestration still works
- [ ] Phase 1 file system still works
- [ ] No console errors
- [ ] No broken existing features
- [ ] All new features functional
- [ ] Documentation complete

---

## Sign-Off

- [ ] All manual tests passed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Ready for production

**Date**: ___________
**Tester**: ___________
**Status**: ✓ APPROVED / ✗ NEEDS WORK
