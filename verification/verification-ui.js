/**
 * VerificationUI - UI components for displaying verification and quality results
 * Integrates with main editor UI to show validation, testing, and quality metrics
 */

class VerificationUI {
  constructor() {
    this.container = null;
    this.qualityPanel = null;
    this.verificationStatus = 'idle';
  }

  /**
   * Initialize verification UI elements
   */
  initialize(editorPanel) {
    // Create verification container
    this.container = document.createElement('div');
    this.container.className = 'verification-panel';
    this.container.id = 'verification-panel';
    
    // Create quality score section
    this.createQualitySection();
    
    // Create validation alerts section
    this.createValidationSection();
    
    // Create test results section
    this.createTestSection();

    // Create auto-fix status section
    this.createAutoFixSection();

    // Insert before editor if available, or append to body
    if (editorPanel && editorPanel.parentElement) {
      editorPanel.parentElement.insertBefore(this.container, editorPanel.nextSibling);
    } else {
      document.body.appendChild(this.container);
    }
  }

  /**
   * Create quality score section
   */
  createQualitySection() {
    const section = document.createElement('section');
    section.className = 'verification-section quality-section';
    section.innerHTML = `
      <div class="section-header">
        <h3>📊 Code Quality</h3>
        <button class="close-btn" title="Collapse">−</button>
      </div>
      <div class="section-content quality-content">
        <div class="quality-score hidden">
          <div class="score-circle">
            <span class="score-value">—</span>
            <span class="score-label">/10</span>
          </div>
          <div class="score-breakdown"></div>
        </div>
        <div class="quality-loading">Loading assessment...</div>
      </div>
    `;

    this.qualityPanel = section;
    this.container.appendChild(section);
  }

  /**
   * Create validation alerts section
   */
  createValidationSection() {
    const section = document.createElement('section');
    section.className = 'verification-section validation-section';
    section.innerHTML = `
      <div class="section-header">
        <h3>✓ Validation</h3>
        <button class="close-btn" title="Collapse">−</button>
      </div>
      <div class="section-content validation-content">
        <div class="validation-status hidden">
          <div class="status-indicator"></div>
          <span class="status-text"></span>
        </div>
        <div class="errors-list"></div>
        <div class="no-errors hidden">✓ No validation errors detected</div>
      </div>
    `;

    this.container.appendChild(section);
  }

  /**
   * Create test results section
   */
  createTestSection() {
    const section = document.createElement('section');
    section.className = 'verification-section test-section';
    section.innerHTML = `
      <div class="section-header">
        <h3>🧪 Tests</h3>
        <button class="close-btn" title="Collapse">−</button>
      </div>
      <div class="section-content test-content">
        <div class="test-results hidden">
          <div class="test-summary">
            <span class="passed">0 passed</span>
            <span class="failed">0 failed</span>
            <span class="total">0 total</span>
          </div>
          <div class="test-errors"></div>
        </div>
        <div class="test-loading hidden">Running tests...</div>
        <div class="no-tests">No tests available</div>
      </div>
    `;

    this.container.appendChild(section);
  }

  /**
   * Create auto-fix status section
   */
  createAutoFixSection() {
    const section = document.createElement('section');
    section.className = 'verification-section autofix-section';
    section.innerHTML = `
      <div class="section-header">
        <h3>🔧 Auto-Fix Status</h3>
        <button class="close-btn" title="Collapse">−</button>
      </div>
      <div class="section-content autofix-content">
        <div class="autofix-idle">
          Ready to auto-fix errors
        </div>
        <div class="autofix-running hidden">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <span class="attempt-text"></span>
        </div>
        <div class="autofix-result hidden">
          <div class="result-message"></div>
          <div class="fix-history"></div>
        </div>
      </div>
    `;

    this.container.appendChild(section);
  }

  /**
   * Display validation results
   */
  displayValidation(results) {
    const section = this.container.querySelector('.validation-section');
    const content = section.querySelector('.validation-content');
    const errorsList = content.querySelector('.errors-list');
    const statusDiv = content.querySelector('.validation-status');
    const noErrors = content.querySelector('.no-errors');

    errorsList.innerHTML = '';

    if (results.errors && results.errors.length > 0) {
      statusDiv.classList.remove('hidden');
      noErrors.classList.add('hidden');

      const indicator = statusDiv.querySelector('.status-indicator');
      indicator.className = 'status-indicator error';
      statusDiv.querySelector('.status-text').textContent = `${results.errors.length} error(s) found`;

      results.errors.slice(0, 5).forEach(error => {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-item';
        errorEl.innerHTML = `
          <span class="error-type">${error.type || 'error'}</span>
          <span class="error-message">${error.message || error}</span>
          ${error.line ? `<span class="error-line">Line ${error.line}</span>` : ''}
        `;
        errorsList.appendChild(errorEl);
      });

      if (results.errors.length > 5) {
        const moreEl = document.createElement('div');
        moreEl.className = 'error-item more';
        moreEl.textContent = `+${results.errors.length - 5} more error(s)`;
        errorsList.appendChild(moreEl);
      }
    } else {
      statusDiv.classList.add('hidden');
      noErrors.classList.remove('hidden');
    }
  }

