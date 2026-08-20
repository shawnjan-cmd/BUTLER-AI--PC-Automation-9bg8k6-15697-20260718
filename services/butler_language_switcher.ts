/**
 * BUTLER AI — Offline Secure Language Switcher v1.1 (Hardened)
 * Validates language keys against a strict whitelist to prevent injection,
 * prototype pollution, or malformed state deserialization.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'en' | 'es' | 'de' | 'ja';

const STORAGE_KEY = '@butler_selected_language_v1';
const ALLOWED_LANGUAGES: SupportedLanguage[] = ['en', 'es', 'de', 'ja'];

const DICTIONARY: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    systemConfig: 'SYSTEM CONFIG',
    zeroTelemetry: 'ZERO TELEMETRY',
    secureRemoteRelay: 'SECURE REMOTE RELAY',
    ollamaStatus: 'Check Ollama Status',
    pullModel: 'Pull Best Model',
    killSwitch: 'Neural Kill-Switch',
    searchPlaceholder: 'Search settings (e.g. Ollama, PIN, Disk)...',
    connection: 'CONNECTION & PAIRING',
    aiEngine: 'PROPRIETARY AI ENGINES',
    behavior: 'SYSTEM BEHAVIOR',
    automations: 'AUTOMATIONS & GUARDIANS',
    privacy: 'PRIVACY & ZERO-KNOWLEDGE',
    ide: 'CODEBASE IDE & SOURCE',
    sync: 'SYNC & UPDATES',
    protips: 'PROTIPS & EFFICIENCY',
    about: 'ABOUT & PROPRIETARY LICENSE',
    rule1: 'Rule I — Absolute Data Sovereignty',
    rule2: 'Rule II — Fail-Closed Privacy Circuit',
    rule3: 'Rule III — Deterministic Resource Guard',
  },
  es: {
    systemConfig: 'CONFIGURACIÓN DEL SISTEMA',
    zeroTelemetry: 'CERO TELEMETRÍA',
    secureRemoteRelay: 'RELE SEGURO REMOTO',
    ollamaStatus: 'Verificar Estado Ollama',
    pullModel: 'Descargar Mejor Modelo',
    killSwitch: 'Interruptor de Emergencia IA',
    searchPlaceholder: 'Buscar ajustes (ej. Ollama, PIN, Disco)...',
    connection: 'CONEXIÓN Y EMPAREJAMIENTO',
    aiEngine: 'MOTORES DE IA PROPIETARIOS',
    behavior: 'COMPORTAMIENTO DEL SISTEMA',
    automations: 'AUTOMATIZACIONES Y GUARDIANES',
    privacy: 'PRIVACIDAD Y CERO CONOCIMIENTO',
    ide: 'IDE DE CÓDIGO Y FUENTE',
    sync: 'SINCRONIZACIÓN Y ACTUALIZACIONES',
    protips: 'CONSEJOS Y EFICIENCIA',
    about: 'ACERCA DE Y LICENCIA PROPIETARIA',
    rule1: 'Regla I — Soberanía Absoluta de Datos',
    rule2: 'Regla II — Circuito de Privacidad Fail-Closed',
    rule3: 'Regla III — Guardia de Recursos Determinista',
  },
  de: {
    systemConfig: 'SYSTEM-KONFIGURATION',
    zeroTelemetry: 'KEINE TELEMETRIE',
    secureRemoteRelay: 'SICHERES FERN-RELAY',
    ollamaStatus: 'Ollama-Status prüfen',
    pullModel: 'Bestes Modell laden',
    killSwitch: 'KI-Notabschaltung',
    searchPlaceholder: 'Einstellungen durchsuchen (z.B. Ollama, PIN)...',
    connection: 'VERBINDUNG & KOPPLUNG',
    aiEngine: 'PROPRIETÄRE KI-ENGINES',
    behavior: 'SYSTEMVERHALTEN',
    automations: 'AUTOMATISIERUNGEN & WÄCHTER',
    privacy: 'DATENSCHUTZ & NULL-WISSEN',
    ide: 'CODEBASE IDE & QUELLTEXT',
    sync: 'SYNCHRONISIERUNG & UPDATES',
    protips: 'PRO-TIPPS & EFFIZIENZ',
    about: 'ÜBER & PROPRIETÄRE LIZENZ',
    rule1: 'Regel I — Absolute Datensouveränität',
    rule2: 'Regel II — Fail-Closed Datenschutzschaltung',
    rule3: 'Regel III — Deterministischer Ressourcenschutz',
  },
  ja: {
    systemConfig: 'システム構成',
    zeroTelemetry: 'ゼロテレメトリー',
    secureRemoteRelay: 'セキュアリモートリレー',
    ollamaStatus: 'Ollama状態の確認',
    pullModel: '最適モデルの取得',
    killSwitch: 'ニューラルキルスイッチ',
    searchPlaceholder: '設定を検索 (例: Ollama, PIN, ディスク)...',
    connection: '接続とペアリング',
    aiEngine: '独自AIエンジン',
    behavior: 'システム動作',
    automations: '自動化とガーディアン',
    privacy: 'プライバシーとゼロ知識',
    ide: 'コードベースIDEとソース',
    sync: '同期とアップデート',
    protips: 'プロのヒントと効率',
    about: '情報と独自ライセンス',
    rule1: 'ルールI — 完全なデータ主権',
    rule2: 'ルールII — フェイルクローズド・プライバシー回路',
    rule3: 'ルールIII — 決定論的リソースガード',
  }
};

class ButlerLanguageManager {
  private currentLang: SupportedLanguage = 'en';

  async load(): Promise<SupportedLanguage> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && ALLOWED_LANGUAGES.includes(saved as SupportedLanguage)) {
        this.currentLang = saved as SupportedLanguage;
      } else {
        this.currentLang = 'en';
      }
    } catch {
      this.currentLang = 'en';
    }
    return this.currentLang;
  }

  async setLanguage(lang: string): Promise<void> {
    // Strict whitelist validation prevents any injection or prototype pollution
    const sanitized = String(lang).trim().toLowerCase() as SupportedLanguage;
    if (ALLOWED_LANGUAGES.includes(sanitized)) {
      this.currentLang = sanitized;
      try {
        await AsyncStorage.setItem(STORAGE_KEY, sanitized);
      } catch {}
    }
  }

  get(key: string): string {
    const safeKey = String(key || '');
    return DICTIONARY[this.currentLang]?.[safeKey] || DICTIONARY['en']?.[safeKey] || safeKey;
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLang;
  }
}

export const butlerLang = new ButlerLanguageManager();
