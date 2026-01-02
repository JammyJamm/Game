import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors({ origin: "http://localhost:3006" }));
app.use(express.json());

/* ---------------- MEMORY ---------------- */
let roundHistory = [];

/* ---------------- PLAYWRIGHT ---------------- */
let browser;
let page;

/* ✅ CORRECT WAY TO GET AVIATOR IFRAME */
async function getGameFrame() {
  const iframeHandle = await page.waitForSelector(
    'iframe[src*="spribegaming.com/aviator"]',
    { timeout: 0 }
  );

  const frame = await iframeHandle.contentFrame();
  return frame;
}

/* ---------------- LAUNCH BROWSER ---------------- */
(async () => {
  browser = await chromium.launch({ headless: false });
  page = await browser.newPage();
  page.setDefaultTimeout(0);

  /* Bridge iframe → Node */
  await page.exposeFunction("__pushRound", ({ date, time, value }) => {
    let day = roundHistory.find((d) => d[date]);
    if (!day) {
      day = { [date]: [] };
      roundHistory.unshift(day);
    }

    day[date].push({ [time]: value });

    if (day[date].length > 200) day[date].shift();
  });

  await page.goto("https://india1xbet.mobi/en", {
    waitUntil: "domcontentloaded",
  });

  console.log("🌐 Login manually → open Aviator game");
})();

/* ---------------- START OBSERVER ---------------- */
app.post("/click-button", async (req, res) => {
  try {
    const frame = await getGameFrame();
    if (!frame) {
      return res.json({ success: false, error: "Iframe not ready" });
    }

    const started = await frame.evaluate(async () => {
      function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
      }

      /* 🔎 WAIT FOR PAYOUT CONTAINER */
      let container = null;
      for (let i = 0; i < 60; i++) {
        container =
          document.querySelector(".payouts-block") ||
          document.querySelector('[class*="payouts"]') ||
          document.querySelector('[class*="payout"]');

        if (container) break;
        await sleep(500);
      }

      if (!container) {
        console.log("❌ payouts container not found");
        return false;
      }

      if (window.__observerStarted) return true;
      window.__observerStarted = true;

      let lastValue = null;

      function extractValue(el) {
        const txt = el?.textContent?.replace("x", "").trim();
        const num = parseFloat(txt);
        return isNaN(num) ? null : num;
      }

      function pushIfNew(val) {
        if (val === null || val === lastValue) return;
        lastValue = val;

        const now = new Date();
        window.__pushRound({
          date: now.toLocaleDateString("en-GB"),
          time: now.toLocaleTimeString("en-US"),
          value: val,
        });
      }

      /* 🟢 CAPTURE LAST EXISTING PAYOUT */
      const existing = container.querySelectorAll('[class*="payout"]');
      if (existing.length) {
        pushIfNew(extractValue(existing[existing.length - 1]));
      }

      /* 👀 OBSERVE DOM CHANGES */
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "childList") {
            for (const node of m.addedNodes) {
              const v = extractValue(node);
              if (v !== null) {
                pushIfNew(v);
                return;
              }
            }
          }

          if (m.type === "characterData") {
            const v = extractValue(m.target.parentElement);
            if (v !== null) {
              pushIfNew(v);
              return;
            }
          }
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      console.log("✅ Aviator observer started");
      return true;
    });

    if (!started) {
      return res.json({ success: false, error: "Game not ready" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ click-button error:", err);
    res.json({ success: false, error: err.message });
  }
});

/* ---------------- BET CLICK ---------------- */
app.post("/bet-click", async (req, res) => {
  try {
    const frame = await getGameFrame();
    if (!frame) {
      return res.json({ success: false, error: "Iframe not found" });
    }

    /* ⚠️ Button selector may change */
    await frame.click("button");

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ---------------- HISTORY ---------------- */
app.get("/round-history", (req, res) => {
  res.json({ success: true, history: roundHistory });
});

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", console.error);
