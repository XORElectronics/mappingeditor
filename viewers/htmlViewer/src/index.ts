import * as parsers from './parsers.js';
import * as formatters from './formatters.js';
import * as doc from './documentModel.js';

const fileInput = document.getElementById('fileInput') as HTMLInputElement;

const buttonDownloadHtml = document.getElementById('buttonDownloadHtml') as HTMLButtonElement;
const buttonDownloadMd = document.getElementById('buttonDownloadMd') as HTMLButtonElement;
const buttonDownloadJson = document.getElementById('buttonDownloadJson') as HTMLButtonElement;
const buttonDownloadMap = document.getElementById('buttonDownloadMap') as HTMLButtonElement;
const buttonReset = document.getElementById('buttonReset') as HTMLButtonElement;

const mappingFileSelectContainer = document.getElementById('mappingFileSelectContainer') as HTMLDivElement;
const downloadActionsContainer = document.getElementById('downloadActionsContainer') as HTMLDivElement;

const outPutDiv = document.getElementById('output') as HTMLDivElement;

fileInput.addEventListener('change', readFile);
buttonDownloadHtml.addEventListener('click', downloadHtml);
buttonDownloadMd.addEventListener('click', downloadMarkdown);
buttonDownloadJson.addEventListener('click', downloadJson);
buttonDownloadMap.addEventListener('click', downloadMap);
buttonReset.addEventListener('click', reset);

let mapDoc: doc.MappingDocument;

function readFile() {
    const file = fileInput?.files?.[0] as File;
    if (!file) {
        return alert('Please select a file!');
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async function (e: any) {
        const fileData = new Uint8Array(e.target.result);
        mapDoc = parsers.MappingDocumentParser.parse(fileData);
        const mapDocStr = formatters.toHtml(mapDoc, true);
        outPutDiv.innerHTML = `<div>${mapDocStr}</div>`;
        mappingFileSelectContainer.classList.add('d-none');
        downloadActionsContainer.classList.remove('d-none');
    };

    reader.onerror = function (e: any) {
        outPutDiv.innerHTML = `<div>An error occurred! Error message : ${e}</div>`;
    }
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
    const output = formatters.toHtml(mapDoc);
    const blob = new Blob([output], { type: "text/html" });
    downloadFile(blob, `${mapDoc.header.fileName}.html`);
}

function downloadMarkdown() {
    const output = formatters.toMarkdown(mapDoc);
    const blob = new Blob([output], { type: "text/markdown" });
    downloadFile(blob, `${mapDoc.header.fileName}.md`);
}

function downloadJson() {
    const output = formatters.toJson(mapDoc);
    const blob = new Blob([output], { type: "application/json" });
    downloadFile(blob, `${mapDoc.header.fileName}.json`);
}

function downloadMap() {
    const blob = formatters.toBlob(mapDoc);
    downloadFile(blob, `${mapDoc.header.fileName}.map`);
}

function reset() {
    mappingFileSelectContainer.classList.remove('d-none');
    downloadActionsContainer.classList.add('d-none');
    outPutDiv.innerHTML = '';
    fileInput.value = '';
}
