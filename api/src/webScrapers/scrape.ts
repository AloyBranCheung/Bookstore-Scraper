import puppeteer from "puppeteer";

interface BookDataObj {
  title: string;
  price: string;
  numberOfStocks: RegExpMatchArray | null;
  productDescription: string;
}

interface BookData {
  [bookTitle: string]: {
    price: string;
    numberOfStocks: RegExpMatchArray | null;
    productDescription: string;
  };
}

const scrapeBookData = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.on("console", (msg) => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`);
    });

    await page.goto("http://books.toscrape.com/");

    await page.setViewport({ width: 1920, height: 1080 });

    const sleep = (milliseconds: number) => {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    };

    /* --------------------------------  scrape ------------------------------- */
    const urlsToScrape = [];
    let nextPage = await page.evaluate(() => {
      const nextPageAnchorTag = document.querySelector(".next a");
      if (
        nextPageAnchorTag instanceof HTMLAnchorElement &&
        nextPageAnchorTag.href.length > 0
      ) {
        return nextPageAnchorTag.href;
      } else {
        return "";
      }
    });

    while (nextPage.length > 0) {
      const pageUrls = await page.evaluate(() => {
        const urls = [];

        const booksToScrapeOnPage = Array.from(
          document.querySelectorAll(".product_pod")
        ).map((productPod) => {
          const aTag = productPod.querySelector("a");
          if (aTag) {
            return aTag.href;
          } else {
            return "";
          }
        });

        urls.push(...booksToScrapeOnPage);

        return urls;
      });
      urlsToScrape.push(...pageUrls);
      nextPage = await page.evaluate(() => {
        const nextPageUrl = document.querySelector(".next a");
        if (nextPageUrl instanceof HTMLAnchorElement) return nextPageUrl.href;
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

    let bookData: BookData = {};
    for (let url of urlsToScrape) {
      await page.goto(url);
      const data: BookDataObj | undefined = await page.evaluate(() => {
        const productMain = document.querySelector(".product_main");
        if (!productMain) return;

        const titleHTMLTag = productMain.querySelector("h1");
        const priceHTMLTag = productMain.querySelector(
          ".price_color"
        ) as HTMLParagraphElement;
        const stockStringHTMLTag = productMain.querySelector(
          ".instock"
        ) as HTMLParagraphElement;
        const productDescriptionHTMLTag = document.querySelector(
          ".product_page > p"
        ) as HTMLParagraphElement;

        let title: string = "",
          price: string = "",
          numberOfStocks: RegExpMatchArray | null = null,
          productDescription: string = "";

        if (titleHTMLTag) title = titleHTMLTag.innerText;
        if (priceHTMLTag) price = priceHTMLTag.innerText;
        if (stockStringHTMLTag)
          numberOfStocks = stockStringHTMLTag.innerText.match(/\d+/g);
        if (productDescriptionHTMLTag)
          productDescription = productDescriptionHTMLTag.innerText;

        return { title, price, numberOfStocks, productDescription };
      });

      if (data) {
        bookData[data.title] = {
          price: data.price,
          numberOfStocks: data.numberOfStocks,
          productDescription: data.productDescription,
        };
      }
      // await sleep(5000);
      console.log(bookData);
    }

    browser.close();

    // put to db?
    return bookData;
  } catch (error) {
    console.log("error", error);
  }
};

export default scrapeBookData;
