# DESIGN_SYSTEM_V5.md

## Neo Fluent Enterprise

Premium internal operations platform inspired by Microsoft Loop, Notion, Linear, Arc Browser, and Apple VisionOS.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| **Background** | `#ECF4E8` | Main app background |
| **Surface** | `#FFFFFF` | Card backgrounds, white elements |
| **Primary** | `#ABE7B2` | Primary actions, selected states |
| **Accent** | `#CBF3BB` | Highlights, hover states, subtle accents |
| **Secondary** | `#93BFC7` | Borders, secondary text, icons |

---

## Accessibility & Readability Rules

1. **All text must be clearly visible** – minimum 4.5:1 contrast
2. **Dark text on light backgrounds** – `#1A1A2E` (slate-900) for primary text, `#4A5568` (slate-600) for secondary text
3. **No neon effects** – subtle shadows and layering only
4. **Readable form elements** – white backgrounds with `#93BFC7` borders

---

## Glass Effects

- **Cards**: 95% opacity, 12px blur (`backdrop-filter: blur(12px)`)
- **Dropdowns**: White background with subtle border `#93BFC7`, 14px radius
- **Inputs**: White background, `#93BFC7` border, focus ring `#ABE7B2`

---

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page Title | 2xl (24px) | Bold | `#1A1A2E` |
| Section Header | lg (18px) | Semibold | `#1A1A2E` |
| Card Title | md (16px) | Semibold | `#1A1A2E` |
| Body Text | sm (14px) | Regular | `#1A1A2E` |
| Secondary Text | xs (12px) | Regular | `#4A5568` |
| Labels | xs (12px) | Medium | `#4A5568` |

---

## Component Specifications

### Cards (Premium Glass)
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(12px);
border: 1px solid #ABE7B2;
border-radius: 14px;
box-shadow: 0 4px 16px rgba(147, 191, 199, 0.12);
```

### Buttons
- **Primary**: `#ABE7B2` background, `#1A1A2E` text, subtle shadow
- **Secondary**: Transparent with `#ABE7B2` border
- **Ghost**: White with `#4A5568` text

### Dropdowns
```css
background: #FFFFFF;
border: 1px solid #93BFC7;
border-radius: 8px;
width: 100%;
padding: 8px 12px;
color: #1A1A2E;
```

### Tables
- Header: `#ABE7B2` background, `#1A1A2E` text
- Rows: `#FFFFFF` background, alternate `#CBF3BB/5` for zebra
- Hover: `#ABE7B2/10` background

---

## Spacing System

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |

---

## Motion & Micro-interactions

- **Hover**: `transform: translateY(-1px)` + shadow increase
- **Transition**: `transition-all duration-200 ease-in-out`
- **Focus**: Subtle scale (1.01) + shadow

---

## Implementation Checklist

- [x] Update `tailwind.config.js` with V5 colors
- [x] Update `index.css` with glass utilities
- [x] Update all Cyber* components to Fluent style
- [x] Modernize Sidebar
- [x] Modernize Workbook Editor
- [x] Verify all contrast ratios meet 4.5:1