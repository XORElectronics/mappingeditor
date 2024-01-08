
function genMidiDeviceChannelSources() {
  const sources = [];
  sources.push({ id: 65535, source: "----" });
  for (let id = 0; id <= 15; id++) {
    sources.push({ id: id, source: `TRS Midi Channel ${id + 1}` });
  }
  for (let id = 16; id <= 31; id++) {
    sources.push({ id: id, source: `USB Host Midi Channel ${id - 15}` });
  }
  for (let id = 32; id <= 47; id++) {
    sources.push({ id: id, source: `USB Device Midi Channel ${id - 31}` });
  }
  sources.push({ id: 48, source: "MIDI Learn" });
  return sources;
}


function genMidiNoteParameters() {
  const parameters = [];
  parameters.push({ id: 65535, parameter: "----" });
  parameters.push({ id: 0, parameter: "Note" });
  parameters.push({ id: 1, parameter: "Gate" });
  parameters.push({ id: 2, parameter: "Velocity" });
  parameters.push({ id: 3, parameter: "Channel Pressure" });
  parameters.push({ id: 4, parameter: "Pitch Bend" });
  for (let id = 5; id <= 124; id++) {
    parameters.push({ id: id, parameter: `Selected Midi Note ${id - 5} On/Off` });
  }
  for (let id = 125; id <= 245; id++) {
    parameters.push({ id: id, parameter: `Selected Midi Note ${id - 125} Velocity` });
  }
  for (let id = 246; id <= 364; id++) {
    parameters.push({ id: id, parameter: `Selected Midi Note ${id - 246} Aftertouch` });
  }
  return parameters;
}

function genVariableSources() {
  const sources = [];
  sources.push({ id: 65535, source: "----" });
  for (let id = 0; id <= 15; id++) {
    sources.push({ id: id, source: `Variable ${String.fromCharCode(65 + id)}` });
  }
  for (let id = 16; id <= 86; id++) {
    sources.push({ id: id, source: `Mapping Row ${(id - 16).toString(16)} (${id - 16})` });
  }
  return sources;
}

function genSkipSources() {
  const sources = [];
  sources.push({ id: 65535, source: "----" });
  let id = 0;
  for (let rowSkipCount = 0; rowSkipCount <= 15; rowSkipCount++) {
    sources.push({ id: id++, source: `Skip ${rowSkipCount} Rows If Param1 < Param2` });
    sources.push({ id: id++, source: `Skip ${rowSkipCount} Rows If Param1 <= Param2` });
    sources.push({ id: id++, source: `Skip ${rowSkipCount} Rows If Param1 >= Param2` });
    sources.push({ id: id++, source: `Skip ${rowSkipCount} Rows If Param1 = Param2` });
    sources.push({ id: id++, source: `Skip ${rowSkipCount} Rows If Param1 <> Param2` });
  }
  return sources;
}

function genControlSourceParameters() {
  const parameters = [];
  parameters.push({ id: 65535, parameter: "----" });
  for (let id = 0; id <= 31; id++) {
    parameters.push({ id: id, parameter: `Execute ${id + 1} Mapping Rows` });
  }
  return parameters;
}

function genVariableDestinations() {
  const destinations = [];
  destinations.push({ id: 65535, destination: "----" });
  for (let id = 0; id <= 15; id++) {
    destinations.push({ id: id, destination: `Variable ${String.fromCharCode(65 + id)}` });
  }
  for (let id = 16; id <= 85; id++) {
    destinations.push({ id: id, destination: `Mapping Row ${(id - 16).toString(16)}h (${id - 16})` });
  }
  return destinations;
}

function genMidiDeviceChannelDestinations(addLearn = true) {
  const destinations = [];
  destinations.push({ id: 65535, destination: "----" });
  for (let id = 0; id <= 15; id++) {
    destinations.push({ id: id, destination: `TRS Midi Channel ${id + 1}` });
  }
  for (let id = 16; id <= 31; id++) {
    destinations.push({ id: id, destination: `USB Host Midi Channel ${id - 15}` });
  }
  for (let id = 32; id <= 47; id++) {
    destinations.push({ id: id, destination: `USB Device Midi Channel ${id - 31}` });
  }
  if (addLearn) { destinations.push({ id: 48, parameter: "MIDI Learn" }); }
  return destinations;
}

function genCVDestinationParameters() {
  const parameters = [];
  parameters.push({ id: 65535, parameter: "----" });
  for (let id = 0; id <= 5; id++) {
    parameters.push({ id: id, parameter: `Local CV ${id}` });
  }
  for (let id = 6; id <= 11; id++) {
    parameters.push({ id: id, parameter: `Local MOD ${id - 6}` });
  }
  for (let id = 12; id <= 27; id++) {
    parameters.push({ id: id, parameter: `CV16 NSA1 ${id - 12}` });
  }
  for (let id = 28; id <= 43; id++) {
    parameters.push({ id: id, parameter: `CV16 NSA2 ${id - 28}` });
  }
  for (let id = 44; id <= 59; id++) {
    parameters.push({ id: id, parameter: `CV16 NSA3 ${id - 44}` });
  }
  for (let id = 60; id <= 75; id++) {
    parameters.push({ id: id, parameter: `CV16 NSA4 ${id - 60}` });
  }
  return parameters;
}

