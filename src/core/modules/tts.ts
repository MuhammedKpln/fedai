import axios from "axios";
import pkg, { Client, Message } from "whatsapp-web.js";
import { errorMessage, infoMessage } from "../helpers.js";
import { BasePlugin, addCommand } from "./_module.js";

const { MessageMedia } = pkg;

@addCommand(".(tts).?(.*)")
export default class TTSPlugin implements BasePlugin {
  async action(message: Message, client: Client, text: string): Promise<void> {
    if (!text) {
      await client.sendMessage(
        message.to,
        errorMessage("Hele bi yazi ver bana gardasim benim")
      );
    }
    const { data } = await axios.get(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=tr&q=${text}`,
      { responseType: "arraybuffer" }
    );

    if (data) {
      const messageMedia = new MessageMedia(
        "audio/mp4",
        Buffer.from(data).toString("base64")
      );
      await message.reply(messageMedia, message.to, {
        sendAudioAsVoice: true,
        caption: infoMessage("Hele gardasim benim al"),
      });

      return;
    }

    await client.sendMessage(message.to, errorMessage("Cevirememisem"));
  }
  help(): string {
    return "Convert text to audio";
  }
}
