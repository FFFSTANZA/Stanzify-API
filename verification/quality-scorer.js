/**
 * QualityScorer - Evaluates code across multiple dimensions
 * Provides readability, performance, security, and best practices scores
 */

class QualityScorer {
  constructor(aiPoolManager) {
    this.aiPoolManager = aiPoolManager;
    this.metrics = {
      readability: { weight: 0.25, min: 0, max: 10 },
      performance: { weight: 0.25, min: 0, max: 10 },
      security: { weight: 0.25, min: 0, max: 10 },
      bestPractices: { weight: 0.25, min: 0, max: 10 }
    };
  }

  /**
   * Evaluate code readability
   */
  async evaluateReadability(code) {
    try {
      const prompt = `Rate this code's readability on a scale of 1-10. Consider:
- Variable/function naming clarity
- Code organization and structure
- Comment documentation
- Complexity level

Code:
\`\`\`javascript
${code.slice(0, 1000)}
\`\`\`

Respond with ONLY a JSON object: {"score": <number>, "reason": "<brief explanation>"}`;

      const worker = this.aiPoolManager?.getWorker('GPT-4o');
      if (!worker) {
        return this.estimateReadability(code);
      }

      const response = await worker.sendPrompt({
        prompt,
        contextFiles: []
      });

      return this.parseScoreResponse(response.content, 'readability');
    } catch (error) {
      console.warn('Readability evaluation failed:', error);
      return this.estimateReadability(code);
    }
  }

  /**
   * Evaluate performance characteristics
   */
  async evaluatePerformance(code) {
    try {
      const prompt = `Analyze this code for performance bottlenecks and efficiency. Rate it 1-10 for:
- Algorithm efficiency (O notation consideration)
- Memory usage
- Unnecessary loops or iterations
- DOM manipulation efficiency (if applicable)

Code:
\`\`\`javascript
${code.slice(0, 1000)}
\`\`\`

Respond with ONLY a JSON object: {"score": <number>, "issues": ["issue1", "issue2"], "suggestions": ["suggestion1"]}`;

      const worker = this.aiPoolManager?.getWorker('DeepSeek');
      if (!worker) {
        return this.estimatePerformance(code);
      }

      const response = await worker.sendPrompt({
        prompt,
        contextFiles: []
      });

      return this.parsePerformanceResponse(response.content);
    } catch (error) {
      console.warn('Performance evaluation failed:', error);
      return this.estimatePerformance(code);
    }
  }

  /**
   * Evaluate security posture
   */
  async evaluateSecurity(code) {
    try {
      const prompt = `Review this code for security vulnerabilities. Rate it 1-10 for:
- Input validation and sanitization
- SQL/code injection risks
- XSS vulnerabilities
- Unsafe eval() usage
- Exposed sensitive information

Code:
\`\`\`javascript
${code.slice(0, 1000)}
\`\`\`

Respond with ONLY a JSON object: {"score": <number>, "vulnerabilities": ["vuln1", "vuln2"], "recommendations": ["rec1"]}`;

      const worker = this.aiPoolManager?.getWorker('Qwen');
      if (!worker) {
        return this.estimateSecurity(code);
      }

      const response = await worker.sendPrompt({
        prompt,
        contextFiles: []
      });

      return this.parseSecurityResponse(response.content);
    } catch (error) {
      console.warn('Security evaluation failed:', error);
      return this.estimateSecurity(code);
    }
  }

  /**
   * Evaluate best practices adherence
   */
  async evaluateBestPractices(code) {
    try {
      const prompt = `Review this code for adherence to JavaScript/Node best practices. Rate it 1-10 for:
- DRY principle (Don't Repeat Yourself)
- SOLID principles
- Error handling
- Async/await usage (if applicable)
- Testing potential
- Modularity and reusability

Code:
\`\`\`javascript
${code.slice(0, 1000)}
\`\`\`

Respond with ONLY a JSON object: {"score": <number>, "issues": ["issue1", "issue2"], "improvements": ["improvement1"]}`;

      const worker = this.aiPoolManager?.getWorker('Gemini');
      if (!worker) {
        return this.estimateBestPractices(code);
      }

      const response = await worker.sendPrompt({
        prompt,
        contextFiles: []
      });

      return this.parseBestPracticesResponse(response.content);
    } catch (error) {
      console.warn('Best practices evaluation failed:', error);
      return this.estimateBestPractices(code);
    }
  }

