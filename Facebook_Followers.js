const puppeteer = require("puppeteer");
const xlsx = require('xlsx');
const dotenv = require('dotenv');

dotenv.config();

let browser;
let page;

const launchBrowser = async () => {
  browser = await puppeteer.launch({
    headless: false,
    slowMo: false,
    defaultViewport: null,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--user-data-dir=C:\\Users\\Shreyansh\\AppData\\Local\\Google\\Chrome\\User Data ", "--start-maximized", "--mute-audio"],
  });
  const pagesArr = await browser.pages();
  page = pagesArr[0];
};

const login = async () => {
  await page.goto("https://www.facebook.com/");
  await page.waitForSelector("input[type='text']", { visible: true });
  await page.type("input[type='text']", process.env.EMAIL);
  await page.type("input[type='password']", process.env.PASSWORD);
  await page.click("button[type='submit']");
};

const finalAction = async () => {
  await page.goto("https://www.facebook.com/profile.php?id=100090715820573&sk=followers");
  const linksSet = new Set();
  const data = [];

    for(let i = 0; i < 10; i++){
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await page.waitForTimeout(500);
    }

    const parentDiv = await page.$(".x78zum5.x1q0g3np.x1a02dak.x1qughib");

    const children = await parentDiv.$$("div");

    for (let i = 0; i < children.length; i++) {
      const refreshedParentDiv = await page.$(".x78zum5.x1q0g3np.x1a02dak.x1qughib");

      if (!refreshedParentDiv) {
        console.error('Parent div not found after navigating back');
        break;
      }

      const refreshedChildren = await refreshedParentDiv.$$("div");
      const child = refreshedChildren[i];
      const aTag = await child.$(".x1iyjqo2.x1pi30zi > div > a");

      if (aTag) {
        const href = await aTag.evaluate(a => a.getAttribute('href'));

        if (linksSet.has(href)) {
          continue;
        }

        linksSet.add(href);
        await aTag.click();
        await page.waitForTimeout(1000);

        const info = await page.$$(".x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x193iq5w.xeuugli.x1r8uery.x1iyjqo2.xs83m0k.xsyo7zv.x16hj40l.x10b6aqq.x1yrsyyn span.xt0psk2 > span");

        if (info) {
          const rowData = [];
          for (let i = 0; i < info.length; i++) {
            const text = await info[i].evaluate(node => node.textContent.trim());
            rowData.push(text);
          }
          if(rowData.length > 0){
            rowData.push(href);
            data.push(rowData);
          }
        }

        await page.goBack();
        await page.waitForSelector(".x78zum5.x1q0g3np.x1a02dak.x1qughib");
      }
    }

   await browser.close();

  // Convert data to Excel and save
  const ws = xlsx.utils.aoa_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet 1');
  xlsx.writeFile(wb, 'output.xlsx');
}

launchBrowser()
  .then(login)
  .then(finalAction)
  .catch((error) => console.error(error));
