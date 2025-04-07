



import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import emailjs from "emailjs-com";
import { setDateToSpecificTime } from "../utils/setDate.js";

const PostlistPage = () => {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(setDateToSpecificTime());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailStatus, setEmailStatus] = useState("");
  const lastSentRef = useRef(null); // Для отслеживания последней отправки
  const initialRenderRef = useRef(true); // Для предотвращения двойного запуска при первом рендере
  const intervalRef = useRef(null); // Таймер

  // Funksjon for å hente data basert på dato
  const fetchPostlistByDate = async (date) => {
    setLoading(true);
    setError(null);

    if (!date || isNaN(Date.parse(date))) {
      setError("Ugyldig datoformat."); // Неверный формат даты
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get("http://localhost:5001/api/postlist", { params: { date } });
      setEntries(response.data);

      // Automatisk sending av e-post hvis data finnes og dato ikke er sendt før
      if (response.data.length > 0 && lastSentRef.current !== date) {
        await sendEmail(response.data);
        lastSentRef.current = date; // Oppdatere dato for siste sending
      }
    } catch (error) {
      console.error("Feil ved lasting av data:", error); // Логируем ошибку
      setError("Feil ved lasting av data. Sjekk server eller API-adresse."); // Сообщение об ошибке
    } finally {
      setLoading(false);
    }
  };




const formatRowsToHTML = (rows) => {
  return rows
    .map(
      (row) =>
        `<tr>
          <td style="border: 1px solid #eaeaea; padding: 8px;">${row.date}</td>
          <td style="border: 1px solid #eaeaea; padding: 8px;">${row.title.replace(/\n/g, "<br>")}</td>
          <td style="border: 1px solid #eaeaea; padding: 8px;">${row.unit}</td>
          <td style="border: 1px solid #eaeaea; padding: 8px;">
            <a href="${row.archiveLink}" style="text-decoration: none; color: #007bff;">Arkiv</a>
          </td>
        </tr>`
    )
    .join(""); // Combine rows into a single HTML string
};

const sendEmail = async (entriesToSend) => {
  if (entriesToSend.length === 0) {
    setEmailStatus("Ingen data tilgjengelig for sending."); // No data available for sending
    return;
  }

  try {
    const formattedRows = formatRowsToHTML(entriesToSend);

    await emailjs.send(
      import.meta.env.VITE_EMAIL_SERVICE_ID,
      import.meta.env.VITE_EMAIL_TEMPLATE_ID,
      {
        to_email: import.meta.env.VITE_TO_EMAIL,
        email: import.meta.env.VITE_FROM_EMAIL,
        rows: formattedRows, // Pass the raw HTML string here
      },
      import.meta.env.VITE_EMAIL_USER_ID
    );

    setEmailStatus("E-posten ble sendt!"); // Email sent successfully
  } catch (error) {
    setEmailStatus(`Feil ved sending av e-post: ${error.message || "Ukjent feil"}`); // Error during email sending
  }
};










  // Funksjon for å sende e-post
  // const sendEmail = async (entriesToSend) => {
  //   if (entriesToSend.length === 0) {
  //     setEmailStatus("Ingen data tilgjengelig for sending."); // Нет данных для отправки
  //     return;
  //   }

  //   try {
  //     const records = entriesToSend
  //       .map(
  //         (entry) =>
  //           `Dato: ${entry.date}\nTittel: ${entry.title}\nAnsvarlig enhet: ${entry.unit}\n` +
  //           `Arkivlenke: ${entry.archiveLink || "Ikke oppgitt"}`
  //       )
  //       .join("\n");

  //     await emailjs.send(
  //       import.meta.env.VITE_EMAIL_SERVICE_ID,
  //       import.meta.env.VITE_EMAIL_TEMPLATE_ID,
  //       {
  //         to_email: import.meta.env.VITE_TO_EMAIL,
  //         email: import.meta.env.VITE_FROM_EMAIL,
  //         records,
  //       },
  //       import.meta.env.VITE_EMAIL_USER_ID
  //     );

  //     setEmailStatus("E-posten ble sendt!"); // Письмо успешно отправлено
  //   } catch (error) {
  //     setEmailStatus(`Feil ved sending av e-post: ${error.text || "Ukjent feil"}`); // Ошибка при отправке письма
  //   }
  // };

  useEffect(() => {
    // Første spørring ved komponentinnlasting
    if (initialRenderRef.current) {
      fetchPostlistByDate(selectedDate);
      initialRenderRef.current = false; // Устанавливаем, что первый рендер завершён
    }

    // Setter opp timer for å sjekke tid
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        const currentDate = new Date();

        if (
          currentDate.getHours() === 14 &&
          currentDate.getMinutes() === 0 &&
          currentDate.getSeconds() === 0
        ) {
          const nextDate = setDateToSpecificTime();
          setSelectedDate(nextDate);
          fetchPostlistByDate(nextDate);
        }
      }, 1000);
    }

    // Rens opp timeren ved demontering
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedDate]);

  const handleDateChange = (event) => {
    const date = event.target.value;
    if (!date || isNaN(Date.parse(date))) {
      setError("Ugyldig datoformat."); // Неверный формат даты
      return;
    }
    setSelectedDate(date);
    fetchPostlistByDate(date);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Postliste</h1>
      <label>
        Velg dato:
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          style={{ marginLeft: "10px", padding: "5px" }}
        />
      </label>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Laster data...</p>
      ) : entries.length > 0 ? (
        <>
          <table
            border="1"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px",
            }}
          >
            <thead>
              <tr>
                <th>Dato</th>
                <th>Tittel</th>
                <th>Ansvarlig enhet</th>
                <th>Arkivlenke</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.date}</td>
                  <td>{entry.title.replace(/\n\s*-\s*\n/g, " - ").trim()}</td>
                  <td>{entry.unit}</td>
                  <td>
                    {entry.archiveLink ? (
                      <a href={entry.archiveLink} target="_blank" rel="noopener noreferrer">
                        Arkiv
                      </a>
                    ) : (
                      "Ikke oppgitt"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>E-poststatus: {emailStatus}</p>
        </>
      ) : (
        <p>Ingen data tilgjengelig.</p>
      )}
    </div>
  );
};

