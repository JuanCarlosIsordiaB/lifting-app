# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT: Documentation First

**ALWAYS refer to the relevant documentation files in the `/docs` directory before generating any code.** The docs contain project-specific patterns, conventions, and guidelines that must be followed. Read the applicable docs files first to ensure generated code is consistent with established patterns.

- /docs/ui.md

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a Next.js 16 project using the App Router with React 19 and TypeScript.

**Tech Stack:**
- Next.js 16 with App Router (`src/app/`)
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4 (using `@import "tailwindcss"` syntax)
- Clerk authentication (`@clerk/nextjs`)
- ESLint 9 with flat config

**Project Structure:**
- `src/app/` - App Router pages and layouts
- `src/app/layout.tsx` - Root layout with ClerkProvider and Geist fonts
- `src/app/page.tsx` - Home page
- `src/app/globals.css` - Global styles with Tailwind and CSS variables
- `src/middleware.ts` - Clerk authentication middleware
- `public/` - Static assets

**Path Alias:** `@/*` maps to `./src/*`
