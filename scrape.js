import puppeteer from "puppeteer";

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.on("console", (msg) => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`);
    });

    await page.goto("http://books.toscrape.com/");

    await page.setViewport({ width: 1920, height: 1080 });

    const sleep = (milliseconds) => {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    };

    /* --------------------------------  scrape ------------------------------- */
    const urlsToScrape = [];
    let nextPage = await page.evaluate(() => {
      const nextPageUrl = document.querySelector(".next a").href;
      return nextPageUrl;
    });

    while (nextPage.length > 0) {
      const pageUrls = await page.evaluate(() => {
        const urls = [];

        const booksToScrapeOnPage = Array.from(
          document.querySelectorAll(".product_pod")
        ).map((productPod) => {
          const aTag = productPod.querySelector("a");
          return aTag.href;
        });

        urls.push(...booksToScrapeOnPage);

        return urls;
      });
      urlsToScrape.push(...pageUrls);
      nextPage = await page.evaluate(() => {
        const nextPageUrl = document.querySelector(".next a");
        if (nextPageUrl) return nextPageUrl.href;
        return "";
      });
      if (nextPage.length > 0) await page.goto(nextPage);
    }

    // see list of urls scraped
    // console.dir(urlsToScrape, { maxArrayLength: null });

    // get the whole page's html
    // const html = await page.content();
    // console.log(html);

    // download as pdf
    // await page.emulateMediaType("screen");
    // await page.pdf({ path: "./test1.pdf" });

    let bookData = {};
    for (let url of urlsToScrape) {
      await page.goto(url);
      const { title, price, numberOfStocks, productDescription } =
        await page.evaluate(() => {
          const productMain = document.querySelector(".product_main");
          const title = productMain.querySelector("h1").innerText;
          const price = productMain.querySelector(".price_color").innerText;
          const stockString = productMain.querySelector(".instock").innerText;
          const numberOfStocks = stockString.match(/\d+/g);
          const productDescription = document.querySelector(".product_page > p")
            ? document.querySelector(".product_page > p").innerText
            : "No description.";
          console.log(productDescription);

          return { title, price, numberOfStocks, productDescription };
        });
      bookData[title] = { price, numberOfStocks, productDescription };
      // await sleep(5000);
      console.log(bookData);
    }

    // put to db?
    console.log(bookData);

    browser.close();
  } catch (error) {
    console.log("error", error);
  }
})();
