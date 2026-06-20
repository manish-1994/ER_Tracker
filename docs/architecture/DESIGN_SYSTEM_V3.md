# DESIGN SYSTEM V3 – Futuristic Glassmorphism

---

## 1. DESIGN PHILOSOPHY

Inspired by Apple VisionOS, Notion, Linear, Microsoft Loop, and Arc Browser. Clean, airy, and premium — a modern internal enterprise platform that feels expansive and calm.

**Key Principles:**
- **Light & Airy** – Soft cream backgrounds with floating white glass cards
- **Depth through Blur** – Layers of transparency create spatial hierarchy
- **Subtle Color** – Warm neutrals with cool steel blue accents
- **Floating UI** – Cards with gentle shadows feel suspended above the background
- **Generous Space** – Ample padding creates breathing room
- **Smooth & Fast** – 200ms transitions, spring animations, no jank

---

## 2. COLOR SYSTEM

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | `#FFF9D2` | Primary background tint |
| `warm-beige` | `#EBDCBF` | Secondary surface, hover states |
| `steel-light` | `#AEC7DB` | Subtle accents, borders, secondary UI |
| `steel-blue` | `#7FAED8` | Primary accent, links, active states |

### Extended Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#F5F2EB` | Main app background (lightened cream) |
| `bg-card` | `#FFFFFF` | Card/surface background |
| `bg-glass` | `rgba(255, 255, 255, 0.72)` | Glass panel background |
| `bg-glass-strong` | `rgba(255, 255, 255, 0.88)` | Strong glass (modals) |
| `bg-glass-light` | `rgba(127, 174, 216, 0.06)` | Subtle glass tint |
| `text-primary` | `#1A1A2E` | Primary text (dark slate) |
| `text-secondary` | `#8B8FA3` | Secondary/muted text |
| `text-accent` | `#7FAED8` | Accent text |
| `border-light` | `rgba(127, 174, 216, 0.12)` | Subtle borders |
| `border-medium` | `rgba(127, 174, 216, 0.20)` | Visible borders |
| `border-strong` | `rgba(127, 174, 216, 0.35)` | Focus/highlight borders |
| `success` | `#4ADE80` | Success states |
| `warning` | `#FBBF24` | Warning states |
| `danger` | `#F87171` | Error/danger states |

### Glass Effects

| Token | Value |
|-------|-------|
| `glass-bg` | `rgba(255, 255, 255, 0.72)` |
| `glass-bg-strong` | `rgba(255, 255, 255, 0.88)` |
| `glass-bg-light` | `rgba(127, 174, 216, 0.06)` |
| `backdrop-blur` | `blur(16px)` |
| `backdrop-blur-sm` | `blur(8px)` |
| `backdrop-blur-lg` | `blur(24px)` |

---

## 3. TYPOGRAPHY

| Property | Value |
|----------|-------|
| Font Family | `Inter`, system-ui, -apple-system, sans-serif |
| Monospace | `JetBrains Mono`, `Fira Code`, monospace |
| Base Size | 15px (0.9375rem) |
| Scale | 1.25 (Major Third) |
| Line Height | 1.6 (body) |

### Type Scale

| Level | Size | Weight | Letter-spacing | Usage |
|-------|------|--------|----------------|-------|
| `h1` | 1.75rem (28px) | 600 | -0.02em | Page titles |
| `h2` | 1.25rem (20px) | 600 | -0.01em | Section headers |
| `h3` | 1rem (16px) | 600 | normal | Card titles |
| `body` | 0.9375rem (15px) | 400 | normal | Body text |
| `small` | 0.8125rem (13px) | 500 | normal | Labels, metadata |
| `xs` | 0.6875rem (11px) | 600 | +0.02em | Badges, tags |
| `mono` | 0.8125rem (13px) | 500 | normal | Data display |

---

## 4. SPACING

| Token | Rem | PX | Usage |
|-------|-----|-----|-------|
| `space-xs` | 0.375rem | 6px | Inner padding tight |
| `space-sm` | 0.75rem | 12px | Compact gaps |
| `space-md` | 1.25rem | 20px | Standard spacing |
| `space-lg` | 2rem | 32px | Section spacing |
| `space-xl` | 2.5rem | 40px | Large sections |
| `space-2xl` | 4rem | 64px | Page sections |

