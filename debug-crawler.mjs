import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log("Navigating to target...");
  await page.goto("https://lecture.develrocket.com/v2/course-info/DES-103/attendance-manage", { 
    waitUntil: "domcontentloaded",
    timeout: 30000 
  });
  
  console.log("Waiting 5s for any redirects...");
  await page.waitForTimeout(5000);
  console.log("Current URL:", page.url());
  
  console.log("Scanning all input fields...");
  const inputs = await page.locator("input").all();
  console.log(`Found ${inputs.length} inputs on page.`);
  for (let i = 0; i < inputs.length; i++) {
     const isVisible = await inputs[i].isVisible();
     const type = await inputs[i].getAttribute("type");
     const classes = await inputs[i].getAttribute("class");
     const ph = await inputs[i].getAttribute("placeholder");
     console.log(`Input ${i}: type=${type}, visible=${isVisible}, placeholder=${ph}`);
  }
  
  await browser.close();
})();
