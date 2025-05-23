
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import emailjs from "emailjs-com";
import { setDateToSpecificTime } from "../utils/setDate.js";

// Функция для разбиения массива на чанки
function chunkArray(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

const PostlistPage = () => {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(setDateToSpecificTime());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailStatus, setEmailStatus] = useState("");
  const lastSentRef = useRef(null);
  const initialRenderRef = useRef(true);
  const intervalRef = useRef(null);

  const fetchPostlistByDate = async (date) => {
    setLoading(true);
    setError(null);

    if (!date || isNaN(Date.parse(date))) {
      setError("Ugyldig datoformat.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get("http://localhost:5001/api/postlist", { params: { date } });
      setEntries(response.data);

      // Автоматическая отправка email чанками по 45 строк
      if (response.data.length > 0 && lastSentRef.current !== date) {
        await sendEmail(response.data);
        lastSentRef.current = date;
      }
    } catch (error) {
      console.error("Feil ved lasting av data:", error);
      setError("Feil ved lasting av data. Sjekk server eller API-adresse.");
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
      .join("");
  };

  // Обновлённая функция отправки email чанками по 45 строк
  // const sendEmail = async (entriesToSend) => {
  //   if (entriesToSend.length === 0) {
  //     setEmailStatus("Ingen data tilgjengelig for sending.");
  //     return;
  //   }

  //   const chunked = chunkArray(entriesToSend, 50);
  //   let allOk = true;
  //   let errorMsg = "";

  //   for (let i = 0; i < chunked.length; i++) {
  //     try {
  //       const formattedRows = formatRowsToHTML(chunked[i]);
  //       await emailjs.send(
  //         import.meta.env.VITE_EMAIL_SERVICE_ID,
  //         import.meta.env.VITE_EMAIL_TEMPLATE_ID,
  //         {
  //           to_email: import.meta.env.VITE_TO_EMAIL,
  //           email: import.meta.env.VITE_FROM_EMAIL,
  //           rows: formattedRows,
  //           chunk_number: i + 1,
  //           chunk_total: chunked.length,
  //         },
  //         import.meta.env.VITE_EMAIL_USER_ID
  //       );
  //     } catch (error) {
  //       allOk = false;
  //       errorMsg = error.message || "Ukjent feil";
  //       break;
  //     }
  //   }

  //   if (allOk) {
  //     setEmailStatus(
  //       chunked.length === 1
  //         ? "E-posten ble sendt!"
  //         : `E-posten ble sendt i ${chunked.length} deler!`
  //     );
  //   } else {
  //     setEmailStatus(`Feil ved sending av e-post: ${errorMsg}`);
  //   }
  // };

  const sendEmail = async (entriesToSend) => {
  if (entriesToSend.length === 0) {
    setEmailStatus("Ingen data tilgjengelig for sending.");
    return;
  }

  const fromEmails = import.meta.env.VITE_FROM_EMAIL.split(",").map(email => email.trim()); // Разделяем и обрабатываем адреса получателей
  const toEmail = import.meta.env.VITE_TO_EMAIL.trim(); // Убираем пробелы вокруг адреса отправителя
  const chunked = chunkArray(entriesToSend, 50);
  let allOk = true;
  let errorMsg = "";

  for (const fromEmail of fromEmails) { // Цикл по каждому получателю
    for (let i = 0; i < chunked.length; i++) {
      try {
        const formattedRows = formatRowsToHTML(chunked[i]);
        await emailjs.send(
          import.meta.env.VITE_EMAIL_SERVICE_ID,
          import.meta.env.VITE_EMAIL_TEMPLATE_ID,
          {
            to_email: fromEmail, // Указываем текущего получателя
            email: toEmail, // Отправитель
            rows: formattedRows,
            chunk_number: i + 1,
            chunk_total: chunked.length,
          },
          import.meta.env.VITE_EMAIL_USER_ID
        );
      } catch (error) {
        allOk = false;
        errorMsg = error.message || "Ukjent feil";
        break;
      }
    }
  }
    
    if (allOk) {
    setEmailStatus(
      chunked.length === 1
        ? "E-posten ble sendt til alle mottakere!"
        : `E-posten ble sendt i ${chunked.length} deler til hver mottaker!`
    );
  } else {
    setEmailStatus(`Feil ved sending av e-post: ${errorMsg}`);
  }
};

  useEffect(() => {
    if (initialRenderRef.current) {
      fetchPostlistByDate(selectedDate);
      initialRenderRef.current = false;
    }

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
      setError("Ugyldig datoformat.");
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

////////////////////// рабочий вариант /////////////////////////
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

//   // Funksjon for å hente data basert på dato
//   const fetchPostlistByDate = async (date) => {
//     setLoading(true);
//     setError(null);

//     if (!date || isNaN(Date.parse(date))) {
//       setError("Ugyldig datoformat."); // Неверный формат даты
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.get("http://localhost:5001/api/postlist", { params: { date } });
//       setEntries(response.data);

//       // Automatisk sending av e-post hvis data finnes og dato ikke er sendt før
//       if (response.data.length > 0 && lastSentRef.current !== date) {
//         await sendEmail(response.data);
//         lastSentRef.current = date; // Oppdatere dato for siste sending
//       }
//     } catch (error) {
//       console.error("Feil ved lasting av data:", error); // Логируем ошибку
//       setError("Feil ved lasting av data. Sjekk server eller API-adresse."); // Сообщение об ошибке
//     } finally {
//       setLoading(false);
//     }
//   };




// const formatRowsToHTML = (rows) => {
//   return rows
//     .map(
//       (row) =>
//         `<tr>
//           <td style="border: 1px solid #eaeaea; padding: 8px;">${row.date}</td>
//           <td style="border: 1px solid #eaeaea; padding: 8px;">${row.title.replace(/\n/g, "<br>")}</td>
//           <td style="border: 1px solid #eaeaea; padding: 8px;">${row.unit}</td>
//           <td style="border: 1px solid #eaeaea; padding: 8px;">
//             <a href="${row.archiveLink}" style="text-decoration: none; color: #007bff;">Arkiv</a>
//           </td>
//         </tr>`
//     )
//     .join(""); // Combine rows into a single HTML string
// };

// const sendEmail = async (entriesToSend) => {
//   if (entriesToSend.length === 0) {
//     setEmailStatus("Ingen data tilgjengelig for sending."); // No data available for sending
//     return;
//   }

//   try {
//     const formattedRows = formatRowsToHTML(entriesToSend);

//     await emailjs.send(
//       import.meta.env.VITE_EMAIL_SERVICE_ID,
//       import.meta.env.VITE_EMAIL_TEMPLATE_ID,
//       {
//         to_email: import.meta.env.VITE_TO_EMAIL,
//         email: import.meta.env.VITE_FROM_EMAIL,
//         rows: formattedRows, // Pass the raw HTML string here
//       },
//       import.meta.env.VITE_EMAIL_USER_ID
//     );

//     setEmailStatus("E-posten ble sendt!"); // Email sent successfully
//   } catch (error) {
//     setEmailStatus(`Feil ved sending av e-post: ${error.message || "Ukjent feil"}`); // Error during email sending
//   }
// };

//   useEffect(() => {
//     // Første spørring ved komponentinnlasting
//     if (initialRenderRef.current) {
//       fetchPostlistByDate(selectedDate);
//       initialRenderRef.current = false; // Устанавливаем, что первый рендер завершён
//     }

//     // Setter opp timer for å sjekke tid
//     if (!intervalRef.current) {
//       intervalRef.current = setInterval(() => {
//         const currentDate = new Date();

//         if (
//           currentDate.getHours() === 14 &&
//           currentDate.getMinutes() === 0 &&
//           currentDate.getSeconds() === 0
//         ) {
//           const nextDate = setDateToSpecificTime();
//           setSelectedDate(nextDate);
//           fetchPostlistByDate(nextDate);
//         }
//       }, 1000);
//     }

//     // Rens opp timeren ved demontering
//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     };
//   }, [selectedDate]);

//   const handleDateChange = (event) => {
//     const date = event.target.value;
//     if (!date || isNaN(Date.parse(date))) {
//       setError("Ugyldig datoformat."); // Неверный формат даты
//       return;
//     }
//     setSelectedDate(date);
//     fetchPostlistByDate(date);
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
//           <p style={{ marginTop: "10px", fontWeight: "bold" }}>E-poststatus: {emailStatus}</p>
//         </>
//       ) : (
//         <p>Ingen data tilgjengelig.</p>
//       )}
//     </div>
//   );
// };

// export default PostlistPage;



















