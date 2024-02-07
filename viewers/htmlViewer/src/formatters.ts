import { MappingDocument } from "./documentModel";

export function toHtml(document: MappingDocument, useBsStyles: boolean = false): string {
    let output = `<table ${useBsStyles ? "class='table table-dark'" : ''}><tbody>`;
    output += `<tr><td>Header Text: </td><td>${document.header.headerText}</td></tr>`;
    output += `<tr><td>Major Version: </td><td>${document.header.majorVersion}</td></tr>`;
    output += `<tr><td>Minor Version: </td><td>${document.header.minorVersion}</td></tr>`;
    output += `<tr><td>FileName: </td><td>${document.header.fileName}</td></tr>`;
    output += `<tr>`;
    output += `<table ${useBsStyles ? "class='table table-dark'" : ''}>`;
    output += `<thead ${useBsStyles ? "class='thead-dark'" : ''}><tr><th>Index </th><th>Source Type </th><th>Source Function </th><th>Source Extra </th><th>Destination Type </th><th>Destination Function </th><th>Destination Extra </th></tr></thead>`;
    output += `<tbody>`;
    document.rows.forEach(row => {
        output += `<tr>`;
        output += `<td>${row.index}</td>`;
        output += `<td title='${row.source.type.abbr}'>${row.source.type.description}</td>`;
        output += `<td title='${row.source.function.abbr}'>${row.source.function.description}</td>`;
        output += `<td title='${row.source.extra.abbr}'>${row.source.extra.description}</td>`;
        output += `<td title='${row.destination.type.abbr}'>${row.destination.type.description}</td>`;
        output += `<td title='${row.destination.function.abbr}'">${row.destination.function.description}</td>`;
        output += `<td title='${row.destination.extra.abbr}'>${row.destination.extra.description}</td>`;
        output += `</tr>`;
    });
    output += `</tbody></table></tr><table ${useBsStyles ? "class='table table-dark'" : ''}>`;
    document.variables.forEach(variable => {
        output += `<tr><td>${variable.name}: </td><td>${variable.value}</td></tr>`;
    });
    output += "</tbody></table>";
    return output;
}

export function toMarkdown(document: MappingDocument, useAbbrivations: boolean = false): string {
    let output = `# NerdSeq Mapping File\n\n`;
    output += `## Header\n\n`;
    output += `| Property | Value |\n`;
    output += `| --- | --- |\n`;
    output += `| Header Text | ${document.header.headerText} |\n`;
    output += `| Major Version | ${document.header.majorVersion} |\n`;
    output += `| Minor Version | ${document.header.minorVersion} |\n`;
    output += `| FileName | ${document.header.fileName} |\n\n`;
    output += `## Rows\n\n`;
    output += `| Index | Source Type | Source Function | Source Extra | Destination Type | Destination Function | Destination Extra |\n`;
    output += `| --- | --- | --- | --- | --- | --- | --- |\n`;
    document.rows.forEach(row => {
        if (useAbbrivations) {
            output += `| ${row.index.toString(16).toUpperCase().padStart(2, '0')} | ${row.source.type.abbr} | ${row.source.function.abbr} | ${row.source.extra.abbr} | ${row.destination.type.abbr} | ${row.destination.function.abbr} | ${row.destination.extra.abbr} |\n`;
            return;
        }
        output += `| ${row.index} | ${row.source.type.description} | ${row.source.function.description} | ${row.source.extra.description} | ${row.destination.type.description} | ${row.destination.function.description} | ${row.destination.extra.description} |\n`;
    });
    output += `\n## Variables\n\n`;
    output += `| Name | Value |\n`;
    output += `| --- | --- |\n`;
    document.variables.forEach(variable => {
        output += `| ${variable.name} | ${variable.value} |\n`;
    });
    return output;
}

export function toJson(document: MappingDocument): string {
    return JSON.stringify(document);
}

function numToUint8Array(value: number): Uint8Array {
    let uint16Array = new Uint16Array([value]);
    let uint8Array = new Uint8Array(uint16Array.length * 2);
    let dataView = new DataView(uint8Array.buffer);
    for (let i = 0; i < uint16Array.length; i++) {
        dataView.setUint16(i * 2, uint16Array[i], true);
    }
    return uint8Array;
}

export function toBlob(document: MappingDocument): Blob {
    const HEADER_TEXT_LENGTH = 16;
    const FILE_NAME_LENGTH = 12;
    const HEADER_RESERVED_LENGTH = 40;
    const ROW_UNUSED_LENGTH = 8;
    const UNUSED_FILLER = 0xFF;

    let encoder = new TextEncoder();
    let parts: Uint8Array[] = [];

    // Serialize header
    const encodedHeaderText = encoder.encode(document.header.headerText.padEnd(HEADER_TEXT_LENGTH, '\0')).slice(0, HEADER_TEXT_LENGTH);
    parts.push(encodedHeaderText);
    parts.push(new Uint8Array([document.header.majorVersion]));
    parts.push(new Uint8Array([document.header.minorVersion]));
    const encodedFileName = encoder.encode(document.header.fileName.padEnd(FILE_NAME_LENGTH, '\0')).slice(0, FILE_NAME_LENGTH);
    parts.push(encodedFileName);
    parts.push(new Uint8Array(HEADER_RESERVED_LENGTH).fill(UNUSED_FILLER));

    // Serialize rows
    document.rows.forEach(row => {
        parts.push(numToUint8Array(row.source.type.key));
        parts.push(numToUint8Array(row.source.function.key));
        parts.push(numToUint8Array(row.source.extra.keyOrValue));
        parts.push(numToUint8Array(row.destination.type.key));
        parts.push(numToUint8Array(row.destination.function.key));
        parts.push(numToUint8Array(row.destination.extra.keyOrValue));
        parts.push(new Uint8Array(ROW_UNUSED_LENGTH).fill(UNUSED_FILLER));
    });

    // Serialize variables
    document.variables.forEach(variable => {
        parts.push(numToUint8Array(variable.value));
    });

    return new Blob(parts, { type: "application/octet-stream" });
}