import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { readFile, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { Client, Message } from "whatsapp-web.js";
import { errorMessage, infoMessage, successfullMessage } from "../helpers.js";
import { BasePlugin, addCommand } from "./_module.js";

@addCommand(".voicy", {
  isPublic: true,
})
export default class VoicyPlugin implements BasePlugin {
  async action(message: Message, _client: Client): Promise<void> {
    if (message.hasQuotedMsg) {
      const se = await message.getQuotedMessage();

      if (se.hasMedia) {
        const media = await se.downloadMedia();
        if (!media.mimetype.startsWith("audio")) {
          await message.reply(errorMessage("Lütfen bana bir ses alintilayin."));

          return;
        }
        console.log(media);
        let fileExtension;

        if (media.mimetype.startsWith("audio/ogg")) {
          fileExtension = "ogg";
        }

        if (media.mimetype.startsWith("audio/mpeg")) {
          fileExtension = "mp3";
        }

        const fileName = `file.${fileExtension}`;

        await message.reply(infoMessage("Recognizing.."));

        await writeFile(
          fileName,
          Buffer.from(media.data.replace(media.mimetype, ""), "base64")
        );

        await this.convertToWav(fileName, fileExtension);

        const recognizedText = await this.recognizeAudio();

        message.reply(successfullMessage(recognizedText));
      }
    } else {
      await message.reply(errorMessage("Lütfen bana bir ses alintilayin."));
    }
  }

  help(): string {
    return "Changes speech to text";
  }

  private convertToWav(file: string, extension: string): Promise<void> {
    return new Promise((resolve) => {
      const convert = ffmpeg(file)
        .inputFormat(extension)
        .audioCodec("pcm_s16le")
        .format("wav")
        .save("output.wav");

      convert.on("end", resolve);
    });
  }

  private parseResponse(response) {
    const chunks = response
      .split("\r\n")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

    let prev = "";
    let jsons = [];
    for (const chunk of chunks) {
      try {
        prev += chunk;
        //@ts-ignore
        jsons.push(JSON.parse(prev));
        prev = "";
      } catch (_e) {}
    }

    return jsons;
  }

  private async recognizeAudio(): Promise<string> {
    return new Promise(async (resolve) => {
      const headers = {
        "Content-Type": "audio/wav",
        Authorization: `Bearer ${process.env.WITAI_API}`,
        "Transfer-Encoding": "chunked",
      };

      const file = await readFile("./output.wav");

      const response = await axios.post<Readable>(
        "https://api.wit.ai/dictation?v=20230215",
        file,
        {
          headers: headers,
          responseType: "stream",
        }
      );

      response.data.on("readable", () => {
        let chunk;
        let contents = "";
        while (null !== (chunk = response.data.read())) {
          contents += chunk.toString();
        }

        for (const rsp of this.parseResponse(contents)) {
          const { error, intents, is_final, text } = rsp;

          if (!(error || intents)) {
            if (is_final) {
              resolve(text);
            }
          }
        }
      });
    });
  }
}
