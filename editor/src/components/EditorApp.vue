<script setup lang="ts">
import _ from "lodash";
import { ref } from 'vue';
import {
  DataModel, type MappingTuple, type MappingType, EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION, MIDI_NRPN_SOURCE_TYPE_KEY, CALC_SOURCE_TYPE_KEY, SKIP_SOURCE_TYPE_KEY,
  EXTERNAL_SOURCE_TYPE_KEY, keyboardSourceExtras, segaGamepadSourceExtras, globalButtonsDestinationExtras, globalModesDestinationExtras, globalScreensDestinationExtras,
  KEYBOARD_EXTERNAL_SOURCE_FUNCTION_KEY, SEGA_GAMEPAD_EXTERNAL_SOURCE_FUNCTION_KEY, VAR_SOURCE_TYPE_KEY, GLOBAL_DESTINATION_TYPE_KEY, GLOBAL_BUTTONS_DESTINATION_FUNCTION_KEY,
  GLOBAL_SCREENS_DESTINATION_FUNCTION_KEY, GLOBAL_MODES_DESTINATION_FUNCTION_KEY, MIDI_CC_DESTINATION_TYPE_KEY
} from '../modules/dataModel';
import { MappingDocument, Row as MappingRow, Source, SourceType, SourceFunction, SourceExtra, DestinationType, DestinationFunction, DestinationExtra, Destination, Header } from '../modules/documentModel';
import { MappingDocumentParser } from '../modules/parsers';
import * as formatters from '../modules/formatters';
import schema from '../modules/documentModel.schema.json';

import Ajv from 'ajv';

import CalcSkipSourceExtra from './CalcSkipSourceExtra.vue';
import NprnSourceExtra from './NprnSourceExtra.vue';
import VariableSourceExtra from './VariableSourceExtra.vue';
import MidiCcDestinationExtra from './MidiCcDestinationExtra.vue';

const mappingDocument = ref<MappingDocument>(new MappingDocument());
const fileInput = ref<HTMLInputElement | null>(null);

const currentlySelectedSourceTypes = ref(new Array<MappingType>());
const currentlySelectedDestinationTypes = ref(new Array<MappingType>());

function readFile() {
  const file = fileInput.value?.files?.[0];

  if (!file) {
    alert('No file uploaded!');
    return;
  }

  const reader = new FileReader();
  const fileExtension = file.name.split('.').pop();

  switch (fileExtension) {

    case 'map':
      reader.readAsArrayBuffer(file);
      reader.onload = async function (e: any) {
        const fileData = new Uint8Array(e.target.result);
        mappingDocument.value = MappingDocumentParser.parse(fileData);
        init();
      };
      break;

    case 'json':
      reader.readAsText(file);
      reader.onload = function (e: any) {
        const fileData = e.target.result;
        const jsonData = JSON.parse(fileData);

        // Validate the JSON file against the schema
        const ajv = () => new Ajv({ allErrors: true });
        const validate = ajv().compile(schema);
        const isValid = validate(jsonData);
        if (!isValid) {
          alert('Invalid JSON file! ');
          console.error(validate.errors);
          return;
        }

        const mappingDoc = _.merge(new MappingDocument(), jsonData); 

        mappingDocument.value = mappingDoc;;
        init();
      };
      break;

    default:
      alert('Invalid file type!');
      reader.onerror = function (e: any) {
        alert('Error : ' + e.target.error.name);
      }
  }
}

function reset() {
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  mappingDocument.value = new MappingDocument();
  currentlySelectedSourceTypes.value = new Array<MappingType>();
  currentlySelectedDestinationTypes.value = new Array<MappingType>();;
}

function init() {
  for (let i = 0; i < mappingDocument.value.rows.length; i++) {
    const row = mappingDocument.value.rows[i];
    currentlySelectedSourceTypes.value[i] = DataModel.sourceTypes.find(x => x.key === row.source.type.key) as MappingType;
    currentlySelectedDestinationTypes.value[i] = DataModel.destinationTypes.find(x => x.key === row.destination.type.key) as MappingType;
  }
}