function genTriggerDestinationParameters() {
  const parameters = [];
  parameters.push({ id: 65535, parameter: "----" });
  for (let id = 0; id <= 5; id++) {
    parameters.push({ id: id, parameter: `Local Trigger ${id}` });
  }
  for (let id = 6; id <= 21; id++) {
    parameters.push({ id: id, parameter: `Trigger16 NSA1 ${id - 6}` });
  }
  for (let id = 22; id <= 37; id++) {
    parameters.push({ id: id, parameter: `Trigger16 NSA2 ${id - 22}` });
  }
  for (let id = 38; id <= 53; id++) {
    parameters.push({ id: id, parameter: `Trigger16 NSA3 ${id - 38}` });
  }
  for (let id = 54; id <= 69; id++) {
    parameters.push({ id: id, parameter: `Trigger16 NSA4 ${id - 54}` });
  }
  return parameters;
}

function genTrackDestinations() {
  const destinations = [];
  destinations.push({ id: 65535, destination: "----" });
  destinations.push({ id: 0, destination: "Mute" });
  destinations.push({ id: 1, destination: "Solo" });
  destinations.push({ id: 2, destination: "Pattern Order" });
  destinations.push({ id: 3, destination: "Transpose" });
  destinations.push({ id: 4, destination: "Trigger Delay" });
  destinations.push({ id: 5, destination: "Probability 1" });
  destinations.push({ id: 6, destination: "Probability 2" });
  destinations.push({ id: 7, destination: "Probability 3" });
  destinations.push({ id: 8, destination: "Probability 4" });
  destinations.push({ id: 9, destination: "Probability 5" });
  destinations.push({ id: 10, destination: "Probability 6" });
  destinations.push({ id: 11, destination: "Probability 7" });
  destinations.push({ id: 12, destination: "Probability 8" });
  destinations.push({ id: 13, destination: "Row Probability" });
  destinations.push({ id: 14, destination: "Glide CV" });
  destinations.push({ id: 15, destination: "Glide CV Resolution" });
  destinations.push({ id: 16, destination: "Glide MOD" });
  destinations.push({ id: 17, destination: "Glide MOD Resolution" });
  destinations.push({ id: 18, destination: "Track Clock" });
  destinations.push({ id: 19, destination: "Set Pattern Start Position(not used yet)" });
  destinations.push({ id: 20, destination: "Pattern Length" });
  destinations.push({ id: 21, destination: "Set current Pattern Row" });
  destinations.push({ id: 22, destination: "Generate Tick" });
  destinations.push({ id: 23, destination: "Pattern Shift Up" });
  destinations.push({ id: 24, destination: "Pattern Shift Down" });
  destinations.push({ id: 25, destination: "Sync Track" });
  destinations.push({ id: 26, destination: "Reset Track" });
  destinations.push({ id: 27, destination: "FX1 Overrule" });
  destinations.push({ id: 28, destination: "FX2 Overrule" });
  destinations.push({ id: 29, destination: "FX3 Overrule" });
  destinations.push({ id: 30, destination: "FX4 Overrule" });
  destinations.push({ id: 31, destination: "Unused" });
  destinations.push({ id: 32, destination: "Unused" });
  destinations.push({ id: 33, destination: "Unused" });
  destinations.push({ id: 34, destination: "Unused" });
  destinations.push({ id: 35, destination: "Unused" });
  destinations.push({ id: 36, destination: "Unused" });
  destinations.push({ id: 37, destination: "Euclidean" });
  for (let id = 38; id <= 53; id++) {
    destinations.push({ id: id, destination: `Drum Matrix Euclidean ${id - 38}` });
  }
  destinations.push({ id: 54, destination: "Pattern Cursor Position" });
  destinations.push({ id: 55, destination: "Pattern Note at Cursor" });
  for (let id = 56; id <= 119; id++) {
    destinations.push({ id: id, destination: `Note at Pattern Step ${id - 56}` });
  }
  for (let id = 120; id <= 183; id++) {
    destinations.push({ id: id, destination: `Value at Cursor Column Step ${id - 120}` });
  }
  return destinations;
}

function genTableDestinations() {
  const destinations = [];
  destinations.push({ id: 65535, destination: "----" });
  for (let id = 0; id <= 31; id++) {
    destinations.push({ id: id, destination: `Selected Table ${id + 1}` });
  }
  for (let id = 32; id <= 40; id++) {
    destinations.push({ id: id, destination: `Running Table on Track ${id - 31}` });
  }
}

function genRandomRangeDestinations() {
  const destinations = [];
  destinations.push({ id: 65535, destination: "----" });
  for (let id = 0; id <= 15; id++) {
    destinations.push({ id: id, destination: `Range ${id}` });
  }
  return destinations;
}

