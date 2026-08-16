/**
 * Butler AI — Remote Access Tiers & Subscription Manager
 * ────────────────────────────────────────────────────────────────
 * Manages the 4-tier remote access subscription system:
 *   FREE   → LAN only, 50 scripts, basic KB
 *   PRO    → Tailscale/Cloudflare remote, 250 scripts, AI KB, priority
 *   ELITE  → Multi-PC (3 machines), script scheduler, advanced analytics
 *   TEAM   → 5 users, shared library, team KB, collaboration
 *
 * Integrates with RevenueCat (react-native-purchases) when available.
 * Falls back to AsyncStorage-backed local state for dev/test.
 * Never crashes — all paths are fully guarded.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Guarded RevenueCat loader.
 * A literal require('react-native-purchases') makes Metro fail the whole
 * bundle when the package is absent (it is an optional paid-tier module).
 * The indirect lookup keeps it invisible to the bundler's static resolver.
 */
function loadPurchases(): any | null {
  // Billing is intentionally disabled in the single free build. Cosmetic
  // previews and opt-in remote connection do not depend on a purchase gate.
  return null;
}


// ── Product IDs (match your Play Store / App Store product IDs) ──
export const PRODUCT_IDS = {
  PRO_MONTHLY:   'butler_pro_monthly_499',
  PRO_YEARLY:    'butler_pro_yearly_4999',
  ELITE_MONTHLY: 'butler_elite_monthly_999',
  ELITE_YEARLY:  'butler_elite_yearly_9999',
  TEAM_MONTHLY:  'butler_team_monthly_1999',
} as const;

// ── Entitlement IDs (RevenueCat dashboard) ───────────────────────
export const ENTITLEMENT_IDS = {
  PRO:   'butler_pro',
  ELITE: 'butler_elite',
  TEAM:  'butler_team',
} as const;

// No billing credentials are bundled. If billing is ever added, it must be
// a separately reviewed Play Billing build with server-side verification.
const RC_API_KEY_ANDROID = '';
const RC_API_KEY_IOS = '';

export type TierID = 'free' | 'pro' | 'elite' | 'team';

export interface Tier {
  id:          TierID;
  name:        string;
  tagline:     string;
  monthlyPrice: string;
  yearlyPrice:  string;
  color:        string;
  accentColor:  string;
  icon:         string;
  badge?:       string;
  features:     string[];
  limits: {
    scripts:    number | 'unlimited';
    pcs:        number;
    users:      number;
    remoteAccess: boolean;
    tailscale:  boolean;
    cloudflare: boolean;
    scheduler:  boolean;
    teamKB:     boolean;
    analytics:  boolean;
    prioritySupport: boolean;
  };
}

export const TIERS: Record<TierID, Tier> = {
  free: {
    id:          'free',
    name:        'BUTLER FREE',
    tagline:     'Local LAN control · Get started',
    monthlyPrice: '$0',
    yearlyPrice:  '$0',
    color:        '#4A9EFF',
    accentColor:  '#4A9EFF',
    icon:         'shield-outline',
    features: [
      'LAN-first PC control',
      'Opt-in encrypted remote connection',
      '50 script executions/day',
      'Basic AI chat',
      'QR pairing',
      'Standard KB (25 articles)',
      'Community support',
    ],
    limits: { scripts: 50, pcs: 1, users: 1, remoteAccess: true, tailscale: false, cloudflare: false, scheduler: false, teamKB: false, analytics: false, prioritySupport: false },
  },
  pro: {
    id:          'pro',
    name:        'BUTLER PRO',
    tagline:     'Unlock remote access · Control from anywhere',
    monthlyPrice: '$4.99',
    yearlyPrice:  '$49.99',
    color:        '#38D9E8',
    accentColor:  '#4A9EFF',
    icon:         'shield-star',
    badge:        'MOST POPULAR',
    features: [
      'Everything in FREE',
      'Tailscale remote access',
      'Cloudflare tunnel support',
      '250 scripts/day',
      'Advanced AI KB (250 articles)',
      'Script history & analytics',
      'Performance sparklines',
      'Priority email support',
    ],
    limits: { scripts: 250, pcs: 1, users: 1, remoteAccess: true, tailscale: true, cloudflare: true, scheduler: false, teamKB: false, analytics: true, prioritySupport: true },
  },
  elite: {
    id:          'elite',
    name:        'BUTLER ELITE',
    tagline:     'Multi-PC command · Ultimate power',
    monthlyPrice: '$9.99',
    yearlyPrice:  '$99.99',
    color:        '#A468FF',
    accentColor:  '#A468FF',
    icon:         'shield-crown',
    badge:        'BEST VALUE',
    features: [
      'Everything in PRO',
      'Control up to 3 PCs',
      'Script scheduler (cron)',
      'Advanced analytics dashboard',
      'Unlimited KB growth',
      'Custom script packs',
      'Dedicated support channel',
    ],
    limits: { scripts: 'unlimited', pcs: 3, users: 1, remoteAccess: true, tailscale: true, cloudflare: true, scheduler: true, teamKB: false, analytics: true, prioritySupport: true },
  },
  team: {
    id:          'team',
    name:        'BUTLER TEAM',
    tagline:     '5 users · Shared library · Collaboration',
    monthlyPrice: '$19.99',
    yearlyPrice:  '$199.99',
    color:        '#FFB43D',
    accentColor:  '#0B0F17',
    icon:         'shield-account',
    features: [
      'Everything in ELITE',
      'Up to 5 team members',
      'Shared script library',
      'Team knowledge base',
      'Role-based access control',
      'Audit log (all actions)',
      'White-glove onboarding',
      'SLA: 4h response time',
    ],
    limits: { scripts: 'unlimited', pcs: 5, users: 5, remoteAccess: true, tailscale: true, cloudflare: true, scheduler: true, teamKB: true, analytics: true, prioritySupport: true },
  },
};