---

## 5. SHADOWS

Inspired by Linear and Notion — soft, diffused, no harsh edges.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)` | Subtle elevation |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)` | Cards, panels |
| `shadow-lg` | `0 10px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)` | Modals, drawers |
| `shadow-xl` | `0 20px 60px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)` | Large modals |
| `shadow-button` | `0 1px 2px rgba(0,0,0,0.05)` | Button elevation |
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)` | Card elevation |

---

## 6. GLASS EFFECTS

### Base Glass Panel (Cards, Sidebar)
```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(127, 174, 216, 0.12);
border-radius: 14px;
box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03);
```

### Strong Glass (Modals, Drawers)
```css
background: rgba(255, 255, 255, 0.88);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border: 1px solid rgba(127, 174, 216, 0.20);
border-radius: 18px;
box-shadow: 0 10px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
```

### Subtle Glass (Inner Panels, Hover States)
```css
background: rgba(127, 174, 216, 0.06);
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
border-radius: 10px;
```

---

## 7. COMPONENTS

### Buttons
- Clean background with soft hover lift
- 10px border radius
- Primary: solid `#7FAED8` background, white text
- Secondary: bordered with subtle background
- No glow, no strong shadows
- Hover: subtle background shift + slight translateY(-1px)

### Cards
- White glass background (72% opacity)
- 14px border radius
- 1px ultra-subtle blue-tinted border
- Soft card shadow
- Hover: subtle elevation increase

### Modals
- Strong white glass background (88% opacity)
- 18px border radius
- Floating shadow
- Centered, max-width constrained
- Smooth spring animation (framer-motion)

### Tables
- Clean header row with steel blue tint
- White glass background
- Subtle row dividers
- Hover row light highlight
- Compact but comfortable padding

### Inputs / Selects
- Clean white/light background
- 10px border radius
- Soft focus ring with steel blue
- No glow, just a clean outline

### Badges
- Compact, subtle background
- 6px border radius
- Matching text + border

### Sidebar
- Full-height white glass panel
- Active nav: steel blue background
- Clean typography
- Subtle border separator

---

## 8. BORDER RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Badges, tags |
| `radius-md` | 10px | Buttons, inputs |
| `radius-lg` | 14px | Cards, panels |
| `radius-xl` | 18px | Modals, drawers |

---

## 9. ANIMATIONS

| Property | Duration | Easing | Usage |
|----------|----------|--------|-------|
| Hover states | 200ms | ease-out | All interactive elements |
| Panel open | 300ms | spring (gentle) | Modals, drawers |
| Page transitions | 200ms | ease-in-out | Route changes |
| Focus transitions | 150ms | ease-in | Input focus |

---

## 10. THEME VARIANTS

### All variants use white glass base with different accent colors:

| Variant | Border | Accent | Background |
|---------|--------|--------|------------|
| default | `rgba(127, 174, 216, 0.12)` | `#7FAED8` | white glass |
| primary | `rgba(127, 174, 216, 0.30)` | `#7FAED8` | white glass |
| secondary | `rgba(174, 199, 219, 0.30)` | `#AEC7DB` | white glass |
| success | `rgba(74, 222, 128, 0.25)` | `#4ADE80` | white glass |
| warning | `rgba(251, 191, 36, 0.25)` | `#FBBF24` | white glass |
| danger | `rgba(248, 113, 113, 0.25)` | `#F87171` | white glass |

---

## 11. DESIGN PRINCIPLES

1. **Clarity** – Every element serves a purpose. No decoration for decoration's sake.
2. **Air** – Generous whitespace creates a premium feel.
3. **Light** – Soft cream/warm tones with white glass for a bright, open interface.
4. **Depth** – Achieved through blur and shadow, not color contrast.
5. **Consistency** – 8px grid, repeated patterns, predictable interactions.
6. **Calm** – Muted palette, smooth animations, no visual noise.
7. **Modern Enterprise** – Professional but not sterile. Warm but not casual.

---

*Generated on 2026-06-17.*
