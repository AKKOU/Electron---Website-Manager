const { info } = require('console');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const path = require('path');

require('dotenv').config();

log.transports.file.level = 'info';
log.info('App Starting...');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

Object.defineProperty(app, 'isPackaged', {
    get() {
      return true;
    }
});

autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');

autoUpdater.on('update-available',(info) => {
    dialog.showMessageBox({
        type:'info',
        title: 'Update available',
        message: 'A new version is available, Do you want to update now?',
        buttons: ['Yes','No']
    }).then(result => {
        if(result.response === 0){
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-downloaded',(info) => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: 'Install & Restart NOW?',
        buttons: ['Yes','Later']
    }).then(result => {
        if(result.response === 0){
            autoUpdater.quitAndInstall();
        }
    })
})

function createWindow() {
    let win = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1300,
        minHeight:850,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname,'renderer.js'),
        },
        frame: false,
        icon: 'img/icon.png'
    })

    //min-win
    ipcMain.on('minimize-window',function(){
        win.minimize();
    })

    //max-win
    ipcMain.on('maximize-window',function(){
        if(!win.isMaximized()){
            win.maximize();
        }
        else{
            win.unmaximize();
        }
    })

    //close page
    ipcMain.on('close-window',function(){
        win.close();
    })

    //load HTML
    win.loadFile('index.html');
    // win.webContents.openDevTools();

    //Send DB data to renderer
    win.webContents.on('did-finish-load',()=>{
        win.webContents.send('env',{
            DB_HOST: process.env.DB_HOST,
            DB_USER: process.env.DB_USER,
            DB_PASSWORD: process.env.DB_PASSWORD,
            DB_NAME: process.env.DB_NAME,
            SERVER_HOST: process.env.SERVER_HOST,
            SERVER_USER: process.env.SERVER_USER,
            SERVER_PASSWORD: process.env.SERVER_PASSWORD
        });
    })
}

app.whenReady().then(() => {
    autoUpdater.checkForUpdatesAndNotify();
    createWindow();
});