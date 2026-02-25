import { ref, computed, type Ref } from 'vue';

export function useRowSelection(
  totalRowCount: number,
  rowComments: Ref<Record<number, string>>
) {
  // Multi-selection state
  const selectedRowIndices = ref<Set<number>>(new Set());
  const lastClickedRowIndex = ref<number | null>(null);

  // Comment section expansion state
  const expandedCommentRowIndex = ref<number | null>(null);

  // Computed for backwards compatibility with single selection UI
  const selectedRowIndex = computed(() =>
    selectedRowIndices.value.size === 1
      ? [...selectedRowIndices.value][0]
      : null
  );

  // Multi-selection computed properties
  const sortedSelectedIndices = computed(() =>
    [...selectedRowIndices.value].sort((a, b) => a - b)
  );

  const canMoveUp = computed(() => {
    if (selectedRowIndices.value.size === 0) return false;
    return sortedSelectedIndices.value[0] > 0;
  });

  const canMoveDown = computed(() => {
    if (selectedRowIndices.value.size === 0) return false;
    const maxIndex = totalRowCount - 1;
    return sortedSelectedIndices.value[sortedSelectedIndices.value.length - 1] < maxIndex;
  });

  function handleRowClick(rowIndex: number, event: MouseEvent): void {
    if (event.shiftKey && lastClickedRowIndex.value !== null) {
      // Shift+Click: Select range with sticky comment state
      const wasCommentOpen = expandedCommentRowIndex.value !== null;
      const start = Math.min(lastClickedRowIndex.value, rowIndex);
      const end = Math.max(lastClickedRowIndex.value, rowIndex);
      for (let i = start; i <= end; i++) {
        selectedRowIndices.value.add(i);
      }
      if (wasCommentOpen) {
        // Apply comment state to newly selected row
        if (rowComments.value[rowIndex] === undefined) {
          rowComments.value[rowIndex] = '';
        }
        expandedCommentRowIndex.value = rowIndex;
      } else {
        expandedCommentRowIndex.value = null;
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+Click: Toggle individual with sticky comment state
      const wasCommentOpen = expandedCommentRowIndex.value !== null;
      if (selectedRowIndices.value.has(rowIndex)) {
        selectedRowIndices.value.delete(rowIndex);
        // Clear comment expansion if this row was expanded
        if (expandedCommentRowIndex.value === rowIndex) {
          expandedCommentRowIndex.value = null;
        }
      } else {
        selectedRowIndices.value.add(rowIndex);
        if (wasCommentOpen) {
          // Apply comment state to newly selected row
          if (rowComments.value[rowIndex] === undefined) {
            rowComments.value[rowIndex] = '';
          }
          expandedCommentRowIndex.value = rowIndex;
        } else {
          expandedCommentRowIndex.value = null;
        }
      }
    } else {
      // Normal click: Simple three-click cycle with sticky comment state
      const isOnlySelected = selectedRowIndices.value.size === 1 && selectedRowIndices.value.has(rowIndex);
      const isCommentExpanded = expandedCommentRowIndex.value === rowIndex;
      const wasCommentOpen = expandedCommentRowIndex.value !== null; // Track if ANY comment was open

      if (!selectedRowIndices.value.has(rowIndex)) {
        // Click 1: Select row and apply current comment state
        selectedRowIndices.value.clear();
        selectedRowIndices.value.add(rowIndex);
        if (wasCommentOpen) {
          // Previous selection had comment open, so open this one too
          if (rowComments.value[rowIndex] === undefined) {
            rowComments.value[rowIndex] = '';
          }
          expandedCommentRowIndex.value = rowIndex;
        } else {
          // Previous selection had no comment, so don't open this one
          expandedCommentRowIndex.value = null;
        }
      } else if (isOnlySelected && !isCommentExpanded) {
        // Click 2: Open comment section
        if (rowComments.value[rowIndex] === undefined) {
          rowComments.value[rowIndex] = '';
        }
        expandedCommentRowIndex.value = rowIndex;
      } else if (isOnlySelected && isCommentExpanded) {
        // Click 3: Deselect row
        selectedRowIndices.value.clear();
        expandedCommentRowIndex.value = null;
      } else {
        // Clicked on a different row in a multi-selection - switch to single selection
        selectedRowIndices.value.clear();
        selectedRowIndices.value.add(rowIndex);
        if (wasCommentOpen) {
          // Previous selection had comment open, apply to new selection
          if (rowComments.value[rowIndex] === undefined) {
            rowComments.value[rowIndex] = '';
          }
          expandedCommentRowIndex.value = rowIndex;
        } else {
          expandedCommentRowIndex.value = null;
        }
      }
    }
    lastClickedRowIndex.value = rowIndex;
    // Force reactivity
    selectedRowIndices.value = new Set(selectedRowIndices.value);
  }

  // Handle scroll to row from LogMonitor
  function handleScrollToRow(rowIndex: number): void {
    // Select the row (no comment opens)
    selectedRowIndices.value.clear();
    selectedRowIndices.value.add(rowIndex);
    expandedCommentRowIndex.value = null;
    selectedRowIndices.value = new Set(selectedRowIndices.value);

    // Scroll the row into view
    const rowElement = document.querySelector(`[data-row-index="${rowIndex}"]`);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearRowSelection(): void {
    selectedRowIndices.value.clear();
    selectedRowIndices.value = new Set();
    lastClickedRowIndex.value = null;
  }

  function isRowSelected(rowIndex: number): boolean {
    return selectedRowIndices.value.has(rowIndex);
  }

  return {
    selectedRowIndices,
    lastClickedRowIndex,
    expandedCommentRowIndex,
    selectedRowIndex,
    sortedSelectedIndices,
    canMoveUp,
    canMoveDown,
    handleRowClick,
    handleScrollToRow,
    clearRowSelection,
    isRowSelected
  };
}
