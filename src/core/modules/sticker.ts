import { writeFile } from "fs/promises";
import sharp from "sharp";
import { errorMessage, infoMessage } from "../helpers.js";
import Message from "../proxy/message.js";
import { BasePlugin, addCommand } from "./_module.js";

@addCommand(".sticker", {
  isPublic: true,
})
export default class StickerPlugin implements BasePlugin {
  async action(message: Message) {
    if (!message?.reply_message) {
      await message.edit(errorMessage("Lütfen alintilayin"));

      return;
    }

    if (!message.reply_message.mediaKey) {
      await message.edit(errorMessage("Sadece resim alintialyin."));
      return;
    }

    await message.edit(infoMessage("Stickerci fedai calisiyor..."));

    const downloadedMedia = await message.reply_message.downloadMedia();
    await writeFile("image.jpeg", downloadedMedia);
    const data = await this.convertToWebp(downloadedMedia);

    await message.sendMessage(
      {
        sticker: data,
      },
      message.jid
    );
  }

  private async convertToWebp(chunks: Uint8Array): Promise<Buffer> {
    return sharp(chunks).webp({ lossless: true }).toBuffer();
  }

  help(): string {
    return "Makes sticker from photos.";
  }
}
