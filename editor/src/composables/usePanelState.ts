import { ref, watch } from 'vue';

// localStorage keys
const SELECTION_TOOLBAR_VISIBLE_KEY = 'nerdseq-show-selection-toolbar';
const MIDI_MONITOR_VISIBLE_KEY = 'nerdseq-show-midi-monitor';
const VARIABLE_MONITOR_VISIBLE_KEY = 'nerdseq-show-variable-monitor';
const LOG_MONITOR_VISIBLE_KEY = 'nerdseq-show-log-monitor';
const DESCRIPTION_VISIBLE_KEY = 'nerdseq-show-description';
const MIDI_LEARN_AUTO_ADVANCE_KEY = 'nerdseq-midi-learn-auto-advance';
const PASTE_AUTO_ADVANCE_KEY = 'nerdseq-paste-auto-advance';
const ROW_INDEX_DISPLAY_KEY = 'row-index-display-hex';

export type PasteAutoAdvanceMode = 'disabled' | 'rows-only' | 'all';

function createPanelState() {
  // Panel expanded states — read from localStorage using the same keys BasePanel uses
  const settingsPanelExpanded = ref(localStorage.getItem('settings-panel-expanded') === 'true');
  const selectionToolbarExpanded = ref(localStorage.getItem('selection-toolbar-expanded') === 'true');
  const midiMonitorExpanded = ref(localStorage.getItem('midi-monitor-expanded') === 'true');
  const variableMonitorExpanded = ref(localStorage.getItem('variable-monitor-expanded') === 'true');
  const logMonitorExpanded = ref(localStorage.getItem('warning-log-expanded') === 'true');

  // Global Documentation Panel expanded state
  const getInitialGlobalDocExpanded = (): boolean => {
    const stored = localStorage.getItem('global-doc-panel-expanded');
    return stored ? JSON.parse(stored) : false;
  };
  const globalDocPanelExpanded = ref(getInitialGlobalDocExpanded());

  // Persist expanded state changes
  watch(globalDocPanelExpanded, (newValue) => {
    localStorage.setItem('global-doc-panel-expanded', JSON.stringify(newValue));
  });

  // Panel visibility state (controlled from Settings Panel)
  // Selection Toolbar defaults to true (enabled by default)
  const showSelectionToolbar = ref(localStorage.getItem(SELECTION_TOOLBAR_VISIBLE_KEY) !== 'false');
  const showMidiMonitor = ref(localStorage.getItem(MIDI_MONITOR_VISIBLE_KEY) === 'true');
  const showVariableMonitor = ref(localStorage.getItem(VARIABLE_MONITOR_VISIBLE_KEY) === 'true');
  const showLogMonitor = ref(localStorage.getItem(LOG_MONITOR_VISIBLE_KEY) === 'true');
  const showDescription = ref(localStorage.getItem(DESCRIPTION_VISIBLE_KEY) === 'true');
  const midiLearnAutoAdvance = ref(localStorage.getItem(MIDI_LEARN_AUTO_ADVANCE_KEY) !== 'false'); // Default: true

  // Initialize paste auto-advance setting with proper type handling
  const storedPasteAutoAdvance = localStorage.getItem(PASTE_AUTO_ADVANCE_KEY);
  const pasteAutoAdvance = ref<PasteAutoAdvanceMode>(
    storedPasteAutoAdvance === 'disabled' || storedPasteAutoAdvance === 'rows-only' || storedPasteAutoAdvance === 'all'
      ? storedPasteAutoAdvance
      : 'all' // Default: all
  );

  // Row index display format (hex/decimal)
  const displayRowIndexAsHex = ref(false);

  // Watch and persist panel visibility
  watch(showSelectionToolbar, (val) => {
    localStorage.setItem(SELECTION_TOOLBAR_VISIBLE_KEY, val.toString());
    if (!val) selectionToolbarExpanded.value = false;
  });
  watch(showMidiMonitor, (val) => {
    localStorage.setItem(MIDI_MONITOR_VISIBLE_KEY, val.toString());
    if (!val) midiMonitorExpanded.value = false;
  });
  watch(showVariableMonitor, (val) => {
    localStorage.setItem(VARIABLE_MONITOR_VISIBLE_KEY, val.toString());
    if (!val) variableMonitorExpanded.value = false;
  });
  watch(showLogMonitor, (val) => {
    localStorage.setItem(LOG_MONITOR_VISIBLE_KEY, val.toString());
    if (!val) logMonitorExpanded.value = false;
  });
  watch(showDescription, (val) => {
    localStorage.setItem(DESCRIPTION_VISIBLE_KEY, val.toString());
    if (!val) globalDocPanelExpanded.value = false;
  });
  watch(midiLearnAutoAdvance, (val) => {
    localStorage.setItem(MIDI_LEARN_AUTO_ADVANCE_KEY, val.toString());
  });
  watch(pasteAutoAdvance, (val) => {
    localStorage.setItem(PASTE_AUTO_ADVANCE_KEY, val);
  });

  function initDisplayPreferences(): void {
    displayRowIndexAsHex.value = localStorage.getItem(ROW_INDEX_DISPLAY_KEY) === 'true';
  }

  // Persist row index display preference
  function watchDisplayRowIndexAsHex(onChangeCallback: () => void): void {
    watch(displayRowIndexAsHex, (val) => {
      localStorage.setItem(ROW_INDEX_DISPLAY_KEY, val.toString());
      onChangeCallback();
    });
  }

  return {
    // Panel expanded states
    settingsPanelExpanded,
    midiMonitorExpanded,
    variableMonitorExpanded,
    selectionToolbarExpanded,
    logMonitorExpanded,
    globalDocPanelExpanded,
    // Panel visibility
    showSelectionToolbar,
    showMidiMonitor,
    showVariableMonitor,
    showLogMonitor,
    showDescription,
    // Auto-advance settings
    midiLearnAutoAdvance,
    pasteAutoAdvance,
    // Row index display
    displayRowIndexAsHex,
    initDisplayPreferences,
    watchDisplayRowIndexAsHex
  };
}

let instance: ReturnType<typeof createPanelState> | null = null;

export function usePanelState() {
  if (!instance) instance = createPanelState();
  return instance;
}
