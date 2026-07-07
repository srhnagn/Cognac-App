import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0b0c10',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // HACKER MODE: APPLE CORS BYPASS ONLY FOR API
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [
      '*://api.music.apple.com/*',
      '*://amp-api.music.apple.com/*',
      '*://play.itunes.apple.com/*'
    ] },
    (details, callback) => {
      details.requestHeaders['Origin'] = 'https://music.apple.com';
      details.requestHeaders['Referer'] = 'https://music.apple.com/';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadURL('http://localhost:5173');
  }
}

app.commandLine.appendSwitch('no-sandbox');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
