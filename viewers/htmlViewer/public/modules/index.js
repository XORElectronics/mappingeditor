var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as parsers from './parsers.js';
import * as formatters from './formatters.js';
var fileInput = document.getElementById('fileInput');
var buttonDownloadHtml = document.getElementById('buttonDownloadHtml');
var buttonDownloadMd = document.getElementById('buttonDownloadMd');
var buttonDownloadJson = document.getElementById('buttonDownloadJson');
var buttonDownloadMap = document.getElementById('buttonDownloadMap');
var buttonReset = document.getElementById('buttonReset');
var mappingFileSelectContainer = document.getElementById('mappingFileSelectContainer');
var downloadActionsContainer = document.getElementById('downloadActionsContainer');
var outPutDiv = document.getElementById('output');
fileInput.addEventListener('change', readFile);
buttonDownloadHtml.addEventListener('click', downloadHtml);
buttonDownloadMd.addEventListener('click', downloadMarkdown);
buttonDownloadJson.addEventListener('click', downloadJson);
buttonDownloadMap.addEventListener('click', downloadMap);
buttonReset.addEventListener('click', reset);
var mapDoc;
function readFile() {
    var _a;
    var file = (_a = fileInput === null || fileInput === void 0 ? void 0 : fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file) {
        return alert('Please select a file!');
    }
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function (e) {
        return __awaiter(this, void 0, void 0, function () {
            var fileData, mapDocStr;
            return __generator(this, function (_a) {
                fileData = new Uint8Array(e.target.result);
                mapDoc = parsers.MappingDocumentParser.parse(fileData);
                mapDocStr = formatters.toHtml(mapDoc, true);
                outPutDiv.innerHTML = "<div>".concat(mapDocStr, "</div>");
                mappingFileSelectContainer.classList.add('d-none');
                downloadActionsContainer.classList.remove('d-none');
                return [2 /*return*/];
            });
        });
    };
    reader.onerror = function (e) {
        outPutDiv.innerHTML = "<div>An error occurred! Error message : ".concat(e, "</div>");
    };
}
function downloadFile(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName; // name of the file to be downloaded
    link.click();
    URL.revokeObjectURL(url); // free up storage--remove the file blobs
}
function downloadHtml() {
    var output = formatters.toHtml(mapDoc);
    var blob = new Blob([output], { type: "text/html" });
    downloadFile(blob, "".concat(mapDoc.header.fileName, ".html"));
}
function downloadMarkdown() {
    var output = formatters.toMarkdown(mapDoc);
    var blob = new Blob([output], { type: "text/markdown" });
    downloadFile(blob, "".concat(mapDoc.header.fileName, ".md"));
}
function downloadJson() {
    var output = formatters.toJson(mapDoc);
    var blob = new Blob([output], { type: "application/json" });
    downloadFile(blob, "".concat(mapDoc.header.fileName, ".json"));
}
function downloadMap() {
    var blob = formatters.toBlob(mapDoc);
    downloadFile(blob, "".concat(mapDoc.header.fileName, ".map"));
}
function reset() {
    mappingFileSelectContainer.classList.remove('d-none');
    downloadActionsContainer.classList.add('d-none');
    outPutDiv.innerHTML = '';
    fileInput.value = '';
}
//# sourceMappingURL=index.js.map