const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sql = require('mssql');

let mainWindow;
let dbPool = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Gestor de Precios - Exportación ICG",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('public/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

//--- MANEJADORES DE BASE DE DATOS (IPC)
ipcMain.handle('db-connect', async (event, config) => {
  try {
    if (dbPool) {
      await dbPool.close();
      dbPool = null;
    }
    const sqlConfig = {
      user: config.user,
      password: config.password,
      database: config.database,
      server: config.server,
      pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
      },
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 300000 // 5 minutos de timeout
      }
    };
    dbPool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log("Conexión SQL establecida con éxito.");
    return { success: true, message: "Conectado correctamente" };
  } catch (err) {
    console.error("Error SQL Connect:", err);
    dbPool = null;
    return { success: false, message: err.message };
  }
});

ipcMain.handle('db-execute', async (event, query) => {
  try {
    if (!dbPool || !dbPool.connected) {
      throw new Error("No hay conexión activa. Por favor, conéctese de nuevo.");
    }
    const request = dbPool.request();
    request.timeout = 300000; // 5 minutos
    const result = await request.query(query);
    return { success: true, data: result.recordset, rowsAffected: result.rowsAffected };
  } catch (err) {
    console.error("Error SQL Query:", err);
    return { success: false, message: err.message };
  }
});