# DESIGN SYSTEM V2 – Glassmorphic Enterprise Cyberpunk

---

## 1. COLOR SYSTEM

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-dark` | `#355872` | Brand primary, headers, key UI accents |
| `secondary` | `#7AAACE` | Secondary UI elements, supporting accents |
| `accent` | `#9CD5FF` | Highlight states, active selections, links |
| `background` | `#07111F` | Main app background |

### Extended Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | `rgba(53, 88, 114, 0.08)` | Glass panel base |
| `surface-hover` | `rgba(53, 88, 114, 0.15)` | Glass panel hover |
| `border-light` | `rgba(154, 213, 255, 0.15)` | Subtle borders |
| `border-medium` | `rgba(154, 213, 255, 0.25)` | Visible borders |
| `border-strong` | `rgba(154, 213, 255, 0.40)` | Focus/highlight borders |
| `text-primary` | `#E2E8F0` | Primary text |
| `text-secondary` | `#94A3B8` | Secondary/muted text |
| `text-accent` | `#9CD5FF` | Accent text |
| `success` | `#4ADE80` | Success states |
| `warning` | `#FBBF24` | Warning states |
| `danger` | `#F87171` | Error/danger states |

### Glass Effects

| Token | Value |
|-------|-------|
| `glass-bg` | `rgba(7, 17, 31, 0.60)` |
| `glass-bg-strong` | `rgba(7, 17, 31, 0.75)` |
| `glass-bg-light` | `rgba(7, 17, 31, 0.40)` |
| `backdrop-blur` | `blur(12px)` |
| `backdrop-blur-sm` | `blur(8px)` |
| `backdrop-blur-lg` | `blur(20px)` |

---

## 2. TYPOGRAPHY

| Property | Value |
|----------|-------|
| Font Family | `Inter`, system-ui, -apple-system, sans-serif |
| Monospace | `JetBrains Mono`, `Fira Code`, monospace |
| Base Size | 14px (0.875rem) |
| Scale | 1.25 (Major Third) |

### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 1.75rem (28px) | 700 | Page titles |
| `h2` | 1.25rem (20px) | 600 | Section headers |
| `h3` | 1rem (16px) | 600 | Card titles |
| `body` | 0.875rem (14px) | 400 | Body text |
| `small` | 0.75rem (12px) | 500 | Labels, metadata |
| `xs` | 0.625rem (10px) | 600 | Badges, tags |
| `mono` | 0.75rem (12px) | 500 | Data display |

---

## 3. SPACING

| Token | Rem | PX | Usage |
|-------|-----|-----|-------|
| `space-xs` | 0.25rem | 4px | Inner padding tight |
| `space-sm` | 0.5rem | 8px | Compact gaps |
| `space-md` | 1rem | 16px | Standard spacing |
| `space-lg` | 1.5rem | 24px | Section spacing |
| `space-xl` | 2rem | 32px | Large sections |
| `space-2xl` | 3rem | 48px | Page sections |

---

## 4. SHADOWS

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` | Subtle elevation |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Cards, panels |
| `shadow-lg` | `0 8px 32px rgba(0,0,0,0.5)` | Modals, drawers |
| `shadow-glass` | `0 8px 32px rgba(53, 88, 114, 0.15)` | Glass panel shadow |
| `shadow-glow-accent` | `0 0 20px rgba(154, 213, 255, 0.10)` | Subtle accent glow |

---

## 5. GLASS EFFECTS

### Base Glass Panel
```css
background: rgba(7, 17, 31, 0.60);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(154, 213, 255, 0.15);
border-radius: 12px;
```

### Strong Glass (Modals/Drawers)
```css
background: rgba(7, 17, 31, 0.75);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(154, 213, 255, 0.25);
border-radius: 16px;
```

### Light Glass (Inner Panels)
```css
background: rgba(53, 88, 114, 0.08);
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
border: 1px solid rgba(154, 213, 255, 0.10);
border-radius: 8px;
```

---

## 6. COMPONENTS

### Buttons
- Glass background with subtle border
- Rounded (8px)
- Hover: elevated opacity, subtle border lighten
- Variants: primary (accent border), secondary (default), danger, warning, success
- No glow effects

### Cards
- Glass background (60% opacity)
- 12px border radius
- 1px soft border
- Subtle shadow
- No corner brackets
- No scanning lines

### Modals
- Strong glass background (75% opacity)
- 16px border radius
- 1px medium border
- Larger shadow
- Centered, max-width constrained
- No corner brackets

### Tables
- Glass header row
- Clean divider lines (subtle)
- Hover row highlight
- Compact padding
- Monospace data font

### Inputs / Selects
- Glass background
- Soft border (1px)
- Focus: accent border, subtle accent shadow
- No glow
- Rounded 8px

### Badges
- Small, compact
- Soft background with matching border
- Rounded 4px
- No glow

### Drawers
- Strong glass background
- Slide-in from right
- 16px border radius left side
- Corner accents removed

---

## 7. BORDER RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Badges, tags |
| `radius-md` | 8px | Buttons, inputs, cards |
| `radius-lg` | 12px | Cards, panels |
| `radius-xl` | 16px | Modals, drawers |

---

## 8. TRANSITIONS

| Property | Duration | Easing |
|----------|----------|--------|
| Hover states | 200ms | ease-in-out |
| Panel open/close | 300ms | ease-out |
| Focus transitions | 150ms | ease-in-out |

---

## 9. COMPONENT VARIANTS

### All variants use the same glass base with different border and accent colors:

| Variant | Border | Accent Text |
|---------|--------|-------------|
| default | `rgba(154, 213, 255, 0.15)` | `#9CD5FF` |
| primary | `rgba(53, 88, 114, 0.40)` | `#355872` |
| secondary | `rgba(122, 170, 206, 0.40)` | `#7AAACE` |
| success | `rgba(74, 222, 128, 0.30)` | `#4ADE80` |
| warning | `rgba(251, 191, 36, 0.30)` | `#FBBF24` |
| danger | `rgba(248, 113, 113, 0.30)` | `#F87171` |

---

## 10. DESIGN PRINCIPLES

1. **Glassmorphism** – Semi-transparent panels with backdrop blur create depth without noise
2. **Enterprise Clean** – No decorative elements that don't serve a purpose
3. **Subtle Depth** – Layering through opacity and blur, not heavy shadows or glows
4. **Consistent Spacing** – 4px grid system, 16px base unit
5. **Readability First** – High contrast text on glass backgrounds
6. **Professional Palette** – Muted blues and slate tones with soft accent highlights
7. **No Hacker Aesthetic** – No neon glows, scan lines, corner brackets, or matrix effects

---

*Generated on 2026-06-17.*
