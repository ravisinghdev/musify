const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("musifyDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "1.0.0",
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  onMediaAction: (callback) => {
    ipcRenderer.on("media-control", (_event, action) => callback(action));
  },
});

