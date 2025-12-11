/**
 * AutoFixPipeline - Automatically fixes code errors through iterative refinement
 * Routes errors to best AI specialists and learns from success rates
 */

class ErrorFixingAI {
  constructor(name, specialties) {
    this.name = name;
    this.specialties = specialties;
    this.successRate = 0.5; // Initial success rate
    this.totalAttempts = 0;
    this.successfulFixes = 0;
  }

  updateSuccessRate(success) {
    this.totalAttempts++;
    if (success) {
      this.successfulFixes++;
    }
    this.successRate = this.successfulFixes / this.totalAttempts;
  }

  isSpecialistFor(errorType) {
    return this.specialties.includes(errorType);
  }
}

class AutoFixPipeline {
  constructor(aiPoolManager, codeValidator, syntaxChecker) {
    this.aiPoolManager = aiPoolManager;
    this.codeValidator = codeValidator;
    this.syntaxChecker = syntaxChecker;
    this.maxAttempts = 3;
    this.fixHistory = [];
    this.errorFixingAIs = this.initializeErrorFixingAIs();
  }

  /**
   * Initialize AI specialists for different error types
   */
  initializeErrorFixingAIs() {
    const ais = {
      'syntax': new ErrorFixingAI('Qwen', ['syntax']),
      'type': new ErrorFixingAI('GPT-4o', ['type', 'typescript']),
      'logic': new ErrorFixingAI('DeepSeek', ['logic', 'runtime']),
      'performance': new ErrorFixingAI('DeepSeek', ['performance', 'optimize']),
      'style': new ErrorFixingAI('Qwen', ['style', 'formatting']),
      'security': new ErrorFixingAI('Qwen', ['security', 'vulnerability'])
    };

    return ais;
  }

  /**
   * Classify error by type
   */
  classifyError(error) {
    const { message = '', type = '' } = error;
    const lowerMsg = message.toLowerCase();

    if (type === 'syntax' || lowerMsg.includes('syntax') || lowerMsg.includes('unexpected')) {
      return 'syntax';
    }
    if (type === 'typescript' || lowerMsg.includes('type') || lowerMsg.includes('is not assignable')) {
      return 'type';
    }
    if (type === 'runtime' || lowerMsg.includes('undefined') || lowerMsg.includes('is not a function')) {
      return 'logic';
    }
    if (lowerMsg.includes('performance') || lowerMsg.includes('slow')) {
      return 'performance';
    }
    if (type === 'eslint' || lowerMsg.includes('unused') || lowerMsg.includes('semicolon')) {
      return 'style';
    }
    if (lowerMsg.includes('security') || lowerMsg.includes('vulnerability')) {
      return 'security';
    }

    return 'logic';
  }

  /**
   * Select best AI for fixing a specific error type
   */
  selectFixingAI(errorType) {
    const candidates = Object.values(this.errorFixingAIs)
      .filter(ai => ai.isSpecialistFor(errorType));

    if (candidates.length === 0) {
      // Fallback to any available AI
      return this.aiPoolManager.getWorker('GPT-4o');
    }

    // Sort by success rate and select best
    candidates.sort((a, b) => b.successRate - a.successRate);
    return this.aiPoolManager.getWorker(candidates[0].name);
  }

  /**
   * Generate fix prompt for AI
   */
  generateFixPrompt(code, errors) {
    const errorDescriptions = errors
      .map(error => {
        const type = error.type || 'unknown';
        const message = error.message || 'Unknown error';
        const context = error.line ? ` (line ${error.line})` : '';
        return `- ${type}: ${message}${context}`;
      })
      .join('\n');

    return `Fix the following errors in this code:

${errorDescriptions}

Original code:
\`\`\`javascript
${code}
\`\`\`

Return ONLY the fixed code in a code block, with no explanation.`;
  }

  /**
   * Extract fixed code from AI response
   */
  extractFixedCode(response) {
    const codeBlockRegex = /```(?:javascript|js)?\n([\s\S]*?)```/;
    const match = response.match(codeBlockRegex);
    return match ? match[1].trim() : response.trim();
  }

