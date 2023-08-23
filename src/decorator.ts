import { window, Range, Position } from "vscode";

const decorations: {
  [key: string]: { line: number; size?: number }[];
} = {};

const decorationType = window.createTextEditorDecorationType({});
const outputColor = "#7cc36e";

export function setDecorations(
  filename: string,
  info: { line: number; size: number }[]
) {
  info.forEach((info) => decorate(filename, info));
  flushDecorationsDebounced(filename);
}

function decorate(fileName: string, info: { line: number; size?: number }) {
  const entry = decorations[fileName];
  if (entry) {
    entry.push(info);
  } else {
    decorations[fileName] = [info];
  }
}

export function calculated(fileName: string, info: { line: number; size?: number }) {
  console.log(`Calculated: ${JSON.stringify(info)}`);
  decorate(fileName, info);
  flushDecorationsDebounced(fileName);
}

function getDecorationMessage(size?: number) {
  const text = (s: string) => ({
    after: {
      contentText: s,
      margin: `0 0 0 1rem`,
      fontStyle: "normal",
    },
  });
  if (!size) {
    return text("Calculating...");
  } else if (size < 0) {
    return text("unknown");
  }
  return text(`${size} byte`);
}

function getDecorationColor(size?: number) {
  const color = (old: string, dark: string, light: string) => ({
    dark: { after: { color: old || dark } },
    light: { after: { color: old || light } },
  });

  return color(outputColor, outputColor, outputColor);
}

function decoration(line: number, size?: number) {
  return {
    renderOptions: {
      ...getDecorationColor(size),
      ...getDecorationMessage(size),
    },
    range: new Range(
      new Position(line - 1, 1024),
      new Position(line - 1, 1024)
    ),
  };
}

let decorationsDebounce: NodeJS.Timeout;
function flushDecorationsDebounced(fileName: string) {
  clearTimeout(decorationsDebounce);
  decorationsDebounce = setTimeout(() => flushDecorations(fileName), 10);
}

function flushDecorations(fileName: string) {
  let arr: Record<string, any> = {};
  decorations[fileName]?.forEach((info) => {
    arr[info.line] = decoration(info.line, info.size);
  });

  const log = Object.entries(arr)
    .map(([line, decoration]) => {
      const message = decoration.renderOptions.after.contentText;
      return `${fileName}, ${line}, ${message}`;
    })
    .join("\n");
  console.log(`Setting decorations:\n${log}`);

  window.visibleTextEditors
    .filter((editor) => editor.document.fileName === fileName)
    .forEach((editor) => {
      editor.setDecorations(decorationType, Object.values(arr));
    });
}

export function clearDecorations() {
  window.visibleTextEditors.forEach((textEditor) => {
    textEditor.setDecorations(decorationType, []);
  });
}
