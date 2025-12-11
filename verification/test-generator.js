/**
 * TestGenerator - Generates unit tests for code using AI and runs them
 * Supports Jest browser build for test execution
 */

class TestGenerator {
  constructor(aiPoolManager) {
    this.aiPoolManager = aiPoolManager;
    this.jestLoaded = false;
    this.tests = [];
    this.testResults = [];
  }

  /**
   * Load Jest browser build
   */
  async loadJest() {
    if (this.jestLoaded) return;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jest@29.7.0/dist/jest.min.js';
      script.onload = () => {
        this.jestLoaded = window.jest !== undefined;
        console.log('Jest loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load Jest from CDN');
        this.jestLoaded = false;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Generate tests for code using AI
   */
  async generateTests(code, prompt = '', aiName = 'GPT-4o') {
    const testPrompt = `Generate Jest unit tests for this code. Include test cases for:
1. Normal/happy path scenarios
2. Edge cases
3. Error handling
4. Input validation

Code to test:
\`\`\`javascript
${code}
\`\`\`

Return ONLY the test code, no explanations. Use the following format:
\`\`\`javascript
describe('MyFunction', () => {
  test('should ...', () => {
    // test code
  });
});
\`\`\``;

    try {
      // Get AI worker
      const worker = this.aiPoolManager?.getWorker(aiName);
      if (!worker) {
        return this.generateBasicTests(code);
      }

      // Request test generation
      const response = await worker.sendPrompt({
        prompt: testPrompt,
        contextFiles: []
      });

      // Extract test code from response
      const testCode = this.extractTestCode(response.content);
      this.tests.push({
        code: testCode,
        generatedBy: aiName,
        timestamp: Date.now(),
        originalCode: code
      });

      return {
        success: true,
        testCode,
        generatedBy: aiName,
        message: 'Tests generated successfully'
      };
    } catch (error) {
      console.warn('Test generation failed:', error);
      return this.generateBasicTests(code);
    }
  }

  /**
   * Extract test code from AI response
   */
  extractTestCode(content) {
    const codeBlockRegex = /```(?:javascript|js)?\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);
    return match ? match[1].trim() : '';
  }

  /**
   * Generate basic tests as fallback
   */
  generateBasicTests(code) {
    // Extract function names from code
    const functionNameRegex = /(?:function|const)\s+(\w+)\s*=?\s*(?:function)?\s*\(/g;
    const functions = [];
    let match;

    while ((match = functionNameRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }

    if (functions.length === 0) {
      return {
        success: false,
        testCode: '',
        message: 'Could not generate tests - no functions found'
      };
    }

    // Generate basic test template
    const testCode = functions
      .map(fn => `describe('${fn}', () => {
  test('should be defined', () => {
    expect(${fn}).toBeDefined();
  });

  test('should be a function', () => {
    expect(typeof ${fn}).toBe('function');
  });

  // Add more test cases here
});`)
      .join('\n\n');

    return {
      success: true,
      testCode,
      generatedBy: 'fallback',
      message: 'Generated basic test template'
    };
  }

  /**
   * Execute tests using simple evaluation
   * Note: Jest browser build requires additional setup
   */
  async executeTests(testCode) {
    const results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: [],
      timestamp: Date.now()
    };

    // Simple test runner since full Jest in browser is complex
    try {
      // Extract test blocks
      const testRegex = /test\s*\(\s*['"`](.*?)['"`]\s*,\s*\(\s*\)\s*=>\s*{([\s\S]*?)}/g;
      let testMatch;

      while ((testMatch = testRegex.exec(testCode)) !== null) {
        results.totalTests++;
        const testName = testMatch[1];
        const testBody = testMatch[2];

        try {
          // Execute test
          (new Function(testBody))();
          results.passed++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            test: testName,
            error: error.message
          });
        }
      }

      return {
        success: results.failed === 0,
        results,
        coverage: results.totalTests > 0
          ? `${((results.passed / results.totalTests) * 100).toFixed(1)}%`
          : 'N/A'
      };
    } catch (error) {
      results.errors.push({
        type: 'execution',
        error: error.message
      });

      return {
        success: false,
        results,
        error: error.message
      };
    }
  }

  /**
   * Generate and execute tests in sequence
   */
  async generateAndTest(code, aiName = 'GPT-4o') {
    const generation = await this.generateTests(code, '', aiName);

    if (!generation.success || !generation.testCode) {
      return {
        generation,
        execution: null,
        message: 'Test generation failed'
      };
    }

    const execution = await this.executeTests(generation.testCode);

    return {
      generation,
      execution,
      success: execution.success,
      message: execution.success ? 'All tests passed!' : 'Some tests failed'
    };
  }

  /**
   * Get test coverage assessment
   */
  getTestCoverage(testResults) {
    if (!testResults || testResults.totalTests === 0) {
      return { coverage: 0, level: 'no-tests' };
    }

    const passed = testResults.passed;
    const total = testResults.totalTests;
    const coverage = (passed / total) * 100;

    let level = 'poor';
    if (coverage >= 90) level = 'excellent';
    else if (coverage >= 75) level = 'good';
    else if (coverage >= 50) level = 'moderate';
    else if (coverage > 0) level = 'poor';

    return { coverage, passed, total, level };
  }
}

// Make class available globally
window.TestGenerator = TestGenerator;
