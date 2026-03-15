import { MappingDocumentParser } from './parsers';
import type { MappingDocument } from './documentModel';

export interface JsonParseResult {
  doc: MappingDocument;
  globalComment: string;
  rowComments: Record<number, string>;
  rowColors: Record<number, string>;
}

export function parseJsonMapping(text: string): JsonParseResult {
  const doc = MappingDocumentParser.parseJson(text);
  const j = JSON.parse(text) as Record<string, unknown>;
  const meta = (j.editorMetadata && typeof j.editorMetadata === 'object')
    ? j.editorMetadata as Record<string, unknown>
    : {};

  const globalComment = typeof meta.globalComment === 'string' ? meta.globalComment : '';
  const rowComments = (meta.rowComments && typeof meta.rowComments === 'object')
    ? meta.rowComments as Record<number, string>
    : {};
  const rowColors = (meta.rowColors && typeof meta.rowColors === 'object')
    ? meta.rowColors as Record<number, string>
    : {};

  if (globalComment) doc.globalComment = globalComment;
  return { doc, globalComment, rowComments, rowColors };
}
