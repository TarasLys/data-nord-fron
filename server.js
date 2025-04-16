
console.log('=== server.js STARTED ===');

import express from 'express';
import cors from 'cors';
import fetchPostlist from './src/scripts/fetchPostlist.js';
import dotenv from 'dotenv';
//import process from "process";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config(); // Подгружаем переменные окружения

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.REACT_APP_PORT || 5001; // Используем порт из переменных окружения или стандартный 5001

app.use(cors()); // Разрешаем CORS

// Простое логирование всех входящих запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

let lastSentDate = ''; // Отслеживание последней отправленной даты

app.get('/api/postlist', async (req, res) => {
  const { date } = req.query;

  // Проверка корректности параметра date
  if (!date || isNaN(Date.parse(date))) {
    console.error('Ugyldig datoformat:', date);
    return res.status(400).json({ error: 'Ugyldig datoformat.' });
  }

  try {
    const data = await fetchPostlist(date); // Извлечение данных с сайта

    if (data.length > 0 && date !== lastSentDate) {
      const emailText = data
        .map(
          (entry) =>
            `Dato: ${entry.date}\nTittel: ${entry.title}\nAnsvarlig enhet: ${entry.unit}`
        )
        .join('\n');

      console.log(`Klart for å sende e-post: ${emailText}`);
      lastSentDate = date;
    } else if (data.length === 0) {
      console.log(`Ingen data for valgt dato: ${date}`);
    }

    res.json(data); // Отправка данных клиенту
  } catch (error) {
    console.error('Feil på serveren:', error.message);
    res.status(500).json({ error: 'Feil ved henting av data.' });
  }
});

// --- ОТДАЁМ production-статик из dist ---
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: только если не /api/*
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Обработка несуществующих API-маршрутов (404)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ikke funnet.' });
});

// Graceful shutdown для Electron/Node
const server = app.listen(PORT, () => {
  console.log(`Server kjører på http://localhost:${PORT}`);
});

// Обработка ошибок запуска сервера (например, если порт занят)
server.on('error', (err) => {
  console.error('Ошибка запуска сервера:', err);
});

function shutdown() {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('=== server.js FINISHED ===');






//////////////// рабочий код 1 //////////////////////////////
// import express from 'express';
// import cors from 'cors';
// import fetchPostlist from './src/scripts/fetchPostlist.js';
// import dotenv from 'dotenv';
// import process from "process";
// dotenv.config(); // Подгружаем переменные окружения

// const app = express();
// const PORT = process.env.REACT_APP_PORT || 5001; // Используем порт из переменных окружения или стандартный 5001

// app.use(cors()); // Разрешаем CORS

// // Простое логирование всех входящих запросов
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
//   next();
// });

// let lastSentDate = ''; // Отслеживание последней отправленной даты

// app.get('/api/postlist', async (req, res) => {
//   const { date } = req.query;

//   // Проверка корректности параметра date
//   if (!date || isNaN(Date.parse(date))) {
//     console.error('Ugyldig datoformat:', date);
//     return res.status(400).json({ error: 'Ugyldig datoformat.' });
//   }

//   try {
//     const data = await fetchPostlist(date); // Извлечение данных с сайта

//     if (data.length > 0 && date !== lastSentDate) {
//       const emailText = data
//         .map(
//           (entry) =>
//             `Dato: ${entry.date}\nTittel: ${entry.title}\nAnsvarlig enhet: ${entry.unit}`
//         )
//         .join('\n');

//       console.log(`Klart for å sende e-post: ${emailText}`);
//       lastSentDate = date;
//     } else if (data.length === 0) {
//       console.log(`Ingen data for valgt dato: ${date}`);
//     }

//     res.json(data); // Отправка данных клиенту
//   } catch (error) {
//     console.error('Feil på serveren:', error.message);
//     res.status(500).json({ error: 'Feil ved henting av data.' });
//   }
// });

// // Обработка несуществующих маршрутов (404)
// app.use((req, res) => {
//   res.status(404).json({ error: 'Ikke funnet.' });
// });

// // Graceful shutdown для Electron/Node
// const server = app.listen(PORT, () => {
//   console.log(`Server kjører på http://localhost:${PORT}`);
// });

// // Обработка ошибок запуска сервера (например, если порт занят)
// server.on('error', (err) => {
//   console.error('Ошибка запуска сервера:', err);
// });

// function shutdown() {
//   console.log('Shutting down server...');
//   server.close(() => {
//     process.exit(0);
//   });
// }

// process.on('SIGINT', shutdown);
// process.on('SIGTERM', shutdown);




// import express from 'express';
// import cors from 'cors';
// import fetchPostlist from './src/scripts/fetchPostlist.js';
// import dotenv from 'dotenv';
// import process from "process";
// dotenv.config(); // Подгружаем переменные окружения


// const app = express();
// const PORT = process.env.REACT_APP_PORT || 5001; // Используем порт из переменных окружения или стандартный 5001

// app.use(cors()); // Разрешаем CORS

// let lastSentDate = ''; // Отслеживание последней отправленной даты

// app.get('/api/postlist', async (req, res) => {
//   const { date } = req.query;

//   // Проверка корректности параметра date
//   if (!date || isNaN(Date.parse(date))) {
//     console.error('Ugyldig datoformat:', date);
//     return res.status(400).json({ error: 'Ugyldig datoformat.' });
//   }

//   try {
//     const data = await fetchPostlist(date); // Извлечение данных с сайта

//     if (data.length > 0 && date !== lastSentDate) {
//       const emailText = data
//         .map(
//           (entry) =>
//             `Dato: ${entry.date}\nTittel: ${entry.title}\nAnsvarlig enhet: ${entry.unit}`
//         )
//         .join('\n');

//       console.log(`Klart for å sende e-post: ${emailText}`);
//       lastSentDate = date;
//     } else if (data.length === 0) {
//       console.log(`Ingen data for valgt dato: ${date}`);
//     }

//     res.json(data); // Отправка данных клиенту
//   } catch (error) {
//     console.error('Feil på serveren:', error.message);
//     res.status(500).json({ error: 'Feil ved henting av data.' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server kjører på http://localhost:${PORT}`);
// });






