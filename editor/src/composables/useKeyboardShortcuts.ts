import { onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue';
import type { PasteAutoAdvanceMode } from './usePanelState';

export interface UseKeyboardShortcutsOptions {
  // State refs
  selectedRowIndices: Ref<Set<number>>;
  sortedSelectedIndices: ComputedRef<number[]>;
  isCurrentLocked: ComputedRef<boolean>;
  pasteAutoAdvance: Ref<PasteAutoAdvanceMode>;
  hasCopiedRow: Ref<boolean>;
  hasCopiedRows: Ref<boolean>;

  // Actions
  handleSlotSwitch: (slot: 'A' | 'B') => void;
  undo: () => void;
  redo: () => void;
  copyRow: (index: number) => void;
  copyRows: (indices: number[]) => void;
  cutRows: (indices: number[]) => void;
  pasteRow: (index: number) => void;
  pasteRows: (startIndex: number) => void;
  clearRow: (index: number) => void;
  clearRows: (indices: number[]) => void;
  clearRowSelection: () => void;
  advanceToNextRow: (currentRowIndex: number, keepCommentOpen?: boolean) => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    selectedRowIndices,
    sortedSelectedIndices,
    isCurrentLocked,
    pasteAutoAdvance,
    hasCopiedRow,
    hasCopiedRows,
    handleSlotSwitch,
    undo,
    redo,
    copyRow,
    copyRows,
    cutRows,
    pasteRow,
    pasteRows,
    clearRow,
    clearRows,
    clearRowSelection,
    advanceToNextRow
  } = options;

  function handleKeyDown(event: KeyboardEvent): void {
    // Don't handle shortcuts if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }

    // Slot switching shortcuts (1 = Slot 1, 2 = Slot 2; press again to toggle lock)
    if (event.key === '1' && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      handleSlotSwitch('A');
      event.preventDefault();
      return;
    } else if (event.key === '2' && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      handleSlotSwitch('B');
      event.preventDefault();
      return;
    }

    // Undo/Redo shortcuts (work globally, not just for selections)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      undo();
      event.preventDefault();
      return;
    } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      redo();
      event.preventDefault();
      return;
    }

    // Rest of shortcuts require row selection
    if (selectedRowIndices.value.size === 0) return;

    const indices = sortedSelectedIndices.value;

    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      if (selectedRowIndices.value.size > 1) {
        copyRows(indices);
      } else if (indices.length === 1) {
        copyRow(indices[0]);
      }
      event.preventDefault();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
      if (selectedRowIndices.value.size > 1) {
        cutRows(indices);
      }
      event.preventDefault();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      if (hasCopiedRows.value && indices.length > 0) {
        pasteRows(indices[0]);
      } else if (hasCopiedRow.value && indices.length === 1) {
        const currentRowIndex = indices[0];
        pasteRow(currentRowIndex);

        // Auto-advance to next row after full row paste (if enabled)
        if (pasteAutoAdvance.value === 'rows-only' || pasteAutoAdvance.value === 'all') {
          advanceToNextRow(currentRowIndex);
        }
      }
      event.preventDefault();
    } else if (event.key === 'Escape') {
      clearRowSelection();
      event.preventDefault();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      // Check lock state before clearing
      if (isCurrentLocked.value) {
        event.preventDefault();
        return;
      }

      if (selectedRowIndices.value.size > 1) {
        clearRows(indices);
      } else if (indices.length === 1) {
        clearRow(indices[0]);
      }
      event.preventDefault();
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });
}
