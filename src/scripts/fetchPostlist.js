import puppeteer from 'puppeteer';
import { load } from 'cheerio';

export default async function fetchPostlist(date) {
  const baseUrl = `https://www.nord-fron.kommune.no/innsyn.aspx?response=journalpost_postliste&MId1=758&scripturi=/innsyn.aspx&skin=infolink&tittel=&fratil=&doktype=&simple=true&sok=S%C3%B8k&fradato=${date}T00:00:00`;

  try {
    const browser = await puppeteer.launch({ headless: false }); // Визуализация включена для отладки
    const page = await browser.newPage();

    let allEntries = [];
    let processedUrls = new Set(); // Храним обработанные URL
    let currentPageUrl = baseUrl;

    while (currentPageUrl) {
      console.log(`Обрабатываем страницу: ${currentPageUrl}`);
      await page.goto(currentPageUrl, { waitUntil: 'networkidle2' });

      const content = await page.content();
      const $ = load(content);

      // Извлекаем данные с текущей страницы
      $('li.np.i-par.i-jp').each((_, element) => {
        const entryDate = $(element).find('span:contains("Journaldato")').next('strong').text().trim();
        const title = $(element).find('h3 > a.content-link').text().trim();
        const unit = $(element).find('span:contains("Ansvarlig enhet")').next('strong').text().trim();
        const archiveLink = $(element).find('a.content-link[href*="arkivsak_detaljer"]').attr('href');
        const documentLink = $(element).find('a.blank[href*="wfdocument.ashx"]').attr('href');

        if (entryDate && title && unit) {
          allEntries.push({
            date: entryDate,
            title,
            unit,
            archiveLink: archiveLink ? `https://www.nord-fron.kommune.no${archiveLink}` : null,
            documentLink: documentLink ? `https://innsyn.onacos.no${documentLink}` : null,
          });
        }
      });

      // Добавляем текущий URL в обработанные
      processedUrls.add(currentPageUrl);

      // Проверяем наличие ссылки на следующую страницу
      const nextPageLink = $('ul.pagination li a.content-link[href*="startrow"]').last().attr('href');
      console.log(`Ссылка на следующую страницу: ${nextPageLink}`);

      if (nextPageLink) {
        const nextPageUrl = `https://www.nord-fron.kommune.no${nextPageLink}`;
        if (processedUrls.has(nextPageUrl)) {
          console.log("Следующая страница уже была обработана. Завершаем цикл.");
          currentPageUrl = null; // Останавливаем цикл
        } else {
          currentPageUrl = nextPageUrl;
        }
      } else {
        console.log("Следующих страниц больше нет.");
        currentPageUrl = null; // Останавливаем цикл
      }
    }

    await browser.close();
    console.log("Все данные:", allEntries);
    return allEntries;
  } catch (error) {
    console.error("Ошибка при извлечении данных:", error.message);
    return [];
  }
}



