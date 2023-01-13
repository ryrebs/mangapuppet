const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AnonUA = require("puppeteer-extra-plugin-anonymize-ua");



const Config = (additionalArgs = [], additionalOptions = {}) => {
  const CommonOption = {
    args: [
      "--window-size=1600,1080",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
    ],
    headless: true,
    ignoreHTTPSErrors: true,
    userDataDir: "./tmp",
    proxy_host: "",
    slowMo: 100,
  };
  const options = { ...CommonOption }

  //// Add args
  additionalArgs.forEach((arg) => {
    if (!(options.args.includes(arg)))
      options.args.push(arg);
  });

  //// Add options
  for (let key in additionalOptions) {
    options[key] = additionalOptions[key]
  }

  //// Set proxy if it exists
  if (options.proxy_host !== "")
    options.args.push(`--proxy-server=${options.proxy_host}`);

  return options;
};

//// Plugins
const setPlugins = () => {
  try {
    puppeteer.use(StealthPlugin());
    puppeteer.use(AnonUA());
  } catch (error) {
    console.log(error);
  }
};

const PuppeteerBrowser = async (config = Config()) => {
  setPlugins();
  return puppeteer.launch(config);
};

export { PuppeteerBrowser, Config };
