import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("http://books.toscrape.com/");

  await page.setViewport({ width: 1920, height: 1080 });

  // scrape
  const urlsToScrape = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".product_pod")).map(
      (productPod) => {
        const aTag = productPod.querySelector("a");
        return aTag.href;
      }
    );
  });

  const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  let bookData = {};
  for (let url of urlsToScrape) {
    await page.goto(url);
    const { title, price, numberofStocks } = await page.evaluate(() => {
      const productMain = document.querySelector(".product_main");
      const title = productMain.querySelector("h1").innerText;
      const price = productMain.querySelector(".price_color").innerText;
      const stockString = productMain.querySelector(".instock").innerText;
      const numberofStocks = stockString.match(/\d+/g);
      return { title, price, numberofStocks };
    });
    bookData[title] = { price, numberofStocks };
    console.log(bookData);
    await sleep(5000);
  }

  console.log(bookData);
})();
