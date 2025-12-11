/**
 * CodeValidator - Validates JavaScript/TypeScript code using ESLint, Prettier, and TypeScript
 * Uses CDN-based tools to avoid bundler dependency
 */

class CodeValidator {
  constructor() {
    this.eslintLoaded = false;
    this.prettierLoaded = false;
    this.tsLoaded = false;
    this.errors = [];
    this.initializeTools();
  }

  async initializeTools() {
    // Load ESLint from CDN
    await this.loadESLint();
    // Load Prettier from CDN
    await this.loadPrettier();
    // Load TypeScript from CDN
    await this.loadTypeScript();
  }

  async loadESLint() {
    if (window.ESLint) {
      this.eslintLoaded = true;
      return;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/eslint@8.57.0/dist/eslint.min.js';
      script.onload = () => {
        this.eslintLoaded = window.ESLint !== undefined;
        console.log('ESLint loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load ESLint from CDN');
        this.eslintLoaded = false;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async loadPrettier() {
    if (window.prettier) {
      this.prettierLoaded = true;
      return;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/prettier@3.0.3/standalone.min.js';
      script.onload = () => {
        this.prettierLoaded = window.prettier !== undefined;
        console.log('Prettier loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load Prettier from CDN');
        this.prettierLoaded = false;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async loadTypeScript() {
    if (window.ts) {
      this.tsLoaded = true;
      return;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/typescript@5.3.3/lib/typescript.js';
      script.onload = () => {
        this.tsLoaded = window.ts !== undefined;
        console.log('TypeScript loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load TypeScript from CDN');
        this.tsLoaded = false;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async validateCode(code, filePath = 'test.js') {
    const errors = [];
    const warnings = [];
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

    // Basic syntax validation that works in browser
    try {
      new Function(code);
    } catch (error) {
      errors.push({
        type: 'syntax',
        message: error.message,
        severity: 'error'
      });
    }

    // Basic formatting check (simulate Prettier style)
    const basicFormattingErrors = this.checkBasicFormatting(code);
    warnings.push(...basicFormattingErrors);

    // If TypeScript is loaded, attempt basic type checking
    if (this.tsLoaded && isTypeScript) {
      const tsErrors = this.validateTypeScript(code);
      errors.push(...tsErrors);
    }

    // If ESLint is loaded, attempt basic linting
    if (this.eslintLoaded) {
      const eslintErrors = await this.validateESLint(code, isTypeScript);
      warnings.push(...eslintErrors);
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
      timestamp: Date.now(),
      filePath
    };
  }

  validateTypeScript(code) {
    if (!window.ts) return [];

    const errors = [];
    const sourceFile = window.ts.createSourceFile(
      'temp.ts',
      code,
      window.ts.ScriptTarget.Latest,
      true
    );

    const diagnostics = window.ts.getPreEmitDiagnostics(sourceFile);

    diagnostics.forEach(diagnostic => {
      const message = window.ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      errors.push({
        type: 'typescript',
        message,
        severity: diagnostic.category === 1 ? 'error' : 'warning',
        code: diagnostic.code
      });
    });

    return errors;
  }

  /**
   * Basic formatting checks that work in browser environment
   */
  checkBasicFormatting(code) {
    const warnings = [];
    
    // Check for missing semicolons
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('/*') &&
          !trimmed.startsWith('*') &&
          (trimmed.includes('const ') || 
           trimmed.includes('let ') || 
           trimmed.includes('var ') ||
           trimmed.includes('function ') ||
           trimmed.includes('return '))) {
        warnings.push({
          type: 'formatting',
          message: `Missing semicolon on line ${index + 1}`,
          severity: 'warning',
          line: index + 1
        });
      }
    });

    // Check for inconsistent indentation
    const indentPattern = /^(\s+)/;
    let baseIndent = null;
    lines.forEach((line, index) => {
      const match = line.match(indentPattern);
      if (match && line.trim()) {
        const currentIndent = match[1].length;
        if (baseIndent === null) {
          baseIndent = currentIndent;
        } else if (currentIndent > baseIndent && currentIndent % baseIndent !== 0) {
          warnings.push({
            type: 'formatting',
            message: `Inconsistent indentation on line ${index + 1}`,
            severity: 'warning',
            line: index + 1
          });
        }
      }
    });

    return warnings;
  }

  async validateESLint(code, isTypeScript = false) {
    if (!window.ESLint) {
      return this.basicESLintCheck(code);
    }

    try {
      // Use simplified ESLint config that works in browser
      const eslint = new window.ESLint.ESLint({
        useEslintrc: false,
        baseConfig: {
          parserOptions: {
            ecmaVersion: 2021,
            sourceType: 'module'
          },
          rules: {
            'no-unused-vars': 'warn',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single']
          }
        }
      });

      const results = await eslint.lintText(code, { filePath: 'temp.js' });
      const messages = results[0]?.messages || [];

      return messages.map(message => ({
        type: 'eslint',
        message: message.message,
        severity: message.severity === 2 ? 'error' : 'warning',
        ruleId: message.ruleId,
        line: message.line,
        column: message.column
      }));
    } catch (error) {
      console.warn('Full ESLint failed, using basic checks:', error);
      return this.basicESLintCheck(code);
    }
  }

  basicESLintCheck(code) {
    const warnings = [];
    
    // Check for missing semicolons
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('/*') &&
          !trimmed.startsWith('*') &&
          (trimmed.includes('const ') || 
           trimmed.includes('let ') || 
           trimmed.includes('var ') ||
           trimmed.includes('function ') ||
           trimmed.includes('return '))) {
        warnings.push({
          type: 'eslint',
          message: `Missing semicolon at end of statement`,
          severity: 'warning',
          ruleId: 'semi',
          line: index + 1
        });
      }
    });

    // Check for quotes consistency
    const singleQuotes = (code.match(/'/g) || []).length;
    const doubleQuotes = (code.match(/"/g) || []).length;
    if (singleQuotes > 0 && doubleQuotes > 0) {
      warnings.push({
        type: 'eslint',
        message: `Strings must use single quotes`,
        severity: 'warning',
        ruleId: 'quotes'
      });
    }

    return warnings;
  }

  async formatCode(code, filePath = 'test.js') {
    if (!this.prettierLoaded || !window.prettier) {
      return { formatted: code, error: 'Prettier not loaded' };
    }

    try {
      const parser = filePath.endsWith('.ts') || filePath.endsWith('.tsx')
        ? 'typescript'
        : 'babel';

      const formatted = await window.prettier.format(code, {
        parser,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5'
      });

      return { formatted, error: null };
    } catch (error) {
      return { formatted: code, error: error.message };
    }
  }

  async validateAndFormat(code, filePath = 'test.js') {
    const validation = await this.validateCode(code, filePath);
    const formatting = await this.formatCode(code, filePath);

    return {
      ...validation,
      formatted: formatting.formatted,
      formattingError: formatting.error,
      hasIssues: validation.errors.length > 0 || formatting.error !== null
    };
  }
}

// Make classes available globally
window.CodeValidator = CodeValidator;
