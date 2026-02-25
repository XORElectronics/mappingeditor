# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NerdSEQ Mapping Editor - A web-based editor for creating and managing NerdSEQ hardware mappings. The editor allows users to configure 70 mapping rows that route signals between sources (CV, MIDI, triggers, etc.) and destinations (CV outputs, MIDI, I2C, etc.) on the NerdSEQ sequencer.

## Development Commands

```bash
cd editor
npm install        # Install dependencies
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build (runs type-check + build-only)
npm run type-check # TypeScript strict mode validation
npm run preview    # Preview production build
```

Test files are in `/tests/` with validation scripts:
```bash
node run-tests.js                    # Validates and regenerates all test files
cd tests && node validate-test-files.js  # Manual test validation
```

## Architecture

### Directory Structure

```
editor/src/
├── components/          # Vue components
├── composables/         # Vue 3 Composition API composables
├── modules/             # Core data models and utilities
├── services/            # Business logic services
├── constants/           # Shared constants (colors, MIDI)
└── assets/              # Static assets (styles, images, fonts)
```

### Core Data Flow

```
.MAP/.JSON file → Parsers → MappingDocument → Vue UI → Formatters → Export
```

### Key Modules (`editor/src/modules/`)

- **documentModel.ts**: `MappingDocument` class containing 70 `Row` objects + 16 `Variable` objects (A-P). Each row has source/function/extra triplet and destination/function/extra triplet.

- **dataModel.ts**: Lookup tables for all source types (0-14: CV, Trigger, Track, Automator, Envelope, MIDI, MIDI CC, NRPN, I2C, Variable, Calc, Skip, Global, External, Control) and destination types (0-16: CV, Trigger, Track, Automator, Envelope, MIDI CC, I2C, Audio, SetVar, RandomRange, Global, CV16, Table, MIDI, Dual, Skip, Visu).

- **parsers.ts**: `MappingDocumentParser` handles the 1502-byte binary .MAP format (70-byte header, 1400 bytes for 70 rows × 10 uint16 values each, 32 bytes for 16 variables). All values are Little Endian. `0xFFFF` (65535) represents empty/unused fields.

- **formatters.ts**: Export to JSON, HTML, Markdown, and binary .MAP blob.

### UI Components (`editor/src/components/`)

#### Main Application

- **EditorApp.vue**: Main component (~1100 lines) with file I/O, 70-row mapping table, row management, and panel coordination.

#### Panel Components (BasePanel-based)

- **BasePanel.vue**: Unified foldable panel container with consistent styling and animations.
- **SettingsPanel.vue**: Settings and info display.
- **MidiMonitor.vue**: MIDI message monitoring and live trace.
- **VariableMonitor.vue**: Variable A-P display with values.
- **LogMonitor.vue**: Centralized log and validation message display.

#### UI Components

- **MenuButton.vue**: Unified button component with variants (primary, secondary, download).
- **ToastNotifications.vue**: Transient notification system for user feedback.
- **SelectionToolbar.vue**: Multi-row operations toolbar (copy, paste, clear, move, color).
- **RowCommentSection.vue**: Expanded row details, warnings, and comments.
- **RowActionButtons.vue**: Per-row copy/paste/clear buttons.

#### Source/Destination Extra Components

- **CalcSkipSourceExtra.vue**: Calc/Skip source parameters.
- **NrpnSourceExtra.vue**: NRPN source parameters.
- **VariableSourceExtra.vue**: Variable source parameters.
- **MidiLearnExtra.vue**: MIDI learn mode UI.
- **DualDestinationExtra.vue**: Dual destination parameters.
- **MidiCcDestinationExtra.vue**: MIDI CC destination parameters.
- **SkipDestinationExtra.vue**: Skip destination parameters.
- **VariableDestinationExtra.vue**: Variable destination parameters.
- **VisuDestinationExtra.vue**: Visualization destination parameters.

### Composables (`editor/src/composables/`)

- **useClipboard.ts**: Row/source/destination copy-paste operations.
- **useMappingCache.ts**: A/B slot caching with IndexedDB persistence and lock state.
- **useMidi.ts**: Web MIDI API integration, NRPN assembly, learn mode (10s timeout).
- **useStaticAnalyzer.ts**: Logic validation and warning generation (unused vars, read-before-write, conflicts).
- **useWarningLog.ts**: Centralized warning log management.

### Services (`editor/src/services/`)

- **rowReferenceService.ts**: Handles row reference tracking and analysis.

### Constants (`editor/src/constants/`)

- **colors.ts**: Row background color definitions.
- **midi.ts**: MIDI-related constants (interfaces, channels, learn mode).

### Binary Format Reference

See `/docs/mapping_file_definition.txt` for complete .MAP file format specification including all source/destination type codes and their parameters.

## Important Constants

- **EMPTY_KEY**: `0xFFFF` (65535) - represents unused/empty field values.
- **Row count**: 70 mapping rows.
- **Variables**: 16 named variables (A-P), each 16-bit unsigned (0-4095).
- **MIDI interfaces**: TRS (channels 0-15), USB Host (16-31), USB Device (32-47), Learn (48).

## Key Features

### A/B Caching System

- Two independent mapping slots (A/B) with IndexedDB persistence.
- Lock function per slot to prevent accidental modifications.
- Auto-restore on page load.
- See `useMappingCache.ts`.

### Static Logic Analyzer

- Automated analysis on load/save.
- Warning types: Variable Read Before Write, Destination Conflicts, Unused Variables.
- Warning count badge in header toolbar.
- See `useStaticAnalyzer.ts` and `useWarningLog.ts`.

### Multi-Selection & Row Operations

- **Shift+Click**: Range selection.
- **Ctrl/Cmd+Click**: Toggle individual rows.
- **SelectionToolbar**: Batch operations (copy, paste, clear, move up/down, color assignment).
- **Row Colors**: 8 background color options for visual grouping.

### Copy/Paste System

- Row-level: Copy entire mapping (source + destination).
- Source-level: Copy only source parameters.
- Destination-level: Copy only destination parameters.
- See `useClipboard.ts` for implementation details.

## Tech Stack

- Vue.js 3.4 with Composition API
- TypeScript 5.3 (strict mode)
- Vite 5.0
- Bootstrap 5.3 (Bootswatch Lux dark theme)
- AJV for JSON schema validation
- IndexedDB for client-side persistence

## Planning Documents

- **FEATURE_PLAN.md**: Debugger & monitoring system roadmap with completed/planned features.
- **REFACTORING_PLAN.md**: Recent implementations, architectural observations, and improvement opportunities.

## Custom Claude Code Agents

This project has custom agents configured for specialized tasks:

- **map-export-guardian**: Protects .MAP binary export functionality from breaking changes.
- **vue-refactoring-architect**: Assists with Vue component refactoring and clean architecture.
- **feature-research**: Explores and evaluates new feature ideas.

See Serena memory "custom-agents" for detailed usage guidance.
