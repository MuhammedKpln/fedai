import * as dotenv from "dotenv";
import { Client, LocalAuth } from "whatsapp-web.js";
import { commands, loadModules } from "./core/modules/_module.js";
import {
  extractCommandFromText,
  extractCommandsFromModules,
} from "./core/parser.js";
import { Logger } from "./core/session/logger.js";

dotenv.config({
  path: "../../.env",
});

const logger = Logger.child({
  module: "main",
});

const client = new Client({
  puppeteer: { headless: true, args: ["--no-sandbox"] },
  authStrategy: new LocalAuth({ clientId: "fedai" }),
});

client.on("auth_failure", (error) => logger.error(error));
client.on("loading_screen", (percent) => logger.info(`Loading ${percent}%`));

client.on("ready", async () => {
  logger.info("Client is ready");

  await initialize();
});

client.on("message", (message) => {
  // if (!message.fromMe) {
  const command = extractCommandFromText(message.body);
  if (command) {
    const isExists = commands.filter(
      (value) =>
        (value.command === command.command ||
          value.command.includes(command.command)) &&
        value.options?.isPublic
    );

    if (isExists) {
      const targetClass = new isExists[0].target();

      targetClass.action(message, client, command.args);
    }
  }
  // }
});

client.on("message_create", async (message) => {
  if (!message.hasMedia && message.fromMe) {
    const command = extractCommandFromText(message.body);
    if (command) {
      const isExists = commands.filter(
        (value) =>
          value.command === command.command ||
          value.command.includes(command.command)
      );

      if (isExists) {
        const targetClass = new isExists[0].target();

        targetClass.action(message, client, command.args);
      }
    }
  }
});

async function initialize() {
  await loadModules();
  setTimeout(() => {
    extractCommandsFromModules();
  }, 300);
}

// initialize();
client.initialize();
