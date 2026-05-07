---
name: Neo-Industrial (Dark)
colors:
  surface: '#13121b'
  surface-dim: '#13121b'
  surface-bright: '#393842'
  surface-container-lowest: '#0e0d16'
  surface-container-low: '#1b1b24'
  surface-container: '#1f1f28'
  surface-container-high: '#2a2933'
  surface-container-highest: '#35343e'
  on-surface: '#e4e1ee'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#e4e1ee'
  inverse-on-surface: '#302f39'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#6cd3f7'
  on-secondary: '#003543'
  secondary-container: '#269dbe'
  on-secondary-container: '#002e3b'
  tertiary: '#ffb695'
  on-tertiary: '#571f00'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#6cd3f7'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e61'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#13121b'
  on-background: '#e4e1ee'
  surface-variant: '#35343e'
typography:
  h1:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
---

# Neo-Industrial Design System

## Dark Mode 

### Brand & Style
This design system is built upon the principles of precision, technical efficiency, and structured clarity. It targets professional environments where high-density information must be balanced with visual sophistication. The brand personality is authoritative yet modern, evoking the feel of a high-end engineering terminal.

The aesthetic follows a **Neo-Industrial** direction—a synthesis of **Minimalism** and **Glassmorphism**. It utilizes a dark, atmospheric foundation to reduce ocular strain, while employing sharp, translucent layers and vibrant accents to guide the user's focus. The result is a UI that feels both heavy-duty and light-weight, prioritizing functional hierarchy and mechanical precision.

### Colors
The palette is anchored in a deep, nocturnal Slate. The background establishes a "void" from which information emerges through tonal layering. 

- **Primary Action:** Indigo 600 serves as the primary driver for interaction, used for main calls to action and active states.
- **System Highlights:** Cyan 600 is utilized for secondary indicators, data visualizations, and progress elements, providing a technical "glow" against the dark background.
- **Surfaces:** Surfaces use a lighter Slate tone to create depth without relying on traditional shadows.
- **Accents:** Borders are kept extremely delicate, using low-opacity whites to define edges without adding visual bulk.

### Typography
This design system exclusively utilizes **Inter** to maintain a utilitarian, systematic feel. The typographic hierarchy is strictly enforced through weight and letter-spacing adjustments.

All headings are set to a bold 700 weight with a tight -0.02em letter-spacing to create a dense, "machined" look that feels impactful on screen. Body text remains neutral to ensure long-form readability. For technical labels and UI metadata, a smaller, semi-bold, uppercase style is used to mimic industrial labeling.

### Layout & Spacing
The layout is built on a rigid **4px base spacing scale**, ensuring that every element aligns to a consistent rhythmic grid. 

A **12-column fluid grid** is the standard for page layouts, allowing for flexible content distribution while maintaining structural integrity. Margins and gutters are kept generous (32px and 24px respectively) to provide "breathing room" against the high-density components. Use vertical rhythm to separate sections, favoring multiples of 16px (md) or 24px (lg) for component spacing.

### Elevation & Depth
Depth is communicated through **Tonal Layering** and **Glassmorphism** rather than heavy shadows. 

