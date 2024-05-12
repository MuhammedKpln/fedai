import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  WAMessageContent,
  WAMessageKey,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import NodeCache from "node-cache";
import fs from "node:fs/promises";
import path from "node:path";
import { Logger } from "./logger.js";

const authRootFolder = path.resolve("..", "..", "auth");
const storeMultiFilePath = path.resolve(
  authRootFolder,
  "baileys_store_multi.json"
);
const baileysAuthPath = path.resolve(authRootFolder, "baileys");

const logger = Logger.child({
  module: "connection",
});

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache();

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ logger });
store.readFromFile(storeMultiFilePath);
// save every 10s
setInterval(() => {
  store?.writeToFile(storeMultiFilePath);
}, 10_000);

// // start a connection

const startSocket = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(baileysAuthPath);
  // fetch latest version of WA Web
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: false,
    getMessage,
  });

  store?.bind(sock.ev);

  sock.ev.on("creds.update", async () => {
    await saveCreds();
  });

  sock.ev.on("connection.update", async (conn) => {
    const { connection, lastDisconnect } = conn;
    if (connection === "close") {
      // reconnect if not logged out
      const errorStatusCode = (lastDisconnect?.error as Boom)?.output
        ?.statusCode;
      if (errorStatusCode !== DisconnectReason.loggedOut) {
        await startSocket();
      } else if (errorStatusCode === DisconnectReason.loggedOut) {
        logger.info("Logged out, Removing auth folder.");
        await fs.rmdir(authRootFolder, { recursive: true });
        await startSocket();
      } else {
        console.log("Connection closed. You are logged out.");
      }
    }

    console.log("connection update", conn);
  });

  return sock;

  async function getMessage(
    key: WAMessageKey
  ): Promise<WAMessageContent | undefined> {
    if (store) {
      const msg = await store.loadMessage(key.remoteJid!, key.id!);
      return msg?.message || undefined;
    }

    // only if store is present
    return proto.Message.fromObject({});
  }
};

export { startSocket };
