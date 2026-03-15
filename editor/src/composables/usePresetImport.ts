import { MappingDocumentParser } from '../modules/parsers';
import { parseJsonMapping } from '../modules/jsonParser';
import type { MappingDocument } from '../modules/documentModel';
import { EMPTY_KEY } from '../modules/dataModel';

export interface LoadedFileResult {
  doc: MappingDocument;
  rowComments: Record<number, string>;
  rowColors: Record<number, string>;
}

export interface PresetManifestEntry {
  id: string;
  filename: string;
  label: string;
  category?: string;
  description?: string;
  tags?: string[];
  author?: string;
}

export interface GhostRow {
  srcIndex: number;
  sourceType: string;
  sourceFunc: string;
  destType: string;
  destFunc: string;
}

export interface ImportPreview {
  targetIndex: number;
  blockSize: number;
  ghostRows: GhostRow[];
  cutCount: number;
}

export async function loadLocalFile(file: File): Promise<LoadedFileResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.map')) {
    const doc = MappingDocumentParser.parse(new Uint8Array(await file.arrayBuffer()));
    return { doc, rowComments: {}, rowColors: {} };
  }
  if (name.endsWith('.json')) {
    const { doc, rowComments, rowColors } = parseJsonMapping(await file.text());
    return { doc, rowComments, rowColors };
  }
  throw new Error(`Unsupported file type: ${file.name}`);
}

// Structural interfaces to handle both real class instances and Vue's UnwrapRef versions
interface RowLike {
  source: { type: { key: number } };
}

interface GhostRowLike {
  source: { type: { key: number; abbr: string }; function: { abbr: string } };
  destination: { type: { abbr: string }; function: { abbr: string } };
}

export function buildGhostRows(
  sourceRows: GhostRowLike[],
  startLine: number,
  endLine: number,
  targetIndex: number
): { ghostRows: GhostRow[]; cutCount: number } {
  const ghostRows: GhostRow[] = [];
  let cutCount = 0;
  for (let i = 0; i <= endLine - startLine; i++) {
    const srcRow = sourceRows[startLine + i];
    if (!srcRow) { cutCount++; continue; }
    if (targetIndex + i >= 70) { cutCount++; continue; }
    ghostRows.push({
      srcIndex: startLine + i,
      sourceType: srcRow.source.type.abbr,
      sourceFunc: srcRow.source.function.abbr,
      destType: srcRow.destination.type.abbr,
      destFunc: srcRow.destination.function.abbr,
    });
  }
  return { ghostRows, cutCount };
}

interface MappingDocumentLike {
  rows: RowLike[];
}

export function getUsedRowCount(doc: MappingDocumentLike): number {
  let count = 0;
  for (const row of doc.rows) {
    if (row.source.type.key !== EMPTY_KEY) count++;
  }
  return count;
}

// Find the index after the last non-empty row (for append mode).
// Returns 0 if all rows are empty.
export function findAppendIndex(rows: RowLike[]): number {
  let lastNonEmpty = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].source.type.key !== EMPTY_KEY) {
      lastNonEmpty = i;
    }
  }
  return lastNonEmpty + 1;
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

  return {
    fetchPresetManifest,
    loadPreset,
    getUsedRowCount,
    findAppendIndex,
  };
}
