import { WASocket } from "@whiskeysockets/baileys";
import { errorMessage, infoMessage } from "../helpers.js";
import Message from "../proxy/message.js";
import { BasePlugin, addCommand } from "./_module.js";

@addCommand(".(tts).?(.*)", { isPublic: true })
export default class TTSPlugin implements BasePlugin {
  async action(
    message: Message,
    _client: WASocket,
    text: string
  ): Promise<void> {
    if (!text) {
      await message.edit(errorMessage("Text is required."));

      return;
    }
    await message.edit(infoMessage("Converting.."));

    const response = await fetch(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=tr&q=${text}`
    );
    const buffer = await response.arrayBuffer();

    if (response.status === 200) {
      await message.sendMessage({
        audio: Buffer.from(buffer),
      });

      return;
    }

    await message.edit(errorMessage("Cevirememisem"));
  }
  help(): string {
    return "Convert text to audio";
  }
}
