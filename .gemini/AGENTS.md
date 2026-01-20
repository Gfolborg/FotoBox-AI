# AGENTS.md - Gemini AI Guidance

This file provides guidance for AI agents working with this React Native/Expo codebase.

## Project: FotoBox AI

**Stack:** React 19 + React Native 0.81.5 + Expo SDK 54 + Hermes + TypeScript

## Critical: Common Runtime Errors

### ReferenceError: Property 'StyleSheet' doesn't exist

**This is a common issue.** It means a component uses `StyleSheet` (or `View`, `Image`, `Dimensions`, etc.) without importing it.

**To diagnose:**
1. Check the file mentioned in the error
2. Look for `StyleSheet.create(` or `StyleSheet.absoluteFillObject`
3. Verify `import { StyleSheet } from "react-native"` exists at the top

**To fix:**
```typescript
// Add missing import
import { StyleSheet, View, ScrollView, Image } from "react-native";
```

**After fixing:**
```bash
npx expo start --clear
```

### Prevention Checklist

Before any code changes, verify:
- [ ] All React Native components are imported: `StyleSheet`, `View`, `ScrollView`, `Image`, `Pressable`, `Dimensions`, `Platform`
- [ ] Run `npx eslint client/ --max-warnings=0`
- [ ] Run `npx tsc --noEmit`

## Quick Reference: React Native Imports

```typescript
// Layout
import { View, ScrollView, FlatList, SafeAreaView } from "react-native";

// Styling
import { StyleSheet, Dimensions, Platform } from "react-native";

// Interactive
import { Pressable, TouchableOpacity, TextInput } from "react-native";

// Display
import { Text, Image, ImageBackground } from "react-native";

// Utilities
import { Alert, Linking, Share } from "react-native";
```

## Path Aliases

- `@/` → `./client/`
- `@shared/` → `./shared/`

## Commands

| Action | Command |
|--------|---------|
| Start dev | `npx expo start --clear` |
| Lint | `npx eslint client/ --max-warnings=0` |
| Type check | `npx tsc --noEmit` |
| Fix format | `npx eslint client/ --fix` |
