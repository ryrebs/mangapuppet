const dotenv = require("dotenv");

//// Load .env variables
dotenv.config();

import { PuppeteerBrowser, Config } from "./browser";
import { ResultQueue } from "./utils";

//// No. of tabs that are proccessed concurrently
const MAX_CONCURRENCY = 5;

const additionalHeaders = {
  "a.lt-svc":
    'h3=":443"; ma=86400, h3-29=":443"; ma=86400, h3-28=":443"; ma=86400, h3-27=":443"; ma=86400',
  "cf-cache-status": "DYNAMIC",
  "cf-ray": "6c9f3eb0490d41d6-MRS",
  "content-encoding": "br",
  "content-type": "text/html; charset=UTF-8",
  nel: '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
  "strict-transport-security": "max-age=31536000",
  vary: "Accept-Encoding",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "x-powered-by": "VPSSIM",
  "x-xss-protection": "1; mode=block",
  referer: "https://www.google.com",
};

const targetSites = [
];

//// Browser options
const user_profile_data_dir = process.env.CHROME_PROFILE;
const browser_path = process.env.CHROME_PATH;

const filter = (searchText, filterRegex = /hour|min|day|second/g) => {
  if (searchText.match(filterRegex)) return true;
  return false;
};

const parser = async (link, page, filterFN) => {
  let linkText = [];

  try {
    if (link.includes("readmanganato.com")) {
      const p = await page.$x("//ul[@class='row-content-chapter']/li", {
        visible: true,
        timeout: 10000,
      });
      for (let xp of p) {
        const hrefHandle = await xp.$("a");
        const releaseHandle = await xp.$("span:nth-child(3)");

        const href = await hrefHandle.evaluate((node) =>
          node.getAttribute("href")
        );
        const release = await releaseHandle.evaluate((node) => node.innerText);

        if (filterFN(release)) linkText.push(href);
      }
    }

    if (link.includes("webtoons.com")) {
      const p = await page.$x("//ul[@id='_listUl']/li", {
        visible: true,
        timeout: 10000,
      });
      for (let xp of p) {
        const hrefHandle = await xp.$("a");
        const titleHandle = await xp.$("span.subj em");

        if (hrefHandle !== null && titleHandle !== null) {
          const href = await hrefHandle.evaluate((node) =>
            node.getAttribute("href")
          );
          const release = await titleHandle.evaluate((node) => node.innerText);

          if (filterFN(release, /UP/g)) linkText.push(href);
        }
      }
    }

    if (link.includes("mangakakalot.tv")) {
      const p = await page.$x("//div[@class='chapter-list']/div", {
        visible: true,
        timeout: 10000,
      });
      for (let xp of p) {
        //// The data are on the spans
        const hrefHandle = await xp.$("span:nth-child(1) a");
        const titlehandle = await xp.$("span:nth-child(3)");

        const href = await hrefHandle.evaluate((node) =>
          node.getAttribute("href")
        );
        //// Date is on the title attribute of the third span
        const release = await titlehandle.evaluate((node) =>
          node.getAttribute("title")
        );

        if (filterFN(release)) {
          if (href.includes("mangakakalot")) {
            linkText.push(href);
          } else {
            linkText.push(`${link.match(".+.tv")[0]}${href}`);
          }
        }
      }
    }

    if (link.includes("mangarockteam.com")) {
      await page.waitForXPath(
        "//ul[@class='main version-chap no-volumn active']/li",
        {
          visible: true,
          timeout: 10000,
        }
      );
      const p = await page.$x(
        "//ul[@class='main version-chap no-volumn active']/li",
        {
          visible: true,
          timeout: 10000,
        }
      );

      for (let xp of p) {
        //// The data are on the spans
        const hrefHandle = await xp.$("a");
        const releaseHandle = await xp.$("span a");

        if (hrefHandle !== null && releaseHandle !== null) {
          const href = await hrefHandle.evaluate((node) =>
            node.getAttribute("href")
          );
          const release = await releaseHandle.evaluate((node) =>
            node.getAttribute("title")
          );

          if (filterFN(release)) {
            linkText.push(href);
          }
        }
      }
    }

    if (link.includes("manga-tx.com")) {
      await page.waitForXPath("//ul[@class='main version-chap active']/li", {
        visible: true,
        timeout: 10000,
      });
      const p = await page.$x("//ul[@class='main version-chap active']/li", {
        visible: true,
        timeout: 10000,
      });

      for (let xp of p) {
        //// The data are on the spans
        const hrefHandle = await xp.$("a");
        const releaseHandle = await xp.$("span a");

        if (hrefHandle !== null && releaseHandle !== null) {
          const href = await hrefHandle.evaluate((node) =>
            node.getAttribute("href")
          );
          const release = await releaseHandle.evaluate((node) =>
            node.getAttribute("title")
          );

          if (filterFN(release)) {
            linkText.push(href);
          }
        }
      }
    }

    if (link.includes("isekaiscan.com")) {
      const xpth =
        "//ul[contains(@class, 'main version-chap no-volumn') or @class='main version-chap no-volumn active']/li";
      await page.waitForXPath(xpth, {
        visible: true,
        timeout: 10000,
      });
      const p = await page.$x(xpth, {
        visible: true,
        timeout: 10000,
      });

      for (let xp of p) {
        //// The data are on the spans
        const hrefHandle = await xp.$("a");
        const releaseHandle = await xp.$("span i");

        if (hrefHandle !== null && releaseHandle !== null) {
          const href = await hrefHandle.evaluate((node) =>
            node.getAttribute("href")
          );
          const release = await releaseHandle.evaluate(
            (node) => node.innerText
          );

          if (filterFN(release)) {
            linkText.push(href);
          }
        }
      }
    }
  } catch (error) {
    console.log(`Scrape error on ${link}\n${error}`);
  }

  return linkText;
};

(async () => {
  try {
    //// Setup
    const config = Config(["--start-maximized"], {
      userDataDir: user_profile_data_dir,
      executablePath: browser_path,
    });
    const browser = await PuppeteerBrowser(config);
    const max_retry = 3;

    //// Create scrape promise list
    const scrape_promise_list = targetSites.map((link) => async () => {
      for (let attempt = 1; attempt <= max_retry; attempt++) {
        try {
          const page = await browser.newPage();
          await page.setExtraHTTPHeaders(additionalHeaders);
          await page.goto(link, { timeout: 120000 });
          const data = await parser(link, page, filter);
          await page.close();
          return data;
        } catch (error) {
          console.error(error);
        }
      }
    });

    //// Create queue
    let tasksCount = scrape_promise_list.length;
    const result = [];
    const queue = new ResultQueue(
      scrape_promise_list,
      MAX_CONCURRENCY,
      (res) => {
        if (res !== undefined && res !== null && res.length > 0)
          result.push(res);
        tasksCount--;
      }
    );

    //// Execute tasks
    queue.resolveTask();

    //// Check task count status, exit if 0 tasks
    setInterval(async () => {
      if (tasksCount === 0) {
        console.log(result);
        await browser.close();
        process.exit(0);
      }
    }, 3000);
  } catch (error) {
    console.log(error);
  }
})();
