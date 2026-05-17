/**
 * Global Validation & Error Handling System
 * Provides safe execution, element checking, error management
 * Integrated with Admin UI Config System
 */

class GlobalValidationSystem {
  constructor() {
    this.errors = [];
    this.logs = [];
    this.maxErrors = 50;
    this.maxLogs = 100;
    this.setupErrorHandler();
  }

  setupErrorHandler() {
    window.addEventListener('error', (event) => {
      this.logError(`Runtime Error: ${event.message}`, {
        file: event.filename,
        line: event.lineno,
        col: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError(`Unhandled Promise: ${event.reason}`);
    });
  }

  checkElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      this.logError(`Missing element: ${selector}`);
      return null;
    }
    return element;
  }

  checkElements(selectors) {
    const results = {};
    selectors.forEach(sel => {
      results[sel] = this.checkElement(sel);
    });
    return results;
  }

  safeExecute(fn, fallback = null, context = {}) {
    try {
      if (typeof fn !== 'function') {
        throw new Error('Invalid function provided');
      }
      return fn();
    } catch (error) {
      this.logError(`Safe execution failed: ${error.message}`, {
        context,
        stack: error.stack
      });
      return fallback;
    }
  }

  safeRender(elementSelector, renderFn, fallbackHTML = '') {
    const element = this.checkElement(elementSelector);
    
    if (!element) {
      // Show fallback UI
      this.showFallbackUI(elementSelector, fallbackHTML);
      return false;
    }
    
    if (typeof renderFn !== 'function') {
      this.logError(`Invalid render function for: ${elementSelector}`);
      return false;
    }
    
    try {
      const result = renderFn(element);
      return result !== false;
    } catch (error) {
      this.logError(`Render failed for ${elementSelector}: ${error.message}`);
      element.innerHTML = fallbackHTML;
      return false;
    }
  }

  showFallbackUI(selector, fallbackHTML = '') {
    const element = document.querySelector(selector);
    if (element) {
      element.innerHTML = fallbackHTML || `
        <div class="fallback-ui text-center py-8">
          <span class="material-symbols-outlined text-4xl text-slate-400">info</span>
          <p class="text-slate-500 mt-2">Content unavailable</p>
        </div>
      `;
      element.classList.add('fallback-mode');
    }
  }

  validateState(state, schema) {
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = state[key];
      
      // Check if required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key}: required field`);
      }
      
      // Check type
      if (rules.type && value !== undefined && value !== null) {
        if (typeof value !== rules.type) {
          errors.push(`${key}: expected ${rules.type}, got ${typeof value}`);
        }
      }
      
      // Check custom validator
      if (rules.validate && !rules.validate(value)) {
        errors.push(`${key}: validation failed`);
      }
      
      // Check min/max
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${key}: must be >= ${rules.min}`);
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${key}: must be <= ${rules.max}`);
      }
      
      // Check allowed values
      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        errors.push(`${key}: must be one of ${rules.allowedValues.join(', ')}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate UI state against admin config
  validateUIState() {
    const config = window.AdminUIConfig?.getConfig() || { theme: 'light', animations: true, gameUI: true };
    
    const uiState = {
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      animations: !document.body?.classList.contains('no-animations'),
      gameUIActive: config.gameUI !== false
    };
    
    if (uiState.theme !== config.theme) {
      this.logWarning(`Theme mismatch: expected ${config.theme}, got ${uiState.theme}`);
    }
    
    return uiState;
  }

  logError(message, context = {}) {
    const errorObj = {
      id: `err_${Date.now()}`,
      message,
      timestamp: new Date().toISOString(),
      context,
      type: 'error'
    };
    
    this.errors.push(errorObj);
    this.logs.push(errorObj);
    
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    console.error(`[SMART HUB ERROR] ${message}`, context);
    this.showErrorNotification(message);
  }

  logWarning(message, context = {}) {
    const log = {
      id: `warn_${Date.now()}`,
      message,
      timestamp: new Date().toISOString(),
      context,
      type: 'warning'
    };
    
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    console.warn(`[SMART HUB WARNING] ${message}`, context);
  }

  logInfo(message, context = {}) {
    const log = {
      id: `info_${Date.now()}`,
      message,
      timestamp: new Date().toISOString(),
      context,
      type: 'info'
    };
    
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    console.log(`[SMART HUB INFO] ${message}`, context);
  }

  showErrorNotification(message) {
    // Prevent duplicate notifications
    if (document.querySelector('[data-error-notification]')) return;
    
    const toast = document.createElement('div');
    toast.setAttribute('data-error-notification', 'true');
    toast.className = 'fixed bottom-4 right-4 bg-rose-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-pulse';
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined">error</span>
        <div>
          <div class="font-bold">Error</div>
          <div class="text-sm">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  getErrors() {
    return [...this.errors];
  }

  getLogs() {
    return [...this.logs];
  }

  clearErrors() {
    this.errors = [];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return {
      errors: this.errors,
      logs: this.logs,
      timestamp: new Date().toISOString()
    };
  }
}

// Create global instance
window.globalValidation = window.globalValidation || new GlobalValidationSystem();