function genCV16Destinations() {
  const destinations = [];
  destinations.push({ id: 65535, destination: "----" });
  destinations.push({ id: 0, destination: "Glide Speed" });
  destinations.push({ id: 1, destination: "Glide Resolution" });
  let id = 2;
  for (let envCount = 0; envCount <= 7; envCount++) {
    destinations.push({ id: id++, destination: `Envelope ${envCount + 1} Attack` });
    destinations.push({ id: id++, destination: `Envelope ${envCount + 1} Amplitude` });
    destinations.push({ id: id++, destination: `Envelope ${envCount + 1} Release` });
    destinations.push({ id: id++, destination: `Envelope ${envCount + 1} Fire Oneshot` });
    destinations.push({ id: id++, destination: `Envelope ${envCount + 1} Fire A/R` });
  }
  for (let lfoCount = 0; lfoCount <= 7; lfoCount++) {
    destinations.push({ id: id++, destination: `LFO ${lfoCount + 1} Type` });
    destinations.push({ id: id++, destination: `LFO ${lfoCount + 1} Speed` });
    destinations.push({ id: id++, destination: `LFO ${lfoCount + 1} Amplitude` });
    destinations.push({ id: id++, destination: `LFO ${lfoCount + 1} Start` });
    destinations.push({ id: id++, destination: `LFO ${lfoCount + 1} Reset` });
  }
  destinations.push({ id: 82, destination: "Stop Modulator Function" });
}

function genCV16DestinationParameters() {
  const parameters = [];
  parameters.push({ id: 65535, parameter: "----" });
  for (let id = 0; id <= 15; id++) {
    parameters.push({ id: id, parameter: `NSA1 ${id + 1}` });
  }
  for (let id = 16; id <= 31; id++) {
    parameters.push({ id: id, parameter: `NSA2 ${id - 15}` });
  }
  for (let id = 32; id <= 47; id++) {
    parameters.push({ id: id, parameter: `NSA3 ${id - 31}` });
  }
  for (let id = 48; id <= 63; id++) {
    parameters.push({ id: id, parameter: `NSA4 ${id - 47}` });
  }
  return parameters;
}

function genMidiControllerParameters() {
  const parameters = [];
  parameters.push({ id: 65535, parameter: "----" });
  for (let id = 0; id <= 127; id++) {
    parameters.push({ id: id, parameter: `MIDI Controller #${id}` });
  }
  return parameters;
}

function genI2cPortParameters() {
  const parameters = [];
  parameters.push({ id: 65535, parameter: "----" });
  for (let id = 0; id <= 127; id++) {
    parameters.push({ id: id, parameter: `Port Number ${id}` });
  }
  return parameters;
}