export default PostlistPage;




// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import emailjs from "emailjs-com";
// import { setDateToSpecificTime } from "../utils/setDate.js";

// const PostlistPage = () => {
//   const [entries, setEntries] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(setDateToSpecificTime());
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [emailStatus, setEmailStatus] = useState("");
//   const lastSentRef = useRef(null); // Для отслеживания последней отправки
//   const initialRenderRef = useRef(true); // Для предотвращения двойного запуска при первом рендере
//   const intervalRef = useRef(null); // Таймер

//   // Функция для запроса данных
//   const fetchPostlistByDate = async (date) => {
//     console.log(`Запрос данных для даты: ${date}`);
//     setLoading(true);
//     setError(null);

//     if (!date || isNaN(Date.parse(date))) {
//       console.error("Неверный формат даты");
//       setError("Неверный формат даты.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.get("http://localhost:5001/api/postlist", { params: { date } });
//       console.log("Данные успешно получены:", response.data);
//       setEntries(response.data);

//       // Отправляем письмо, если данные есть и дата не совпадает с последней отправленной
//       if (response.data.length > 0 && lastSentRef.current !== date) {
//         console.log("Данные найдены, отправка почты...");
//         await sendEmail(response.data);
//         lastSentRef.current = date; // Обновляем дату последней отправки
//       } else if (response.data.length === 0) {
//         console.log("Данных за эту дату нет, почта не отправляется.");
//       }
//     } catch (err) {
//       console.error("Ошибка при загрузке данных:", err);
//       setError("Ошибка загрузки данных. Проверьте сервер или API-адрес.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Функция отправки почты
//   const sendEmail = async (entriesToSend) => {
//     if (entriesToSend.length === 0) {
//       console.warn("Нет данных для отправки письма.");
//       setEmailStatus("Нет данных для отправки.");
//       return;
//     }

//     try {
//       const records = entriesToSend
//         .map(
//           (entry) =>
//             `Дата: ${entry.date}\nНазвание: ${entry.title}\nОтдел: ${entry.unit}\n` +
//             `Ссылка: ${entry.archiveLink || "Не указано"}`
//         )
//         .join("\n");

//       console.log("Отправка письма с данными:", records);

//       await emailjs.send(
//         import.meta.env.VITE_EMAIL_SERVICE_ID,
//         import.meta.env.VITE_EMAIL_TEMPLATE_ID,
//         {
//           to_email: import.meta.env.VITE_TO_EMAIL,
//           email: import.meta.env.VITE_FROM_EMAIL,
//           records,
//         },
//         import.meta.env.VITE_EMAIL_USER_ID
//       );