  /**
   * Execute full auto-fix pipeline
   */
  async generateWithValidation(prompt, initialCode) {
    let attempts = 0;
    let code = initialCode;
    const history = [];

    while (attempts < this.maxAttempts) {
      attempts++;

      // Validate current code
      const validation = await this.codeValidator.validateAndFormat(code);
      const syntaxCheck = this.syntaxChecker.checkSyntax(code);

      history.push({
        attempt: attempts,
        code,
        validation,
        syntaxCheck,
        timestamp: Date.now()
      });

      // If valid, return success
      if (validation.isValid && syntaxCheck.isValid) {
        return {
          success: true,
          code,
          formatted: validation.formatted,
          attempts,
          history,
          message: `Code fixed in ${attempts} attempt(s)`
        };
      }

      // If last attempt, return best effort
      if (attempts >= this.maxAttempts) {
        return {
          success: false,
          code: validation.formatted || code,
          attempts,
          history,
          errors: [...validation.errors, ...syntaxCheck.errors],
          message: `Could not fix all errors after ${this.maxAttempts} attempts`
        };
      }

      // Prepare for next iteration
      const allErrors = [...validation.errors, ...syntaxCheck.errors];
      if (allErrors.length === 0) break;

      // Classify primary error
      const primaryError = allErrors[0];
      const errorType = this.classifyError(primaryError);

      // Select best AI for this error type
      const fixingAI = this.selectFixingAI(errorType);
      if (!fixingAI) {
        console.warn('No AI available for error type:', errorType);
        break;
      }

      // Generate fix prompt
      const fixPrompt = this.generateFixPrompt(code, allErrors.slice(0, 5));

      // Get fixed code from AI
      try {
        const response = await fixingAI.sendPrompt({
          prompt: fixPrompt,
          contextFiles: []
        });

        const fixedCode = this.extractFixedCode(response.content);
        code = fixedCode;

        // Track success for learning
        const successCheck = await this.codeValidator.validateCode(code);
        const success = successCheck.isValid;
        const errorFixingAI = this.errorFixingAIs[errorType];
        if (errorFixingAI) {
          errorFixingAI.updateSuccessRate(success);
        }

      } catch (error) {
        console.warn('Failed to get fix from AI:', error);
        break;
      }
    }

    return {
      success: false,
      code,
      attempts,
      history,
      message: `Could not achieve valid code after ${attempts} attempts`
    };
  }

  /**
   * Get performance statistics
   */
  getStatistics() {
    const stats = {};

    Object.entries(this.errorFixingAIs).forEach(([errorType, ai]) => {
      stats[errorType] = {
        aiName: ai.name,
        successRate: (ai.successRate * 100).toFixed(1) + '%',
        attempts: ai.totalAttempts,
        successes: ai.successfulFixes
      };
    });

    return stats;
  }

  /**
   * Reset learning data
   */
  resetStatistics() {
    this.errorFixingAIs = this.initializeErrorFixingAIs();
  }

  /**
   * Get error fixing history
   */
  getHistory() {
    return this.fixHistory;
  }

  /**
   * Save/load statistics from localStorage
   */
  saveStatistics() {
    const stats = {};
    Object.entries(this.errorFixingAIs).forEach(([key, ai]) => {
      stats[key] = {
        successRate: ai.successRate,
        totalAttempts: ai.totalAttempts,
        successfulFixes: ai.successfulFixes
      };
    });

    localStorage.setItem('autofix-statistics', JSON.stringify(stats));
  }

  loadStatistics() {
    try {
      const stats = JSON.parse(localStorage.getItem('autofix-statistics') || '{}');
      Object.entries(stats).forEach(([key, data]) => {
        if (this.errorFixingAIs[key]) {
          this.errorFixingAIs[key].successRate = data.successRate;
          this.errorFixingAIs[key].totalAttempts = data.totalAttempts;
          this.errorFixingAIs[key].successfulFixes = data.successfulFixes;
        }
      });
    } catch (error) {
      console.warn('Failed to load statistics:', error);
    }
  }
}

// Make classes available globally
window.AutoFixPipeline = AutoFixPipeline;
window.ErrorFixingAI = ErrorFixingAI;
