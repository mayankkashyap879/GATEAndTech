# GATE And Tech Landing Page - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (SaaS/EdTech Hybrid)  
**Primary References:** Linear (typography & polish), Notion (feature presentation), Duolingo (gamification elements)  
**Aesthetic Direction:** Modern, professional educational platform with dark theme and vibrant green accents that convey growth and success

## Core Design Elements

### A. Color Palette

**Dark Mode Primary:**
- Background Base: 15 8% 11% (deep navy, #0f172a)
- Surface Elevated: 217 33% 17% (lighter slate for cards)
- Text Primary: 210 40% 98% (near white)
- Text Secondary: 215 20% 65% (muted slate)

**Brand Colors:**
- Primary Green: 160 84% 39% (emerald #10b981)
- Success Accent: 142 76% 36% (deeper green)
- Gradient Overlay: Linear from emerald to teal (160 84% 39% → 172 66% 50%)

**Supporting Colors:**
- Warning/Timer: 38 92% 50% (amber for countdown)
- Error State: 0 84% 60% (red for incorrect)
- Subtle Borders: 217 20% 25% (dark slate borders)

### B. Typography

**Font Families:**
- Primary: 'Inter' - all body text, navigation, buttons
- Display: 'Plus Jakarta Sans' or 'Inter' with increased letter-spacing for headlines
- Monospace: 'JetBrains Mono' for code snippets in quiz questions

**Type Scale:**
- Hero Headline: text-5xl md:text-6xl lg:text-7xl, font-bold, tracking-tight
- Section Headers: text-3xl md:text-4xl, font-bold
- Feature Titles: text-xl md:text-2xl, font-semibold
- Body Text: text-base md:text-lg, leading-relaxed
- Small Text: text-sm, for labels and captions
- Buttons: text-base, font-medium, tracking-wide

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 4, 6, 8, 12, 16, 20, 24, 32  
**Container Strategy:**
- Max-width: max-w-7xl for content sections
- Page padding: px-4 sm:px-6 lg:px-8
- Section spacing: py-16 md:py-24 lg:py-32

**Grid Patterns:**
- Features: 3-column on desktop (grid-cols-1 md:grid-cols-3)
- Pricing: 2-column centered (grid-cols-1 lg:grid-cols-2, max-w-5xl)
- Stats: 3-column (grid-cols-3, gap-8)

### D. Component Library

**Navigation Bar:**
- Fixed top, backdrop blur with semi-transparent dark background
- Logo (left): 40px height with green accent mark
- Nav items: text-sm, hover:text-green-400 transition
- CTA button: Bright emerald with subtle glow effect (shadow-lg shadow-green-500/30)

**Hero Section (80vh min-height):**
- Left content (50%): Headline with green gradient text on "focused confidence"
- Subheadline: text-xl, text-slate-400, max-w-2xl
- Dual CTAs: Primary (solid green), Secondary (outline with blur backdrop)
- Right content (50%): Dashboard mockup with subtle perspective tilt and shadow

**YouTube Showcase:**
- Two-column: Embedded video player (60%) | Stats sidebar (40%)
- Stats: Large numbers (text-4xl, font-bold, green) with labels below
- Feature list: Checkmark bullets with green accents
- Subscribe button: Outline style with YouTube red hover state

**Interactive Quiz Demo:**
- Two-column layout: Question interface (55%) | Demo preview image (45%)
- Timer: Circular progress indicator, amber color
- Options: Radio button cards with hover lift effect (hover:-translate-y-1)
- "Live Demo" badge: Small green pill in top-right

**Feature Cards:**
- Icon badge: 48x48, green background with white icon
- Image: Rounded-xl with border, subtle glow on hover
- Layout: Alternating left-right image placement per feature
- Label tags: Small green badges ("120+ Mock Tests", "AI-Powered Analytics")

**Testimonial Carousel:**
- Card design: Dark slate background, rounded-2xl, border accent
- Avatar: 56x56 circle with initials on green background
- Metrics badge: "+14 percentile" in emerald pill
- Navigation: Dots below, prev/next arrows on hover

**Pricing Cards:**
- Border: 1px solid slate-700, hover border-green-500 transition
- "Most Popular" badge: Absolute positioned, -top-3, green background
- Features: Checkmark list, text-sm, space-y-3
- Trust badges: Small icons row at bottom (secure, money-back)

**FAQ Accordion:**
- Single column, max-w-3xl centered
- Headers: Flex justify-between, chevron icon rotation on expand
- Content: Slide-down animation, text-slate-400

**Email Capture:**
- Form: Inline flex layout, input + button combined
- Checkbox: Custom green checkbox design
- Trust indicators: 3-column grid of checkmark items below

### E. Visual Effects & Interactions

**Animations (Minimal, purposeful):**
- Hero: Fade-in-up on load (0.6s ease)
- Cards: Scale 1.02 on hover with shadow increase
- Buttons: Brightness increase + shadow glow on hover
- Accordion: Smooth height transition (300ms)

**Shadows:**
- Cards: shadow-xl with green tint (shadow-green-500/10)
- Elevated elements: shadow-2xl for modals/popovers
- Button primary: shadow-lg shadow-green-500/30

**Borders & Dividers:**
- Subtle: border-slate-700/50
- Active/Focused: border-green-500
- Section dividers: 1px border-t border-slate-800

## Images

**Hero Dashboard Mockup:**
- Description: Modern analytics dashboard showing exam performance metrics, charts, and progress indicators
- Placement: Right 50% of hero section, -rotate-1 perspective tilt
- Treatment: Rounded-xl, shadow-2xl with green glow

**Feature Section Images (3 total):**
1. **Mock Test Interface:** Clean exam simulation UI with timer and question layout
2. **Analytics Dashboard:** Colorful charts showing topic-wise performance and predictions
3. **Community Interface:** Chat/discussion board with user avatars and activity

- Placement: Alternating sides (right, left, right) of feature cards
- Treatment: Rounded-lg, border border-slate-700, hover:scale-105 transition

**Demo Interface Preview:**
- Description: Side-by-side comparison showing question interface
- Placement: Right side of interactive quiz section
- Treatment: Rounded-xl with spotlight effect overlay

## Responsive Behavior

**Breakpoints:**
- Mobile (< 768px): Single column, hero stacked, reduced padding
- Tablet (768-1024px): 2-column grids, hero side-by-side
- Desktop (> 1024px): Full 3-column layouts, spacious padding

**Mobile Optimizations:**
- Hero: Stack content above image, full-width CTAs
- Stats: 2-column grid instead of 3
- Pricing: Full-width cards with spacing
- Navigation: Hamburger menu with slide-out drawer

## Key Design Principles

1. **Trust Through Professionalism:** Dark theme conveys sophistication, green accents inspire growth
2. **Progressive Disclosure:** Content reveals value at each scroll, no filler sections
3. **Social Proof Integration:** Stats, testimonials, and badges throughout to build credibility
4. **Action-Oriented:** Multiple CTAs strategically placed (hero, features, pricing, footer)
5. **Scannable Content:** Clear visual hierarchy with numbers, bullets, and spacing