//       console.log("Письмо успешно отправлено!");
//       setEmailStatus("Письмо успешно отправлено!");
//     } catch (error) {
//       console.error("Ошибка при отправке письма:", error);
//       setEmailStatus(`Ошибка при отправке письма: ${error.text || "Неизвестная ошибка"}`);
//     }
//   };

//   useEffect(() => {
//     // Запрос только при первом рендере
//     if (initialRenderRef.current) {
//       console.log("Первоначальный запрос при запуске компонента.");
//       fetchPostlistByDate(selectedDate);
//       initialRenderRef.current = false; // Устанавливаем, что первый рендер завершён
//     }

//     // Устанавливаем таймер для проверки времени
//     if (!intervalRef.current) {
//       console.log("Создаём таймер для проверки времени.");
//       intervalRef.current = setInterval(() => {
//         const currentDate = new Date();
//         console.log(`Текущее время: ${currentDate.toLocaleTimeString()}`);

//         if (
//           currentDate.getHours() === 14 &&
//           currentDate.getMinutes() === 0 &&
//           currentDate.getSeconds() === 0
//         ) {
//           console.log("Время достигло 14:00, обновляем дату и проверяем данные.");
//           const nextDate = setDateToSpecificTime();
//           console.log(`Установлена новая дата: ${nextDate}`);
//           setSelectedDate(nextDate);
//           fetchPostlistByDate(nextDate);
//         }
//       }, 1000);
//     }

//     // Очистка таймера при размонтировании
//     return () => {
//       if (intervalRef.current) {
//         console.log("Компонент размонтирован, очищаем интервал.");
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     };
//   }, [selectedDate]);

//   const handleDateChange = (event) => {
//     const date = event.target.value;
//     console.log(`Дата вручную изменена на: ${date}`);
//     if (!date || isNaN(Date.parse(date))) {
//       console.error("Неверный формат даты");
//       setError("Неверный формат даты.");
//       return;
//     }
//     setSelectedDate(date);
//     fetchPostlistByDate(date);
//   };

//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
//       <h1>Postliste</h1>
//       <label>
//         Выберите дату:
//         <input
//           type="date"
//           value={selectedDate}
//           onChange={handleDateChange}
//           style={{ marginLeft: "10px", padding: "5px" }}
//         />
//       </label>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       {loading ? (
//         <p>Загрузка данных...</p>
//       ) : entries.length > 0 ? (
//         <>
//           <table
//             border="1"
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               marginTop: "20px",
//             }}
//           >
//             <thead>
//               <tr>
//                 <th>Дата</th>
//                 <th>Название</th>
//                 <th>Отдел</th>
//                 <th>Ссылка</th>
//               </tr>
//             </thead>
//             <tbody>
//               {entries.map((entry, index) => (
//                 <tr key={index}>
//                   <td>{entry.date}</td>
//                   <td>{entry.title.replace(/\n\s*-\s*\n/g, " - ").trim()}</td>
//                   <td>{entry.unit}</td>
//                   <td>
//                     {entry.archiveLink ? (
//                       <a href={entry.archiveLink} target="_blank" rel="noopener noreferrer">
//                         Архив
//                       </a>
//                     ) : (
//                       "Не указано"
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <p style={{ marginTop: "10px", fontWeight: "bold" }}>Статус почты: {emailStatus}</p>
//         </>
//       ) : (
//         <p>Данные недоступны.</p>
//       )}
//     </div>
//   );
// };

// export default PostlistPage;





// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import emailjs from "emailjs-com";
// import { setDateToSpecificTime } from "../utils/setDate.js"; // Импорт функции

// const PostlistPage = () => {
//   const [entries, setEntries] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(setDateToSpecificTime()); // Устанавливаем начальную дату
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [emailStatus, setEmailStatus] = useState("");

//   // Функция для запроса данных
//   const fetchPostlistByDate = async (date) => {
//     console.log(`Запрос данных для даты: ${date}`);
//     setLoading(true);
//     setError(null);

