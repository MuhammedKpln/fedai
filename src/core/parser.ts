import { WASocket, proto } from "@whiskeysockets/baileys";
import { errorMessage, infoMessage } from "./helpers.js";
import { commands } from "./modules/_module.js";
import Message from "./proxy/message.js";
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

export async function commandCatcher(
  lastMessage: proto.IWebMessageInfo,
  client: WASocket
) {
  let message: string = "";

  // if (lastMessage.key.remoteJid) {
  await client.sendPresenceUpdate("unavailable");
  // }

  // if (lastMessage.key.fromMe) {
  if (lastMessage.message?.conversation) {
    // If user simply just use the command
    message = lastMessage.message.conversation;
  }
  if (lastMessage.message?.extendedTextMessage) {
    // If user quoted a message
    if (lastMessage.message.extendedTextMessage.text) {
      message = lastMessage.message.extendedTextMessage.text;
    }
  }
  if (lastMessage.message?.imageMessage?.caption) {
    // If replying a image message with command
    message = lastMessage?.message?.imageMessage.caption;
  }

  const isExists = commands.filter((value) => message.match(value.command));
  console.log(isExists);
  // if (lastMessage.key.fromMe) {
  if (lastMessage.message?.conversation) {
    // If user simply just use the command
    message = lastMessage.message.conversation;
  }
  if (lastMessage.message?.extendedTextMessage) {
    // If user quoted a message
    if (lastMessage.message.extendedTextMessage.text) {
      message = lastMessage.message.extendedTextMessage.text;
    }
  }
  if (lastMessage.message?.imageMessage?.caption) {
    // If replying a image message with command
    message = lastMessage?.message?.imageMessage.caption;
  }

  // Check if message contains any command with help of regex.

  // console.log(match);
  if (isExists.length > 0) {
    const match = message.match(isExists[0].command);

    const _client = new Message(client, lastMessage);

    // Message is sent from a group
    if (isExists[0].options?.onlyGroups && !_client.jid.includes("-")) {
      return _client.sendMessage({
        text: infoMessage("Only groups"),
      });
    }

    if (isExists[0]?.options?.isPublic) {
      if (!lastMessage.key.fromMe) {
        await client.sendMessage(lastMessage.key.remoteJid!, {
          text: errorMessage("Only author."),
        });
        return;
      }
    }

    try {
      const targetClass = new isExists[0].target();

      targetClass.action(_client, client, match?.at(2));
    } catch (err) {
      await client.sendMessage(lastMessage.key.remoteJid!, {
        text: err,
      });
    }
  }
}
