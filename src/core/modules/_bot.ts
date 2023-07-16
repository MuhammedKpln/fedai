import { WASocket } from "@whiskeysockets/baileys";
import { BaseMessage } from "../proxy/base.js";
import { BasePlugin, addCommand, commands } from "./_module.js";

@addCommand(".fedai", {
  excludeFromHelpList: true,
})
export class BotPlugin implements BasePlugin {
  async action(message: BaseMessage, _client: WASocket): Promise<void> {
    // const commandForHelp: string = match[1];
    let CMD_HELP: string[] = [];
    const _commands = commands.filter((v) => !v.options?.excludeFromHelpList);

    _commands.map((command) => {
      // Skip plugins who don't want to show it self in help.
      CMD_HELP.push("*🛠 " + "Komut:" + ":* ```" + command.command + "```\n");
      CMD_HELP.push(
        "*💬 " + "Bu ne?:" + ":* ```" + new command.target().help() + "```\n\n"
      );
    });

    await message.edit(CMD_HELP.join(""));
  }
  help(): string {
    throw new Error("Method not implemented.");
  }
}
