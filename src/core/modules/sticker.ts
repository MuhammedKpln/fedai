import { writeFile } from "fs/promises";
import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";
import pkg, { Client, Message } from "whatsapp-web.js";
import { errorMessage, infoMessage } from "../helpers.js";
import { BasePlugin, addCommand } from "./_module.js";

const { MessageMedia } = pkg;

@addCommand(".sticker", {
  isPublic: true,
})
export default class StickerPlugin implements BasePlugin {
  async action(
    message: Message,
    client: Client
  ): Promise<Promise<Promise<void>>> {
    if (!message.hasQuotedMsg) {
      await message.reply(errorMessage("Lütfen alintilayin"));

      return;
    }
    const quotedMessage = await message.getQuotedMessage();

    if (!quotedMessage.hasMedia) {
      await message.reply(errorMessage("Sadece resim alintialyin."));
      return;
    }

    message.reply(infoMessage("Stickerci fedai calisiyor..."));

    const downloadedMedia = await quotedMessage.downloadMedia();
    const mediaAsBuffer = Buffer.from(downloadedMedia.data, "base64");
    await writeFile("image.jpeg", mediaAsBuffer);
    const data = await this.convertToWebp();

    await message.reply(data, message.to, {
      sendMediaAsSticker: true,
    });
  }

  private async convertToWebp(): Promise<pkg.MessageMedia> {
    const result = await imagemin(["image.jpeg"], {
      destination: "./output.webp",
      //@ts-ignore
      plugins: [imageminWebp({ quality: 80 })],
    });

    const messageMedia = new MessageMedia(
      "image/webp",
      result[0].data.toString("base64")
    );

    return messageMedia;
  }

  help(): string {
    return "Makes sticker from photos.";
  }
}