let mappingConfig = {
  mappings: {
    sourceCategories: [
      {
        id: 65535,
        category: "----",
        sources: [{ id: 65535, source: "----" }],
        parameters: [{ id: 65535, parameter: "----" }],
      },
      {
        id: 0,
        category: "CV or MOD",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "CV In 1" },
          { id: 1, source: "CV In 2" },
          { id: 2, source: "CV In 3" },
          { id: 3, source: "CV In 4" },
          { id: 4, source: "CV Out 1" },
          { id: 5, source: "CV Out 2" },
          { id: 6, source: "CV Out 3" },
          { id: 7, source: "CV Out 4" },
          { id: 8, source: "CV Out 5" },
          { id: 9, source: "CV Out 6" },
          { id: 10, source: "MOD Out 1" },
          { id: 11, source: "MOD Out 2" },
          { id: 12, source: "MOD Out 3" },
          { id: 13, source: "MOD Out 4" },
          { id: 14, source: "MOD Out 5" },
          { id: 15, source: "MOD Out 6" },
        ],
        parameters: [{ id: 65535, parameter: "----" }],
      },
      {
        id: 1,
        category: "Trigger",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "Trigger 1" },
          { id: 1, source: "Trigger 2" },
          { id: 2, source: "Trigger 3" },
          { id: 3, source: "Trigger 4" },
          { id: 4, source: "Trigger 5" },
          { id: 5, source: "Trigger 6" },
        ],
        parameters: [{ id: 65535, parameter: "----" }],
      },
      {
        id: 2,
        category: "Track",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "Track 1" },
          { id: 1, source: "Track 2" },
          { id: 2, source: "Track 3" },
          { id: 3, source: "Track 4" },
          { id: 4, source: "Track 5" },
          { id: 5, source: "Track 6" },
          { id: 6, source: "Track 7" },
          { id: 7, source: "Track 8" },
        ],
        parameters: [
          { id: 65535, parameter: "----" },
          { id: 0, parameter: "Probability 0" },
          { id: 1, parameter: "Probability 1" },
          { id: 2, parameter: "Probability 2" },
          { id: 3, parameter: "Probability 3" },
          { id: 4, parameter: "Probability 4" },
          { id: 5, parameter: "Probability 5" },
          { id: 6, parameter: "Probability 6" },
          { id: 7, parameter: "Probability 7" },
          { id: 8, parameter: "Row Probability" },
          { id: 9, parameter: "Pattern Row" },
          { id: 10, parameter: "Pattern/Track Run Status" },
          { id: 11, parameter: "Track Active Note" },
        ],
      },
      {
        id: 3,
        category: "Automator",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "Slot 1" },
          { id: 1, source: "Slot 2" },
          { id: 2, source: "Slot 3" },
          { id: 3, source: "Slot 4" },
          { id: 4, source: "Slot 5" },
          { id: 5, source: "Slot 6" },
          { id: 6, source: "Slot 7" },
          { id: 7, source: "Slot 8" },
        ],
        parameters: [{ id: 65535, parameter: "----" }],
      },
      {
        id: 4,
        category: "Envelope",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "Envelope 1" },
          { id: 1, source: "Envelope 2" },
          { id: 2, source: "Envelope 3" },
          { id: 3, source: "Envelope 4" },
          { id: 4, source: "Envelope 5" },
          { id: 5, source: "Envelope 6" },
          { id: 6, source: "Envelope 7" },
          { id: 7, source: "Envelope 8" },
        ],
        parameters: [{ id: 65535, parameter: "----" }],
      },
      {
        id: 5,
        category: "MIDI Note",
        sources: genMidiDeviceChannelSources(),
        parameters: genMidiNoteParameters(),
      },
      {
        id: 6,
        category: "MIDI CC",
        sources: genMidiDeviceChannelSources(),
        parameters: genMidiControllerParameters(),
      },
      {
        id: 7,
        category: "MIDI NRPN",
        sources: genMidiDeviceChannelSources(),
        parameters: [{ id: 65535, parameter: "----" },]
        // Handle parameters in code. 
        // 0..9999 "Midi NRPN Controller #"
      },
      {
        id: 8,
        category: "I2C",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "SC.CV" },
          { id: 48, source: "Learn" },
        ],
        parameters: genI2cPortParameters(),
      },
      {
        id: 9,
        category: "Variable",
        sources: genVariableSources(),
        parameters: [{ id: 65535, parameter: "----" }],
        // Handle parameters in code. 
        // 0 Pass Value from Variable/Row
        // 1..4096 Set Variable/ Row to 0 - 4095 / 0 - FFF
      },
      {
        id: 10,
        category: "Calculation",
        sources: [
          { id: 0, source: "Add" },
          { id: 1, source: "Add with Overflow" },
          { id: 2, source: "Subtract" },
          { id: 3, source: "Subtract with Overflow" },
          { id: 4, source: "Multiply" },
          { id: 5, source: "Multiply with Overflow" },
          { id: 6, source: "Multiply 0.1" },
          { id: 7, source: "Multiply 0.1 with Overflow" },
          { id: 8, source: "Divide" },
          { id: 9, source: "Divide 0.1" },
          { id: 10, source: "Divide 0.1 with Overflow" },
          { id: 11, source: "Modulo" },
          { id: 12, source: "Bitwise AND" },
          { id: 13, source: "Bitwise OR" },
          { id: 14, source: "Bitwise XOR" },
          { id: 15, source: "Left SHIFT" },
          { id: 16, source: "Right SHIFT" },
          { id: 17, source: "Logical AND" },
          { id: 18, source: "Logical OR" },
          { id: 19, source: "Logical XOR" },
          { id: 20, source: "IF <" },
          { id: 21, source: "IF <=" },
          { id: 22, source: "IF >" },
          { id: 23, source: "IF >=" },
          { id: 24, source: "IF =" },
          { id: 25, source: "IF <>" },
          { id: 26, source: "Flipflop" },
          { id: 27, source: "Raising value does invert" },
          { id: 28, source: "Falling value does invert" },
          { id: 29, source: "Track & Hold" },
          { id: 30, source: "Sample & Hold" },
          { id: 31, source: "Pass A if B is true" },
          { id: 32, source: "Count" },
          { id: 33, source: "Logical Invert" },
          { id: 34, source: "Bitwise Invert" },
          { id: 35, source: "Right Shift with carry" },
          { id: 36, source: "Left Shift with carry" },
          { id: 37, source: "Increment" },
          { id: 38, source: "Decrement" },
          { id: 39, source: "MIN" },
          { id: 40, source: "MAX" },
          { id: 41, source: "Average" },
          { id: 42, source: "Pitch To Note" },
          { id: 43, source: "Note To Pitch" },
          { id: 44, source: "Generate Random Value" },
          { id: 45, source: "Range former row between A and B" },
          { id: 46, source: "Force Value to Destination" },
          { id: 65535, source: "----" },
        ],
        parameters: [{ id: 65535, parameter: "----" }],
        // Handle parameters in code.
        // 16 bit word is split in 2 bytes where the MSB is the first operand and the LSB is the 2nd operand
        // Value definition of a operand:
        // = 0..= 9 Constant 0 to 9
        // VA..VP Variables A- P
        // 00..70 Rows 0 - 70
      },
      {
        id: 11,
        category: "Skip",
        sources: genSkipSources(),
        parameters: [{ id: 65535, parameter: "----" }],
        // Handle parameters in code.
        // 16 bit word is split in 2 bytes where the MSB is the first operand and the LSB is the 2nd operand
        // Value definition of a operand:
        // = 0..= 9 Constant 0 to 9
        // VA..VP Variables A- P
        // 00..70 Rows 0 - 70
      },
      {
        id: 12,
        category: "Global",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "Current Main Clock Row" },
          { id: 1, source: "Sequencer Started/Stopped" },
          { id: 2, source: "Clock Input State" },
          { id: 3, source: "Clock Output State" },
          { id: 4, source: "Reset Input State" },
          { id: 5, source: "Reset Output State" },
          { id: 6, source: "Random Value" },
          { id: 7, source: "Clock Tempo/BPM" },
          { id: 8, source: "Sequencer Value" },
          { id: 9, source: "Create Pulse from Command" },
        ],
        parameters: [{ id: 65535, parameter: "----" }],
      },
      {
        id: 13,
        category: "External",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "Keyboard Numpad" },
          { id: 1, source: "Sega Gamepad" },
        ],
        parameters: [{ id: 65535, parameter: "----" }],
        // Handle parameters in code. Different parameters for each of 0, 1
        // Use KeyboardSourceParameters and GamepadSourceParameters

      },
      {
        id: 14,
        category: "Control",
        sources: [
          { id: 65535, source: "----" },
          { id: 0, source: "External X Mapping Rows" },
        ],
        parameters: genControlSourceParameters(),
      },
    ],
    destinationCategories: [
      {
        id: 65535,
        category: "----",
        destinations: [{ id: 65535, destination: "----" }],
        parameters: [{ id: 65535, parameter: "----" }],
      },
      {
        id: 0,
        category: "CV",
        destinations: [
          { id: 65535, destination: "----" },
          { id: 0, destination: "Pitch" },
          { id: 1, destination: "Note" },
        ],
        parameters: genCVDestinationParameters(),
      },
      {
        id: 1,
        category: "Trigger",
        destinations: [
          { id: 65535, destination: "----" },
          { id: 0, destination: "Gate" },
          { id: 1, destination: "Trigger" },
          { id: 2, destination: "Trigger Value" },
          { id: 3, destination: "Trigger Always" },
          { id: 4, destination: "Trigger Value Always" },

        ],
        parameters: genTriggerDestinationParameters(),
      },
      {
        id: 2,
        category: "Track",
        destinations: genTrackDestinations(),
        parameters: [{ id: 65535, parameter: "----" }],
      },
      {
        id: 3,
        category: "Automator",
        destinations: [
          { id: 65535, destination: "----" },
          { id: 0, destination: "Selected Automator Slot 0" },
          { id: 1, destination: "Selected Automator Slot 1" },
          { id: 2, destination: "Selected Automator Slot 2" },
          { id: 3, destination: "Selected Automator Slot 3" },
          { id: 4, destination: "Selected Automator Slot 4" },
          { id: 5, destination: "Selected Automator Slot 5" },
          { id: 6, destination: "Selected Automator Slot 6" },
          { id: 7, destination: "Selected Automator Slot 7" },
        ],
        parameters: [
          { id: 65535, parameter: "----" },
          { id: 0, parameter: "LFO Start" },
          { id: 1, parameter: "LFO Reset" },
          { id: 2, parameter: "LFO Speed" },
          { id: 3, parameter: "LFO Offset" },
          { id: 4, parameter: "LFO Invert" },
          { id: 5, parameter: "LFO Clock Source" },
          { id: 6, parameter: "LFO Amplitude" },
          { id: 7, parameter: "LFO Waveform" },
          { id: 8, parameter: "LFO Bit Rate" },
          { id: 9, parameter: "LFO Phase" },
        ],
      },
      {
        id: 4,
        category: "Envelope",
        destinations: [
          { id: 65535, destination: "----" },
          { id: 0, destination: "Envelope 1" },
          { id: 1, destination: "Envelope 2" },
          { id: 2, destination: "Envelope 3" },
          { id: 3, destination: "Envelope 4" },
          { id: 4, destination: "Envelope 5" },
          { id: 5, destination: "Envelope 6" },
          { id: 6, destination: "Envelope 7" },
          { id: 7, destination: "Envelope 8" },
        ],
        parameters: [
          { id: 65535, parameter: "----" },
          { id: 0, parameter: "Attack" },
          { id: 1, parameter: "Attack Peak" },
          { id: 2, parameter: "Decay" },
          { id: 3, parameter: "Sustain" },
          { id: 4, parameter: "Release" },
          { id: 5, parameter: "Offset" },
          { id: 6, parameter: "Gate" },
          { id: 7, parameter: "Fire" },
          { id: 8, parameter: "Toggle" },
        ],
      },
      {
        id: 5,
        category: "MIDI CC",
        destinations: genMidiDeviceChannelDestinations(),
        parameters: genMidiControllerParameters(),
        // Handle in code
        // 128 - 10127 Midi NRPN Controller 0-9999

      },
      {
        id: 6,
        category: "MIDI NRPN",
        destinations: [
          { id: 65535, destination: "----" },
          { id: 0, destination: "I2CA SET.CV Slew" },
          { id: 1, destination: "I2CA SET.CV NoSlew" },
          { id: 2, destination: "I2CA SET.CV NoSlew X" },
          { id: 3, destination: "I2CA SET.TR" },
          { id: 4, destination: "I2CA SET.CV Slew" },
          { id: 5, destination: "I2CA SET.CV NoSlew" },
          { id: 6, destination: "I2CA SET.CV NoSlew X" },
          { id: 7, destination: "I2CA SET.TR" },
        ],
        parameters: genI2cPortParameters(),
      },
      {
        id: 7,
        category: "Audio",
        destinations: [
          { id: 65535, destination: "----" },
          { id: 0, destination: "Audio Part/Channel/Operator 1" },
          { id: 1, destination: "Audio Part/Channel/Operator 2" },
          { id: 2, destination: "Audio Part/Channel/Operator 3" },
          { id: 3, destination: "Audio Part/Channel/Operator 4" },
        ],
        parameters: [
          { id: 65535, parameter: "----" },
          { id: 0, parameter: "Pitch" },
          { id: 1, parameter: "Note" },
          { id: 2, parameter: "Gate" },
          { id: 3, parameter: "Start/Stop Wave" },
          { id: 4, parameter: "Sample/Waveform" },
          { id: 5, parameter: "Offset" },
          { id: 6, parameter: "Backwards" },
          { id: 7, parameter: "Delay Type" },
          { id: 8, parameter: "Delay Time" },
          { id: 9, parameter: "Delay Send" },
          { id: 10, parameter: "Delay Feedback" },
          { id: 11, parameter: "FM Boost" },
          { id: 12, parameter: "Volume" },
          { id: 13, parameter: "Glide" },
          { id: 14, parameter: "Mute" },
          { id: 15, parameter: "Clone Notes" },
          { id: 16, parameter: "Note Coarse" },
          { id: 17, parameter: "Fine Coarse" },
          { id: 18, parameter: "Modulation Source" },
          { id: 19, parameter: "PWM" },
          { id: 20, parameter: "Wave Folder" },
          { id: 21, parameter: "Bit Crusher" },
          { id: 22, parameter: "Distortion" },
        ],
      },
      {
        id: 8,
        category: "Variable",
        destinations: genVariableDestinations(),
        parameters: [
          { id: 65535, parameter: "----" },
          { id: 0, parameter: "Set Variable/Row" },
          { id: 1, parameter: "Reset Variable/Row if Source == true" },
        ],
      },
      {
        id: 9,
        category: "Random Range",
        destinations: genRandomRangeDestinations(),
        parameters: [
          { id: 65535, parameter: "----" },
          { id: 0, parameter: "Minimum Range" },
          { id: 1, parameter: "Maximum Range" },
        ],
      },
      {
        id: 10,
        category: "Global",
        destinations: [
          { id: 65535, destination: "----" },
          { id: 0, destination: "Transpose" },
          { id: 1, destination: "Swing" },
          { id: 2, destination: "Tempo/BPM" },
          { id: 3, destination: "Master Clock Steps" },
          { id: 4, destination: "Scale" },
          { id: 5, destination: "Scale Keynote" },
          { id: 6, destination: "Resync All Tracks" },
          { id: 7, destination: "Reset Player" },
          { id: 8, destination: "Row as Midi Record Source" },
          { id: 9, destination: "Buttons" },
          { id: 10, destination: "Screens" },
          { id: 11, destination: "Modes" },
        ],
        parameters: [{ id: 65535, parameter: "----" }],
        // Handle parameters in code. Different parameters for each of 9, 10, 11
        // Use GlobalButtonsDestinationParameters, GlobalScreensDestinationParameters, and GlobalModesDestinationParameters
      },
      {
        id: 11,
        category: "CV16",
        destinations: genCV16Destinations(),
        parameters: genCV16DestinationParameters(),
      },
      {
        id: 12,
        category: "Table",
        destinations: genTableDestinations(),
        parameters: [
          { id: 65535, parameter: "----" },
          { id: 0, parameter: "Speed" },
          { id: 1, parameter: "Type" },
          { id: 2, parameter: "Quantize" },
          { id: 3, parameter: "Set Chord" },
          { id: 4, parameter: "Range Low" },
          { id: 5, parameter: "Range High" },
          { id: 6, parameter: "Set Preset" },
          { id: 7, parameter: "Add Tick" },
        ],
      },
      {
        id: 13,
        category: "MIDI Note",
        destinations: genMidiDeviceChannelDestinations(false),
        parameters: [
          { id: 65535, parameter: "----" },
          { id: 0, parameter: "Note On" },
          { id: 1, parameter: "Note Off" },
          { id: 2, parameter: "Note OnOff" },
          { id: 3, parameter: "Pitch Bend" },
        ],
      },
    ],
  },
};

