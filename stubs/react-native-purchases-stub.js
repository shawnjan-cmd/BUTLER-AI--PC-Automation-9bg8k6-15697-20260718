/**
 * react-native-purchases stub — Butler AI
 * Used when the native RevenueCat SDK is not installed.
 * All methods are no-ops that resolve immediately.
 * remoteAccessTiers.ts wraps every call in try/catch,
 * so returning empty/null values here is completely safe.
 */
const noop = () => Promise.resolve(null);
const stub = {
  configure:         noop,
  getCustomerInfo:   () => Promise.resolve({ entitlements: { active: {} } }),
  getOfferings:      () => Promise.resolve({ current: null }),
  purchasePackage:   noop,
  restorePurchases:  () => Promise.resolve({ entitlements: { active: {} } }),
  setDebugLogsEnabled: noop,
  default: null, // filled below
};
stub.default = stub;
module.exports = stub;
