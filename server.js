import express from 'express';
import cors from 'cors';
import fetchPostlist from './src/scripts/fetchPostlist.js';
import dotenv from 'dotenv';
import process from "process";
dotenv.config(); // Подгружаем переменные окружения


const app = express();
const PORT = process.env.REACT_APP_PORT || 5001; // Используем порт из переменных окружения или стандартный 5001

app.use(cors()); // Разрешаем CORS

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

app.listen(PORT, () => {
  console.log(`Server kjører på http://localhost:${PORT}`);
});






