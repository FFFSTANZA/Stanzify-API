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
      script.src = 'https://unpkg.com/eslint@8/dist/eslint.umd.js';
      script.onload = () => {
        this.eslintLoaded = window.ESLint !== undefined;
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load ESLint');
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
      script.src = 'https://unpkg.com/prettier@3/standalone.js';
      script.onload = () => {
        this.prettierLoaded = window.prettier !== undefined;
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load Prettier');
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
      script.src = 'https://unpkg.com/typescript@5/lib/typescript.js';
      script.onload = () => {
        this.tsLoaded = window.ts !== undefined;
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load TypeScript');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async validateCode(code, filePath = 'test.js') {
    const errors = [];
    const warnings = [];

    // Determine if TypeScript based on extension
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

    // Check TypeScript
    if (this.tsLoaded && isTypeScript) {
      const tsErrors = this.validateTypeScript(code);
      errors.push(...tsErrors);
    }

    // Check ESLint
    if (this.eslintLoaded) {
      const eslintErrors = await this.validateESLint(code, isTypeScript);
      errors.push(...eslintErrors);
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

  async validateESLint(code, isTypeScript = false) {
    if (!window.ESLint) return [];

    try {
      const eslint = new window.ESLint.ESLint({
        useEslintrc: false,
        baseConfig: {
          parser: isTypeScript ? '@typescript-eslint/parser' : undefined,
          env: {
            browser: true,
            es2021: true,
            node: true
          },
          parserOptions: {
            ecmaVersion: 2021,
            sourceType: 'module'
          },
          rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single']
          }
        }
      });

      const results = await eslint.lintText(code);
      const errors = [];

      results.forEach(result => {
        result.messages.forEach(message => {
          errors.push({
            type: 'eslint',
            message: message.message,
            severity: message.severity === 2 ? 'error' : 'warning',
            line: message.line,
            column: message.column,
            rule: message.ruleId
          });
        });
      });

      return errors;
    } catch (error) {
      console.warn('ESLint validation failed:', error);
      return [];
    }
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
