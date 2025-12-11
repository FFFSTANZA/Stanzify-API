/**
 * SyntaxChecker - Validates syntax by attempting execution in a sandboxed environment
 * Catches syntax errors and runtime issues before exposing to users
 */

class SyntaxChecker {
  constructor() {
    this.sandbox = null;
    this.errors = [];
  }

  /**
   * Check if code is valid JavaScript/TypeScript by attempting to parse and validate
   * Uses Function constructor for safe parsing without full execution
   */
  checkSyntax(code) {
    const errors = [];

    // Basic syntax check using Function constructor
    try {
      // This will throw if there's a syntax error
      new Function(code);
    } catch (error) {
      errors.push({
        type: 'syntax',
        message: error.message,
        severity: 'error',
        stack: error.stack
      });
    }

    // Additional checks for common issues
    const additionalErrors = this.checkCommonPatterns(code);
    errors.push(...additionalErrors);

    return {
      isValid: errors.length === 0,
      errors,
      timestamp: Date.now()
    };
  }

  /**
   * Check for common problematic patterns
   */
  checkCommonPatterns(code) {
    const errors = [];

    // Check for unmatched brackets
    if (!this.checkBracketBalance(code)) {
      errors.push({
        type: 'syntax',
        message: 'Unmatched brackets detected',
        severity: 'error'
      });
    }

    // Check for incomplete statements
    if (this.hasIncompleteStatements(code)) {
      errors.push({
        type: 'syntax',
        message: 'Incomplete statement detected',
        severity: 'warning'
      });
    }

    // Check for common typos in keywords
    const keywordErrors = this.checkKeywordTypos(code);
    errors.push(...keywordErrors);

    return errors;
  }

  /**
   * Verify bracket/brace/parenthesis balance
   */
  checkBracketBalance(code) {
    const pairs = {
      '{': '}',
      '[': ']',
      '(': ')'
    };

    const stack = [];
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const prevChar = i > 0 ? code[i - 1] : '';

      // Handle strings
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (inString) continue;

      // Handle comments
      if (char === '/' && code[i + 1] === '/') {
        i = code.indexOf('\n', i);
        if (i === -1) break;
        continue;
      }

      if (char === '/' && code[i + 1] === '*') {
        i = code.indexOf('*/', i) + 1;
        if (i < 0) break;
        continue;
      }

      // Check brackets
      if (pairs[char]) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        const expectedOpen = Object.keys(pairs).find(k => pairs[k] === char);
        if (stack.length === 0 || stack[stack.length - 1] !== expectedOpen) {
          return false;
        }
        stack.pop();
      }
    }

    return stack.length === 0;
  }

  /**
   * Check for incomplete statements
   */
  hasIncompleteStatements(code) {
    const lines = code.trim().split('\n');
    if (lines.length === 0) return false;

    const lastLine = lines[lines.length - 1].trim();

    // Check if last line ends with operators or unclosed structures
    const incompletePatterns = [
      /[,\{\\|&\+\-\*\/]$/,  // Ends with operator
      /\s+[a-zA-Z_]\w*\s*$/, // Incomplete statement
      /\.\s*$/ // Incomplete property access
    ];

    return incompletePatterns.some(pattern => pattern.test(lastLine));
  }

  /**
   * Check for common keyword typos
   */
  checkKeywordTypos(code) {
    const errors = [];
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return'];
    const typos = {
      'funciton': 'function',
      'const': 'const',
      'lte': 'let',
      'vat': 'var',
      'retrun': 'return',
      'whlie': 'while',
      'elif': 'else if'
    };

    Object.entries(typos).forEach(([typo, correct]) => {
      const regex = new RegExp(`\\b${typo}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        errors.push({
          type: 'syntax',
          message: `Possible keyword typo: "${typo}" should be "${correct}"`,
          severity: 'warning',
          occurrences: matches.length
        });
      }
    });

    return errors;
  }

  /**
   * Execute code in a sandboxed environment and catch runtime errors
   * WARNING: Only execute trusted code!
   */
  executeSandboxed(code) {
    const errors = [];
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;

    try {
      // Intercept console methods
      console.log = (...args) => {
        logs.push({ type: 'log', args: args.map(arg => String(arg)) });
        originalLog.apply(console, args);
      };

      console.error = (...args) => {
        logs.push({ type: 'error', args: args.map(arg => String(arg)) });
        originalError.apply(console, args);
      };

      // Execute code in strict mode
      (new Function(`'use strict'; ${code}`))();

    } catch (error) {
      errors.push({
        type: 'runtime',
        message: error.message,
        severity: 'error',
        stack: error.stack
      });
    } finally {
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
    }

    return {
      isValid: errors.length === 0,
      errors,
      logs,
      timestamp: Date.now()
    };
  }

  /**
   * Comprehensive check combining syntax and execution
   */
  comprehensiveCheck(code, executeCode = false) {
    const syntaxCheck = this.checkSyntax(code);

    let executionCheck = { isValid: true, errors: [], logs: [] };
    if (executeCode && syntaxCheck.isValid) {
      executionCheck = this.executeSandboxed(code);
    }

    return {
      syntax: syntaxCheck,
      execution: executionCheck,
      isValid: syntaxCheck.isValid && executionCheck.isValid,
      allErrors: [...syntaxCheck.errors, ...executionCheck.errors],
      logs: executionCheck.logs,
      timestamp: Date.now()
    };
  }
}
