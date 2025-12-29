import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import db from "./firebaseConfig";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import { saveRound as saveGameRound } from "./gameservice";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

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

        // Firebase save data based on 10th ele or 11th ele
        const ele10 = Object.values(timeArray[timeArray.length - 11]);
        const firstStr = ele10.toString().split(".")[1]?.length || 0;
        const getCompArr = timeArray.slice(-12);
        if (firstStr === 1) saveGameRound(today, getCompArr);
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
  // Table
  const [data, setData] = useState({});
  const [order, setOrder] = useState("desc"); // asc | desc
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${today.getFullYear()}`;
  const [selectDay, setSelectDay] = useState(formattedDate);
  async function getData() {
    try {
      const docRef = doc(db, "Game", selectDay);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setData(snap.data());
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  const handleSort = () => {
    setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // 🔹 Sort by Time
  const sortedData = useMemo(() => {
    return Object.entries(data || {}).sort(([timeA], [timeB]) => {
      const dateA = new Date(`1970/01/01 ${timeA}`);
      const dateB = new Date(`1970/01/01 ${timeB}`);

      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [data, order]);
  // Handling select day
  const [docIds, setDocIds] = useState([]);
  async function getAllDocIds() {
    const colRef = collection(db, "Game");
    const snapshot = await getDocs(colRef);

    const docIds = snapshot.docs.map((doc) => doc.id);

    console.log(docIds);
    return docIds;
  }

  useEffect(() => {
    getAllDocIds().then(setDocIds);
  }, []);
  return (
    <div>
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
      <Card>
        <CardActionArea
          sx={{
            height: "100%",
            "&[data-active]": {
              backgroundColor: "action.selected",
              "&:hover": {
                backgroundColor: "action.selectedHover",
              },
            },
          }}
        >
          <CardContent sx={{ height: "100%" }}>
            <Typography variant="h5" component="div">
              Playwright Observer
            </Typography>

            <Button variant="contained" onClick={startObserver}>
              Start Observer
            </Button>
          </CardContent>
        </CardActionArea>
      </Card>
      <TableContainer component={Paper}>
        <Toolbar
          sx={[
            {
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              display: "flex",
              justifyContent: "space-between",
            },
          ]}
        >
          <Typography variant="h6" align="left">
            Daily Data
          </Typography>
          <FormControl sx={{ m: 1, minWidth: 120 }} size="small" align="right">
            <InputLabel id="demo-select-small-label"> Day</InputLabel>
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={selectDay}
              label="Day"
              onChange={(e) => {
                setSelectDay(e.target.value);
              }}
            >
              {docIds.map((day) => {
                return <MenuItem value={day}>{day}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Toolbar>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active direction={order} onClick={handleSort}>
                  Time
                </TableSortLabel>
              </TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="center">1st Element</TableCell>
              <TableCell align="center">8th Win / Loss</TableCell>
              <TableCell align="center">9th Win / Loss</TableCell>
              <TableCell align="center">10th Win / Loss</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedData.map(([groupTime, rounds]) => {
              const eight = Object.values(rounds?.[9] ?? {})[0];
              const ninth = Object.values(rounds?.[10] ?? {})[0];
              const tenth = Object.values(rounds?.[11] ?? {})[0];

              return (
                <TableRow
                  key={groupTime}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>{groupTime}</TableCell>

                  <TableCell style={{ display: "flex", flexWrap: "wrap" }}>
                    {rounds.map((item, index) => {
                      const time = Object.keys(item)[0];
                      const value = Object.values(item)[0];

                      return (
                        <Tooltip key={index} title={time} placement="top">
                          <Chip
                            label={value}
                            variant="outlined"
                            sx={{ m: "2px" }}
                          />
                        </Tooltip>
                      );
                    })}
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip
                      title={Object.keys(rounds?.[1] ?? {})[0]}
                      placement="top"
                    >
                      <Chip label={Object.values(rounds?.[1] ?? {})[0]} />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={eight}
                      color={eight >= 2 ? "success" : "error"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={ninth}
                      color={ninth >= 2 ? "success" : "error"}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={tenth}
                      color={tenth >= 2 ? "success" : "error"}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
