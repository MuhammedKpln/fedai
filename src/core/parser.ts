import { commands } from "./modules/_module.js";
import { IExtractedCommand } from "./types/commads.js";

export let commandRegexPattern: RegExp;

export function extractCommandFromText(text: string): IExtractedCommand | void {
  const match = text.match(commandRegexPattern);

  if (match != null) {
    if (match?.[2]) {
      return {
        command: match[1],
        args: match[2],
      };
    }

    if (match[0].length > 1) {
      return {
        command: match[0],
      };
    }
  }
}

export function extractCommandsFromModules() {
  let pattern = "";
  commands.forEach((value, index) => {
    if (index + 1 == commands.length) {
      pattern += value.command;
    } else {
      pattern += value.command + "|";
    }
  });

  commandRegexPattern = new RegExp(pattern);
}
