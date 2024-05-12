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

async function initialize() {
  client = await startSocket();
  await loadModules();
  setTimeout(() => {
    extractCommandsFromModules();
  }, 300);

  client.ev.process(async (event) => {
    if (event["connection.update"]?.connection === "open") {
      await client.sendPresenceUpdate("unavailable");
    }

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
