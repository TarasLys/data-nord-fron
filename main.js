
import { app, BrowserWindow, dialog } from 'electron';
import { spawn } from 'child_process';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Защита от второго экземпляра
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Устанавливаем userData до app.whenReady()
if (app.isPackaged) {
  const userDataPath = path.join(app.getPath('home'), '.myapp-user-data');
  try {
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    app.setPath('userData', userDataPath);
  } catch (err) {
    dialog.showErrorBox('User Data Error', `Не удалось установить userData: ${err.message}`);
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let serverProcess;
let serverStarted = false; // Флаг для предотвращения повторного запуска сервера

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = app.isPackaged
    ? 'http://localhost:5001/'
    : 'http://localhost:5173/';
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Запуск серверного процесса с логированием в файл (только в production)
function startServer() {
  if (serverStarted) return; // Не даём запустить второй раз
  serverStarted = true;

  const serverPath = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'server.js')
    : join(__dirname, 'server.js');

  // cwd должен быть process.resourcesPath в production!
  const cwd = app.isPackaged ? process.resourcesPath : __dirname;

  const logFile = path.join(app.getPath('userData'), 'server.log');
  console.log('Server log path:', logFile);
  const out = fs.createWriteStream(logFile, { flags: 'a' });

  console.log('Spawning server with:');
  console.log('  node:', process.platform === 'win32' ? 'node.exe' : 'node');
  console.log('  serverPath:', serverPath);
  console.log('  cwd:', cwd);

  // Используем node, а не Electron!
  const nodeExec = process.platform === 'win32' ? 'node.exe' : 'node';

  serverProcess = spawn(nodeExec, [serverPath], {
    cwd,
    shell: true, // чтобы node.exe был найден в PATH
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: app.isPackaged ? 'production' : 'development' },
  });

  serverProcess.stdout.pipe(out);
  serverProcess.stderr.pipe(out);

  serverProcess.on('error', (err) => {
    dialog.showErrorBox('Ошибка сервера', `Не удалось запустить сервер: ${err.message}`);
    app.quit();
  });

  serverProcess.on('close', (code) => {
    dialog.showErrorBox('Сервер завершён', `Сервер завершил работу с кодом ${code}. См. server.log для подробностей.`);
    app.quit();
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code}, signal ${signal}`);
  });
}

function killProcess(proc) {
  if (proc) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
      } else {
        process.kill(-proc.pid, 'SIGKILL');
      }
    } catch {
      // Уже завершён
    }
  }
}

// Функция для обновления окна ровно в 14:00, только один раз в сутки
function reloadWindowAtSpecificTime(hour = 14, minute = 0) {
  let alreadyReloadedToday = false;
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === hour && now.getMinutes() === minute) {
      if (!alreadyReloadedToday && mainWindow) {
        mainWindow.reload();
        alreadyReloadedToday = true;
      }
    } else if (now.getHours() !== hour || now.getMinutes() !== minute) {
      alreadyReloadedToday = false;
    }
  }, 10 * 1000);
}

app.whenReady().then(() => {
  // Сервер запускаем только в production!
  if (app.isPackaged) {
    startServer();
    setTimeout(() => {
      createWindow();
      reloadWindowAtSpecificTime(14, 0);
    }, 8000);
  } else {
    // В dev-режиме сервер запускается отдельно!
    createWindow();
    reloadWindowAtSpecificTime(14, 0);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    killProcess(serverProcess);
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    // startServer(); // НЕ вызываем здесь!
  }
});






///////////////// рабочиий файл 1 //////////////////////
// import { app, BrowserWindow } from 'electron';
// import { spawn } from 'child_process';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';



// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// let mainWindow;
// let serverProcess;
// let viteProcess;

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//     },
//   });

//   mainWindow.loadURL('http://localhost:5173/');
//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });
// }

// // Запуск серверного процесса
// function startServer() {
//   serverProcess = spawn('node', ['server.js'], {
//     cwd: __dirname,
//     shell: true,
//     stdio: 'inherit',
//   });

//   serverProcess.on('error', (err) => {
//     console.error('Ошибка запуска сервера:', err);
//     app.quit();
//   });

//   serverProcess.on('close', (code) => {
//     console.log(`Server process exited with code ${code}`);
//     if (viteProcess) killProcess(viteProcess);
//     app.quit();
//   });
// }

// // Запуск frontend (Vite)
// function startFrontend() {
//   viteProcess = spawn('npm', ['run', 'dev'], {
//     cwd: __dirname,
//     shell: true,
//     stdio: 'inherit',
//   });

//   viteProcess.on('error', (err) => {
//     console.error('Ошибка запуска Vite:', err);
//     if (mainWindow) mainWindow.close();
//     app.quit();
//   });

//   viteProcess.on('close', (code) => {
//     console.log(`Vite process exited with code ${code}`);
//     if (mainWindow) mainWindow.close();
//     app.quit();
//   });
// }

// function killProcess(proc) {
//   if (proc) {
//     try {
//       if (process.platform === 'win32') {
//         spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
//       } else {
//         process.kill(-proc.pid, 'SIGKILL');
//       }
//     } catch {
//       // Может быть уже завершён
//     }
//   }
// }

// // Функция для обновления окна ровно в 14:00, только один раз в сутки
// function reloadWindowAtSpecificTime(hour = 14, minute = 0) {
//   let alreadyReloadedToday = false;
//   setInterval(() => {
//     const now = new Date();
//     if (now.getHours() === hour && now.getMinutes() === minute) {
//       if (!alreadyReloadedToday && mainWindow) {
//         mainWindow.reload();
//         alreadyReloadedToday = true;
//       }
//     } else if (now.getHours() !== hour || now.getMinutes() !== minute) {
//       // Сброс флага после 14:00, чтобы на следующий день снова сработало
//       alreadyReloadedToday = false;
//     }
//   }, 10 * 1000); // Проверяем каждые 10 секунд
// }

// app.whenReady().then(() => {
//   startServer();

//   setTimeout(() => {
//     startFrontend();

//     setTimeout(() => {
//       createWindow();
//       reloadWindowAtSpecificTime(14, 0); // Обновлять ровно в 14:00
//     }, 4000);
//   }, 4000);
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     killProcess(serverProcess);
//     killProcess(viteProcess);
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

// import { app, BrowserWindow } from 'electron';
// import { spawn } from 'child_process';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// // Импортируем функцию вычисления даты
// import { setDateToSpecificTime } from './src/utils/setDate.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// let mainWindow;
// let serverProcess;
// let viteProcess;
// let lastDate = setDateToSpecificTime(); // Сохраняем начальную дату

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//     },
//   });

//   mainWindow.loadURL('http://localhost:5173/');
//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });
// }

// function restartWindowIfDateChanged() {
//   const currentDate = setDateToSpecificTime();
//   if (currentDate !== lastDate) {
//     lastDate = currentDate;
//     if (mainWindow) {
//       mainWindow.close();
//     }
//     // Открываем новое окно с актуальной датой
//     createWindow();
//   }
// }

// // Запуск серверного процесса
// function startServer() {
//   serverProcess = spawn('node', ['server.js'], {
//     cwd: __dirname,
//     shell: true,
//     stdio: 'inherit',
//   });

//   serverProcess.on('error', (err) => {
//     console.error('Ошибка запуска сервера:', err);
//     app.quit();
//   });

//   serverProcess.on('close', (code) => {
//     console.log(`Server process exited with code ${code}`);
//     if (viteProcess) killProcess(viteProcess);
//     app.quit();
//   });
// }

// // Запуск frontend (Vite)
// function startFrontend() {
//   viteProcess = spawn('npm', ['run', 'dev'], {
//     cwd: __dirname,
//     shell: true,
//     stdio: 'inherit',
//   });

//   viteProcess.on('error', (err) => {
//     console.error('Ошибка запуска Vite:', err);
//     if (mainWindow) mainWindow.close();
//     app.quit();
//   });

//   viteProcess.on('close', (code) => {
//     console.log(`Vite process exited with code ${code}`);
//     if (mainWindow) mainWindow.close();
//     app.quit();
//   });
// }

// function killProcess(proc) {
//   if (proc) {
//     try {
//       if (process.platform === 'win32') {
//         spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
//       } else {
//         process.kill(-proc.pid, 'SIGKILL');
//       }
//     } catch {
//       // Может быть уже завершён
//     }
//   }
// }

// app.whenReady().then(() => {
//   startServer();

//   setTimeout(() => {
//     startFrontend();

//     setTimeout(() => {
//       createWindow();

//       // Запускаем таймер для проверки смены даты каждую минуту
//       setInterval(restartWindowIfDateChanged, 60 * 1000);
//     }, 4000);
//   }, 4000);
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     killProcess(serverProcess);
//     killProcess(viteProcess);
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });


// import { app, BrowserWindow } from 'electron';
// import { spawn } from 'child_process';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// let mainWindow;
// let serverProcess;
// let viteProcess;

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//     },
//   });

//   mainWindow.loadURL('http://localhost:5173/');
//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });
// }

// function startServer() {
//   serverProcess = spawn('node', ['server.js'], {
//     cwd: __dirname,
//     shell: true,
//     stdio: 'inherit',
//   });

//   serverProcess.on('error', (err) => {
//     console.error('Ошибка запуска сервера:', err);
//     app.quit();
//   });

//   serverProcess.on('close', (code) => {
//     console.log(`Server process exited with code ${code}`);
//     if (viteProcess) killProcess(viteProcess);
//     app.quit();
//   });
// }

// function startFrontend() {
//   viteProcess = spawn('npm', ['run', 'dev'], {
//     cwd: __dirname,
//     shell: true,
//     stdio: 'inherit',
//   });

//   viteProcess.on('error', (err) => {
//     console.error('Ошибка запуска Vite:', err);
//     if (mainWindow) mainWindow.close();
//     app.quit();
//   });

//   viteProcess.on('close', (code) => {
//     console.log(`Vite process exited with code ${code}`);
//     if (mainWindow) mainWindow.close();
//     app.quit();
//   });
// }

// function killProcess(proc) {
//   if (proc) {
//     try {
//       if (process.platform === 'win32') {
//         spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
//       } else {
//         process.kill(-proc.pid, 'SIGKILL');
//       }
//     } catch {
//       // Может быть уже завершён
//     }
//   }
// }

// app.whenReady().then(() => {
//   startServer();

//   setTimeout(() => {
//     startFrontend();

//     setTimeout(() => {
//       createWindow();
//     }, 4000);
//   }, 4000);
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     killProcess(serverProcess);
//     killProcess(viteProcess);
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });