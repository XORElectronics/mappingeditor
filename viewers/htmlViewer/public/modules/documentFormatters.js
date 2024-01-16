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
    var output = "# ".concat(document.header.headerText, "\n\n");
    output += "## Header\n\n";
    output += "| Property | Value |\n";
    output += "| --- | --- |\n";
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
export function toStream(document) {
    return new Blob([], { type: "application/octet-stream" });
}
//# sourceMappingURL=documentFormatters.js.map