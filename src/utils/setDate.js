export const setDateToSpecificTime = (hour = 14, minute = 0) => {
  const today = new Date();
  const specificTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()  // +1 - если добавить = Следующий день
  );
  specificTime.setHours(hour, minute, 0, 0); // Устанавливаем 14:00

  return specificTime.toISOString().split("T")[0]; // Возвращаем в формате yyyy-MM-dd
};

// export const setDateToSpecificTime = (hour = 14, minute = 0) => {
//   const today = new Date();
//   const specificTime = new Date(
//     today.getFullYear(),
//     today.getMonth(),
//     today.getDate() + 1 // Следующий день
//   );
//   specificTime.setHours(hour, minute, 0, 0); // Устанавливаем 14:00 и обнуляем секунды

//   return specificTime.toISOString().split("T")[0]; // Формат yyyy-MM-dd
// };
