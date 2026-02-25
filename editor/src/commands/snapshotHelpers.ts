/**
 * Shared snapshot types and helpers for row-level undo/redo commands
 */

import {
  Source, SourceType, SourceFunction, SourceExtra,
  Destination, DestinationType, DestinationFunction, DestinationExtra,
  Row as MappingRow
} from '../modules/documentModel';
import { DataModel, EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION, type MappingType } from '../modules/dataModel';

export interface SourceSnapshot {
  typeKey: number; typeAbbr: string; typeDesc: string;
  funcKey: number; funcAbbr: string; funcDesc: string;
  extraKey: number; extraAbbr: string; extraDesc: string;
  selectedTypeKey: number;
}

export interface DestinationSnapshot {
  typeKey: number; typeAbbr: string; typeDesc: string;
  funcKey: number; funcAbbr: string; funcDesc: string;
  extraKey: number; extraAbbr: string; extraDesc: string;
  selectedTypeKey: number;
}

export interface RowSnapshot {
  rowIndex: number;
  source: SourceSnapshot;
  destination: DestinationSnapshot;
  comment: string | null;
}

export function captureSourceSnapshot(row: MappingRow, selectedSourceTypes: MappingType[]): SourceSnapshot {
  return {
    typeKey: row.source.type.key, typeAbbr: row.source.type.abbr, typeDesc: row.source.type.description,
    funcKey: row.source.function.key, funcAbbr: row.source.function.abbr, funcDesc: row.source.function.description,
    extraKey: row.source.extra.keyOrValue, extraAbbr: row.source.extra.abbr, extraDesc: row.source.extra.description,
    selectedTypeKey: selectedSourceTypes[row.index]?.key ?? EMPTY_KEY
  };
}

export function captureDestinationSnapshot(row: MappingRow, selectedDestTypes: MappingType[]): DestinationSnapshot {
  return {
    typeKey: row.destination.type.key, typeAbbr: row.destination.type.abbr, typeDesc: row.destination.type.description,
    funcKey: row.destination.function.key, funcAbbr: row.destination.function.abbr, funcDesc: row.destination.function.description,
    extraKey: row.destination.extra.keyOrValue, extraAbbr: row.destination.extra.abbr, extraDesc: row.destination.extra.description,
    selectedTypeKey: selectedDestTypes[row.index]?.key ?? EMPTY_KEY
  };
}

export function captureRowSnapshot(
  row: MappingRow,
  selectedSourceTypes: MappingType[],
  selectedDestTypes: MappingType[],
  rowComments: Record<number, string>
): RowSnapshot {
  return {
    rowIndex: row.index,
    source: captureSourceSnapshot(row, selectedSourceTypes),
    destination: captureDestinationSnapshot(row, selectedDestTypes),
    comment: rowComments[row.index] ?? null
  };
}

export function applySourceSnapshot(
  row: MappingRow,
  snap: SourceSnapshot,
  selectedSourceTypes: MappingType[]
): void {
  row.source = new Source(
    new SourceType(snap.typeKey, snap.typeAbbr, snap.typeDesc),
    new SourceFunction(snap.funcKey, snap.funcAbbr, snap.funcDesc),
    new SourceExtra(snap.extraKey, snap.extraAbbr, snap.extraDesc)
  );
  const type = DataModel.sourceTypes.find(t => t.key === snap.selectedTypeKey);
  if (type) selectedSourceTypes[row.index] = type;
}

export function applyDestinationSnapshot(
  row: MappingRow,
  snap: DestinationSnapshot,
  selectedDestTypes: MappingType[]
): void {
  row.destination = new Destination(
    new DestinationType(snap.typeKey, snap.typeAbbr, snap.typeDesc),
    new DestinationFunction(snap.funcKey, snap.funcAbbr, snap.funcDesc),
    new DestinationExtra(snap.extraKey, snap.extraAbbr, snap.extraDesc)
  );
  const type = DataModel.destinationTypes.find(t => t.key === snap.selectedTypeKey);
  if (type) selectedDestTypes[row.index] = type;
}

export function applyRowSnapshot(
  rows: MappingRow[],
  snap: RowSnapshot,
  selectedSourceTypes: MappingType[],
  selectedDestTypes: MappingType[],
  rowComments: Record<number, string>
): void {
  const row = rows.find(r => r.index === snap.rowIndex);
  if (!row) return;

  applySourceSnapshot(row, snap.source, selectedSourceTypes);
  applyDestinationSnapshot(row, snap.destination, selectedDestTypes);

  if (snap.comment === null || snap.comment === '') {
    delete rowComments[snap.rowIndex];
  } else {
    rowComments[snap.rowIndex] = snap.comment;
  }
}

export function createEmptySourceSnapshot(): SourceSnapshot {
  return {
    typeKey: EMPTY_KEY, typeAbbr: EMPTY_ABBR, typeDesc: EMPTY_DESCRIPTION,
    funcKey: EMPTY_KEY, funcAbbr: EMPTY_ABBR, funcDesc: EMPTY_DESCRIPTION,
    extraKey: EMPTY_KEY, extraAbbr: EMPTY_ABBR, extraDesc: EMPTY_DESCRIPTION,
    selectedTypeKey: DataModel.sourceTypes[0]?.key ?? EMPTY_KEY
  };
}

export function createEmptyDestinationSnapshot(): DestinationSnapshot {
  return {
    typeKey: EMPTY_KEY, typeAbbr: EMPTY_ABBR, typeDesc: EMPTY_DESCRIPTION,
    funcKey: EMPTY_KEY, funcAbbr: EMPTY_ABBR, funcDesc: EMPTY_DESCRIPTION,
    extraKey: EMPTY_KEY, extraAbbr: EMPTY_ABBR, extraDesc: EMPTY_DESCRIPTION,
    selectedTypeKey: DataModel.destinationTypes[0]?.key ?? EMPTY_KEY
  };
}