const keyboardSourceParameters = [
  { id: 65535, parameter: "----" },
  { id: 0, parameter: "Keyboard Numpad 0" },
  { id: 1, parameter: "Keyboard Numpad 1" },
  { id: 2, parameter: "Keyboard Numpad 2" },
  { id: 3, parameter: "Keyboard Numpad 3" },
  { id: 4, parameter: "Keyboard Numpad 4" },
  { id: 5, parameter: "Keyboard Numpad 5" },
  { id: 6, parameter: "Keyboard Numpad 6" },
  { id: 7, parameter: "Keyboard Numpad 7" },
  { id: 8, parameter: "Keyboard Numpad 8" },
  { id: 9, parameter: "Keyboard Numpad 9" },
  { id: 10, parameter: "Keyboard Numpad ." },
]

const segaGamepadSourceParameters = [
  { id: 65535, parameter: "----" },
  { id: 0, parameter: "Sega Gamepad: A" },
  { id: 1, parameter: "Sega Gamepad: B" },
  { id: 2, parameter: "Sega Gamepad: C" },
  { id: 3, parameter: "Sega Gamepad: X" },
  { id: 4, parameter: "Sega Gamepad: Y" },
  { id: 5, parameter: "Sega Gamepad: Z" },
  { id: 6, parameter: "Sega Gamepad: Start" },
  { id: 7, parameter: "Sega Gamepad: Mode" },
  { id: 8, parameter: "Sega Gamepad: Up" },
  { id: 9, parameter: "Sega Gamepad: Down" },
  { id: 10, parameter: "Sega Gamepad: Left" },
  { id: 11, parameter: "Sega Gamepad: Right" },
]

