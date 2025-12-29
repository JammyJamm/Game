// server.js
import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = 8000;

// Endpoint to trigger the button click
app.post("/click-button", async (req, res) => {
  let browser;
  try {
    browser = await chromium.launch({ headless: false }); // headless:false to see browser
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://india1xbet.mobi/en", {
      waitUntil: "domcontentloaded",
    });

    // Wait for the button to be available
    await page.waitForSelector("#ClickBTN", { timeout: 5000 });

    // Click the button
    await page.click("#ClickBTN");

    res.json({ success: true, message: "Button clicked!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