// ── Storage Keys ─────────────────────────────────────────────────
const KEY_TIER          = '@butler_subscription_tier_v1';
const KEY_EXPIRES_AT    = '@butler_subscription_expires_v1';
const KEY_RECEIPT       = '@butler_subscription_receipt_v1';
const KEY_SAVED_PCS     = '@butler_saved_pcs_v2';
const KEY_RC_INITED     = '@butler_rc_initialized_v1';

export interface SavedPC {
  id:        string;
  name:      string;
  ip:        string;
  port:      string;
  icon:      string;   // materialcommunityicons name
  color:     string;
  isPrimary: boolean;
  lastSeen?: number;
}

type Listener = (tier: TierID) => void;

// ── Service ───────────────────────────────────────────────────────
class RemoteAccessTierService {
  private static _inst: RemoteAccessTierService;
  static getInstance() {
    if (!this._inst) this._inst = new RemoteAccessTierService();
    return this._inst;
  }

  private _tier:       TierID  = 'free';
  private _expiresAt:  number  = 0;
  private _loaded:     boolean = false;
  private _rcReady:    boolean = false;
  private _listeners:  Set<Listener> = new Set();
  private _savedPCs:   SavedPC[]     = [];

  getTier()       { return this._tier; }
  getTierData()   { return TIERS[this._tier]; }
  isLoaded()      { return this._loaded; }
  isRemote()      { return TIERS[this._tier].limits.remoteAccess; }
  canMultiPC()    { return TIERS[this._tier].limits.pcs > 1; }
  maxPCs()        { return TIERS[this._tier].limits.pcs; }
  hasTailscale()  { return TIERS[this._tier].limits.tailscale; }
  hasCloudflare() { return TIERS[this._tier].limits.cloudflare; }
  hasScheduler()  { return TIERS[this._tier].limits.scheduler; }
  hasAnalytics()  { return TIERS[this._tier].limits.analytics; }
  isExpired()     { return this._expiresAt > 0 && Date.now() > this._expiresAt; }
  isPro()         { return ['pro', 'elite', 'team'].includes(this._tier); }
  isElite()       { return ['elite', 'team'].includes(this._tier); }
  isTeam()        { return this._tier === 'team'; }

  subscribe(fn: Listener): () => void {
    this._listeners.add(fn);
    if (this._loaded) fn(this._tier);
    return () => this._listeners.delete(fn);
  }

  private _emit() {
    this._listeners.forEach(fn => { try { fn(this._tier); } catch {} });
  }

  // ── Init: load from storage + init RevenueCat if available ───
  async init(): Promise<void> {
    if (this._loaded) return;
    try {
      const [tierRaw, expiresRaw] = await Promise.all([
        AsyncStorage.getItem(KEY_TIER).catch(() => null),
        AsyncStorage.getItem(KEY_EXPIRES_AT).catch(() => null),
      ]);
      if (tierRaw && Object.keys(TIERS).includes(tierRaw)) {
        this._tier = tierRaw as TierID;
      }
      if (expiresRaw) this._expiresAt = parseInt(expiresRaw, 10) || 0;
      if (this.isExpired()) { this._tier = 'free'; await this._persist(); }
    } catch {}

    try {
      const raw = await AsyncStorage.getItem(KEY_SAVED_PCS).catch(() => null);
      if (raw) this._savedPCs = JSON.parse(raw);
    } catch {}

    // Try to init RevenueCat
    await this._initRevenueCat().catch(() => {});

    this._loaded = true;
    this._emit();
  }

  private async _initRevenueCat(): Promise<void> {
    // Intentionally inert in the single-free build. No billing SDK, key, or
    // entitlement synchronizer is allowed to influence remote connectivity.
    this._rcReady = false;
  }

  private async _syncFromEntitlements(active: Record<string, any>): Promise<void> {
    if (active[ENTITLEMENT_IDS.TEAM]) {
      this._tier = 'team';
    } else if (active[ENTITLEMENT_IDS.ELITE]) {
      this._tier = 'elite';
    } else if (active[ENTITLEMENT_IDS.PRO]) {
      this._tier = 'pro';
    } else {
      this._tier = 'free';
    }
    await this._persist();
    this._emit();
  }

