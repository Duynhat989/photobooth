const { app, BrowserWindow, Menu, ipcMain, contextBridge, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { machineIdSync } = require('node-machine-id');
require('dotenv').config(); // Đọc biến môi trường từ file .env


const { initServer } = require('./mobile_links/index');
const { projectPath } = require('./config');

// Hoặc cách khác
const isDev = process.argv.includes('--dev')

let mainWindow
let projectDir = projectPath()

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

ipcMain.handle('print-html', async (event, htmlContent) => {
    console.log("📄 Nhận HTML để in");

    const tempDir = path.join(projectDir, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const tempFile = path.join(tempDir, `print_${Date.now()}.html`);

    fs.writeFileSync(tempFile, htmlContent, 'utf8');

    // Tạo cửa sổ preview
    const printWin = new BrowserWindow({
        show: true,
        width: 800,
        height: 600
    });

    await printWin.loadFile(tempFile);

    // Khi load xong thì mở hộp thoại preview
    printWin.webContents.on('did-finish-load', () => {
        printWin.webContents.print({ silent: false });
    });

    // Khi đóng cửa sổ thì xoá file tạm
    printWin.on('closed', () => {
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    });

    // Trả kết quả ngay cho renderer, không chờ người dùng bấm in/cancel
    return { status: 'preview-opened' };
});





initServer()