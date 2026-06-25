const { app, BrowserWindow, ipcMain, shell, Notification, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// GPU ayarları varsayılan bırakıldı (WebGL'in çalışabilmesi için)
app.commandLine.appendSwitch('ignore-certificate-errors');
// Arka plan kısıtlamalarını kapat (Mail/Bildirim arka planda çalışsın)
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
// WebRTC (Kamera) ve Şeffaf Pencere çakışmasını (çökmeyi) engellemek için
app.commandLine.appendSwitch('disable-direct-composition');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 430,
    height: 932,
    minWidth: 390,
    minHeight: 800,
    frame: false,
    titleBarStyle: 'hidden',
    transparent: true,         // Arka planı tamamen şeffaf yapar
    backgroundColor: '#00000000', // Şeffaflık için 8 haneli hex kodu
    resizable: true,
    center: true,
    show: false,
    icon: path.join(__dirname, '../dist/favicon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,        // iframe (Safari uygulaması) için gerekli
      allowRunningInsecureContent: true,
      backgroundThrottling: false, // Minimized olunca bile Supabase realtime kopmasın
      preload: path.join(__dirname, 'preload.cjs'),
    }
  });

  if (app.isPackaged) {
    // Production (Build) durumu: Doğrudan yerel dosyayı yükle, localhost'u bekleme
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(e => console.error('Load error:', e));
  } else {
    // Geliştirme (Dev) durumu: Vite dev server'a bağlanmayı dene
    const devURL = 'https://localhost:5173';
    mainWindow.loadURL(devURL).catch(() => {
      // Dev server kapalıysa fallback
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(e => console.error('Load error:', e));
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // DevTools — geliştirme için (yorum satırı yapabilirsin)
  // mainWindow.webContents.openDevTools();

  // Harici linkleri varsayılan tarayıcıda aç
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Gerekli Windows / Sistem İzinlerini Otomatik Onayla (Kamera, Mikrofon, Konum, Bildirim)
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'geolocation', 'notifications', 'camera', 'microphone'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    const allowedPermissions = ['media', 'geolocation', 'notifications', 'camera', 'microphone'];
    if (allowedPermissions.includes(permission)) {
      return true;
    }
    return false;
  });

  // IPC handlers
  ipcMain.on('window-close',    () => app.quit());
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });

  ipcMain.on('show-notification', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body, icon: path.join(__dirname, '../dist/favicon.svg') }).show();
    }
  });

  ipcMain.on('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
  });

  ipcMain.handle('get-login-settings', () => {
    return app.getLoginItemSettings().openAtLogin;
  });
  
  ipcMain.on('set-login-settings', (event, openAtLogin) => {
    app.setLoginItemSettings({
      openAtLogin,
      path: app.getPath('exe')
    });
  });

  // Fotoğraf işlemleri
  const photosDir = path.join(path.dirname(app.getPath('exe')), 'Tuzluca_Photos');
  
  ipcMain.handle('save-photo', (event, base64Data) => {
    try {
      if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
      const filename = `Photo_${Date.now()}.jpg`;
      const filePath = path.join(photosDir, filename);
      const base64Image = base64Data.split(';base64,').pop();
      fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });
      return { success: true, path: filePath, dataUrl: base64Data };
    } catch (err) {
      console.error('Save photo error:', err);
      // Fallback to AppData if exe directory is write-protected
      try {
        const fallbackDir = path.join(app.getPath('userData'), 'Tuzluca_Photos');
        if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
        const filePath = path.join(fallbackDir, `Photo_${Date.now()}.jpg`);
        const base64Image = base64Data.split(';base64,').pop();
        fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });
        return { success: true, path: filePath, dataUrl: base64Data };
      } catch (fallbackErr) {
        return { success: false, error: fallbackErr.message };
      }
    }
  });

  ipcMain.handle('read-photos', () => {
    const readDir = (dir) => {
      if (!fs.existsSync(dir)) return [];
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'));
      return files.map(f => {
        const p = path.join(dir, f);
        const data = fs.readFileSync(p, { encoding: 'base64' });
        return { path: p, url: `data:image/jpeg;base64,${data}` };
      });
    };
    
    try {
      const p1 = readDir(photosDir);
      const p2 = readDir(path.join(app.getPath('userData'), 'Tuzluca_Photos'));
      // Combine and sort by filename (descending, which implies newest first due to timestamp naming)
      const combined = [...p1, ...p2].sort((a, b) => b.path.localeCompare(a.path));
      return combined;
    } catch (e) {
      return [];
    }
  });

  ipcMain.handle('delete-photo', (e, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.tuzlucasocial.app');
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
