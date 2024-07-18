const {app,BrowserWindow,ipcMain} = require('electron')
const path = require('path');

require('dotenv').config();

function createWindow() {
    let win = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 750,
        minHeight:850,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname,'renderer.js'),
        },
        frame: false
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
    win.loadFile('index.html')
    win.webContents.openDevTools();

    //Send DB data to renderer
    win.webContents.on('did-finish-load',()=>{
        win.webContents.send('env',{
            DB_HOST: process.env.DB_HOST,
            DB_USER: process.env.DB_USER,
            DB_PASSWORD: process.env.DB_PASSWORD,
            DB_NAME: process.env.DB_NAME
        });
    })
}

app.whenReady().then(createWindow)