import { WASocket } from "@whiskeysockets/baileys";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { createReadStream } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { errorMessage, infoMessage, successfullMessage } from "../helpers.js";
import Message from "../proxy/message.js";
import { Logger } from "../session/logger.js";
import { Root } from "../types/modules/voicy/voicy.types.js";
import { BasePlugin, addCommand } from "./_module.js";

@addCommand(".voicy", {
  isPublic: true,
})
export default class VoicyPlugin implements BasePlugin {
  async action(message: Message, _client: WASocket) {
    try {
      if (message.reply_message) {
        if (message.reply_message.audio) {
          try {
            await message.edit(infoMessage("Bakim ne diyor aq cocu"));
            const chunks = await message.reply_message.downloadMedia();

            await writeFile("output.ogg", chunks);

            const bodyStream = createReadStream("output.ogg");

            this.convertToWav(bodyStream).on("end", async () => {
              try {
                const recognizedText = await this.recognizeAudio();

                await message.sendMessage({
                  text: successfullMessage(
                    `Bak agliyo bak:  ${recognizedText}`
                  ),
                });
              } catch (error) {
                await message.edit(infoMessage("Anlamadim amk"));
              } finally {
                await this.cleanup();
              }
            });
          } catch (error) {
            Logger.error(error);
          }
        } else {
          await message.edit(errorMessage("Sadece ses"));
        }
      } else {
        await message.edit(errorMessage("Alinti lazim"));
      }
    } catch (err) {
      console.log(err);
    }
  }
  help(): string {
    return "VOICY";
  }

  private async cleanup() {
    await rm("output.ogg");
    await rm("output.wav");
  }

  private parseChunkedResponse = <Dto>(body: string): Dto[] => {
    // Split by newline, trim, remove empty lines
    const chunks = body
      .split("\r\n")
      .map((chunk) => chunk.trim())
      .filter((chunk) => Boolean(chunk.length));

    // Loop through the chunks and try to Json.parse
    return chunks.reduce<{ prev: string; acc: Dto[] }>(
      ({ prev, acc }, chunk) => {
        const newPrev = `${prev}${chunk}`;
        try {
          const newChunk: Dto = JSON.parse(newPrev);
          return { prev: "", acc: [...acc, newChunk] };
        } catch (err) {
          return { prev: newPrev, acc };
        }
      },
      { prev: "", acc: [] }
    ).acc;
  };

  private async recognizeAudio(): Promise<string> {
    return new Promise(async (resolve) => {
      const file = createReadStream("./output.wav");
      axios
        .request<string>({
          method: "POST",
          url: "https://api.wit.ai/dictation",
          params: {
            v: 20230215,
          },
          headers: {
            Authorization: `Bearer ${process.env.WITAI_API}`,
            Accept: "application/json",
            "Content-Type": `audio/wav`,
            "Transfer-Encoding": "chunked",
          },
          timeout: 10_000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          responseType: "text",
          data: file,
          transformResponse: (d) => d,
        })
        .then((response) => {
          const chunks = this.parseChunkedResponse<Root>(response.data);
          const finalizedChunks = chunks.filter(
            ({ is_final: isFinal }) => isFinal
          );
          if (!finalizedChunks.length) {
            Logger.warn(
              `The final response chunk not found. Transcription is empty.`,
              chunks.map(({ text }) => text)
            );
          }

          resolve(finalizedChunks.map((chunk) => chunk.text).join(". "));

          return finalizedChunks;
        });
    });
  }

  private convertToWav = (filePath: Readable) => {
    return ffmpeg(filePath)
      .inputFormat("ogg")
      .audioCodec("pcm_s16le")
      .format("wav")
      .save("output.wav");
  };
}
