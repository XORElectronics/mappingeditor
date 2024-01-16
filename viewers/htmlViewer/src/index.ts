import * as parsers from './parsers.js';

const fileInput = document.getElementById('fileInput') as HTMLInputElement;
fileInput.addEventListener('change', readFile);

const outPutDiv = document.getElementById('output') as HTMLDivElement;
const mappingFileSelectContainer = document.getElementById('mappingFileSelectContainer') as HTMLDivElement;
const downloadActionsContainer = document.getElementById('downloadActionsContainer') as HTMLDivElement;

function readFile() {
    const file = fileInput?.files?.[0] as File;
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = function (e : any ) {
        const fileData = new Uint8Array(e.target.result);
        const mapDoc = parsers.MappingDocumentParser.parse(fileData);
        const mapDocStr = mapDoc.toHtml();
        outPutDiv.innerHTML = `<div>${mapDocStr}</div>`;
        mappingFileSelectContainer.classList.add('d-none');
        downloadActionsContainer.classList.remove('d-none');
    }; 
    
    reader.onerror = function (e : any) {
        outPutDiv.innerHTML = `<div>An error occurred! Error message : ${e}</div>`;
    }
}
