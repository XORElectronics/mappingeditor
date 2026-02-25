# Mapping Editor - Styling Guide

This guide explains how to use the centralized CSS system for maintaining consistent styling across the mapping editor application.

## Table of Contents

1. [Overview](#overview)
2. [CSS Variables Reference](#css-variables-reference)
3. [Global CSS Classes](#global-css-classes)
4. [Component Styling Conventions](#component-styling-conventions)
5. [How-To Guides](#how-to-guides)
6. [Examples](#examples)

---

## Overview

All styling in the mapping editor uses a centralized system based on **CSS Custom Properties (CSS Variables)**. This provides:

- ✅ **Single source of truth** for colors, spacing, and sizing
- ✅ **Easy theming** - change one value, update entire application
- ✅ **Consistency** across all components
- ✅ **Maintainability** - no duplicate CSS
- ✅ **Scalability** - easy to add new components

### File Structure

```
src/assets/styles/
├── variables.css        # CSS custom properties (colors, spacing, etc.)
├── form-elements.css    # Shared classes for form elements
└── index.css           # Imports variables and form-elements
```

---

## CSS Variables Reference

All CSS variables are defined in `src/assets/styles/variables.css`.

### Colors

#### Primary Colors

```css
--color-primary: #34cc99; /* Main green color for all elements */
--color-hover: #f1f700; /* Yellow hover state */
--color-disabled: grey; /* Disabled/empty state */
--color-empty: grey; /* Empty select/input background */
```

**Usage**: Background colors for buttons, selects, inputs, and containers.

#### Background Colors

```css
--color-dark-bg: #3a3a3f; /* Dark background */
--color-black: black; /* Black */
```

#### Button Colors

```css
--color-reset: #cc8534; /* Reset button background */
--color-reset-hover: red; /* Reset button hover state */
```

#### Text Colors

```css
--color-text-primary: black; /* Primary text color */
--color-text-yellow: #f1f700; /* Yellow text (headers) */
```

#### Border Colors

```css
--color-border-dark: #dee2e6; /* Border color */
```

### Form Elements

#### Heights

```css
--form-height: 30px; /* Standard height for all form elements */
--form-min-height: 30px; /* Minimum height */
```

#### Padding

```css
--form-padding-vertical: 0.25rem; /* Top/bottom padding */
--form-padding-horizontal: 0.75rem; /* Left/right padding */
--form-padding-top-select: 3px; /* Select top padding */
--form-padding-bottom-select: 9px; /* Select bottom padding */
```

#### Border Radius

```css
--form-border-radius: 0; /* Standard border radius */
--form-border-radius-left: 5px 0 0 5px; /* Left side rounded */
--form-border-radius-right: 0 5px 5px 0; /* Right side rounded */
```

#### Font Sizes

```css
--form-font-size: 12px; /* Form element font size */
--form-line-height: 18px; /* Form element line height */
```

### Buttons

```css
--button-padding: 0 6px; /* Button padding */
--button-font-size: 10px; /* Button font size */
```

### Layout

```css
--grid-gap: 2px; /* Grid gap between elements */
```

#### Extra Components

```css
--extras-checkbox-size: 1.2em; /* Checkbox container size */
--extras-label-padding-left: 1em; /* Label left padding */
--extras-checkbox-padding-right: 1.5em; /* Checkbox right padding */
```

### Effects

#### Transitions

```css
--transition-standard: 0.2s ease; /* Standard transition timing */
--transition-fast: 0.1s ease; /* Fast transition timing */
```

#### Shadows

```css
--shadow-hover: 0 0 8px rgba(0, 0, 0, 0.15); /* Hover shadow effect */
```

#### Opacity

```css
--opacity-disabled: 0.3; /* Disabled element opacity */
--opacity-full: 1; /* Full opacity */
```

---

## Global CSS Classes

All shared classes are defined in `src/assets/styles/form-elements.css`.

### Form Element Classes

#### `.mapping-select`

Standard select element styling.

**Usage**: Apply to all `<select>` elements throughout the application.

```vue
<select class="mapping-select" v-model="value">
  <option>Option 1</option>
</select>
```

**Features**:

- Green background (`--color-primary`)
- Yellow hover state (`--color-hover`)
- Grey disabled state (`--color-disabled`)
- Smooth transitions

#### `.mapping-input`

Standard input element styling.

**Usage**: Apply to all `<input>` elements throughout the application.

```vue
<input class="mapping-input" type="text" v-model="value" />
```

**Features**:

- Green background with proper padding
- Yellow hover state
- Grey disabled state with transparent text
- Height: 100% to fill container

### State Classes

#### `.select-empty`

Applied to select elements when no value is selected (EMPTY_KEY).

**Usage**: Add to select elements conditionally.

```vue
<select :class="{ 'select-empty': row.source.type.key === EMPTY_KEY }"></select>
```

**Features**:

- Grey background (`--color-empty`)
- Black text

#### `.input-empty`

Applied to input elements when empty.

**Features**: Same as `.select-empty`

#### `.input-disabled`

Applied to container divs when content is disabled.

**Usage**: Add to container elements that should show disabled state.

```vue
<div :class="{ 'input-disabled': isDisabled }"></div>
```

**Features**:

- Grey background

#### `.label-empty`

Applied to labels showing placeholder text.

**Features**:

- Grey background
- Flexbox centering
- Consistent padding

### Container Classes

#### `.extras-container`

Standard container for Extra components (CalcSkip, Variable, MIDI CC).

**Usage**: Wrapper div for all Extra components.

```vue
<template>
  <div class="extras-container">
    <!-- Extra component content -->
  </div>
</template>
```

**Features**:

- Flexbox row layout
- Centers content vertically
- 100% width and height

#### `.extras-first`

First section of Extra components (labels/checkboxes).

**Features**:

- Flexbox layout
- Green background
- Proper alignment

#### `.extras-second`

Second section of Extra components (inputs/selects).

**Features**:

- Flexbox layout
- Green background
- Right-aligned content

### Button Classes

#### `.mapping-btn`

Standard button styling for mapping actions.

**Usage**: Apply to copy, paste, clear buttons.

```vue
<button class="mapping-btn" @click="handleClick">
  Copy
</button>
```

**Features**:

- Green background
- Yellow hover state
- Grey disabled state
- Smooth transitions
- Shadow on hover

---

## Component Styling Conventions

### When to Use Scoped vs Global Styles

#### Use Global Classes When:

- ✅ Styling is identical across multiple components
- ✅ Element is a standard form element (select, input, button)
- ✅ Styling represents a common state (empty, disabled)

#### Use Scoped Styles When:

- ✅ Styling is unique to one component
- ✅ Need to override global styles for specific use case
- ✅ Component-specific layout (not shared)

### CSS Variable Usage

**DO ✅**:

```css
/* Use CSS variables */
background-color: var(--color-primary);
padding: var(--form-padding-vertical) var(--form-padding-horizontal);
transition: background-color var(--transition-standard);
```

**DON'T ❌**:

```css
/* Don't hardcode values */
background-color: #34cc99;
padding: 0.25rem 0.75rem;
transition: background-color 0.2s ease;
```

### Component Structure Pattern

For Extra components (CalcSkip, Variable, MIDI CC):

```vue
<template>
  <div class="extras-container">
    <div class="first" :class="{ 'input-disabled': !isEnabled }">
      <label>Label Text:</label>
      <div>
        <input type="checkbox" />
      </div>
    </div>
    <div class="second" :class="{ 'input-disabled': isDisabled }">
      <input v-model="value" />
    </div>
  </div>
</template>

<style scoped>
/* Note: Base classes are in global form-elements.css */

.first {
  /* Component-specific width */
  width: 50%;
  background-color: var(--color-primary);
}

.second {
  /* Component-specific width */
  width: 50%;
  background-color: var(--color-primary);
}
</style>
```

---

## How-To Guides

### How to Change the Primary Color Theme

**Task**: Change the green theme to a different color.

**Steps**:

1. Open `src/assets/styles/variables.css`
2. Change the `--color-primary` value:
   ```css
   --color-primary: #ff6b6b; /* Red theme */
   ```
3. Save the file
4. The entire application updates automatically!

**Result**: All buttons, selects, inputs, and backgrounds change to the new color.

### How to Change Hover Color

**Steps**:

1. Open `src/assets/styles/variables.css`
2. Change `--color-hover`:
   ```css
   --color-hover: #00ff00; /* Green hover */
   ```

### How to Adjust Form Element Heights

**Task**: Make all form elements taller.

**Steps**:

1. Open `src/assets/styles/variables.css`
2. Change `--form-height`:
   ```css
   --form-height: 40px; /* Increased from 30px */
   ```

**Result**: All selects, inputs, and their containers adjust automatically.

### How to Change Button Font Size

**Steps**:

1. Open `src/assets/styles/variables.css`
2. Change `--button-font-size`:
   ```css
   --button-font-size: 12px; /* Increased from 10px */
   ```

### How to Adjust Transition Speed

**Task**: Make hover effects faster/slower.

**Steps**:

1. Open `src/assets/styles/variables.css`
2. Change `--transition-standard`:
   ```css
   --transition-standard: 0.1s ease; /* Faster (was 0.2s) */
   --transition-standard: 0.5s ease; /* Slower */
   ```

### How to Add a New Form Element

**Task**: Add a new input field to the application.

**Steps**:

1. Add the input to your component template:

   ```vue
   <input class="mapping-input" v-model="myValue" />
   ```

2. **That's it!** The input automatically gets:
   - Green background
   - Yellow hover state
   - Proper padding and height
   - Smooth transitions

**Optional**: Add empty state:

```vue
<input
  class="mapping-input"
  :class="{ 'input-empty': myValue === EMPTY_KEY }"
  v-model="myValue"
/>
```

### How to Add a New Select Element

**Steps**:

1. Add the select with global class:

   ```vue
   <select
     class="mapping-select"
     :class="{ 'select-empty': value === EMPTY_KEY }"
     v-model="value"
   >
     <option v-for="option in options" :value="option.key">
       {{ option.description }}
     </option>
   </select>
   ```

2. **Done!** Automatic styling applied.

### How to Create a New Extra Component

**Task**: Create a new component similar to VariableSourceExtra or MidiCcDestinationExtra.

**Steps**:

1. Create new component file:

   ```vue
   <template>
     <div class="extras-container">
       <div class="first" :class="{ 'input-disabled': !isEnabled }">
         <label>My Label:</label>
         <div>
           <input type="checkbox" v-model="isEnabled" />
         </div>
       </div>
       <div class="second" :class="{ 'input-disabled': !isEnabled }">
         <select class="mapping-select" v-model="selectedValue">
           <option>Option 1</option>
         </select>
       </div>
     </div>
   </template>

   <style scoped>
   /* Note: Base classes are in global form-elements.css */

   .first {
     width: 40%; /* Adjust as needed */
   }

   .second {
     width: 60%; /* Adjust as needed */
   }
   </style>
   ```

2. The component automatically inherits:
   - Container layout
   - Color scheme
   - Disabled states
   - Transitions

---

## Examples

### Example 1: Themed Buttons

```vue
<template>
  <!-- Copy button - uses global colors -->
  <button
    class="mapping-btn copy-btn"
    @click="handleCopy"
    :disabled="!hasContent"
  >
    Copy
  </button>
</template>

<style scoped>
.copy-btn {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  transition: background-color var(--transition-standard);
}

.copy-btn:hover:not(:disabled) {
  background-color: var(--color-hover);
}

.copy-btn:disabled {
  background-color: var(--color-disabled);
  opacity: var(--opacity-disabled);
}
</style>
```

### Example 2: Select with Empty State

```vue
<template>
  <select
    class="mapping-select"
    :class="{ 'select-empty': sourceType === EMPTY_KEY }"
    v-model="sourceType"
  >
    <option v-for="type in sourceTypes" :value="type.key">
      {{ type.description }}
    </option>
  </select>
</template>

<style scoped>
/* No additional styles needed - all handled by global classes! */
</style>
```

### Example 3: Extra Component with Variables

```vue
<template>
  <div class="extras-container">
    <div class="first">
      <label>NRPN:</label>
      <div>
        <input type="checkbox" v-model="useNRPN" />
      </div>
    </div>
    <div class="second">
      <input
        v-if="useNRPN"
        class="mapping-input"
        type="number"
        v-model="nrpnValue"
      />
      <select v-else class="mapping-select" v-model="ccValue">
        <option>CC 1</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific widths only */
.first {
  width: 30%;
  background-color: var(--color-primary);
}

.second {
  width: 70%;
  background-color: var(--color-primary);
}

.second > input {
  padding: var(--form-padding-vertical) var(--form-padding-horizontal);
}
</style>
```

---

## Best Practices

### ✅ DO

1. **Always use CSS variables** for colors, spacing, and transitions
2. **Use global classes** for standard form elements
3. **Keep scoped styles minimal** - only component-specific layout
4. **Test disabled and empty states** when adding new components
5. **Comment unusual CSS** in scoped styles
6. **Follow existing patterns** when creating new components

### ❌ DON'T

1. **Don't hardcode colors** like `#34cc99` - use variables
2. **Don't duplicate CSS** - check global classes first
3. **Don't create component-specific versions** of states (empty, disabled)
4. **Don't use inline styles** for theming values
5. **Don't override global classes unnecessarily**
6. **Don't forget transitions** - use `var(--transition-standard)`

---

## Migration Checklist

When refactoring an existing component to use the new system:

- [ ] Replace all hardcoded colors with CSS variables
- [ ] Replace all hardcoded spacing/sizing with CSS variables
- [ ] Remove duplicate `.select-empty` class (use global)
- [ ] Remove duplicate `.input-disabled` class (use global)
- [ ] Remove duplicate container styles (use `.extras-container`)
- [ ] Add comment noting which classes are global
- [ ] Test all states: normal, hover, disabled, empty
- [ ] Verify no visual regressions

---

## Troubleshooting

### Problem: Colors not updating

**Solution**: Check that you're using CSS variables, not hardcoded values.

```css
/* Wrong ❌ */
background-color: #34cc99;

/* Correct ✅ */
background-color: var(--color-primary);
```

### Problem: Global class not working

**Solution**: Verify `index.css` is importing the global styles:

```css
/* In src/assets/styles/index.css */
@import "./variables.css";
@import "./form-elements.css";
```

### Problem: Transition not smooth

**Solution**: Use the standard transition variable:

```css
transition:
  background-color var(--transition-standard),
  opacity var(--transition-standard);
```

### Problem: Element height incorrect

**Solution**: Ensure parent container has `height: 100%` and element uses:

```css
height: var(--form-height);
```

---

## Quick Reference Card

| Task                    | CSS Variable            | Default Value |
| ----------------------- | ----------------------- | ------------- |
| Change primary color    | `--color-primary`       | `#34cc99`     |
| Change hover color      | `--color-hover`         | `#F1F700`     |
| Change disabled color   | `--color-disabled`      | `grey`        |
| Change form height      | `--form-height`         | `30px`        |
| Change button size      | `--button-font-size`    | `10px`        |
| Change transition speed | `--transition-standard` | `0.2s ease`   |
| Change grid gap         | `--grid-gap`            | `2px`         |

| Task               | Global Class        | Usage             |
| ------------------ | ------------------- | ----------------- |
| Style select       | `.mapping-select`   | Add to `<select>` |
| Style input        | `.mapping-input`    | Add to `<input>`  |
| Empty state        | `.select-empty`     | Conditional class |
| Disabled container | `.input-disabled`   | Conditional class |
| Extra container    | `.extras-container` | Wrapper div       |
| Button style       | `.mapping-btn`      | Add to `<button>` |

---

## Support

For questions about styling:

1. Check this guide first
2. Look at existing components for examples
3. Review `variables.css` for available options
4. Review `form-elements.css` for global classes

---

**Last Updated**: January 2026
**Version**: 1.0
**Maintained By**: Development Team
