# Cyberpunk UI System Guidelines

This document outlines the visual design system, neon color palette tokens, panel aesthetics, typography, and interactive micro-animations.

---

## 1. Palette Tokens

The UI is constructed using high-contrast neon tones overlaying deep, dark background matrices:

| Color Accent | Hex Code | Utility Description |
| :--- | :--- | :--- |
| **Neon Cyan** | `#00E5FF` | Primary action points, active selections, primary headers |
| **Electric Purple** | `#D500F9` | Secondary cards, borders, aggregation status |
| **Acid Green** | `#00FF9D` | Success statuses, online telemetry active signals |
| **Pink Alert** | `#FF4D6D` | Deletion banners, warning modals, error badges |
| **Cyber Bg** | `#020617` | Root background color |
| **Deep Panel** | `#050b14` | Sub-panel container backgrounds |

---

## 2. Panels and Glassmorphism

Containers use a subtle translucency combined with bright borders to create depth:

*   **Borders**: Containers use thin neon lines (`border-cyan-500/20` or `border-purple-500/20`) that brighten slightly during interactions.
*   **Glow Effects (Box Shadow)**: Important control headers use a subtle glow:
    ```css
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.15);
    ```
*   **Corner Details**: Decorative border-corners are applied to mock advanced telemetry hardware terminals:
    ```html
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/55" />
    ```

---

## 3. Cyberpunk Visualizations

*   **Area Charts**: Rendered with semi-transparent neon fills (`fillOpacity={0.2}`) matching the series stroke lines, giving a fluid wave dashboard look.
*   **Table Matrix Grid**: Interactive checkboxes aligned in a monospaced grid bordered with thin cyan dividers, providing an aggregate representation of user clearances.
*   **CyberCard**: Custom card wrappers with HSL gradient border colors matching the state (primary, success, secondary, danger).
*   **CyberStatCard**: Visual numeric blocks rendering metrics with glowing neon highlights.
*   **CyberBadge**: Solid or outlined neon labels displaying permission levels or clearance statuses.
