export const MIDI_SOURCE_TYPE_KEY = 5
export const MIDI_CC_SOURCE_TYPE_KEY = 6
export const MIDI_NRPN_SOURCE_TYPE_KEY = 7
export const MIDI_CC_DESTINATION_TYPE_KEY = 5
export const MIDI_DESTINATION_TYPE_KEY = 13

export const MIDI_LEARN_FUNCTION_KEY = 48
export const LEARN_TIMEOUT_MS = 10000

export const MIDI_INTERFACES = [
  { value: 'trs' as const, label: 'TRS (Ch 1-16)', offset: 0 },
  { value: 'host' as const, label: 'USB Host (Ch 17-32)', offset: 16 },
  { value: 'device' as const, label: 'USB Device (Ch 33-48)', offset: 32 }
] as const

export type MidiInterface = typeof MIDI_INTERFACES[number]['value']
