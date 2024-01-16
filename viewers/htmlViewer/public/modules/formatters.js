export function toHtml(document, useBsStyles) {
    if (useBsStyles === void 0) { useBsStyles = false; }
    var output = "<table ".concat(useBsStyles ? "class='table table-dark'" : '', "><tbody>");
    output += "<tr><td>Header Text: </td><td>".concat(document.header.headerText, "</td></tr>");
    output += "<tr><td>Major Version: </td><td>".concat(document.header.majorVersion, "</td></tr>");
    output += "<tr><td>Minor Version: </td><td>".concat(document.header.minorVersion, "</td></tr>");
    output += "<tr><td>FileName: </td><td>".concat(document.header.fileName, "</td></tr>");
    output += "<tr>";
    output += "<table ".concat(useBsStyles ? "class='table table-dark'" : '', ">");
    output += "<thead ".concat(useBsStyles ? "class='thead-dark'" : '', "><tr><th>Index </th><th>Source Type </th><th>Source Function </th><th>Source Extra </th><th>Destination Type </th><th>Destination Function </th><th>Destination Extra </th></tr></thead>");
    output += "<tbody>";
    document.rows.forEach(function (row) {
        output += "<tr>";
        output += "<td>".concat(row.index, "</td>");
        output += "<td>".concat(row.source.type.text, "</td>");
        output += "<td>".concat(row.source.function.text, "</td>");
        output += "<td>".concat(row.source.extra.text, "</td>");
        output += "<td>".concat(row.destination.type.text, "</td>");
        output += "<td>".concat(row.destination.function.text, "</td>");
        output += "<td>".concat(row.destination.extra.text, "</td>");
        output += "</tr>";
    });
    output += "</tbody></table></tr><table ".concat(useBsStyles ? "class='table table-dark'" : '', ">");
    document.variables.forEach(function (variable) {
        output += "<tr><td>".concat(variable.name, ": </td><td>").concat(variable.value, "</td></tr>");
    });
    output += "</tbody></table>";
    return output;
}
export function toMarkdown(document) {
    var output = "# NerdSeq Mapping File\n\n";
    output += "## Header\n\n";
    output += "| Property | Value |\n";
    output += "| --- | --- |\n";
    output += "| Header Text | ".concat(document.header.headerText, " |\n");
    output += "| Major Version | ".concat(document.header.majorVersion, " |\n");
    output += "| Minor Version | ".concat(document.header.minorVersion, " |\n");
    output += "| FileName | ".concat(document.header.fileName, " |\n\n");
    output += "## Rows\n\n";
    output += "| Index | Source Type | Source Function | Source Extra | Destination Type | Destination Function | Destination Extra |\n";
    output += "| --- | --- | --- | --- | --- | --- | --- |\n";
    document.rows.forEach(function (row) {
        output += "| ".concat(row.index, " | ").concat(row.source.type.text, " | ").concat(row.source.function.text, " | ").concat(row.source.extra.text, " | ").concat(row.destination.type.text, " | ").concat(row.destination.function.text, " | ").concat(row.destination.extra.text, " |\n");
    });
    output += "\n## Variables\n\n";
    output += "| Name | Value |\n";
    output += "| --- | --- |\n";
    document.variables.forEach(function (variable) {
        output += "| ".concat(variable.name, " | ").concat(variable.value, " |\n");
    });
    return output;
}
export function toJson(document) {
    return JSON.stringify(document);
}
function numToUint8Array(value) {
    var uint16Array = new Uint16Array([value]);
    var uint8Array = new Uint8Array(uint16Array.length * 2);
    var dataView = new DataView(uint8Array.buffer);
    for (var i = 0; i < uint16Array.length; i++) {
        dataView.setUint16(i * 2, uint16Array[i], true);
    }
    return uint8Array;
}
export function toBlob(document) {
    var HEADER_TEXT_LENGTH = 16;
    var FILE_NAME_LENGTH = 12;
    var HEADER_RESERVED_LENGTH = 40;
    var ROW_UNUSED_LENGTH = 8;
    var UNUSED_FILLER = 0xFF;
    var encoder = new TextEncoder();
    var parts = [];
    // Serialize header
    var encodedHeaderText = encoder.encode(document.header.headerText.padEnd(HEADER_TEXT_LENGTH, '\0')).slice(0, HEADER_TEXT_LENGTH);
    parts.push(encodedHeaderText);
    parts.push(new Uint8Array([document.header.majorVersion]));
    parts.push(new Uint8Array([document.header.minorVersion]));
    var encodedFileName = encoder.encode(document.header.fileName.padEnd(FILE_NAME_LENGTH, '\0')).slice(0, FILE_NAME_LENGTH);
    parts.push(encodedFileName);
    parts.push(new Uint8Array(HEADER_RESERVED_LENGTH).fill(UNUSED_FILLER));
    // Serialize rows
    document.rows.forEach(function (row) {
        parts.push(numToUint8Array(row.source.type.key));
        parts.push(numToUint8Array(row.source.function.key));
        parts.push(numToUint8Array(row.source.extra.key));
        parts.push(numToUint8Array(row.destination.type.key));
        parts.push(numToUint8Array(row.destination.function.key));
        parts.push(numToUint8Array(row.destination.extra.key));
        parts.push(new Uint8Array(ROW_UNUSED_LENGTH).fill(UNUSED_FILLER));
    });
    // Serialize variables
    document.variables.forEach(function (variable) {
        parts.push(numToUint8Array(variable.value));
    });
    return new Blob(parts, { type: "application/octet-stream" });
}
//# sourceMappingURL=formatters.js.map