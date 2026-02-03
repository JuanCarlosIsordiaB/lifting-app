# UI Coding Standards

## Component Library

**This project exclusively uses [shadcn/ui](https://ui.shadcn.com/) for all UI components.**

### Rules

1. **ONLY use shadcn/ui components** - All UI elements must be built using shadcn/ui components
2. **NO custom components** - Do not create custom UI components under any circumstances
3. **Install components as needed** - Use `npx shadcn@latest add <component>` to add new shadcn/ui components

### Adding Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
# etc.
```

## Date Formatting

**All date formatting must use [date-fns](https://date-fns.org/).**

### Date Format Standard

Dates must be displayed in the following format:

```
1st Sep 2025
2nd Aug 2025
3rd Jan 2026
```

### Implementation

```typescript
import { format } from "date-fns";

// Use this format pattern for all dates
const formattedDate = format(date, "do MMM yyyy");

// Examples:
// new Date("2025-09-01") → "1st Sep 2025"
// new Date("2025-08-02") → "2nd Aug 2025"
// new Date("2026-01-03") → "3rd Jan 2026"
```

### Format Pattern Breakdown

- `do` - Day of month with ordinal suffix (1st, 2nd, 3rd, etc.)
- `MMM` - Abbreviated month name (Jan, Feb, Mar, etc.)
- `yyyy` - Full year (2025, 2026, etc.)




### Dark and Light

- Every component should be in dark and light mode
