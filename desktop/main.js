/* The desktop shell.

   A browser tab can never show youtube.com inside the app: the site answers
   with X-Frame-Options: SAMEORIGIN and every browser honours it. A desktop
   window can, because Electron's <webview> is a real browsing context rather
   than an iframe — which is also why a YouTube login persists inside it.

   Everything else is unchanged: this window just loads the same local server
   that `run.sh` starts. */

const { app, BrowserWindow, session } = require("electron");

const APP_URL = process.env.KARAOKE_URL || "http://127.0.0.1:8770/";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    title: "KaraokeBox",
    backgroundColor: "#0e0b18",
    autoHideMenuBar: true,
    webPreferences: {
      // The whole point of the desktop build.
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(APP_URL);
  win.webContents.on("did-fail-load", (_event, code, description) => {
    win.loadURL(
      "data:text/html," +
        encodeURIComponent(
          `<body style="background:#0e0b18;color:#f2eefb;font:15px -apple-system;padding:40px">
             <h2>KaraokeBox is not running</h2>
             <p>Could not reach ${APP_URL} — ${description} (${code}).</p>
             <p>Start it with <code>./run.sh</code>, or use <code>./run-desktop.sh</code>
                which starts both.</p>
           </body>`,
        ),
    );
  });

  return win;
}

app.whenReady().then(() => {
  // YouTube serves a cut-down page to anything it thinks is not a real browser.
  const youtube = session.fromPartition("persist:youtube");
  youtube.setPermissionRequestHandler((_wc, permission, callback) => {
    // The embedded browser needs nothing but the ability to play media.
    callback(["media", "fullscreen"].includes(permission));
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
