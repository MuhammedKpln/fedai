import {
  DownloadableMessage,
  MediaType,
  WAContextInfo,
  WASocket,
  downloadContentFromMessage,
  proto,
} from "@whiskeysockets/baileys";

export default class ReplyMessage {
  declare jid: string;
  declare id: string | null;
  declare fromMe: boolean;
  timestamp: number;
  url: string | null;
  caption: string | null;
  mimetype: string | null;
  height: number | null;
  width: number | null;
  mediaKey: Uint8Array | null;
  message: string | null;
  client: WASocket;
  text: string;
  image: boolean;
  video: boolean;
  audio: boolean;
  private downloadableMedia: DownloadableMessage;

  declare data: proto.IContextInfo;
  contextInfo: WAContextInfo | null | undefined;

  constructor(client: WASocket, data: proto.IContextInfo) {
    this.client = client;
    if (data) this._patch(data);
  }

  async downloadMedia(): Promise<Uint8Array> {
    return new Promise(async (resolve, reject) => {
      if (!this?.mediaKey) {
        reject("No media found");
      }
      let chunks: Uint8Array = new Uint8Array();
      let fileType: MediaType = "image";

      if (this.video) {
        fileType = "video";
      }

      if (this.audio) {
        fileType = "audio";
      }

      const file = await downloadContentFromMessage(
        this.downloadableMedia,
        fileType
      );

      file.on("end", async () => {
        resolve(chunks);
      });

      file.on("data", async (data) => {
        chunks = new Uint8Array([...chunks, ...data]);
      });
    });
  }

  _patch(data: proto.IContextInfo) {
    const contextInfo = data;

    this.id = contextInfo!.stanzaId || null;
    this.data = data;

    if (data.participant) {
      this.jid = data.participant;
    }

    if (contextInfo!.quotedMessage && contextInfo!.quotedMessage.imageMessage) {
      this.caption = contextInfo!.quotedMessage?.imageMessage?.caption || null;

      this.url = contextInfo!.quotedMessage?.imageMessage?.url || null;
      this.mimetype =
        contextInfo!.quotedMessage?.imageMessage?.mimetype || null;
      this.height = contextInfo!.quotedMessage?.imageMessage?.height || null;
      this.width = contextInfo!.quotedMessage?.imageMessage?.width || null;
      this.mediaKey =
        contextInfo!.quotedMessage?.imageMessage?.mediaKey || null;
      this.image = true;
      this.downloadableMedia = {
        directPath: contextInfo!.quotedMessage?.imageMessage?.directPath,
        url: this.url,
        mediaKey: this.mediaKey,
      };
    }
    if (contextInfo!.quotedMessage && contextInfo!.quotedMessage.audioMessage) {
      this.url = contextInfo!.quotedMessage?.audioMessage?.url || null;
      this.mimetype =
        contextInfo!.quotedMessage?.audioMessage?.mimetype || null;
      this.mediaKey =
        contextInfo!.quotedMessage?.audioMessage?.mediaKey || null;
      this.audio = true;
      this.downloadableMedia = {
        directPath: contextInfo!.quotedMessage?.audioMessage?.directPath,
        url: this.url,
        mediaKey: this.mediaKey,
      };
    }
    if (contextInfo!.quotedMessage && contextInfo!.quotedMessage.videoMessage) {
      this.caption = contextInfo!.quotedMessage?.videoMessage?.caption || null;

      this.url = contextInfo!.quotedMessage?.videoMessage?.url || null;
      this.mimetype =
        contextInfo!.quotedMessage?.videoMessage?.mimetype || null;
      this.height = contextInfo!.quotedMessage?.videoMessage?.height || null;
      this.width = contextInfo!.quotedMessage?.videoMessage?.width || null;
      this.mediaKey =
        contextInfo!.quotedMessage?.videoMessage?.mediaKey || null;
      this.video = true;
      this.downloadableMedia = {
        directPath: contextInfo!.quotedMessage?.videoMessage?.directPath,
        url: this.url,
        mediaKey: this.mediaKey,
      };
    } else if (
      contextInfo!.quotedMessage &&
      contextInfo!.quotedMessage.conversation
    ) {
      this.message = contextInfo!.quotedMessage.conversation;
      this.text = contextInfo!.quotedMessage.conversation;
      this.image = false;
      this.video = false;
    }
  }
}
