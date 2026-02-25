import { computed } from 'vue';
import { usePanelState } from './usePanelState';
import { useMidi } from './useMidi';

// Panel width constants (extracted from individual panel components)
const PANEL_WIDTHS = {
  settings:  { minimized: 100, expanded: 180 },
  selection: { minimized: 120, expanded: 260 },
  midi:      { minimized: 150, expanded: 320 },
  variables: { minimized: 110, expanded: 300 },
  log:       { minimized: 140, expanded: 350 },
} as const;

const GAP = 10;
const BASE_OFFSET = 10;

export function usePanelLayout() {
  const {
    settingsPanelExpanded, selectionToolbarExpanded, midiMonitorExpanded,
    variableMonitorExpanded,
    showSelectionToolbar, showMidiMonitor, showVariableMonitor
  } = usePanelState();

  const { isSupported: midiSupported } = useMidi();

  function panelWidth(id: keyof typeof PANEL_WIDTHS, expanded: boolean): number {
    return expanded ? PANEL_WIDTHS[id].expanded : PANEL_WIDTHS[id].minimized;
  }

  // Effective MIDI monitor visibility (must be supported AND enabled)
  const effectiveMidiVisible = computed(() => midiSupported.value && showMidiMonitor.value);

  // Each panel's right position = sum of widths of panels to its right + gaps
  const settingsRight = computed(() => `${BASE_OFFSET}px`);

  const selectionRight = computed(() => {
    const pos = BASE_OFFSET + panelWidth('settings', settingsPanelExpanded.value) + GAP;
    return `${pos}px`;
  });

  const midiRight = computed(() => {
    let pos = BASE_OFFSET + panelWidth('settings', settingsPanelExpanded.value) + GAP;
    if (showSelectionToolbar.value) pos += panelWidth('selection', selectionToolbarExpanded.value) + GAP;
    return `${pos}px`;
  });

  const variablesRight = computed(() => {
    let pos = BASE_OFFSET + panelWidth('settings', settingsPanelExpanded.value) + GAP;
    if (showSelectionToolbar.value) pos += panelWidth('selection', selectionToolbarExpanded.value) + GAP;
    if (effectiveMidiVisible.value) pos += panelWidth('midi', midiMonitorExpanded.value) + GAP;
    return `${pos}px`;
  });

  const logRight = computed(() => {
    let pos = BASE_OFFSET + panelWidth('settings', settingsPanelExpanded.value) + GAP;
    if (showSelectionToolbar.value) pos += panelWidth('selection', selectionToolbarExpanded.value) + GAP;
    if (effectiveMidiVisible.value) pos += panelWidth('midi', midiMonitorExpanded.value) + GAP;
    if (showVariableMonitor.value) pos += panelWidth('variables', variableMonitorExpanded.value) + GAP;
    return `${pos}px`;
  });

  return {
    settingsRight,
    selectionRight,
    midiRight,
    variablesRight,
    logRight,
    PANEL_WIDTHS
  };
}