//     if (!date || isNaN(Date.parse(date))) {
//       console.error("Неверный формат даты");
//       setError("Неверный формат даты.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.get("http://localhost:5001/api/postlist", { params: { date } });
//       console.log("Данные успешно получены:", response.data);
//       setEntries(response.data);
//     } catch (err) {
//       console.error("Ошибка при загрузке данных:", err);
//       setError("Ошибка загрузки данных. Проверьте сервер или API-адрес.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Первоначальный запрос при загрузке компонента
//     fetchPostlistByDate(selectedDate);

//     // Таймер для проверки времени каждую секунду
//     const interval = setInterval(() => {
//       const currentDate = new Date();
//       console.log(`Текущее время: ${currentDate.toLocaleTimeString()}`);

//       if (
//         currentDate.getHours() === 14 && // Проверяем, наступило ли 14:00
//         currentDate.getMinutes() === 0 && // Проверяем минуты для точности
//         currentDate.getSeconds() === 0 // Проверяем секунды
//       ) {
//         console.log("Время достигло 14:00, обновляем дату и отправляем запрос.");
//         const nextDate = setDateToSpecificTime(); // Рассчитываем новую дату
//         console.log(`Установлена новая дата: ${nextDate}`);
//         setSelectedDate(nextDate); // Обновляем состояние
//         fetchPostlistByDate(nextDate); // Выполняем запрос
//       }
//     }, 1000); // Проверяем каждую секунду

//     // Очищаем интервал при размонтировании
//     return () => {
//       console.log("Компонент размонтирован, очищаем интервал.");
//       clearInterval(interval);
//     };
//   }, []);

//   const handleDateChange = (event) => {
//     const date = event.target.value;
//     console.log(`Дата вручную изменена на: ${date}`);
//     if (!date || isNaN(Date.parse(date))) {
//       console.error("Неверный формат даты");
//       setError("Неверный формат даты.");
//       return;
//     }
//     setSelectedDate(date);
//     fetchPostlistByDate(date);
//   };

//   const sendEmail = async () => {
//     if (entries.length === 0) {
//       console.warn("Нет данных для отправки письма.");
//       setEmailStatus("Нет данных для отправки.");
//       return;
//     }

//     try {
//       const records = entries
//         .map(
//           (entry) =>
//             `Дата: ${entry.date}\nНазвание: ${entry.title}\nОтдел: ${entry.unit}\n` +
//             `Ссылка: ${entry.archiveLink || "Не указано"}`
//         )
//         .join("\n");

//       console.log("Отправка письма с данными:", records);

//       await emailjs.send(
//         import.meta.env.VITE_EMAIL_SERVICE_ID,
//         import.meta.env.VITE_EMAIL_TEMPLATE_ID,
//         {
//           to_email: import.meta.env.VITE_TO_EMAIL,
//           email: import.meta.env.VITE_FROM_EMAIL,
//           records,
//         },
//         import.meta.env.VITE_EMAIL_USER_ID
//       );

//       console.log("Письмо успешно отправлено!");
//       setEmailStatus("Письмо успешно отправлено!");
//     } catch (error) {
//       console.error("Ошибка при отправке письма:", error);
//       setEmailStatus(`Ошибка при отправке письма: ${error.text || "Неизвестная ошибка"}`);
//     }
//   };

//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
//       <h1>Postliste</h1>
//       <label>
//         Выберите дату:
//         <input
//           type="date"
//           value={selectedDate}
//           onChange={handleDateChange}
//           style={{ marginLeft: "10px", padding: "5px" }}
//         />
//       </label>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       {loading ? (
//         <p>Загрузка данных...</p>
//       ) : entries.length > 0 ? (
//         <>
//           <table
//             border="1"
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               marginTop: "20px",
//             }}
//           >
//             <thead>
//               <tr>
//                 <th>Дата</th>
//                 <th>Название</th>
//                 <th>Отдел</th>
//                 <th>Ссылка</th>
//               </tr>
//             </thead>
//             <tbody>
//               {entries.map((entry, index) => (
//                 <tr key={index}>
//                   <td>{entry.date}</td>
//                   <td>{entry.title.replace(/\n\s*-\s*\n/g, " - ").trim()}</td>
//                   <td>{entry.unit}</td>
//                   <td>
//                     {entry.archiveLink ? (
//                       <a href={entry.archiveLink} target="_blank" rel="noopener noreferrer">
//                         Архив
//                       </a>
//                     ) : (
//                       "Не указано"
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <button
//             onClick={sendEmail}
//             style={{
//               marginTop: "20px",
//               padding: "10px",
//               backgroundColor: "blue",
//               color: "white",
//               border: "none",
//               cursor: "pointer",
//             }}
//           >
//             Отправить данные по email
//           </button>
//           {emailStatus && <p style={{ marginTop: "10px" }}>{emailStatus}</p>}
//         </>
//       ) : (
//         <p>Данные недоступны.</p>
//       )}
//     </div>
//   );
// };

