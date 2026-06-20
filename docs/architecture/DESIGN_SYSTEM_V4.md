# DESIGN SYSTEM V4 – Premium Enterprise Futurism

---

## 1. DESIGN PHILOSOPHY

Inspired by Apple VisionOS, Linear, Notion, Microsoft Loop, and Arc Browser. Clean, airy, and premium — a modern internal enterprise platform that feels expansive and calm.

**Key Principles:**
- **Premium & Professional** – Sophisticated palette with strong visual hierarchy
- **Futuristic Depth** – Subtle shadows and blur create spatial layering
- **Accessibility First** – All text clearly visible, high contrast ratios
- **Floating UI** – Cards with gentle shadows feel suspended above the background
- **Generous Space** – Ample padding creates breathing room
- **Smooth & Fast** – 200ms transitions, no jank
- **Light Glass** – Minimal transparency, no heavy glassmorphism

---

## 2. COLOR SYSTEM

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#355872` | Primary brand, headers, key UI accents |
| `accent` | `#7FAED8` | Secondary accents, links, active states |
| `secondary` | `#AEC7DB` | Subtle touches, borders, secondary UI |
| `warm` | `#EBDCBF` | Warm surfaces, subtle highlights |
| `highlight` | `#FFF9D2` | Table headers, highlights |

### Extended Palette

| Token | Hex/RGBA | Usage |
|-------|----------|-------|
| `bg-primary` | `#FAFAF8` | Main app background (clean off-white) |
| `bg-card` | `#FFFFFF` | Card/surface background (pure white) |
| `bg-table-header` | `#FFF9D2` | Warm gradient header for tables |
| `bg-table-row` | `#FFFFFF` | Clean white for table rows |
| `bg-table-hover` | `rgba(127, 174, 216, 0.08)` | Soft blue highlight on hover |
| `text-primary` | `#1A1A2E` | Primary text (dark slate) |
| `text-secondary` | `#4A5568` | Secondary/muted text |
| `border-light` | `rgba(174, 199, 219, 0.20)` | Subtle borders |
| `border-medium` | `rgba(127, 174, 216, 0.35)` | Visible borders |
| `border-strong` | `rgba(53, 88, 114, 0.50)` | Focus/highlight borders |
| `success` | `#4ADE80` | Success states |
| `warning` | `#FBBF24` | Warning states |
| `danger` | `#F87171` | Error/danger states |

### Gradients

```css
--gradient-table-header: linear-gradient(180deg, #FFF9D2 0%, #EBDCBF 100%);
```

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
|-------|------|--------|--------------|-------|
| `h1` | 1.75rem (28px) | 600 | -0.02em | Page titles |
| `h2` | 1.25rem (20px) | 600 | -0.01em | Section headers |
| `h3` | 1rem (16px) | 600 | normal | Card titles |
| `body` | 0.9375rem (15px) | 400 | normal | Body text |
| `small` | 0.8125rem (13px) | 500 | normal | Labels, metadata |
| `xs` | 0.6875rem (11px) | 600 | +0.02em | Badges, tags |

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

Premium soft shadows with floating effect:

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Subtle elevation |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` | Cards, panels |
| `shadow-lg` | `0 10px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05)` | Modals, drawers |
| `shadow-xl` | `0 20px 60px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)` | Large modals |
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)` | Floating card effect |

---

## 6. GLASS EFFECTS

Light glass with strong shadows:

### Base Glass Panel (Cards)
```css
background: rgba(255, 255, 255, 0.88);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(127, 174, 216, 0.15);
border-radius: 14px;
box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03);
```

### Strong Glass (Modals)
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(127, 174, 216, 0.25);
border-radius: 18px;
box-shadow: 0 10px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05);
```

---

## 7. COMPONENTS

### Buttons
- Clean white background with colored accents
- 10px border radius
- Primary: `#355872` solid background, white text
- Secondary: `#AEC7DB` light background with `#355872` text
- Hover: subtle elevation + scale(0.98)
- No glow, no heavy shadows

### Cards
- White glass background (88% opacity)
- 14px border radius
- 1px subtle border (`#AEC7DB` at 20%)
- Soft shadow-card
- Hover: shadow-md elevation increase

### Modals
- Strong white glass background (95% opacity)
- 18px border radius
- Floating shadow-lg
- Smooth spring animation

### Tables
- **Header**: Warm gradient (`#FFF9D2` → `#EBDCBF`)
- **Rows**: Clean white (`#FFFFFF`)
- **Hover**: Soft blue highlight (`rgba(127, 174, 216, 0.08)`)
- Subtle row dividers (`#AEC7DB` at 15%)
- Padding: px-5 py-3

### Inputs / Selects
- Clean white background
- 10px border radius
- Focus: `#355872` border + subtle shadow

### Sidebar
- White glass panel
- Active nav: `#355872` background, white text
- Clean typography

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

## 10. ACCESSIBILITY RULES

- **No low-contrast text** – `#1A1A2E` on `#FFFFFF` = 12:1 contrast
- **No washed-out cards** – Pure white or 88% white glass
- **No excessive transparency** – Max 15% background tint
- **No heavy neon glow** – Subtle shadows only

---

*Generated on 2026-06-17.*