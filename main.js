const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: "Simulador de Indução Eletromagnética",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        show: false, // Ocultar até estar carregado para evitar flash branco
        backgroundColor: '#0f172a' // Cor de fundo base do CSS original
    });

    // Remove a barra de menus para um visual mais limpo e imersivo
    mainWindow.setMenuBarVisibility(false);

    // Carrega o index.html da aplicação
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Abre o ecrã numa janela maximizada/pronta para o utilizador
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        // No macOS é comum recriar a janela quando se clica no ícone da dock
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    // No macOS, sai-se de forma explícita com Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});
