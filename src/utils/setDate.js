export const setDateToSpecificTime = (hour = 14, minute = 0) => {
  const today = new Date();
  
  // Функция для проверки, является ли день выходным
  const isWeekend = (date) => {
    const day = date.getDay(); // Получаем день недели (0 = воскресенье, 6 = суббота)
    return day === 0 || day === 6;
  };

  let specificDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2); // Минус 2 дня

  // Проверяем, если дата - выходной (суббота или воскресенье), уменьшаем ещё на 2 дня
  if (isWeekend(specificDate)) {
    specificDate.setDate(specificDate.getDate() - 2);
  }

  specificDate.setHours(hour, minute, 0, 0); // Устанавливаем время
  return specificDate.toISOString().split("T")[0]; // Возвращаем в формате yyyy-MM-dd
};



// export const setDateToSpecificTime = (hour = 14, minute = 0) => {
//   const today = new Date();
//   const specificTime = new Date(
//     today.getFullYear(),
//     today.getMonth(),
//     today.getDate()  -2 //- если добавить = Следующий день
//   );
//   specificTime.setHours(hour, minute, 0, 0); // Устанавливаем 14:00

//   return specificTime.toISOString().split("T")[0]; // Возвращаем в формате yyyy-MM-dd
// };

