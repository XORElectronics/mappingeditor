import { type Ref } from 'vue';
import type { PasteAutoAdvanceMode } from './usePanelState';

export interface UseAutoAdvanceOptions {
  // State refs
  selectedRowIndices: Ref<Set<number>>;
  expandedCommentRowIndex: Ref<number | null>;
  pasteAutoAdvance: Ref<PasteAutoAdvanceMode>;
  totalRowCount: number;

  // Paste actions from useClipboard
  pasteRow: (index: number) => void;
  pasteSource: (index: number) => void;
  pasteDestination: (index: number) => void;
}

export function useAutoAdvance(options: UseAutoAdvanceOptions) {
  const {
    selectedRowIndices,
    expandedCommentRowIndex,
    pasteAutoAdvance,
    totalRowCount,
    pasteRow,
    pasteSource,
    pasteDestination
  } = options;

  // Helper function to advance to the next row
  function advanceToNextRow(currentRowIndex: number, keepCommentOpen = false): void {
    const nextRowIndex = currentRowIndex + 1;
    if (nextRowIndex < totalRowCount) {
      selectedRowIndices.value.clear();
      selectedRowIndices.value.add(nextRowIndex);

      // Keep comment section open if requested (for source/destination paste workflow)
      if (keepCommentOpen) {
        expandedCommentRowIndex.value = nextRowIndex;
      } else {
        expandedCommentRowIndex.value = null;
      }

      selectedRowIndices.value = new Set(selectedRowIndices.value);

      // Scroll into view
      const rowElement = document.querySelector(`[data-row-index="${nextRowIndex}"]`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  // Paste operation wrappers with auto-advance support
  function handlePasteRow(rowIndex: number): void {
    pasteRow(rowIndex);
    if (pasteAutoAdvance.value === 'rows-only' || pasteAutoAdvance.value === 'all') {
      advanceToNextRow(rowIndex, false); // Close comment section for full row paste
    }
  }

  function handlePasteSource(rowIndex: number): void {
    pasteSource(rowIndex);
    if (pasteAutoAdvance.value === 'all') {
      advanceToNextRow(rowIndex, true); // Keep comment section open for source paste
    }
  }

  function handlePasteDestination(rowIndex: number): void {
    pasteDestination(rowIndex);
    if (pasteAutoAdvance.value === 'all') {
      advanceToNextRow(rowIndex, true); // Keep comment section open for destination paste
    }
  }

  return {
    advanceToNextRow,
    handlePasteRow,
    handlePasteSource,
    handlePasteDestination
  };
}
