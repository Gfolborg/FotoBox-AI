# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FotoBox AI - A React Native/Expo app for image processing and editing.

**Tech Stack:**
- React 19.1.0 with React Native 0.81.5
- Expo SDK 54 with New Architecture enabled
- Hermes JS engine with React Compiler
- TypeScript

## Common Issues & Fixes

### ReferenceError: Property 'X' doesn't exist

**Symptoms:** Runtime error like `ReferenceError: Property 'StyleSheet' doesn't exist` or similar for `View`, `Image`, `Dimensions`, `Platform`, etc.

**Root Cause:** Missing import from `react-native` in a component file.

**Diagnosis:**
```bash
# Search for files using StyleSheet without importing it
npx eslint client/ --rule 'no-undef: error' 2>&1 | grep -i stylesheet

# Or grep for usage without import
grep -l "StyleSheet\." client/**/*.tsx | xargs -I {} sh -c 'grep -L "from .react-native" {} 2>/dev/null'
```

**Fix:** Add the missing import to the file:
```typescript
import { StyleSheet, View, Image, Dimensions } from "react-native";
```

**After fixing:** Clear Metro cache:
```bash
npx expo start --clear
```

### Common React Native Imports Checklist

When you see a ReferenceError for any of these, ensure they're imported from `react-native`:

| Component | Import |
|-----------|--------|
| StyleSheet | `import { StyleSheet } from "react-native"` |
| View | `import { View } from "react-native"` |
| ScrollView | `import { ScrollView } from "react-native"` |
| Image | `import { Image } from "react-native"` |
| Pressable | `import { Pressable } from "react-native"` |
| Dimensions | `import { Dimensions } from "react-native"` |
| Platform | `import { Platform } from "react-native"` |

## Development Commands

```bash
# Start dev server (clears cache)
npx expo start --clear

# Run ESLint to catch issues
npx eslint client/ --max-warnings=0

# Type check
npx tsc --noEmit

# Fix formatting
npx eslint client/ --fix
```

## Architecture Notes

- **New Architecture enabled** (`newArchEnabled: true` in app.json)
- **React Compiler enabled** (`reactCompiler: true` in experiments)
- **Hermes JS engine** - be aware of Hermes-specific compatibility issues
- **Path aliases**: `@/` maps to `./client/`, `@shared/` maps to `./shared/`

## Before Committing

1. Run `npx eslint client/ --max-warnings=0` to catch undefined variables
2. Run `npx tsc --noEmit` to catch type errors
3. Test the app with `npx expo start --clear`
