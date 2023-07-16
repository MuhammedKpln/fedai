import { WASocket } from "@whiskeysockets/baileys";
import * as dotenv from "dotenv";
import { loadModules } from "./core/modules/_module.js";
import { commandCatcher, extractCommandsFromModules } from "./core/parser.js";
import { Logger } from "./core/session/logger.js";
import { startSocket } from "./core/session/start_session.js";

dotenv.config({
  path: "../../.env",
});

const logger = Logger.child({
  module: "main",
});

let client: WASocket;

// client.on("message_create", async (message) => {
//   // Remove commands and info messages.
//   if (
//     message.fromMe &&
//     (message.body.includes("*FEDAI*:") ||
//       message.body.match(commandRegexPattern))
//   ) {
//     let deleteAfterMs: number = 300;

//     if (message.body.includes("*FEDAI*:")) {
//       deleteAfterMs = 3000;
//     }

//     setTimeout(async () => {
//       await message.delete(true);
//     }, deleteAfterMs);
//   }

//   if (!message.hasMedia && message.fromMe) {
//     const command = extractCommandFromText(message.body);
//     if (command) {
//       const isExists = commands.filter(
//         (value) =>
//           value.command === command.command ||
//           value.command.includes(command.command)
//       );

//       if (isExists.length > 0) {
//         const targetClass = new isExists[0].target();

//         targetClass.action(message, client, command.args);
//       }
//     }
//   }
// });

async function initialize() {
  client = await startSocket();
  await loadModules();
  setTimeout(() => {
    extractCommandsFromModules();
  }, 300);
  client.ev.process(async (event) => {
    const MESSAGE_UPSERT = event["messages.upsert"];

    if (MESSAGE_UPSERT) {
      if (MESSAGE_UPSERT.type == "notify") {
        for (const msg of MESSAGE_UPSERT.messages) {
          await commandCatcher(msg, client);
          logger.info("Process commands");
        }
      }
    }
  });
}

try {
  initialize();
} catch (error) {
  Logger.error(error);
}