const globalButtonsDestinationParameters = [
  { id: 65535, parameter: "----" },
  { id: 0, parameter: "Sequencer/Mark" },
  { id: 1, parameter: "Pattern/Copy" },
  { id: 2, parameter: "Patch/Delete" },
  { id: 3, parameter: "Table/Record" },
  { id: 4, parameter: "Automate/Nerd" },
  { id: 5, parameter: "Project/Setup" },
  { id: 6, parameter: "Start" },
  { id: 7, parameter: "Stop" },
  { id: 8, parameter: "Shift" },
  { id: 9, parameter: "OK" },
  { id: 10, parameter: "Down" },
  { id: 11, parameter: "Up" },
  { id: 12, parameter: "Cursor Up" },
  { id: 13, parameter: "Cursor Down" },
  { id: 14, parameter: "Cursor Left" },
  { id: 15, parameter: "Cursor Right" },
];

const globalScreensDestinationParameters = [
  { id: 65535, parameter: "----" },
  { id: 0, parameter: "Sequencer Screen" },
  { id: 1, parameter: "Pattern Screen" },
  { id: 2, parameter: "Patch Screen" },
  { id: 3, parameter: "Table Screen" },
  { id: 4, parameter: "Current Values Screen" },
  { id: 5, parameter: "Automator Screen" },
  { id: 6, parameter: "Envelope Screen" },
  { id: 7, parameter: "Track Setup Screen" },
  { id: 8, parameter: "Random FX Screen" },
  { id: 9, parameter: "Mappings Screen" },
  { id: 10, parameter: "Variable Screen" },
  { id: 11, parameter: "Scaling Screen" },
  { id: 12, parameter: "Nerd Menu" },
  { id: 13, parameter: "Project Screen" },
  { id: 14, parameter: "Setup Screen" },
  { id: 15, parameter: "Sample Select Screen" },
  { id: 16, parameter: "Record Setup Screen" },
  { id: 17, parameter: "Midi/I2C Setup Screen" },
  { id: 18, parameter: "Screen Saver" },
  { id: 19, parameter: "Track Assign Screen" },
  { id: 20, parameter: "Load Project" },
  { id: 21, parameter: "Save Project" },
];

