// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { calculateFieldSize, findStructDeclaration } from "./calculate";
import { calculated, clearDecorations, setDecorations } from './decorator';
//Create output channel
let output = vscode.window.createOutputChannel("Struct Size");

let isActive = true;

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidChangeTextDocument(ev => processActiveFile(ev.document));
  vscode.window.onDidChangeActiveTextEditor(ev => processActiveFile(ev?.document));
  processActiveFile(vscode.window.activeTextEditor?.document);
  let disposable = vscode.commands.registerCommand(
    "go-struct-size.toggle",
    () => {
      isActive = !isActive;
      if (!isActive) {
        deactivate();
      }

      processActiveFile();

      output.show();
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  clearDecorations();
}

function processActiveFile(document?: vscode.TextDocument) {
  if (!document) {
    return;
  }
  const structRange = findStructDeclaration(document);
  console.log(JSON.stringify(structRange, null, 2));
  setDecorations(document.fileName, []);
  if (structRange) {
    structRange?.forEach((entry) => {
      const startPosition = new vscode.Position(entry.startLine, 0);
      const endPosition = new vscode.Position(entry.endLine, 0);
      const selection = new vscode.Selection(startPosition, endPosition);
      let start = entry.startLine + 1;
      let end = entry.endLine;
      while (start !== end) {
        const { text } = document.lineAt(
          start
        );
        const fieldSize = calculateFieldSize(text);
        if (!fieldSize) {
          start += 1;
          continue;
        }
        output.appendLine(JSON.stringify(fieldSize, null, 2));
        calculated(document.fileName, { line: start + 1, size: fieldSize.fieldSize });
        start += 1;
      }
    });
  } else {
    vscode.window.showInformationMessage("No struct declaration found.");
  }

  return structRange;
}