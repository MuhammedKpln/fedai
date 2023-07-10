import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from "whatsapp-web.js";

const client = new Client({
  puppeteer: { headless: false, args: ["--no-sandbox"] },
  authStrategy: new LocalAuth({ clientId: "fedai" }),
});


client.on("qr", (qr) => {
  console.log(`Scan this QR Code and copy the JSON\n`);
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  client.destroy();
  console.log("Please wait...");
  // wait because filesystem is busy
  setTimeout(async () => {
    console.log("Session has been created");
    process.exit();
  }, 3000);
});

client.initialize();
 