1.  **Base Layer:** The darkest Slate (#0F172A).
2.  **Raised Surfaces:** A slightly lighter Slate (#1E293B) for standard cards and modules.
3.  **High-Value Containers:** For modals, navigation bars, or featured widgets, apply a **12px background blur** with a semi-transparent surface.
4.  **Edge Definition:** All interactive and elevated containers must feature a **delicate 1px border**. On glass layers, use a top-weighted gradient border to simulate a light source catching the edge of a pane.

### Shapes
The shape language balances industrial geometry with modern ergonomics. 

Interactive elements such as buttons, input fields, and dropdowns use a **standard 8px radius**. This provides enough softness for comfort while maintaining a clean, professional edge. Larger structural elements like cards and dashboard panels use a more pronounced **12-16px radius**, creating a clear visual distinction between "the frame" and "the tools."

### Components
- **Buttons:** Primary buttons use a solid Indigo 600 fill with white text. Secondary buttons should use a ghost style with a 1px Cyan 600 border. All buttons use an 8px radius.
- **Input Fields:** Darker than the surface background with a 1px border that glows Cyan 600 on focus.
- **Cards:** Use the 12px or 16px radius. High-priority cards should utilize the glassmorphic blur (12px) and a subtle 1px border (rgba 255, 255, 255, 0.1).
- **Chips/Badges:** Small, 4px-radius elements with low-opacity Indigo or Cyan fills and high-contrast text for status indicators.
- **Lists:** Rows should be separated by 1px Slate dividers or alternating tonal shifts. Use subtle hover states (increase surface brightness by 5%).
- **Scrollbars:** Custom slim-line scrollbars in Slate 600 to minimize visual clutter.


---

## Light Mode 

```yaml
name: Neo-Industrial (Light)
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006780'
  on-secondary: '#ffffff'
  secondary-container: '#76dcff'
  on-secondary-container: '#006077'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#6cd3f7'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e61'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  h1:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
```

### Brand & Style
This design system is built upon the principles of precision, technical efficiency, and structured clarity. It targets professional environments where high-density information must be balanced with visual sophistication. The brand personality is authoritative yet modern, evoking the feel of a high-end engineering laboratory.

The aesthetic follows a **Neo-Industrial** direction—a synthesis of **Minimalism** and **Glassmorphism**. It utilizes a light, high-clarity foundation to maximize readability and focus, while employing sharp, translucent layers and vibrant technical accents to guide the user's focus. The result is a UI that feels both heavy-duty and light-weight, prioritizing functional hierarchy and mechanical precision.

### Colors
The palette is anchored in a crisp, surgical Slate. The background establishes a "canvas" of high visibility from which information emerges through subtle tonal shifts. 

- **Primary Action:** Indigo 600 serves as the primary driver for interaction, used for main calls to action and active states.
- **System Highlights:** Cyan 600 is utilized for secondary indicators, data visualizations, and progress elements, providing a technical contrast against the light background.
- **Surfaces:** Surfaces use layered white and light Slate tones to create depth without relying on traditional heavy shadows.
- **Accents:** Borders are kept extremely delicate, using low-opacity grays to define edges without adding visual bulk.

### Typography
This design system exclusively utilizes **Inter** to maintain a utilitarian, systematic feel. The typographic hierarchy is strictly enforced through weight and letter-spacing adjustments.

All headings are set to a bold 700 weight with a tight -0.02em letter-spacing to create a dense, "machined" look that feels impactful on screen. Body text remains neutral to ensure long-form readability in high-brightness environments. For technical labels and UI metadata, a smaller, semi-bold, uppercase style is used to mimic industrial labeling.

### Layout & Spacing
The layout is built on a rigid **4px base spacing scale**, ensuring that every element aligns to a consistent rhythmic grid. 

A **12-column fluid grid** is the standard for page layouts, allowing for flexible content distribution while maintaining structural integrity. Margins and gutters are kept generous (32px and 24px respectively) to provide "breathing room" against the high-density components. Use vertical rhythm to separate sections, favoring multiples of 16px (md) or 24px (lg) for component spacing.

### Elevation & Depth
In this light-mode environment, depth is communicated through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows. 

1.  **Base Layer:** The cleanest white or light Slate (#F8FAFC).
2.  **Raised Surfaces:** A slightly contrasted Slate (#F1F5F9) for standard cards and modules.
3.  **High-Value Containers:** For modals, navigation bars, or featured widgets, apply a **12px background blur** with a semi-transparent white surface.
4.  **Edge Definition:** All interactive and elevated containers must feature a **delicate 1px border**. On glass layers, use a subtle grey outline (Slate 200) to simulate a physical edge.

### Shapes
The shape language balances industrial geometry with modern ergonomics. 

Interactive elements such as buttons, input fields, and dropdowns use a **standard 8px radius**. This provides enough softness for comfort while maintaining a clean, professional edge. Larger structural elements like cards and dashboard panels use a more pronounced **12-16px radius**, creating a clear visual distinction between "the frame" and "the tools."

### Components
- **Buttons:** Primary buttons use a solid Indigo 600 fill with white text. Secondary buttons should use a ghost style with a 1px Cyan 600 border and Cyan 600 text. All buttons use an 8px radius.
- **Input Fields:** Pure white or light gray background with a 1px border that shifts to Indigo 600 on focus.
- **Cards:** Use the 12px or 16px radius. High-priority cards should utilize the glassmorphic blur (12px) and a subtle 1px border (Slate 200).
- **Chips/Badges:** Small, 4px-radius elements with low-opacity Indigo or Cyan fills and high-contrast text for status indicators.
- **Lists:** Rows should be separated by 1px Slate 100 dividers. Use subtle hover states (darken surface slightly or add a 1px border shift).
- **Scrollbars:** Custom slim-line scrollbars in Slate 300 to minimize visual clutter on the light background.