function sourceTypeSelectionChanged(event: Event, rowIndex: number) {
  const sourceTypeSelectElement = event.target as HTMLSelectElement;
  const selectedSourceTypeKey = parseInt(sourceTypeSelectElement.value);
  const selectedSourceType = DataModel.sourceTypes.find(x => x.key === selectedSourceTypeKey) as MappingType;
  currentlySelectedSourceTypes.value[rowIndex] = selectedSourceType;
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  const newSourceType = new SourceType(selectedSourceTypeKey, selectedSourceType.abbr, selectedSourceType.description);
  const newSourceFunction = new SourceFunction(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
  const newSourceExtra = new SourceExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
  row.source = new Source(newSourceType, newSourceFunction, newSourceExtra);
}

function sourceFunctionSelectionChanged(event: Event, rowIndex: number) {
  const sourceFunctionSelectElement = event.target as HTMLSelectElement;
  const selectedSourceFunctionKey = parseInt(sourceFunctionSelectElement.value);
  const selectedSourceFunction = currentlySelectedSourceTypes.value[rowIndex].functions.find(x => x.key === selectedSourceFunctionKey) as MappingTuple;
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow
  row.source.function = new SourceFunction(selectedSourceFunctionKey, selectedSourceFunction.abbr, selectedSourceFunction.description);
  row.source.extra = new SourceExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
}

enum SourceExtraVariant {
  DEFAULT,
  EXTERNAL_KEYBOARD,
  EXTERNAL_SEGA_GAMEPAD,
}

function sourceExtraSelectionChanged(event: Event, rowIndex: number, extraVariant: SourceExtraVariant = SourceExtraVariant.DEFAULT) {
  const sourceExtraSelectElement = event.target as HTMLSelectElement;
  const selectedSourceExtraKey = parseInt(sourceExtraSelectElement.value);
  let selectedSourceExtra: MappingTuple;

  switch (extraVariant) {
    case SourceExtraVariant.EXTERNAL_KEYBOARD:
      selectedSourceExtra = keyboardSourceExtras.find(x => x.key === selectedSourceExtraKey) as MappingTuple;
      break;
    case SourceExtraVariant.EXTERNAL_SEGA_GAMEPAD:
      selectedSourceExtra = segaGamepadSourceExtras.find(x => x.key === selectedSourceExtraKey) as MappingTuple;
      break;
    default:
      selectedSourceExtra = currentlySelectedSourceTypes.value[rowIndex].extras.find(x => x.key === selectedSourceExtraKey) as MappingTuple;
      break;
  }

  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  row.source.extra = new SourceExtra(selectedSourceExtraKey, selectedSourceExtra.abbr, selectedSourceExtra.description);
}

function destinationTypeSelectionChanged(event: Event, rowIndex: number) {
  const destinationTypeSelectElement = event.target as HTMLSelectElement;
  const selectedDestinationTypeKey = parseInt(destinationTypeSelectElement.value);
  const selectedDestinationType = DataModel.destinationTypes.find(x => x.key === selectedDestinationTypeKey) as MappingType;
  currentlySelectedDestinationTypes.value[rowIndex] = selectedDestinationType;
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  const newDestinationType = new DestinationType(selectedDestinationTypeKey, selectedDestinationType.abbr, selectedDestinationType.description);
  const newDestinationFunction = new DestinationFunction(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
  const newDestinationExtra = new DestinationExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
  row.destination = new Destination(newDestinationType, newDestinationFunction, newDestinationExtra);
}

function destinationFunctionSelectionChanged(event: Event, rowIndex: number, isInit: boolean = false) {
  const destinationFunctionSelectElement = event.target as HTMLSelectElement;
  const selectedDestinationFunctionKey = parseInt(destinationFunctionSelectElement.value);
  const selectedDestinationFunction = currentlySelectedDestinationTypes.value[rowIndex].functions.find(x => x.key === selectedDestinationFunctionKey) as MappingTuple;
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  row.destination.function = new DestinationFunction(selectedDestinationFunctionKey, selectedDestinationFunction.abbr, selectedDestinationFunction.description);
  row.destination.extra = new DestinationExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
}

enum DestinationExtraVariant {
  DEFAULT,
  GLOBAL_BUTTONS,
  GLOBAL_SCREENS,
  GLOBAL_MODES,
  MIDI_CC
}

function destinationExtraSelectionChanged(event: Event, rowIndex: number, isInit: boolean = false, extraVariant: DestinationExtraVariant = DestinationExtraVariant.DEFAULT) {
  const destinationExtraSelectElement = event.target as HTMLSelectElement;
  const selectedDestinationExtraKey = parseInt(destinationExtraSelectElement.value);
  let selectedDestinationExtra: MappingTuple;
  switch (extraVariant) {
    case DestinationExtraVariant.GLOBAL_BUTTONS:
      selectedDestinationExtra = globalButtonsDestinationExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.GLOBAL_SCREENS:
      selectedDestinationExtra = globalScreensDestinationExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.GLOBAL_MODES:
      selectedDestinationExtra = globalModesDestinationExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    default:
      selectedDestinationExtra = currentlySelectedDestinationTypes.value[rowIndex].extras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
  }
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  row.destination.extra = new DestinationExtra(selectedDestinationExtraKey, selectedDestinationExtra.abbr, selectedDestinationExtra.description);
}

function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName; // name of the file to be downloaded
  link.click();

  URL.revokeObjectURL(url); // free up storage--remove the file blobs
}

function downloadHtml() {
  const output = formatters.toHtml(mappingDocument.value as MappingDocument);
  const blob = new Blob([output], { type: "text/html" });
  downloadFile(blob, `${mappingDocument.value.header.fileName}.html`);
}

function downloadMarkdown(useAbbrs: boolean = false) {
  const output = formatters.toMarkdown(mappingDocument.value as MappingDocument, useAbbrs);
  const blob = new Blob([output], { type: "text/markdown" });
  downloadFile(blob, `${mappingDocument.value.header.fileName}.md`);
}

function downloadJson() {
  const output = formatters.toJson(mappingDocument.value as MappingDocument);
  const blob = new Blob([output], { type: "application/json" });
  downloadFile(blob, `${mappingDocument.value.header.fileName}.json`);
}

function downloadMap() {
  const blob = formatters.toBlob(mappingDocument.value as MappingDocument);
  downloadFile(blob, `${mappingDocument.value.header.fileName}.map`);
}

</script>
<template>
  <header>
    <div class="pt-5">
      <img alt="NerdSeq Logo" class="logo" src="/src/assets/images/nerdseq-logo.png" height="100" />
      <h2 class="pt-3">Mapping File Editor</h2>
    </div>
  </header>
  <main>
    <div id="mappingFileSelectContainer" class="pt-3">
      <label id="fileInputLabel" for="fileInput" class="btn btn-info border-dark" title="Open a .MAP or .JSON file.">Open
        Mapping File</label>
      <input id="fileInput" class="d-none" type="file" accept=".map, .json" ref="fileInput" @change="readFile" />
      <button id="buttonReset" type="button" class="btn btn-info border-dark" @click="reset">Reset</button>
    </div>
    <div id="downloadActionsContainer" class="pt-3">
      <div class="header-label">Save as:</div>
      <div>
        <button id="buttonDownloadHtml" type="button" @click="downloadHtml" class="btn btn-info border-dark">
          HTML</button>
        <button id="buttonDownloadMd" type="button" @click="downloadMarkdown(false)"
          class="btn btn-info border-dark">Markdown</button>
        <button id="buttonDownloadMd" type="button" @click="downloadMarkdown(true)" class="btn btn-info border-dark">NS
          Screens (MD)</button>
        <button id="buttonDownloadJson" type="button" @click="downloadJson" class="btn btn-info border-dark">
          JSON</button>
        <button id="buttonDownloadMap" type="button" @click="downloadMap" class="btn btn-info border-dark">
          MAP</button>
      </div>
    </div>
    <div id="docEditor" class="pt-3">
      <div class="pt-2">
        <div class="header-label">Header Text:</div>
        <div class="header-val">{{ mappingDocument.header.headerText }}</div>
      </div>
      <div class="pt-2">
        <div class="header-label">Firmware Major Version:</div>
        <div class="header-val">{{ mappingDocument.header.majorVersion }}</div>
      </div>
      <div class="pt-2">
        <div class="header-label">Firmware Minor Version:</div>
        <div class="header-val">{{ mappingDocument.header.minorVersion }}</div>
      </div>
      <div class="pt-2">
        <div class="header-label">File Name:</div>
        <div class="header-val"><input type="text" id="input" v-model="mappingDocument.header.fileName" /></div>
      </div>
      <div id="rowsGridContainerHeader" class="pt-3">
        <div>Row</div>
        <div>Source Type</div>
        <div>Source Function</div>
        <div>Source Extra(s)</div>
        <div>Destination Type</div>
        <div>Destination Function</div>
        <div>Destination Extra</div>
      </div>
      <div id="rowsGridContainer" v-for="row in mappingDocument.rows" :key="row.index">

        <div class="gridItem rowIndex pt-1">{{ row.index }}</div>

        <div class="gridItem">
          <select :value="row.source.type.key" @change="sourceTypeSelectionChanged($event, row.index)"
            :title="row.source.type.abbr" class="form-select pt-1"
            :class="{ 'select-empty': row.source.type.key === EMPTY_KEY }">

            <option v-for="sourceType in DataModel.sourceTypes" :key="sourceType.key" :value="sourceType.key"
              :title="sourceType.abbr">
              {{ sourceType.description }}
            </option>
          </select>
        </div>

        <div class="gridItem">
          <label class="label-empty border-dark pt-1" v-if="row.source.type.key === EMPTY_KEY">{{ EMPTY_DESCRIPTION
          }}</label>

          <select v-else :value="row.source.function.key" @change="sourceFunctionSelectionChanged($event, row.index)"
            :title="row.source.function.abbr" class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.source.function.key === EMPTY_KEY }">

            <option v-for="func in currentlySelectedSourceTypes[row.index]?.functions" :key="func.key" :value="func.key"
              :title="func.abbr">
              {{ func.description }}</option>
          </select>
        </div>

        <div class="gridItem">
          <!-- If no source type is selected then just show a label -->
          <label class="label-empty border-dark pt-1" v-if="row.source.type.key === EMPTY_KEY">{{ EMPTY_DESCRIPTION
          }}</label>

          <!-- Else handel all the edge cases -->

          <!-- Calc or Skip Source Type -->
          <CalcSkipSourceExtra v-model="row.source.extra as SourceExtra"
            v-else-if="row.source.type.key === CALC_SOURCE_TYPE_KEY || row.source.type.key === SKIP_SOURCE_TYPE_KEY" />

          <!-- NRPN Source Type -->
          <NprnSourceExtra v-model="row.source.extra as SourceExtra"
            v-else-if="row.source.type.key === MIDI_NRPN_SOURCE_TYPE_KEY" />

          <!-- Variable Source Type -->
          <VariableSourceExtra v-model="row.source.extra as SourceExtra"
            v-else-if="row.source.type.key === VAR_SOURCE_TYPE_KEY" />

          <!-- External Source Type, Keyboard Function -->
          <select
            v-else-if="row.source.type.key == EXTERNAL_SOURCE_TYPE_KEY && row.source.function.key == KEYBOARD_EXTERNAL_SOURCE_FUNCTION_KEY"
            :value="row.source.extra.keyOrValue"
            @change="sourceExtraSelectionChanged($event, row.index, SourceExtraVariant.EXTERNAL_KEYBOARD)"
            :title="row.source.extra.abbr" class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.source.extra.keyOrValue === EMPTY_KEY }">

            <option v-for="extra in keyboardSourceExtras" :key="extra.key" :value="extra.key" :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- External Source Type, Sega Gamepad Function  -->
          <select
            v-else-if="row.source.type.key == EXTERNAL_SOURCE_TYPE_KEY && row.source.function.key == SEGA_GAMEPAD_EXTERNAL_SOURCE_FUNCTION_KEY"
            :value="row.source.extra.keyOrValue"
            @change="sourceExtraSelectionChanged($event, row.index, SourceExtraVariant.EXTERNAL_SEGA_GAMEPAD)"
            :title="row.source.extra.abbr" class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.source.extra.keyOrValue === EMPTY_KEY }">

            <option v-for="extra in segaGamepadSourceExtras" :key="extra.key" :value="extra.key" :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- Else show a select with all the extras for this source type -->
          <select v-else :value="row.source.extra.keyOrValue" @change="sourceExtraSelectionChanged($event, row.index)"
            :title="row.source.extra.abbr" class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.source.extra.keyOrValue === EMPTY_KEY }">

            <option v-for="extra in currentlySelectedSourceTypes[row.index]?.extras" :key="extra.key" :value="extra.key"
              :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

        </div>

        <div class="gridItem">
          <select :value="row.destination.type.key" @change="destinationTypeSelectionChanged($event, row.index)"
            :title="row.destination.type.abbr" class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.destination.type.key === EMPTY_KEY }">

            <option v-for="destinationType in DataModel.destinationTypes" :key="destinationType.key"
              :value="destinationType.key" :title="destinationType.abbr">
              {{ destinationType.description }}</option>

          </select>
        </div>

        <div class="gridItem">
          <label class="label-empty border-dark pt-1" v-if="row.destination.type.key === EMPTY_KEY">{{ EMPTY_DESCRIPTION
          }}</label>

          <select v-else :value="row.destination.function.key"
            @change="destinationFunctionSelectionChanged($event, row.index)" :title="row.destination.function.abbr"
            class="form-select border-dark pt-1" :class="{ 'select-empty': row.destination.function.key === EMPTY_KEY }">
            <option v-for="func in currentlySelectedDestinationTypes[row.index]?.functions" :key="func.key"
              :value="func.key" :title="func.abbr">
              {{ func.description }}</option>
          </select>

        </div>

        <div class="gridItem">
          <!-- If no destination type is selected then just show a label -->
          <label class="label-empty border-dark pt-1" v-if="row.destination.type.key === EMPTY_KEY">{{ EMPTY_DESCRIPTION
          }}</label>

          <!-- Else handel all the edge cases -->

          <!-- Midi CC Destination Type -->
          <MidiCcDestinationExtra v-model="row.destination.extra as DestinationExtra"
            v-else-if="row.destination.type.key === MIDI_CC_DESTINATION_TYPE_KEY"
            :midi-cc-extras="currentlySelectedDestinationTypes[row.index]?.extras" />

          <!-- Global Buttons Destination Type -->
          <select
            v-else-if="row.destination.type.key === GLOBAL_DESTINATION_TYPE_KEY && row.destination.function.key === GLOBAL_BUTTONS_DESTINATION_FUNCTION_KEY"
            :value="row.destination.extra.keyOrValue"
            @change="destinationExtraSelectionChanged($event, row.index, false, DestinationExtraVariant.GLOBAL_BUTTONS)"
            :title="row.destination.extra.abbr" class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.destination.extra.keyOrValue === EMPTY_KEY }">
            <option v-for="extra in globalButtonsDestinationExtras" :key="extra.key" :value="extra.key"
              :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- Global Screens Destination Type -->
          <select
            v-else-if="row.destination.type.key === GLOBAL_DESTINATION_TYPE_KEY && row.destination.function.key === GLOBAL_SCREENS_DESTINATION_FUNCTION_KEY"
            :value="row.destination.extra.keyOrValue"
            @change="destinationExtraSelectionChanged($event, row.index, false, DestinationExtraVariant.GLOBAL_SCREENS)"
            :title="row.destination.extra.abbr" class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.destination.extra.keyOrValue === EMPTY_KEY }">
            <option v-for="extra in globalScreensDestinationExtras" :key="extra.key" :value="extra.key"
              :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- Global Modes Destination Type -->
          <select
            v-else-if="row.destination.type.key === GLOBAL_DESTINATION_TYPE_KEY && row.destination.function.key === GLOBAL_MODES_DESTINATION_FUNCTION_KEY"
            :value="row.destination.extra.keyOrValue"
            @change="destinationExtraSelectionChanged($event, row.index, false, DestinationExtraVariant.GLOBAL_MODES)"
            :title="row.destination.extra.abbr" class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.destination.extra.keyOrValue === EMPTY_KEY }">
            <option v-for="extra in globalModesDestinationExtras" :key="extra.key" :value="extra.key" :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- Else show a select with all the extras for this destination type -->
          <select v-else :value="row.destination.extra.keyOrValue"
            @change="destinationExtraSelectionChanged($event, row.index)" :title="row.destination.extra.abbr"
            class="form-select border-dark pt-1"
            :class="{ 'select-empty': row.destination.extra.keyOrValue === EMPTY_KEY }">
            <option v-for="extra in currentlySelectedDestinationTypes[row.index]?.extras" :key="extra.key"
              :value="extra.key" :title="extra.abbr">
              {{ extra.description }}</option>
          </select>
        </div>

        <div class="endCap"></div>
      </div>
      <div id="variablesContainer" class="pt-3"></div>
    </div>
  </main>
