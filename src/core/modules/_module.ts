import { readdir } from "node:fs/promises";
import * as path from "node:path";
import { Client, Message } from "whatsapp-web.js";
import { ICommand, ICommandOptions } from "../types/commads.js";

export const commands: ICommand[] = [];

export function addCommand<T extends { new (...args: any[]): BasePlugin }>(
  command: string,
  options?: ICommandOptions
) {
  return (target: T) => {
    commands.push({
      command,
      target,
      options,
    });
  };
}

export async function loadModules() {
  const dir = await readdir("./core/modules");

  for (let plugin of dir) {
    const pluginExt = path.extname(plugin).toLowerCase();
    if (pluginExt == ".js") {
      await import("./" + plugin);
    }
  }
}

export interface BasePlugin {
  action(message: Message, client: Client, args?: string): void;
  help(): string;
}
