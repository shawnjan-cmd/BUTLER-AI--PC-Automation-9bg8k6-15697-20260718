# Butler AI: PC Automation — Pre-OnSpace.ai UI/UX Preview & Verification Guide

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

To inspect how the **Butler AI** user interface looks and behaves before importing the project into OnSpace.ai [1], developers can run the React Native / Expo application locally on a machine or mobile device. 

This guide outlines the exact local preview methods available for Expo SDK 54 [3], local Metro bundler execution, and emulator testing.

---

## 1. Local Preview Methods (Without OnSpace.ai)

### Method 1: Expo Go or Development Build on Physical Device (Recommended)
1. Extract the master ZIP archive onto your local machine.
2. Open a terminal in the project root and install dependencies:
   ```bash
   npm install (or pnpm install / yarn)
   ```
3. Start the Expo Metro development server:
   ```bash
   npx expo start
   ```
4. Scan the generated QR code using the **Expo Go** app on your Android or iOS device, or press `a` to open an Android emulator / `i` for iOS simulator.

### Method 2: Local Static Mock Preview
If you need to inspect static UI wireframes or layouts before compiling native binaries, you can review the component source files (`app/(tabs)/home.tsx`, `components/ui/`) or inspect the generated Markdown design specifications (`BUTLER_AI_ONSPACE_MASTER_PAGE.md`).

---

## 2. Pre-Flight Visual Checklist

When previewing the app locally, verify the following visual criteria:
* **Cyberpunk HUD Palette:** Deep slate backgrounds (`#050810`, `#0B0F17`) paired with high-contrast cyan, amber, green, and purple neon accents.
* **Responsive Centering:** Edge-to-edge flexible padding (`16px`) ensuring no side clipping across foldables or compact budget phones.
* **Mascot & Glitch Headers:** Smooth 3D rotation animations on headers and breathing halo effects on the robot mascot.
* **Non-Blocking Tips:** Contextal hints appearing cleanly without blocking navigation or user speed.

---

## 3. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.expo.dev/build/introduction/] [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.expo.dev/git/introduction/] [Accessed August 19, 2026].
