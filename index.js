const { app, BrowserWindow, Menu, ipcMain, contextBridge, shell } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
require('dotenv').config(); // Đọc biến môi trường từ file .env
// Hoặc cách khác
const isDev = process.argv.includes('--dev')

let mainWindow
let projectPath
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    backgroundColor: '#0000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
    icon: 'src/assets/img/logo.ico'
  });
  
  if (isDev) {
    console.log('🔧 Development mode');
    mainWindow.loadURL('http://localhost:9911/');
    mainWindow.webContents.openDevTools();
  } else {
    console.log('📦 Production mode');
    mainWindow.loadFile('public/dist/index.html');
  }

  projectPath = app.getAppPath();
  if (!isDev) {
    projectPath = path.dirname(app.getPath('exe'))
  }
}
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  app.quit();
});


ipcMain.on('window-run-application', async (event, data) => {
  console.log("--Active")
});

(async () => {
  const machineId = await machineIdSync();
  try {
    mainWindow.webContents.send('profile-status', JSON.stringify({
      status: "machineIdSync",
      machineId
    }));
  } catch (error) { }
})();

ipcMain.handle('open-app', async (event, objectData) => {
  try {


    return { success: true };
  } catch (error) {
    return { success: false, error };
  }

});
