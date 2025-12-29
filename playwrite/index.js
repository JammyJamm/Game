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

/* Find Aviator iframe safely */
async function getGameFrame() {
  return page
    ?.frames()
    .find(
      (f) =>
        f.name() === "game_place_game" ||
        f.url().includes("crash.aviator.studio")
    );
}

/* Launch browser */
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

    // optional limit
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
    /* wait for iframe */
    let frame = null;
    for (let i = 0; i < 40; i++) {
      frame = await getGameFrame();
      if (frame) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!frame) return res.json({ success: false, error: "Iframe not ready" });

    const started = await frame.evaluate(async () => {
      function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
      }

      /* wait for container */
      let container = null;
      for (let i = 0; i < 40; i++) {
        container = document.querySelector("div._items_7l84e_35");
        if (container) break;
        await sleep(500);
      }
      if (!container) return false;

      if (window.__observerStarted) return true;
      window.__observerStarted = true;

      /* capture last existing value once */
      const lastSpan = container.querySelector("button:last-child span");
      if (lastSpan) {
        const v = parseFloat(lastSpan.textContent.trim());
        if (!isNaN(v)) {
          const now = new Date();
          window.__pushRound({
            date: now.toLocaleDateString("en-GB"),
            time: now.toLocaleTimeString("en-US"),
            value: v,
          });
        }
      }

      /* REAL observer (handles reused DOM nodes) */
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          /* new button added */
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              const span = node.querySelector?.("span");
              if (span) {
                const v = parseFloat(span.textContent.trim());
                if (!isNaN(v)) {
                  const now = new Date();
                  window.__pushRound({
                    date: now.toLocaleDateString("en-GB"),
                    time: now.toLocaleTimeString("en-US"),
                    value: v,
                  });
                  return;
                }
              }
            }
          }

          /* text updated in reused span */
          if (
            m.type === "characterData" &&
            m.target.parentElement?.tagName === "SPAN"
          ) {
            const v = parseFloat(m.target.textContent.trim());
            if (!isNaN(v)) {
              const now = new Date();
              window.__pushRound({
                date: now.toLocaleDateString("en-GB"),
                time: now.toLocaleTimeString("en-US"),
                value: v,
              });
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

      return true;
    });

    if (!started) return res.json({ success: false, error: "Game not ready" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ click-button error:", err);
    res.json({ success: false, error: err.message });
  }
});
/* ---------------- Bet Click ---------------- */
app.post("/bet-click", async (req, res) => {
  try {
    const frame = page
      .frames()
      .find((f) => f.url().includes("crash.aviator.studio"));

    if (!frame) return res.json({ success: false, error: "Iframe not found" });

    await frame.click("button._button_304lu_21");

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
app.listen(PORT, () =>
  console.log(`🚀Backend running on http://localhost:${PORT}`)
);

// app.listen(9000, () =>
//   console.log("🚀 Backend running on http://localhost:9000")
// );

process.on("unhandledRejection", console.error);