  /**
   * Display quality assessment results
   */
  displayQuality(assessment) {
    const content = this.qualityPanel.querySelector('.quality-content');
    const scoreDiv = content.querySelector('.quality-score');
    const scoreValue = scoreDiv.querySelector('.score-value');
    const breakdown = scoreDiv.querySelector('.score-breakdown');
    const loading = content.querySelector('.quality-loading');

    loading.classList.add('hidden');
    scoreDiv.classList.remove('hidden');

    const { aggregate, breakdown: details } = assessment;
    scoreValue.textContent = aggregate.score;

    // Set color based on score
    const scoreCircle = scoreDiv.querySelector('.score-circle');
    const numScore = parseFloat(aggregate.score);
    if (numScore >= 8) {
      scoreCircle.className = 'score-circle excellent';
    } else if (numScore >= 6) {
      scoreCircle.className = 'score-circle good';
    } else {
      scoreCircle.className = 'score-circle fair';
    }

    // Display breakdown
    breakdown.innerHTML = `
      <div class="metric readability">
        <span class="metric-name">📖 Readability</span>
        <span class="metric-score">${details.readability.score}/10</span>
      </div>
      <div class="metric performance">
        <span class="metric-name">⚡ Performance</span>
        <span class="metric-score">${details.performance.score}/10</span>
        ${details.performance.issues.length > 0 ? `<div class="metric-issues">⚠️ ${details.performance.issues[0]}</div>` : ''}
      </div>
      <div class="metric security">
        <span class="metric-name">🔒 Security</span>
        <span class="metric-score">${details.security.score}/10</span>
        ${details.security.vulnerabilities.length > 0 ? `<div class="metric-issues">⚠️ ${details.security.vulnerabilities[0]}</div>` : ''}
      </div>
      <div class="metric bestpractices">
        <span class="metric-name">📚 Best Practices</span>
        <span class="metric-score">${details.bestPractices.score}/10</span>
        ${details.bestPractices.issues.length > 0 ? `<div class="metric-issues">⚠️ ${details.bestPractices.issues[0]}</div>` : ''}
      </div>
    `;
  }

  /**
   * Display test results
   */
  displayTestResults(results) {
    const section = this.container.querySelector('.test-section');
    const content = section.querySelector('.test-content');
    const testResults = content.querySelector('.test-results');
    const loading = content.querySelector('.test-loading');
    const noTests = content.querySelector('.no-tests');

    loading.classList.add('hidden');

    if (results && results.results && results.results.totalTests > 0) {
      noTests.classList.add('hidden');
      testResults.classList.remove('hidden');

      const summary = testResults.querySelector('.test-summary');
      summary.innerHTML = `
        <span class="passed">✓ ${results.results.passed} passed</span>
        <span class="failed">✗ ${results.results.failed} failed</span>
        <span class="total">= ${results.results.totalTests} total</span>
      `;

      const errorsList = testResults.querySelector('.test-errors');
      errorsList.innerHTML = '';

      if (results.results.errors && results.results.errors.length > 0) {
        results.results.errors.slice(0, 3).forEach(error => {
          const errorEl = document.createElement('div');
          errorEl.className = 'test-error';
          errorEl.innerHTML = `
            <strong>${error.test || 'Unknown test'}</strong>
            <pre>${error.error || error.message || ''}</pre>
          `;
          errorsList.appendChild(errorEl);
        });
      }
    } else {
      testResults.classList.add('hidden');
      noTests.classList.remove('hidden');
    }
  }

  /**
   * Display auto-fix progress
   */
  displayAutoFixProgress(attempt, maxAttempts) {
    const section = this.container.querySelector('.autofix-section');
    const content = section.querySelector('.autofix-content');
    const idle = content.querySelector('.autofix-idle');
    const running = content.querySelector('.autofix-running');

    idle.classList.add('hidden');
    running.classList.remove('hidden');

    const progress = running.querySelector('.progress-fill');
    progress.style.width = `${(attempt / maxAttempts) * 100}%`;
    running.querySelector('.attempt-text').textContent = `Attempt ${attempt} of ${maxAttempts}...`;
  }

  /**
   * Display auto-fix completion
   */
  displayAutoFixComplete(result) {
    const section = this.container.querySelector('.autofix-section');
    const content = section.querySelector('.autofix-content');
    const idle = content.querySelector('.autofix-idle');
    const running = content.querySelector('.autofix-running');
    const resultDiv = content.querySelector('.autofix-result');

    idle.classList.add('hidden');
    running.classList.add('hidden');
    resultDiv.classList.remove('hidden');

    const message = resultDiv.querySelector('.result-message');
    if (result.success) {
      message.innerHTML = `✅ Code fixed successfully in ${result.attempts} attempt(s)`;
      message.className = 'result-message success';
    } else {
      message.innerHTML = `⚠️ Could not fix all errors after ${result.attempts} attempt(s)`;
      message.className = 'result-message warning';
    }

    // Show fix history if available
    if (result.history && result.history.length > 0) {
      const history = resultDiv.querySelector('.fix-history');
      history.innerHTML = `<details>
        <summary>Show ${result.history.length} attempt(s)</summary>
        <div class="history-items">
          ${result.history.map((h, i) => `
            <div class="history-item">
              <strong>Attempt ${i + 1}:</strong> ${h.validation.isValid ? '✓ Valid' : '✗ Errors'}
            </div>
          `).join('')}
        </div>
      </details>`;
    }
  }

  /**
   * Show loading state
   */
  showLoading(section = 'quality') {
    if (section === 'quality') {
      const content = this.qualityPanel.querySelector('.quality-content');
      content.querySelector('.quality-loading').classList.remove('hidden');
      content.querySelector('.quality-score').classList.add('hidden');
    }
  }

  /**
   * Hide verification panel
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Show verification panel
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * Clear all verification data
   */
  clear() {
    const sections = this.container.querySelectorAll('.verification-section .section-content');
    sections.forEach(section => {
      section.innerHTML = '';
    });
  }
}

// Make class available globally
window.VerificationUI = VerificationUI;
