/**
 * 🤖 AI-ENHANCED LOGGER
 * 
 * Smart logging system with:
 * - Pattern recognition for common errors
 * - Auto-fix suggestions using AI
 * - Learning from past issues
 * - Real-time diagnostics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptedStorage } from './encryptedStorage';

// ═══════════════════════════════════════════════════════════════
// 📊 ERROR PATTERNS DATABASE
// ═══════════════════════════════════════════════════════════════

interface ErrorPattern {
  pattern: RegExp;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFix?: string;
  suggestion: string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  // Navigation Errors
  {
    pattern: /navigation.*error|could not.*navigate|route.*not.*found/i,
    category: 'Navigation',
    severity: 'high',
    suggestion: 'Check if route file exists. Verify expo-router setup. Use correct path syntax.',
    autoFix: 'Try restarting app and clearing navigation cache'
  },
  
  // Network Errors
  {
    pattern: /network.*request.*failed|connection.*refused|timeout/i,
    category: 'Network',
    severity: 'critical',
    suggestion: 'Ensure phone and server on same WiFi. Check server is running. Verify firewall allows port.',
    autoFix: 'Test connection with health monitor'
  },
  
  // Permission Errors
  {
    pattern: /camera.*permission|permission.*denied/i,
    category: 'Permissions',
    severity: 'high',
    suggestion: 'Enable camera permission in device settings',
    autoFix: 'Request permissions again'
  },
  
  // Server Errors
  {
    pattern: /server.*error|500|502|503/i,
    category: 'Server',
    severity: 'critical',
    suggestion: 'Server encountered error. Check Python server logs. Restart server.',
    autoFix: 'Retry connection'
  },
  
  // Pairing Errors
  {
    pattern: /pairing.*failed|invalid.*code|authentication/i,
    category: 'Pairing',
    severity: 'high',
    suggestion: 'Verify pairing code matches. Ensure QR code is from Butler server. Regenerate QR.',
    autoFix: 'Scan QR code again'
  },
  
  // Module Errors
  {
    pattern: /module.*not.*found|cannot.*resolve/i,
    category: 'Module',
    severity: 'medium',
    suggestion: 'Missing dependency. Run: npm install',
    autoFix: 'Check package.json'
  },
];

// ═══════════════════════════════════════════════════════════════
// 🧠 AI LOGGER CLASS
// ═══════════════════════════════════════════════════════════════

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: string;
  message: string;
  data?: Record<string, unknown>;
  pattern?: ErrorPattern;
  autoFixApplied?: boolean;
}

export interface WorkflowLogEvent {
  correlationId: string;
  stage: string;
  state: 'active' | 'completed' | 'blocked' | 'failed';
  source: 'android' | 'paired_pc';
  detail?: string;
}

const SENSITIVE_LOG_KEY = /(?:token|password|secret|authorization|cookie|credential|private|key|script|source|content|chat|prompt|ip|host|path|url)/i;
const SENSITIVE_LOG_VALUE = /(?:bearer\s+[a-z0-9._-]+|(?:token|password|secret|api[_ -]?key|authorization)\s*[:=]\s*[^\s,;]+)/i;

function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '<truncated>';
  if (typeof value === 'string') {
    return SENSITIVE_LOG_VALUE.test(value) ? '<redacted>' : value.replace(/[\r\n\t]+/g, ' ').slice(0, 240);
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 16).map(item => sanitizeLogValue(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 24).map(([key, nested]) => [key, SENSITIVE_LOG_KEY.test(key) ? '<redacted>' : sanitizeLogValue(nested, depth + 1)]));
  }
  return String(value).slice(0, 120);
}

function sanitizeLogData(data?: unknown): Record<string, unknown> | undefined {
  if (data === undefined) return undefined;
  const safe = sanitizeLogValue(data);
  return safe && typeof safe === 'object' && !Array.isArray(safe) ? safe as Record<string, unknown> : { detail: safe };
}

class AILogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private learningData: Map<string, number> = new Map();

  // ═══════════════════════════════════════════════════════════
  // 📝 LOGGING METHODS
  // ═══════════════════════════════════════════════════════════

  info(message: string, data?: any) {
    this.log('info', 'General', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', 'Warning', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', 'Error', message, data);
    this.analyzeError(message, data);
  }

  success(message: string, data?: unknown) {
    this.log('success', 'Success', message, data);
  }

  /**
   * Records only correlation-safe workflow metadata. Source code, chat text,
   * approval tokens, credentials and full server details are redacted before
   * reaching memory, persistent storage, or a development console.
   */
  workflow(event: WorkflowLogEvent): void {
    const level = event.state === 'failed' || event.state === 'blocked'
      ? 'warn' : event.state === 'completed' ? 'success' : 'info';
    this.log(level, 'AutomationFlow', `flow=${event.correlationId.slice(-8)} stage=${event.stage} state=${event.state}`, {
      correlationId: event.correlationId.slice(-32),
      stage: event.stage.slice(0, 48),
      state: event.state,
      source: event.source,
      detail: event.detail || '',
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 🔍 AI ERROR ANALYSIS
  // ═══════════════════════════════════════════════════════════

  private analyzeError(message: string, data?: any) {
    const fullMessage = `${message} ${JSON.stringify(data || {})}`;
    
    // Find matching pattern
    const matchedPattern = ERROR_PATTERNS.find(pattern => 
      pattern.pattern.test(fullMessage)
    );

    if (matchedPattern) {
      console.log(`\n🤖 AI ANALYSIS:`);
      console.log(`  Category: ${matchedPattern.category}`);
      console.log(`  Severity: ${matchedPattern.severity.toUpperCase()}`);
      console.log(`  💡 Suggestion: ${matchedPattern.suggestion}`);
      
      if (matchedPattern.autoFix) {
        console.log(`  🔧 Auto-Fix: ${matchedPattern.autoFix}`);
      }
      
      // Update learning data
      const key = matchedPattern.category;
      this.learningData.set(key, (this.learningData.get(key) || 0) + 1);
      
      return matchedPattern;
    }
    
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // 💾 CORE LOGGING
  // ═══════════════════════════════════════════════════════════

  private log(
    level: LogEntry['level'],
    category: string,
    message: string,
    data?: unknown
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: String(category).replace(/[\r\n\t]+/g, ' ').slice(0, 48),
      message: String(message).replace(/[\r\n\t]+/g, ' ').slice(0, 280),
      data: sanitizeLogData(data),
    };

    // Add to memory
    this.logs.push(entry);
    
    // Trim if too many
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

        // Production builds avoid device-console copies of user or workflow data.
    // In-memory diagnostics remain redacted, and persistent warn/error/workflow
    // records are encrypted below.
    if ((global as any).__DEV__ === true) {
      const emoji = { info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅' }[level];
      console.log(`${emoji} [${entry.category}] ${entry.message}`, entry.data || '');
    }

    if (level === 'error' || level === 'warn' || category === 'AutomationFlow') {
      this.persistLog(entry);
    }

  }

  // ═══════════════════════════════════════════════════════════
  // 💾 PERSISTENCE
  // ═══════════════════════════════════════════════════════════

  private async persistLog(entry: LogEntry) {
    try {
      const key = `@butler_hardened_log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await encryptedStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Logging is non-authoritative: failure to persist a diagnostic must not
      // grant execution, reveal data, or change a security decision.
    }
  }

  async getRecentLogs(limit = 50): Promise<LogEntry[]> {
    return this.logs.slice(-limit);
  }

  async getErrorStats() {
    const stats = Array.from(this.learningData.entries()).map(([category, count]) => ({
      category,
      count,
    }));
    
    return stats.sort((a, b) => b.count - a.count);
  }

  async clearLogs() {
    this.logs = [];
    this.learningData.clear();
    
    // Clear AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const logKeys = keys.filter(k => k.startsWith('@butler_log_') || k.startsWith('@butler_hardened_log_'));
    await AsyncStorage.multiRemove(logKeys);
  }

  // ═══════════════════════════════════════════════════════════
  // 🔬 DIAGNOSTICS
  // ═══════════════════════════════════════════════════════════

  async getDiagnostics() {
    const recentErrors = this.logs.filter(l => l.level === 'error').slice(-10);
    const recentWarnings = this.logs.filter(l => l.level === 'warn').slice(-10);
    
    return {
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(l => l.level === 'error').length,
      warnCount: this.logs.filter(l => l.level === 'warn').length,
      recentErrors,
      recentWarnings,
      stats: await this.getErrorStats(),
      recommendations: this.getRecommendations(),
    };
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = Array.from(this.learningData.entries());
    
    stats.forEach(([category, count]) => {
      if (count > 5) {
        if (category === 'Network') {
          recommendations.push('🌐 High network errors detected. Check WiFi connection and server status.');
        }
        if (category === 'Navigation') {
          recommendations.push('🧭 Navigation issues detected. Try restarting the app.');
        }
        if (category === 'Permissions') {
          recommendations.push('🔐 Permission errors detected. Check app settings.');
        }
        if (category === 'Server') {
          recommendations.push('🖥️ Server errors detected. Restart Python server.');
        }
      }
    });
    
    return recommendations;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🌟 EXPORT SINGLETON
// ═══════════════════════════════════════════════════════════════

export const aiLogger = new AILogger();
