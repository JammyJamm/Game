import React, { useEffect, useState } from "react";
import axios from "axios";

// import { saveRound as saveGameRound } from "./gameservice";

export default function App() {
  const [status, setStatus] = useState("Idle");
  const [rounds, setRounds] = useState([]);

  const startObserver = async () => {
    try {
      setStatus("Starting observer...");
      const res = await axios.post("http://localhost:9000/click-button");
      setStatus(res.data.success ? "Observer running" : "Failed");
    } catch {
      setStatus("Error");
    }
  };

  const fetchRounds = async () => {
    // const today = new Date().toLocaleDateString("en-GB");
    try {
      const res = await axios.get("http://localhost:9000/round-history");
      //saveGameRound("23-01-2025", "3:56:12 PM", 2.31);
      if (res.data.success) {
        setRounds(res.data.history);
        const data = res.data.history;
        const lastDateObj = data[data.length - 1];
        const dateKey = Object.keys(lastDateObj)[0];
        const timeArray = lastDateObj[dateKey];
        const today = dateKey.replace(/\//g, "-");
        // Slice 20 array - Condition check
        checkLast10ForOne(today, timeArray);

        // const lastEntry = timeArray[timeArray.length - 1];
        // const time = Object.keys(lastEntry)[0];
        // const value = lastEntry[time];

        // saveGameRound(today, timeArray);
      }
    } catch {}
  };
  function checkLast10ForOne(today, arr) {
    // take last 10 elements (or less if array is smaller)
    // const last10 = arr.slice(-11);
    // const hasOne = last10.some((obj) => {
    //   const value = Object.values(obj)[0];
    //   return value === 1;
    // });
    // return Object.values(arr[11])[0] === 1
    //   ? saveGameRound(today, arr.slice(0, 21))
    //   : "";
  }
  useEffect(() => {
    fetchRounds();
    const id = setInterval(fetchRounds, 3000);
    return () => clearInterval(id);
  }, []);
  /// color code
  const spans = document.querySelectorAll("#container span");

  let oneCount = 0;
  let ninthOneIndex = -1;

  // Step 1: find index of 9th "1"
  spans.forEach((span, index) => {
    if (span.textContent.trim() === "1") {
      oneCount++;
      if (oneCount === 9) {
        ninthOneIndex = index;
      }
    }
  });

  // Step 2: apply colors
  spans.forEach((span, index) => {
    if (ninthOneIndex === -1) return; // safety

    if (index < ninthOneIndex) {
      span.classList.add("light-green"); // above 9th "1"
    } else if (index > ninthOneIndex) {
      span.classList.add("dark-green"); // below 9th "1"
    }
  });

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      <div style={{ flex: 4, padding: 20, borderRight: "1px solid #ccc" }}>
        <h2>Playwright Observer</h2>
        <p>
          Status: <b>{status}</b>
        </p>
        <button onClick={startObserver}>Start Observer</button>
      </div>

      <div
        style={{ flex: "6 1 0%", padding: 20, overflowY: "auto", width: "50%" }}
      >
        {rounds.length === 0 && <p>No data yet</p>}

        {rounds.map((day, i) => {
          const date = Object.keys(day)[0];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexWrap: "wrap",
              }}
              id="container"
            >
              {/* <strong>{date}</strong> */}

              {day[date]
                .map((r, idx) => {
                  const time = Object.keys(r)[0];
                  return (
                    <span key={idx} style={{ flex: "0 0 9%", padding: "10px" }}>
                      {(() => {
                        const value = r[time];
                        const isInt = Number.isInteger(value);
                        const decimalLen = isInt
                          ? 0
                          : value.toString().split(".")[1]?.length || 0;

                        return isInt ? (
                          <b>{value}</b>
                        ) : (
                          <>
                            {value}
                            <small style={{ marginLeft: "6px", color: "gray" }}>
                              {decimalLen === 1
                                ? "bet"
                                : decimalLen > 1
                                ? ""
                                : "(0)"}
                            </small>
                          </>
                        );
                      })()}
                    </span>
                  );
                })
                .reverse()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
