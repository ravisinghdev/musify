const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain } = require("electron");
const path = require("path");

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: "Musify",
    backgroundColor: "#07090e",
    icon: path.join(__dirname, "assets", "icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Ensures music never stutters or stops when minimized
      webSecurity: true,
    },
  });

  const appUrl = process.env.MUSIFY_URL || "http://localhost:3000";

  mainWindow.loadURL(appUrl).catch((err) => {
    console.error("Failed to load window URL:", err);
    // Retry once after 2 seconds if server was still spinning up
    setTimeout(() => {
      mainWindow.loadURL(appUrl).catch(() => {});
    }, 2000);
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  setupTray();
  registerShortcuts();
}

function setupTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, "assets", "icon.png");
  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Open Musify",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: "separator" },
      {
        label: "Play / Pause",
        click: () => sendMediaAction("toggle-play"),
      },
      {
        label: "Next Track",
        click: () => sendMediaAction("next"),
      },
      {
        label: "Previous Track",
        click: () => sendMediaAction("prev"),
      },
      { type: "separator" },
      {
        label: "Quit Musify",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("Musify - Premium Music Streaming");
    tray.setContextMenu(contextMenu);

    tray.on("double-click", () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (err) {
    console.warn("Could not create system tray icon:", err);
  }
}

function sendMediaAction(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("media-control", action);
  }
}

function registerShortcuts() {
  globalShortcut.register("MediaPlayPause", () => sendMediaAction("toggle-play"));
  globalShortcut.register("MediaNextTrack", () => sendMediaAction("next"));
  globalShortcut.register("MediaPreviousTrack", () => sendMediaAction("prev"));
}

// Window control IPC handlers
ipcMain.on("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("window-close", () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