</template>

<style scoped>
h2 {
  color: #F1F700;
}

button,
label {
  background-color: #34cc99 !important;
}

#buttonDownloadHtml,
#fileInputLabel {
  border-radius: 5px 0 0 5px;
}

#buttonDownloadMap,
#buttonReset {
  border-radius: 0 5px 5px 0;
}

.header-label {
  display: inline-flex;
  width: 13em;
  font-weight: bold;
}

.header-val {
  display: inline-flex;
  color: #F1F700 !important;
}

.header-val input[type="text"] {
  background-color: #34cc99;
  border-radius: 5px !important;
  padding-left: 0.4em;
}

#rowsGridContainer,
#rowsGridContainerHeader {
  display: grid;
  grid-template-columns: 2em 12em 20em 30em 12em 20em 30em 2em;
  gap: 2px;
}

#rowsGridContainer {
  margin: 0px;
  padding: 1px;
}

#rowsGridContainerHeader {
  font-weight: bold;
  text-align: center;
}

.btn:hover {
  background-color: #F1F700 !important;
  color: black;
}

.rowIndex {
  width: 100%;
  display: inline-block;
  background-color: #34cc99 !important;
  color: black;
  border-radius: 5px 0 0 5px;
  text-align: center;
  font-size: small;
  font-weight: bold;
  padding-bottom: 3px;
}

.gridItem {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gridItem>select {
  background-color: #34cc99;
  color: black;
  height: 100%;
  /* padding-top: 0.7em !important; */
}

.select-empty {
  background-color: grey !important;
  color: black;
}

.endCap {
  width: 100%;
  display: inline-block;
  background-color: #34cc99 !important;
  border-radius: 0 5px 5px 0;
  padding-bottom: 3px;
}

.label-empty {
  display:flex;
  align-items: center;
  background-color: grey !important;
  width: 100%;
  height: 100%;
  color: black !important;
  padding-left: 1.5em;
  padding-bottom: 0.25em;
  display: inline-flex;
}

.debugValue {
  color: red;
  display: inline-flex;
  width: 100px;
  font-size: xx-small;
}

#buttonReset {
  background-color: #cc8534 !important;
}

#buttonReset:hover {
  background-color: red !important;
}
</style>