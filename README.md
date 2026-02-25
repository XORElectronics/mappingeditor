# NerdSEQ Mapping Editor

NerdSEQ is a Eurorack hardware sequencer by XOR Electronics. Its Mappings system is a flexible routing layer that connects CV inputs, MIDI, triggers, I²C, internal variables, and more — letting you wire almost any signal to almost any destination on the hardware.

This editor lets you create, edit, and export `.MAP` files visually in a browser, without needing the hardware in front of you. Load an existing file, make changes, and export it back to the binary format the NerdSEQ expects.

## Features

- 70 configurable mapping rows: source → destination routing
- 15 source types: CV, Trigger, Track, Automator, Envelope, MIDI, MIDI CC, NRPN, I²C, Variable, Calc, Skip, Global, External, Control
- 17 destination types: CV, Trigger, Track, Automator, Envelope, MIDI CC, I²C, Audio, SetVar, RandomRange, Global, CV16, Table, MIDI, Dual, Skip, Visu
- Import / export binary `.MAP` files and JSON
- A/B slot caching with browser persistence (IndexedDB)
- Live MIDI learn mode
- Static logic analyser (unused variables, read-before-write, destination conflicts)
- Undo / redo with full command history

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local development

```bash
git clone <repo>
cd editor
npm install
npm run dev
```

Opens at http://localhost:5173

### Available commands (run from `editor/`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build (type-check + bundle) |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript strict-mode check |

## Project Structure

- **`/editor`** - Main mapping editor application (Vue.js)
- **`/tests`** - Test files and validation scripts
- **`/docs`** - Documentation and file format specifications
- **`/examples`** - Example mapping files
- **`/viewers`** - Standalone mapping file viewers

## Testing

Test files are in the `/tests` directory and cover all 15 source and 17 destination types, edge cases, and binary format compatibility.

```bash
node run-tests.js                        # Validates and regenerates all test files
cd tests && node validate-test-files.js  # Manual validation
```

See `/tests/TEST_FILES_README.md` for details.

## File Format

Mappings are stored as 1502-byte binary `.MAP` files (70-byte header, 70 rows × 20 bytes each, 32 bytes for 16 variables). All values are little-endian; `0xFFFF` represents empty fields.

Full specification: `/docs/mapping_file_definition.txt`