const globalModesDestinationParameters = [
  { id: 65535, parameter: "----" },
  { id: 0, parameter: "Edit Mode" },
  { id: 1, parameter: "Record Mode" },
];

const MAPPING_COUNT = 70;

function decodeByteParameters(arg1) {
  if (arg1 === 255) {
    return `----`;
  }
  if (arg1 >= 0 && arg1 <= 9) {
    return `Constant ${arg1}`;
  }
  if (arg1 >= 10 && arg1 <= 25) {
    return `Variable ${String.fromCharCode(55 + arg1)}`;
  }
  if (arg1 >= 26 && arg1 <= 75) {
    return `Row ${arg1 - 26}`;
  }
  if (arg1 > 75) {
    return `Unexpected Value`;
  }
}

// GENERATE JSON
// const mapjson = JSON.stringify(mappingConfig);
// console.log(mapjson);

registerFileType((fileExt, filePath, fileData) => {
  if (fileExt === "map" || fileExt === "MAP") {
    const headerArray = fileData.getBytesAt(0, 15);
    const header = String.fromCharCode(...headerArray);
    if (header === "NerdSEQ Mapping") {
      return true;
    }
  }
  return false;
});

const MIDI_RPN_SOURCE_CATEGORY_ID = 7;
const VAR_SOURCE_CATEGORY_ID = 9;
const CALC_SOURCE_CATEGORY_ID = 10;
const SKIP_SOURCE_CATEGORY_ID = 11;
const EXTERNAL_SOURCE_CATEGORY_ID = 13;

const KEYBOARD_EXTERNAL_SOURCE_ID = 0;
const SEGA_GAMEPAD_EXTERNAL_SOURCE_ID = 1;

const MIDI_CC_DESTINATION_CATEGORY_ID = 5;
const GLOBAL_DESTINATION_CATEGORY_ID = 10;

const GLOBAL_BUTTONS_DESTINATION_ID = 9;
const GLOBAL_SCREENS_DESTINATION_ID = 10;
const GLOBAL_MODES_DESTINATION_ID = 11;

