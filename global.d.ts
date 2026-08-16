// React Native runtime exposes `global`; this declaration keeps guarded bridge hooks type-safe.
declare const global: typeof globalThis & Record<string, any>;
