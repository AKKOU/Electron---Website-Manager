const {app,BrowserWindow,ipcMain} = require('electron')
const path = require('path')

function createWindow() {
    let win = new BrowserWindow({
        width: 1000,
        height: 800,
        minWidth: 750,
        minHeight:850,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname,'renderer.js'),
        },
        frame: false
    })

    ipcMain.on('minimize-window',function(){
        win.minimize();
    })

    ipcMain.on('maximize-window',function(){
        if(!win.isMaximized()){
            win.maximize();
        }
        else{
            win.unmaximize();
        }
    })

    ipcMain.on('close-window',function(){
        win.close();
    })

    ipcMain.on('page-home',function(){
        
    })

    win.loadFile('index.html')
}

app.whenReady().then(createWindow)