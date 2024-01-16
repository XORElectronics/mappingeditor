import * as parsers from './parsers.js';
var fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', readFile);
var outPutDiv = document.getElementById('output');
var mappingFileSelectContainer = document.getElementById('mappingFileSelectContainer');
var downloadActionsContainer = document.getElementById('downloadActionsContainer');
function readFile() {
    var _a;
    var file = (_a = fileInput === null || fileInput === void 0 ? void 0 : fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function (e) {
        var fileData = new Uint8Array(e.target.result);
        var mapDoc = parsers.MappingDocumentParser.parse(fileData);
        var mapDocStr = mapDoc.toHtml();
        outPutDiv.innerHTML = "<div>".concat(mapDocStr, "</div>");
        mappingFileSelectContainer.classList.add('d-none');
        downloadActionsContainer.classList.remove('d-none');
    };
    reader.onerror = function (e) {
        outPutDiv.innerHTML = "<div>An error occurred! Error message : ".concat(e, "</div>");
    };
}
//# sourceMappingURL=index.js.map