  /**
   * Parse score response from AI
   */
  parseScoreResponse(content, type) {
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (!jsonMatch) return this.getDefaultScore(type);

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(10, Math.max(0, parsed.score || 5)),
        reason: parsed.reason || 'Analysis completed',
        type
      };
    } catch (error) {
      return this.getDefaultScore(type);
    }
  }

  /**
   * Parse performance response from AI
   */
  parsePerformanceResponse(content) {
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (!jsonMatch) return this.estimatePerformance('');

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(10, Math.max(0, parsed.score || 5)),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        type: 'performance'
      };
    } catch (error) {
      return this.estimatePerformance('');
    }
  }

  /**
   * Parse security response from AI
   */
  parseSecurityResponse(content) {
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (!jsonMatch) return this.estimateSecurity('');

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(10, Math.max(0, parsed.score || 5)),
        vulnerabilities: Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        type: 'security'
      };
    } catch (error) {
      return this.estimateSecurity('');
    }
  }

  /**
   * Parse best practices response from AI
   */
  parseBestPracticesResponse(content) {
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (!jsonMatch) return this.estimateBestPractices('');

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(10, Math.max(0, parsed.score || 5)),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        type: 'bestPractices'
      };
    } catch (error) {
      return this.estimateBestPractices('');
    }
  }

  /**
   * Estimate readability heuristically
   */
  estimateReadability(code) {
    let score = 7;

    // Adjust based on length
    if (code.length > 2000) score -= 1;
    if (code.length < 200) score += 1;

    // Check for comments
    const commentRatio = (code.match(/\/\//g) || []).length / (code.split('\n').length);
    if (commentRatio < 0.05) score -= 1;
    if (commentRatio > 0.15) score += 0.5;

    // Check for consistent naming
    const camelCaseRatio = (code.match(/[a-z][A-Z]/g) || []).length / code.split(/\s+/).length;
    if (camelCaseRatio > 0.1) score += 0.5;

    return {
      score: Math.min(10, Math.max(0, score)),
      reason: 'Heuristic estimation based on code structure',
      type: 'readability'
    };
  }

  /**
   * Estimate performance heuristically
   */
  estimatePerformance(code) {
    let score = 7;
    const issues = [];
    const suggestions = [];

    // Check for nested loops
    const nestedLoops = (code.match(/for.*for|while.*while/g) || []).length;
    if (nestedLoops > 0) {
      score -= 2;
      issues.push('Nested loops detected - potential O(n²) or worse complexity');
      suggestions.push('Consider flattening loops or using more efficient algorithms');
    }

    // Check for repeated calculations
    const repeated = (code.match(/\.\w+\(/g) || []).length;
    if (repeated > 10) {
      score -= 1;
      issues.push('Many method calls - consider caching results');
    }

    return {
      score: Math.min(10, Math.max(0, score)),
      issues,
      suggestions,
      type: 'performance'
    };
  }

  /**
   * Estimate security heuristically
   */
  estimateSecurity(code) {
    let score = 8;
    const vulnerabilities = [];
    const recommendations = [];

    // Check for eval
    if (code.includes('eval(')) {
      score -= 3;
      vulnerabilities.push('eval() detected - major security risk');
      recommendations.push('Avoid eval() - use safer alternatives');
    }

    // Check for innerHTML
    if (code.includes('innerHTML')) {
      score -= 1;
      vulnerabilities.push('innerHTML usage - potential XSS vulnerability');
      recommendations.push('Use textContent or DOM APIs instead');
    }

    // Check for console.log of sensitive data
    if (code.match(/console\.log.*password|token|secret/i)) {
      score -= 2;
      vulnerabilities.push('Potential sensitive data exposure in logs');
      recommendations.push('Remove sensitive data from console output');
    }

    return {
      score: Math.min(10, Math.max(0, score)),
      vulnerabilities,
      recommendations,
      type: 'security'
    };
  }

  /**
   * Estimate best practices heuristically
   */
  estimateBestPractices(code) {
    let score = 7;
    const issues = [];
    const improvements = [];

    // Check for var usage
    if (code.includes(' var ')) {
      score -= 1;
      issues.push('var keyword usage - should use const/let');
      improvements.push('Replace var with const or let');
    }

    // Check for error handling
    if (!code.includes('try') && !code.includes('catch')) {
      score -= 1;
      issues.push('No error handling detected');
      improvements.push('Add try-catch blocks for error handling');
    }

    // Check for function size
    const functionMatches = code.match(/(?:function|const|let|var)\s+\w+\s*=?\s*(?:function)?\s*\(/g);
    if (functionMatches && functionMatches.length > 0) {
      const avgSize = code.length / functionMatches.length;
      if (avgSize > 500) {
        score -= 1;
        improvements.push('Functions are large - consider breaking them down');
      }
    }

    return {
      score: Math.min(10, Math.max(0, score)),
      issues,
      improvements,
      type: 'bestPractices'
    };
  }

  /**
   * Get default score for a metric type
   */
  getDefaultScore(type) {
    return {
      score: 5,
      reason: 'Unable to evaluate - using default score',
      type
    };
  }

  /**
   * Run comprehensive quality assessment
   */
  async assessCode(code) {
    const assessments = await Promise.all([
      this.evaluateReadability(code),
      this.evaluatePerformance(code),
      this.evaluateSecurity(code),
      this.evaluateBestPractices(code)
    ]);

    const results = {
      readability: assessments[0],
      performance: assessments[1],
      security: assessments[2],
      bestPractices: assessments[3]
    };

    // Calculate aggregate score
    const scores = Object.values(results).map(r => r.score);
    const aggregateScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

    return {
      aggregate: {
        score: aggregateScore,
        rating: this.getRating(aggregateScore)
      },
      breakdown: results,
      timestamp: Date.now(),
      codeLength: code.length
    };
  }

  /**
   * Get rating description
   */
  getRating(score) {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Very Good';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Fair';
    if (score >= 5) return 'Acceptable';
    return 'Needs Improvement';
  }

  /**
   * Generate user-friendly quality report
   */
  generateReport(assessment) {
    const { aggregate, breakdown } = assessment;

    return `
✅ Code Quality: ${aggregate.score}/10 (${aggregate.rating})

📊 Breakdown:
- 📖 Readability: ${breakdown.readability.score}/10 ${breakdown.readability.reason ? '(' + breakdown.readability.reason + ')' : ''}
- ⚡ Performance: ${breakdown.performance.score}/10${breakdown.performance.issues.length > 0 ? '\n  Issues: ' + breakdown.performance.issues.slice(0, 2).map(i => '• ' + i).join('\n  ') : ''}
- 🔒 Security: ${breakdown.security.score}/10${breakdown.security.vulnerabilities.length > 0 ? '\n  Vulnerabilities: ' + breakdown.security.vulnerabilities.slice(0, 2).map(v => '• ' + v).join('\n  ') : ''}
- 📚 Best Practices: ${breakdown.bestPractices.score}/10${breakdown.bestPractices.issues.length > 0 ? '\n  Issues: ' + breakdown.bestPractices.issues.slice(0, 2).map(i => '• ' + i).join('\n  ') : ''}

⚠️ Top Suggestions:
${[
  ...breakdown.performance.suggestions.slice(0, 1),
  ...breakdown.security.recommendations.slice(0, 1),
  ...breakdown.bestPractices.improvements.slice(0, 1)
].map(s => '• ' + s).join('\n')}
`;
  }
}

// Make class available globally
window.QualityScorer = QualityScorer;