// export default PostlistPage;





/////////////////////////////////////////////////////
// import React, { useState } from "react";
// import axios from "axios";
// import emailjs from "emailjs-com";



// const PostlistPage = () => {
//   const [entries, setEntries] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Standardverdi: dagens dato
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [emailStatus, setEmailStatus] = useState(""); // Status for e-postsending

//   const fetchPostlistByDate = async (date) => {
//     setLoading(true);
//     setError(null);

//     // Проверка корректности даты
//     if (!date || isNaN(Date.parse(date))) {
//       setError("Ugyldig datoformat.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.get("http://localhost:5001/api/postlist", { params: { date } });
//       setEntries(response.data);
//     } catch (err) {
//       setError("Feil under lasting av data. Sjekk serveren eller API-adressen.");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDateChange = (event) => {
//     const date = event.target.value;
//     if (!date || isNaN(Date.parse(date))) {
//       setError("Ugyldig datoformat.");
//       return;
//     }
//     setSelectedDate(date);
//     fetchPostlistByDate(date);
//   };

//   const sendEmail = async () => {
//     if (entries.length === 0) {
//       setEmailStatus("Ingen data tilgjengelig for sending.");
//       return;
//     }

//     try {
//       // Формируем данные для e-mail
//       const records = entries
//         .map(
//           (entry) =>
//             `Dato: ${entry.date}\nTittel: ${entry.title}\nAnsvarlig enhet: ${entry.unit}\n` +
//             `Arkivlenke: ${entry.archiveLink || "Ikke oppgitt"}`
//         )
//         .join("\n");

//       await emailjs.send(
//   import.meta.env.VITE_EMAIL_SERVICE_ID,
//   import.meta.env.VITE_EMAIL_TEMPLATE_ID,
//   {
//     to_email: import.meta.env.VITE_TO_EMAIL,
//     email: import.meta.env.VITE_FROM_EMAIL,
//     records, // данные для шаблона
//   },
//   import.meta.env.VITE_EMAIL_USER_ID
// );


//       setEmailStatus("E-posten ble sendt!");
//     } catch (error) {
//       console.error("Feil under e-postsending:", error);
//       setEmailStatus(`Feil ved sending av e-post: ${error.text || "Ukjent feil"}`);
//     }
//   };

//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
//       <h1>Postliste</h1>
//       <label>
//         Velg dato:
//         <input
//           type="date"
//           value={selectedDate}
//           onChange={handleDateChange}
//           style={{ marginLeft: "10px", padding: "5px" }}
//         />
//       </label>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       {loading ? (
//         <p>Laster data...</p>
//       ) : entries.length > 0 ? (
//         <>
//           <table
//             border="1"
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               marginTop: "20px",
//             }}
//           >
//             <thead>
//               <tr>
//                 <th>Dato</th>
//                 <th>Tittel</th>
//                 <th>Ansvarlig enhet</th>
//                 <th>Arkivlenke</th>
//               </tr>
//             </thead>
//             <tbody>
//               {entries.map((entry, index) => (
//                 <tr key={index}>
//                   <td>{entry.date}</td>
//                   <td>{entry.title.replace(/\n\s*-\s*\n/g, " - ").trim()}</td>
//                   <td>{entry.unit}</td>
//                   <td>
//                     {entry.archiveLink ? (
//                       <a href={entry.archiveLink} target="_blank" rel="noopener noreferrer">
//                         Arkiv
//                       </a>
//                     ) : (
//                       "Ikke oppgitt"
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <button
//             onClick={sendEmail}
//             style={{
//               marginTop: "20px",
//               padding: "10px",
//               backgroundColor: "blue",
//               color: "white",
//               border: "none",
//               cursor: "pointer",
//             }}
//           >
//             Send data på e-post
//           </button>
//           {emailStatus && <p style={{ marginTop: "10px" }}>{emailStatus}</p>}
//         </>
//       ) : (
//         <p>Ingen data tilgjengelig.</p>
//       )}
//     </div>
//   );
// };

// export default PostlistPage;














