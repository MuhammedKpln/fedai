import * as dotenv from "dotenv";
import mongoose from "mongoose";
import * as qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
import { MongoStore } from "wwebjs-mongo";
import { commands, loadModules } from "./core/modules/_module.js";
import {
  commandRegexPattern,
  extractCommandFromText,
  extractCommandsFromModules,
} from "./core/parser.js";
import { Logger } from "./core/session/logger.js";

const { Client, LocalAuth, RemoteAuth } = pkg;

dotenv.config({
  path: "../../.env",
});

const logger = Logger.child({
  module: "main",
});

let puppetterArgs = ["--no-sandbox"];
let authStrategy = new LocalAuth({
  clientId: "fedai",
});

const client = new Client({
  puppeteer: {
    headless: true,
    args: puppetterArgs,
    executablePath: process.env.CHROME_BIN || undefined,
  },
  authStrategy: authStrategy,
});

client.on("qr", (qr) => {
  console.log(qr);
  console.log(`Scan this QR Code and copy the JSON\n`);
  qrcode.generate(qr, { small: true });
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

    if (isExists.length > 0) {
      const targetClass = new isExists[0].target();

      targetClass.action(message, client, command.args);
    }
  }
  // }
});

client.on("message_create", async (message) => {
  // Remove commands and info messages.
  if (
    message.fromMe &&
    (message.body.includes("*FEDAI*:") ||
      message.body.match(commandRegexPattern))
  ) {
    let deleteAfterMs: number = 300;

    if (message.body.includes("*FEDAI*:")) {
      deleteAfterMs = 3000;
    }

    setTimeout(async () => {
      await message.delete(true);
    }, deleteAfterMs);
  }

  if (!message.hasMedia && message.fromMe) {
    const command = extractCommandFromText(message.body);
    if (command) {
      const isExists = commands.filter(
        (value) =>
          value.command === command.command ||
          value.command.includes(command.command)
      );

      if (isExists.length > 0) {
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

if (process.env.NODE_ENV === "production") {
  logger.info("Init remote");
  puppetterArgs = puppetterArgs.concat([
    "--disable-gpu",
    "--disable-setuid-sandbox",
  ]);
  mongoose.connect(process.env.MONGODB_URI!).then(() => {
    logger.info("Connected to mongoose");
    const store = new MongoStore({ mongoose: mongoose });
    authStrategy = new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000,
    });

    client
      .initialize()
      .then(() => console.log("ok"))
      .catch((err) => logger.error(err));
  });
} else {
  logger.info("Init local");
  client
    .initialize()
    .then(() => console.log("ok"))
    .catch((err) => logger.error(err));
}
