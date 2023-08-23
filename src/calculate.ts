import * as vscode from "vscode";

export function calculateFieldSize(
  structText: string
): { fieldName: string, fieldSize: number } | null {
  structText = structText.trim();
  const match = structText.match(/("[^"]+")|\S+/gm);
  if (match) {
    let fieldSize: number = -1;
    const fieldName = match[1];
    const fieldType = match[1].toLowerCase(); // Convert to lowercase for easier comparison

    switch (fieldType) {
      case "int8":
      case "uint8":
      case "bool":
        fieldSize = 1;
        break;
      case "int16":
      case "uint16":
        fieldSize = 2;
        break;
      case "int32":
      case "uint32":
      case "float32":
        fieldSize = 4;
        break;
      case "int64":
      case "uint64":
      case "float64":
        fieldSize = 8;
        break;
      // Add more cases for other field types
      case "uint":
      case "int":
        if (process.arch.includes("64")) {
          fieldSize = 8;
        } else {
          fieldSize = 4;
        }
        break;
      case "string":
        fieldSize = 16;
        break;
      default:
        if (fieldType.includes("[]")) {
          // https://stackoverflow.com/a/38034334
          fieldSize = 24;
        } else if (fieldType.startsWith("*")) {
          if (process.arch.includes("64")) {
            fieldSize = 8;
          } else {
            fieldSize = 4;
          }
        }
        else {
          fieldSize = -1; // Unknown type
        }
        break;
    }
    return { fieldName, fieldSize };
  }
  return null;
}

export function findStructDeclaration(
  document: vscode.TextDocument
): { startLine: number; endLine: number }[] | null {
  let startLine = -1;
  let endLine = -1;
  let insideStruct = false;
  let result = [];

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const line = document.lineAt(lineIndex);
    const lineText = line.text.trim();

    if (insideStruct) {
      if (lineText === "}") {
        endLine = lineIndex;
        insideStruct = false;
        result.push({ startLine, endLine });
        startLine = -1;
        endLine = -1;
      }
    } else if (lineText.startsWith("type ") && lineText.includes(" struct ")) {
      startLine = lineIndex;
      insideStruct = true;
    }
  }

  if (result.length > 0) {
    return result;
  } else {
    return null;
  }
}
