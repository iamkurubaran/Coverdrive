// Coverdrive desktop — Electron main process.
// The renderer is a local, dependency-free port of the web client; all data
// comes from the deployed Coverdrive server (see SERVER below), so the app
// works the same on Windows and macOS with no local server.

const { app, BrowserWindow, Menu, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const SERVER = "https://gitcoverdrive.onrender.com";
const isMac = process.platform === "darwin";

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 880,
    minHeight: 620,
    backgroundColor: "#08090b",
    title: "Coverdrive",
    icon: path.join(__dirname, "build", "icon.png"),
    // Frameless-feeling title bar on macOS; the renderer marks the top bar
    // as the drag region.
    titleBarStyle: isMac ? "hiddenInset" : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Optional deep link: `npm start -- torvalds` (or COVERDRIVE_SCOUT=torvalds)
  // opens the app straight onto that player's report.
  const scout = process.env.COVERDRIVE_SCOUT || process.argv.find((a, i) => i >= 2 && /^[a-z\d-]{1,39}$/i.test(a) && !a.startsWith("-"));
  win.loadFile(path.join(__dirname, "renderer", "index.html"), {
    query: scout ? { u: scout } : undefined,
  });

  // Every external link opens in the system browser, never in-app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://")) {
      e.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  // Surface renderer problems in the terminal during development.
  // (Electron ≥32 passes an event object; older versions positional args.)
  win.webContents.on("console-message", (event, legacyLevel, legacyMessage) => {
    const level = event?.level ?? legacyLevel;
    const message = event?.message ?? legacyMessage;
    if (level === "error" || level === "warning" || (typeof level === "number" && level >= 2)) {
      console.error(`[renderer] ${message}`);
    }
  });

  // Smoke-test hook: COVERDRIVE_SCREENSHOT=/path/out.png renders the app,
  // captures the window, and exits — used to verify the UI headlessly.
  const shotPath = process.env.COVERDRIVE_SCREENSHOT;
  if (shotPath) {
    win.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
        try {
          const image = await win.webContents.capturePage();
          fs.writeFileSync(shotPath, image.toPNG());
          console.log(`screenshot written: ${shotPath}`);
        } catch (err) {
          console.error(`screenshot failed: ${err.message}`);
        } finally {
          app.quit();
        }
      }, Number(process.env.COVERDRIVE_SCREENSHOT_DELAY || 4000));
    });
  }

  return win;
}

function buildMenu() {
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "Open Coverdrive Web App",
          click: () => shell.openExternal(SERVER),
        },
        {
          label: "Coverdrive on GitHub",
          click: () => shell.openExternal("https://github.com/iamkurubaran/Coverdrive"),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    buildMenu();
    mainWindow = createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (!isMac) app.quit();
  });
}