registerParser(() => {
  read(16);
  addRow("Header", getStringValue(), "Mapping File Header");

  read(1);
  addRow("Major Version", getNumberValue(), "Major Firmware Version Number");

  read(1);
  addRow("Minor Version", getNumberValue(), "Minor Firmware Version Number");

  read(12);
  addRow("Filename", getStringValue(), "Mapping File Name");

  read(40);
  addRow("UNUSED", "", "Reserved for future settings");

  for (let i = 0; i < MAPPING_COUNT; i++) {
    readRowWithDetails(`Line ${i}`, () => {
      read(2);

      const sourceCategoryId = getNumberValue();
      const sourceCategory = mappingConfig.mappings.sourceCategories.find((c) => c.id === sourceCategoryId);

      addRow("Source Category", sourceCategoryId, sourceCategory?.category ?? "Unknown Source Category");

      read(2);

      const sourceId = getNumberValue();

      addRow("Source", sourceId, sourceCategory?.sources.find((s) => s.id === sourceId)?.source ?? "Unknown Source");

      switch (sourceCategoryId) {
        case MIDI_RPN_SOURCE_CATEGORY_ID:
          {
            read(2);

            const sourceParameterValue = getNumberValue();

            if (sourceParameterValue === 65535) {
              addRow("Source Parameter", 65535, "----");
              break;
            }

            if (sourceParameterValue > 9999) {
              addRow("Source Parameter", sourceParameterValue, "Unexpected Value");
              break;
            }

            addRow("Source Parameter", sourceParameterValue, `NPRN Controller #${sourceParameterValue}}`);

            break;
          }
        case VAR_SOURCE_CATEGORY_ID:
          {
            read(2);

            const sourceParameterValue = getNumberValue();

            if (sourceParameterValue === 0) {
              addRow("Source Parameter", 0, `Set Variable/Row to ${sourceParameterValue - 1}`);
              break;
            }

            if (sourceParameterValue === 65535) {
              addRow("Source Parameter", 65535, "----");
              break;
            }

            if (sourceParameterValue > 4095) {
              addRow("Source Parameter", sourceParameterValue, "Unexpected Value");
              break;
            }

            addRow("Source Parameter", sourceParameterValue, `Set Variable/Row to ${(sourceParameterValue - 1).toString(16)}h (${sourceParameterValue - 1})`);
            break;

          }
        case CALC_SOURCE_CATEGORY_ID:
          {
            read(1);
            const arg1 = getNumberValue();
            addRow("Source Parameter 1", arg1, decodeByteParameters(arg1));

            read(1);
            const arg2 = getNumberValue();
            addRow("Source Parameter 2", arg2, decodeByteParameters(arg2));

            break;
          }
        case SKIP_SOURCE_CATEGORY_ID:
          {
            read(1);
            const arg1 = getNumberValue();
            addRow("Source Parameter 1", arg1, decodeByteParameters(arg1));

            read(1);
            const arg2 = getNumberValue();
            addRow("Source Parameter 2", arg2, decodeByteParameters(arg2));

            break;
          }
        case EXTERNAL_SOURCE_CATEGORY_ID:
          {
            read(2);

            const sourceParameterId = getNumberValue();

            switch (sourceId) {
              case 65535:
                addRow("Source Parameter", sourceParameterId, "----");
              case KEYBOARD_EXTERNAL_SOURCE_ID:
                addRow("Source Parameter", sourceParameterId, keyboardSourceParameters.find((p) => p.id === sourceParameterId)?.parameter ?? "Unknown Source Parameter");
                break;
              case SEGA_GAMEPAD_EXTERNAL_SOURCE_ID:
                addRow("Source Parameter", sourceParameterId, segaGamepadSourceParameters.find((p) => p.id === sourceParameterId)?.parameter ?? "Unknown Source Parameter");
                break;
              default:
                addRow("Source Parameter", sourceParameterId, "Unknown Source Parameter");
                break;
            }
            break;
          }
        default:
          {
            read(2);
            const sourceParameterId = getNumberValue();
            addRow("Source Parameter", sourceParameterId, sourceCategory?.parameters.find((o) => o.id === sourceParameterId)?.parameter ?? "Unknown Source Parameter");
          }
      }

      read(2);

      const destinationCategoryId = getNumberValue();
      const destinationCategory = mappingConfig.mappings.destinationCategories.find((c) => c.id === destinationCategoryId);

      addRow(
        "Destination Category",
        destinationCategoryId,
        destinationCategory?.category ?? "Unknown Destination Category"
      );

      read(2);

      const destinationId = getNumberValue();
      addRow("Destination", destinationId, destinationCategory?.destinations.find((d) => d.id === destinationId)?.destination ?? "Unknown Destination");

      read(2);
      const destinationParameterValue = getNumberValue();

      switch (destinationCategoryId) {
        case GLOBAL_DESTINATION_CATEGORY_ID:
          {
            switch (destinationId) {
              case GLOBAL_BUTTONS_DESTINATION_ID:
                addRow("Destination Parameter", destinationParameterValue, globalButtonsDestinationParameters.find((p) => p.id === destinationParameterValue)?.parameter ?? "Unknown Destination Parameter");
                break;
              case GLOBAL_SCREENS_DESTINATION_ID:
                addRow("Destination Parameter", destinationParameterValue, globalScreensDestinationParameters.find((p) => p.id === destinationParameterValue)?.parameter ?? "Unknown Destination Parameter");
                break;
              case GLOBAL_MODES_DESTINATION_ID:
                addRow("Destination Parameter", destinationParameterValue, globalModesDestinationParameters.find((p) => p.id === destinationParameterValue)?.parameter ?? "Unknown Destination Parameter");
                break;
              default:
                addRow("Destination Parameter", destinationParameterValue, "Unknown Destination Parameter");
                break;
            }
          }
        case MIDI_CC_DESTINATION_CATEGORY_ID:
          {
            if (destinationParameterValue >= 128 && destinationParameterValue <= 10127) {
              addRow("Destination Parameter", destinationParameterId, `Midi NRPN Controller #${destinationParameterValue - 128}}`);
              break;
            }

            if (destinationParameterValue > 10127 || destinationParameterValue !== 65535) {
              addRow("Destination Parameter", destinationParameterValue, "Invalid Destination Parameter");
              break;
            }
            // Should fall through to default if none of the above are true
          }
        default:
          {
            addRow("Destination Parameter", destinationParameterValue, destinationCategory?.parameters.find((o) => o.id === destinationParameterValue)?.parameter ?? "Unknown Destination Parameter");
          }
      }

      read(8);
      addRow("Unused", "", "");
    });
  }
}); 
