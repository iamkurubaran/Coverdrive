// Minimal, read-only bridge: the renderer only needs to know the platform
// (macOS gets a draggable inset title bar) and versions for the footer.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("coverdrive", {
  platform: process.platform,
  electronVersion: process.versions.electron,
});
