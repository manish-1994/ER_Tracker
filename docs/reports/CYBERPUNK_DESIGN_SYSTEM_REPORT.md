# CYBERPUNK DESIGN SYSTEM REPORT

## OVERVIEW

We have established the core design system for the **Cyberpunk Operations Center** redesign program. All styles align with the dark operations center aesthetic (`#020617` background with vibrant neon highlights).

---

## COLOR TOKENS

The system colors are integrated into Tailwind CSS and TypeScript configurations:

- **Background**: `#020617` (`bg-cyberBg`)
- **Primary Neon**: `#00E5FF` (`text-primary`, `border-primary`)
- **Secondary Neon**: `#8B5CF6` (`text-secondary`, `border-secondary`)
- **Success**: `#00FF9D` (`text-success`, `border-success`)
- **Warning**: `#FFB800` (`text-warning`, `border-warning`)
- **Danger**: `#FF4D6D` (`text-danger`, `border-danger`)

---

## CREATED COMPONENTS

All components are located in `src/components/ui/` and have been built to be highly reusable, dark-mode only, and support glowing neon visuals:

### 1. [CyberCard](file:///d:/ER%20tracker%20Dashboard/frontend/src/components/ui/CyberCard.tsx)
- **Props**: `children`, `className`, `variant` (`"default" | "primary" | "secondary" | "success" | "warning" | "danger"`)
- **Aesthetic**: Rich glassmorphism with scanning borders and grid transparency overlays. Includes tech-oriented corner bracket accents.

### 2. [CyberButton](file:///d:/ER%20tracker%20Dashboard/frontend/src/components/ui/CyberButton.tsx)
- **Props**: `children`, `className`, `variant` (`"primary" | "secondary" | "success" | "warning" | "danger"`), `size` (`"sm" | "md" | "lg"`), and other HTML button attributes.
- **Aesthetic**: Glowing border outlines, mono fonts, uppercase letter-spacing, hover pulse scaling, and active clicked scaling.

### 3. [CyberInput](file:///d:/ER%20tracker%20Dashboard/frontend/src/components/ui/CyberInput.tsx)
- **Props**: Standard HTML input props.
- **Aesthetic**: Dark bracketed container, neon focus transitions, and horizontal shadow glow upon active targeting.

### 4. [CyberTable](file:///d:/ER%20tracker%20Dashboard/frontend/src/components/ui/CyberTable.tsx)
- **Props**: `columns` (`{ header, accessor, render? }[]`), `data` (`any[]`), `actions` (`(row) => ReactNode`), and `className`.
- **Aesthetic**: High-density grid display, glassmorphic table header block, glowing row overlays on hover, and custom cell action templates.

### 5. [CyberModal](file:///d:/ER%20tracker%20Dashboard/frontend/src/components/ui/CyberModal.tsx)
- **Props**: `isOpen`, `onClose`, `title`, `children`.
- **Aesthetic**: Blur-backdrop overlay with Framer Motion slide transitions, corner accents, and a header title tag in glowing neon cyan.

### 6. [CyberBadge](file:///d:/ER%20tracker%20Dashboard/frontend/src/components/ui/CyberBadge.tsx)
- **Props**: `children`, `variant` (`"primary" | "secondary" | "success" | "warning" | "danger" | "muted"`), `className`.
- **Aesthetic**: Monospaced pill design with glowing border outlines and 10% opacity colored fills.

### 7. [CyberAvatar](file:///d:/ER%20tracker%20Dashboard/frontend/src/components/ui/CyberAvatar.tsx)
- **Props**: `username`, `size` (`"sm" | "md" | "lg"`), `isOnline`.
- **Aesthetic**: Renders initials with background color hashes (cyan/purple/green) to keep avatars unique. Includes a pulsing status indicator dot.

### 8. [CyberStatCard](file:///d:/ER%20tracker%20Dashboard/frontend/src/components/ui/CyberStatCard.tsx)
- **Props**: `title`, `value`, `icon`, `subtitle`, `variant`, `trend` (`{ value, isPositive }`).
- **Aesthetic**: CyberCard layout showing metrics in monospaced grids, featuring trend alerts, neon labels, and bottom scanning lines.

---

## VERIFICATION & BUILD
Build has been initialized and validated. Base classes are integrated into `src/index.css`.
