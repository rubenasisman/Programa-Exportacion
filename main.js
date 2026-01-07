const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sql = require('mssql');

let mainWindow;
let dbPool = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "SQL Exporter PRO - Asisman",
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

// --- MEJORA: LOGS DETALLADOS Y CONFIGURACIÓN DE POOL ---
ipcMain.handle('db-connect', async (event, config) => {
    try {
        if (dbPool) {
          await dbPool.close();
        }

        const sqlConfig = {
            user: config.user,
            password: config.password,
            database: config.database,
            server: config.server,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            },
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true,
                requestTimeout: 180000 // 3 min para no colgar el proceso
            }
        };

        dbPool = await new sql.ConnectionPool(sqlConfig).connect();
        return { success: true };

    } catch (err) {
        // MEJORA: LOGS ESPECÍFICOS PARA EL USUARIO SEGÚN EL CÓDIGO DE ERROR
        let friendlyMessage = err.message;
        if (err.code === 'ETIMEOUT') {
          friendlyMessage = "Tiempo de espera agotado. Verifique que el servidor SQL permita conexiones remotas (Puerto 1433).";
        } else if (err.code === 'ELOGIN') {
          friendlyMessage = "Error de autenticación: El usuario o la contraseña de SQL son incorrectos.";
        } else if (err.message.includes('getaddrinfo')) {
          friendlyMessage = "Servidor no encontrado. Verifique el nombre de la instancia o IP.";
        }
        
        return { 
          success: false, 
          message: friendlyMessage, 
          code: err.code 
        };
    }
});

ipcMain.handle('db-execute', async (event, query) => {
  try {
    if (!dbPool || !dbPool.connected) {
        throw new Error("Sesión SQL perdida. Por favor, reconecte en el paso anterior.");
    }
    
    const request = dbPool.request();
    request.timeout = 300000; // 5 minutos para queries muy pesadas

    const result = await request.query(query);
    
    return { success: true, data: result.recordset };
  } catch (err) {
    // Captura errores específicos de SQL Server (Tablas inexistentes, errores de sintaxis, etc)
    return { 
        success: false, 
        message: err.precedingErrors?.[0]?.message || err.message,
        code: err.number 
    };
  }
});