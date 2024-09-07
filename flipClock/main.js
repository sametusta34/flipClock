const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { GlobalKeyboardListener } = require('node-global-key-listener');
let windows = [];
let passwordWindow = null;
let isExiting = false;

function createWindows() {
    const displays = screen.getAllDisplays();
    windows = displays.map((display) => {
        const win = new BrowserWindow({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height,
            skipTaskbar: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'), // Preload script
                contextIsolation: true,
                enableRemoteModule: false,
            },
            fullscreen: true,
            frame: false,
            alwaysOnTop: true,
            backgroundColor: '#000000', // Arka plan rengini siyah yap
        });

        win.loadFile(path.join(__dirname, 'index.html'));

        win.on('closed', () => {
            const index = windows.indexOf(win);
            if (index > -1) {
                windows.splice(index, 1);
            }
        });

        win.webContents.on('before-input-event', (event, input) => {
            if (input.type === 'keyDown') {
                console.log(input);
                if (
                    (input.control) ||
                    (input.meta) ||
                    (input.shift) ||
                    (input.control && input.shift) ||
                    (input.control && input.key.toLowerCase() === 'alt' && input.key.toLowerCase() === 'delete') || // Ctrl+Alt+Delete
                    (input.control && input.shift && input.key.toLowerCase() === 'escape') || // Ctrl+Shift+Esc
                    (input.alt && input.key.toLowerCase() === 'f4') || // Alt+F4
                    (input.key.toLowerCase() === 'meta') || // Windows tuşu
                    (input.alt && input.key.toLowerCase() === 'tab') || // Alt+Tab
                    (input.code === 'MetaLeft') || // Sol Windows tuşu
                    (input.code === 'MetaRight') // Sağ Windows tuşu
                ) {
                    console.log('Kombinasyon engellendi', input);
                    event.preventDefault();
                    return false;
                }
            }
        });

        win.focus(); // Pencereye odaklan

        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        win.setAlwaysOnTop(true, 'screen-saver', 1);

        return win;
    });

}


function createPasswordWindow() {
    if (passwordWindow) {
        return;
    }

    passwordWindow = new BrowserWindow({
        width: 300,
        height: 150,
        parent: windows[0],
        modal: true,
        fullscreen: true,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
        frame: false,
        alwaysOnTop: true,
        backgroundColor: '#000000',
    });

    passwordWindow.loadFile(path.join(__dirname, 'password.html'));


    passwordWindow.on('closed', () => {
        passwordWindow = null;
        if (isExiting) {
            isExiting = false; // Çıkış işlemi iptal edildi
        }
    });

    passwordWindow.focus(); // Şifre penceresine odaklan

    passwordWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    passwordWindow.setAlwaysOnTop(true, 'screen-saver', 1);
}

app.whenReady().then(createWindows);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (windows.length === 0) {
        createWindows();
    }
});

ipcMain.on('double-click', () => {
    createPasswordWindow();
});

ipcMain.on('esc-press', () => {
    if (!isExiting) {
        createPasswordWindow();
    }
});

ipcMain.on('check-password', (event, password) => {
    const correctPassword = '123456';
    if (password === correctPassword) {
        app.quit();
    } else {
        if (passwordWindow) {
            passwordWindow.close();
            windows[0].focus();
        }
    }
});

ipcMain.on('password-incorrect', () => {
    if (passwordWindow) {
        passwordWindow.close();
    }
});