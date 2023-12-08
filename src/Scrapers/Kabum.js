const puppeteer = require('puppeteer');
const categories = require('../config/KabumConfig');
const db = require('../firebase/firebaseConect');
const fs = require('fs');


async function scrapeKabumProductDetails(url) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForFunction(
      () => {
        const items = document.querySelectorAll(".productCard");
        return items.length > 0;
      },
      { timeout: 10000 }
    );

    const productResults = await page.evaluate(() => {
      const items = document.querySelectorAll(".productCard");

      const data = [];
      items.forEach((item) => {
        const titleElement = item.querySelector(".nameCard");
        const priceElement = item.querySelector(".priceCard");
        const linkElement = item.querySelector(".productLink");

        const title = titleElement ? titleElement.innerText : "N/A";
        const price = priceElement ? priceElement.innerText : "N/A";
        const link = linkElement ? linkElement.href : "N/A";

        data.push({ title, price, link });
      });

      return data;
    });

    return productResults;
  } catch (err) {
    console.error("Ocorreu um erro:", err);
  } finally {
    await browser.close();
  }
}

async function main() {
  const allResults = [];

  for (const category of categories) {
    const productResults = await scrapeKabumProductDetails(category.url);
    allResults.push({
      category: category.description,
      products: productResults,
    });
  }

  const today = new Date();
  const collectionName = today.toISOString().slice(0, 10);

  const collectionRef = db.collection(collectionName);

  for (const result of allResults) {
    const categoryDocRef = collectionRef.doc(result.category);
    const categoryData = {};

    for (const product of result.products) {
      const productKey = `product_${Math.random().toString(36).substring(7)}`;

      categoryData[productKey] = {
        Store: "Kabum",
        title: product.title,
        price: product.price,
        link: product.link,
        date: new Date(),
      };
    }

    try {
      await categoryDocRef.set(categoryData, { merge: true });
    } catch (error) { }
  }
}

main().catch((err) => {
  const errorMessage = `Erro ao raspar Kabum: ${err}\n`;

  fs.appendFile("error.log", errorMessage, (error) => {
    if (error) {
      console.error("Erro ao gravar no arquivo de log:", error);
    }
  });

  console.error(errorMessage);
});

async function executeScriptKabum() {
  try {
    await main();
  } catch (err) {
    const errorMessage = `Erro ao executar o script: ${err}\n`;

    fs.appendFile("error.log", errorMessage, (error) => {
      if (error) {
        console.error("Erro ao gravar no arquivo de log:", error);
      }
    });
  }
}
module.exports = executeScriptKabum;
