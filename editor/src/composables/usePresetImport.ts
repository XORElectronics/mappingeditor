import { MappingDocumentParser } from '../modules/parsers';
import type { MappingDocument } from '../modules/documentModel';
import { EMPTY_KEY } from '../modules/dataModel';

export interface PresetManifestEntry {
  id: string;
  filename: string;
  label: string;
}

// Structural interfaces to handle both real class instances and Vue's UnwrapRef versions
interface RowLike {
  source: { type: { key: number } };
}

interface MappingDocumentLike {
  rows: RowLike[];
}

export function usePresetImport() {
  async function fetchPresetManifest(): Promise<PresetManifestEntry[]> {
    const response = await fetch('/examples/manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load preset manifest: ${response.statusText}`);
    }
    const data = await response.json() as { presets: PresetManifestEntry[] };
    return data.presets;
  }

  async function loadPreset(filename: string): Promise<MappingDocument> {
    const response = await fetch(`/examples/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load preset "${filename}": ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return MappingDocumentParser.parse(new Uint8Array(buffer));
  }

  function getUsedRowCount(doc: MappingDocumentLike): number {
    let count = 0;
    for (const row of doc.rows) {
      if (row.source.type.key !== EMPTY_KEY) count++;
    }
    return count;
  }

  // Find the index after the last non-empty row (for append mode).
  // Returns 0 if all rows are empty.
  function findAppendIndex(rows: RowLike[]): number {
    let lastNonEmpty = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].source.type.key !== EMPTY_KEY) {
        lastNonEmpty = i;
      }
    }
    return lastNonEmpty + 1;
  }

  return {
    fetchPresetManifest,
    loadPreset,
    getUsedRowCount,
    findAppendIndex,
  };
}