  private async _persist(): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(KEY_TIER, this._tier).catch(() => {}),
      AsyncStorage.setItem(KEY_EXPIRES_AT, String(this._expiresAt)).catch(() => {}),
    ]);
  }

  // ── Purchase flow ─────────────────────────────────────────────
  async purchase(tier: TierID, isYearly = false): Promise<{ success: boolean; error?: string }> {
    // Single free build: never grant entitlements locally or simulate billing.
    if (tier !== 'free') return { success: false, error: 'Paid entitlements are not enabled in this build.' };
    return { success: true };
    /*
    try {
      if (this._rcReady) {
        return await this._purchaseWithRevenueCat(tier, isYearly);
      }
      return await this._purchaseMock(tier, isYearly);
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Purchase failed' };
    }
    */
  }

  private async _purchaseWithRevenueCat(tier: TierID, isYearly: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const Purchases = loadPurchases();
      if (!Purchases) return { success: false, error: 'In-app purchases unavailable on this build' };
      const offerings = await Purchases.getOfferings();
      const current   = offerings.current;
      if (!current) return { success: false, error: 'No offerings available' };

      const pkgIdentifier = this._getPackageId(tier, isYearly);
      const pkg = current.availablePackages.find((p: any) => p.identifier === pkgIdentifier);
      if (!pkg) return { success: false, error: 'Package not found' };

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await this._syncFromEntitlements(customerInfo.entitlements.active);
      return { success: true };
    } catch (e: any) {
      if (e?.code === '1') return { success: false, error: 'Purchase cancelled' };
      return { success: false, error: e?.message ?? 'Purchase failed' };
    }
  }

  private async _purchaseMock(_tier: TierID, _isYearly: boolean): Promise<{ success: boolean; error?: string }> {
    // Never simulate entitlements or receipts in a release build.
    return { success: false, error: 'Mock purchases are disabled.' };
  }

  private _getPackageId(tier: TierID, isYearly: boolean): string {
    if (tier === 'pro')   return isYearly ? PRODUCT_IDS.PRO_YEARLY   : PRODUCT_IDS.PRO_MONTHLY;
    if (tier === 'elite') return isYearly ? PRODUCT_IDS.ELITE_YEARLY  : PRODUCT_IDS.ELITE_MONTHLY;
    if (tier === 'team')  return PRODUCT_IDS.TEAM_MONTHLY;
    return PRODUCT_IDS.PRO_MONTHLY;
  }

  // ── Restore purchases ─────────────────────────────────────────
  async restore(): Promise<{ success: boolean; tier: TierID; error?: string }> {
    try {
      if (this._rcReady) {
        const Purchases = loadPurchases();
      if (!Purchases) return { success: false, tier: this._tier, error: 'In-app purchases unavailable on this build' };
        const info = await Purchases.restorePurchases();
        await this._syncFromEntitlements(info.entitlements.active);
        return { success: true, tier: this._tier };
      }
      // No RC — check local storage only
      const raw = await AsyncStorage.getItem(KEY_RECEIPT).catch(() => null);
      if (raw) {
        const receipt = JSON.parse(raw);
        if (receipt.tier && Object.keys(TIERS).includes(receipt.tier)) {
          this._tier = receipt.tier;
          this._emit();
          return { success: true, tier: this._tier };
        }
      }
      return { success: true, tier: 'free' };
    } catch (e: any) {
      return { success: false, tier: 'free', error: e?.message };
    }
  }

  // ── Downgrade to free (cancel) ────────────────────────────────
  async downgrade(): Promise<void> {
    this._tier = 'free';
    this._expiresAt = 0;
    await this._persist();
    this._emit();
  }

  // ── Saved PCs (multi-PC manager) ─────────────────────────────
  getSavedPCs(): SavedPC[] { return [...this._savedPCs]; }

  async savePCProfile(pc: Omit<SavedPC, 'id'>): Promise<SavedPC> {
    const id   = `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const full = { ...pc, id };
    if (full.isPrimary) {
      this._savedPCs = this._savedPCs.map(p => ({ ...p, isPrimary: false }));
    }
    this._savedPCs = [full, ...this._savedPCs].slice(0, this.maxPCs());
    await AsyncStorage.setItem(KEY_SAVED_PCS, JSON.stringify(this._savedPCs)).catch(() => {});
    return full;
  }

  async deletePCProfile(id: string): Promise<void> {
    this._savedPCs = this._savedPCs.filter(p => p.id !== id);
    await AsyncStorage.setItem(KEY_SAVED_PCS, JSON.stringify(this._savedPCs)).catch(() => {});
  }

  async updatePCLastSeen(id: string): Promise<void> {
    this._savedPCs = this._savedPCs.map(p => p.id === id ? { ...p, lastSeen: Date.now() } : p);
    await AsyncStorage.setItem(KEY_SAVED_PCS, JSON.stringify(this._savedPCs)).catch(() => {});
  }

  async setPrimary(id: string): Promise<void> {
    this._savedPCs = this._savedPCs.map(p => ({ ...p, isPrimary: p.id === id }));
    await AsyncStorage.setItem(KEY_SAVED_PCS, JSON.stringify(this._savedPCs)).catch(() => {});
  }
}

export const remoteAccessTiers = RemoteAccessTierService.getInstance();
