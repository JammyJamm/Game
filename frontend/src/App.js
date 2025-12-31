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
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";

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
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import BrowserUpdatedIcon from "@mui/icons-material/BrowserUpdated";
import IconButton from "@mui/material/IconButton";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import StepContent from "@mui/material/StepContent";
export default function App() {
  const [status, setStatus] = useState("Idle");
  const [rounds, setRounds] = useState([]);
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${today.getFullYear()}`;
  const startObserver = async () => {
    try {
      setStatus("Starting observer...");
      const res = await axios.post("http://localhost:9000/click-button");
      setStatus(res.data.success ? "Observer running" : "Failed");
    } catch {
      setStatus("Error");
    }
  };
  let lastFirstElement = null; // store the first element of the last API call
  const betTime = [
    {
      startTime: "12:45:00 PM",
      endTime: "1:44:59 PM",
      index: [5, 8],
    },
    {
      startTime: "1:45:00 PM",
      endTime: "2:45:59 PM",
      index: [5],
    },
    {
      startTime: "2:45:00 PM",
      endTime: "3:44:59 PM",
      index: [5],
    },
    {
      startTime: "3:45:00 PM",
      endTime: "4:44:59 PM",
      index: [5],
    },
    {
      startTime: "4:45:00 PM",
      endTime: "5:44:59 PM",
      index: [5],
    },
  ];
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
        const currentFirst = Object.keys(timeArray[0])[0];

        checkLast10ForOne(today, timeArray);

        if (lastFirstElement !== currentFirst) {
          if (timeArray) console.log("Working");
          //handleClick();
        }
        lastFirstElement = currentFirst;
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
  }, [selectDay]);

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
  // Drawer
  const [open, setOpen] = useState(false);
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
  const DrawerList = (
    <Box sx={{ height: 250 }} role="presentation" onClick={toggleDrawer(false)}>
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
    </Box>
  );
  // Note Data - Selecting time frame
  const timeToMinutes = (timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [h, m] = time.split(":").map(Number);

    if (modifier === "PM" && h !== 12) h += 12;
    if (modifier === "AM" && h === 12) h = 0;

    return h * 60 + m;
  };
  const timeRanges = [
    {
      label: "12:45 PM - 1:45 PM - (5th & 8th)",
      start: "12:45 PM",
      end: "1:45 PM",
    },
    { label: "1:45 PM - 2:45 PM", start: "1:45 PM", end: "2:45 PM" },
    { label: "2:45 PM - 3:45 PM", start: "2:45 PM", end: "3:45 PM" },
    { label: "3:45 PM - 4:45 PM", start: "3:45 PM", end: "4:45 PM" },
    { label: "4:45 PM - 5:45 PM", start: "4:45 PM", end: "5:45 PM" },
  ];
  const analyzeTimeRanges = (data) => {
    return timeRanges.map((range) => {
      const startMin = timeToMinutes(range.start);
      const endMin = timeToMinutes(range.end);
      let oneHigher = 0;
      let twoHigher = 0;
      let threeHigher = 0;
      let fourHigher = 0;
      let fiveHigher = 0;
      let sixHigher = 0;
      let sevenHigher = 0;
      let eightHigher = 0;
      let ninthHigher = 0;
      let tenthHigher = 0;
      let elevenHigher = 0;
      let tewelHigher = 0;
      let total = 0;

      Object.entries(data).forEach(([time, values]) => {
        const currentMin = timeToMinutes(time);

        if (currentMin >= startMin && currentMin < endMin) {
          total++;
          if (Object.values(values[0])[0] > 2) oneHigher++;
          if (Object.values(values[1])[0] > 2) twoHigher++;
          if (Object.values(values[2])[0] > 2) threeHigher++;
          if (Object.values(values[3])[0] > 2) fourHigher++;
          if (Object.values(values[4])[0] > 2) fiveHigher++;
          if (Object.values(values[5])[0] > 2) sixHigher++;
          if (Object.values(values[6])[0] > 2) sevenHigher++;
          if (Object.values(values[7])[0] > 2) eightHigher++;
          if (Object.values(values[8])[0] > 2) ninthHigher++;
          if (Object.values(values[9])[0] > 2) tenthHigher++;
          if (Object.values(values[10])[0] > 2) elevenHigher++;
          if (Object.values(values[11])[0] > 2) tewelHigher++;
        }
      });

      return {
        range: range.label,
        one: `${oneHigher}/${total}`,
        two: `${twoHigher}/${total}`,
        three: `${threeHigher}/${total}`,
        four: `${fourHigher}/${total}`,
        five: `${fiveHigher}/${total}`,
        six: `${sixHigher}/${total}`,
        seven: `${sevenHigher}/${total}`,
        eight: `${eightHigher}/${total}`,
        ninth: `${ninthHigher}/${total}`,
        tenth: `${tenthHigher}/${total}`,
        eleven: `${elevenHigher}/${total}`,
        tewel: `${tewelHigher}/${total}`,
      };
    });
  };
  const report = useMemo(() => analyzeTimeRanges(data), [data]);
  //console.log(data);
  const [activeStep, setActiveStep] = useState(null);
  const [price, setPrice] = useState(1000);
  const diffMultiply = (value, price) => {
    if (!value?.includes("/")) return 0;

    const [a, b] = value.split("/").map(Number);
    return isNaN(a) || isNaN(b) ? 0 : (a * 2 - b) * price;
  };
  const percentage = (data) => {
    return Math.round((+data.split("/")[0] / +data.split("/")[1]) * 100);
  };
  /// ---------------- Click Bet -------------------------///
  const handleClick = async () => {
    await fetch("http://localhost:9000/bet-click", {
      method: "POST",
    });
  };
  return (
    <Grid container spacing={2}>
      <SwipeableDrawer
        open={open}
        anchor="bottom"
        onClose={toggleDrawer(false)}
      >
        {DrawerList}
      </SwipeableDrawer>
      <Grid container size={{ xs: 12, md: 9 }}>
        <Grid container size={{ xs: 12, md: 12 }}>
          <Grid container size={{ xs: 12, md: 12 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ marginBottom: "15px" }}>
                <Toolbar className="card-header">
                  <Typography variant="h6" align="left" className="card-title">
                    Playwright Observer
                  </Typography>
                  <IconButton aria-label="data" onClick={toggleDrawer(true)}>
                    <BrowserUpdatedIcon />
                  </IconButton>
                </Toolbar>
                <CardContent>
                  <Button variant="contained" onClick={startObserver}>
                    Start Observer
                  </Button>
                  <p>
                    Status: <b>{status}</b>
                  </p>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ marginBottom: "15px" }}>
                <Toolbar className="card-header">
                  <Typography variant="h6" align="left" className="card-title">
                    Daily Data
                  </Typography>
                </Toolbar>
                <CardContent>
                  <Toolbar>
                    <Avatar>
                      <EmojiEventsIcon />
                    </Avatar>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: "600" }}>
                        3/10
                      </Typography>
                      <Typography variant="body2">
                        Be calm to achive the target !
                      </Typography>
                    </CardContent>
                  </Toolbar>
                </CardContent>
                <CardContent sx={{ paddingTop: "0px" }}>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="caption"
                      gutterBottom
                      sx={{ display: "block" }}
                    >
                      Today Invoice
                    </Typography>
                    <Typography
                      variant="caption"
                      gutterBottom
                      sx={{ display: "block" }}
                    >
                      300/1000
                    </Typography>
                  </div>

                  <LinearProgress
                    variant="determinate"
                    value={60}
                    sx={{
                      borderRadius: 5,
                      backgroundColor: "#e0e0e0",
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ marginBottom: "15px" }}>
                <Toolbar className="card-header">
                  <Typography variant="h6" align="left" className="card-title">
                    Payment Histroy
                  </Typography>
                </Toolbar>
                <CardContent>
                  <Toolbar>
                    <Avatar>
                      <EmojiEventsIcon />
                    </Avatar>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: "600" }}>
                        3/10
                      </Typography>
                      <Typography variant="body2">
                        Be calm to achive the target !
                      </Typography>
                    </CardContent>
                  </Toolbar>
                </CardContent>
                <CardContent sx={{ paddingTop: "0px" }}>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="caption"
                      gutterBottom
                      sx={{ display: "block" }}
                    >
                      Today Invoice
                    </Typography>
                    <Typography
                      variant="caption"
                      gutterBottom
                      sx={{ display: "block" }}
                    >
                      300/1000
                    </Typography>
                  </div>

                  <LinearProgress
                    variant="determinate"
                    value={60}
                    sx={{
                      borderRadius: 5,
                      backgroundColor: "#e0e0e0",
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid container size={{ xs: 12, md: 12, height: "50vh" }}>
          <Grid container size={{ xs: 12, md: 12 }}>
            <Card sx={{ marginBottom: "15px", width: "100%" }}>
              <TableContainer component={Paper}>
                <Toolbar
                  sx={[
                    {
                      pl: { sm: 2 },
                      pr: { xs: 1, sm: 1 },
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid rgba(130, 130, 130, 0.17)",
                    },
                  ]}
                >
                  <Typography variant="h6" align="left" className="card-title">
                    Daily Data
                  </Typography>
                  <FormControl
                    sx={{ m: 1, minWidth: 120 }}
                    size="small"
                    align="right"
                  >
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
                <Table sx={{ width: "100%" }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active
                          direction={order}
                          onClick={handleSort}
                        >
                          Time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell align="center">Before 1st</TableCell>
                      <TableCell align="center">Target Element</TableCell>
                      <TableCell align="center">8th Element</TableCell>
                      <TableCell align="center">9th Element</TableCell>
                      <TableCell align="center">10th Element</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {sortedData.map(([groupTime, rounds]) => {
                      const eight = Object.values(rounds?.[9] ?? {})[0];
                      const ninth = Object.values(rounds?.[10] ?? {})[0];
                      const tenth = Object.values(rounds?.[11] ?? {})[0];
                      const eightToolTip = Object.keys(rounds?.[9] ?? {})[0];
                      const ninthToolTip = Object.keys(rounds?.[10] ?? {})[0];
                      const tenthToolTip = Object.keys(rounds?.[11] ?? {})[0];

                      return (
                        <TableRow
                          key={groupTime}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell>{groupTime}</TableCell>

                          <TableCell
                            style={{ display: "flex", flexWrap: "wrap" }}
                          >
                            {rounds.map((item, index) => {
                              const time = Object.keys(item)[0];
                              const value = Object.values(item)[0];

                              return (
                                <Tooltip
                                  key={index}
                                  title={time}
                                  placement="top"
                                >
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
                              title={Object.keys(rounds?.[0] ?? {})[0]}
                              placement="top"
                            >
                              <Chip
                                label={Object.values(rounds?.[0] ?? {})[0]}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip
                              title={Object.keys(rounds?.[1] ?? {})[0]}
                              placement="top"
                            >
                              <Chip
                                label={Object.values(rounds?.[1] ?? {})[0]}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={eightToolTip} placement="top">
                              <Chip
                                label={eight}
                                color={
                                  eight >= 2
                                    ? "success"
                                    : eight === 1
                                    ? "default"
                                    : "error"
                                }
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={ninthToolTip} placement="top">
                              <Chip
                                label={ninth}
                                color={
                                  ninth >= 2
                                    ? "success"
                                    : ninth === 1
                                    ? "default"
                                    : "error"
                                }
                              />
                            </Tooltip>
                          </TableCell>

                          <TableCell align="center">
                            <Tooltip title={tenthToolTip} placement="top">
                              <Chip
                                label={tenth}
                                color={
                                  tenth >= 2
                                    ? "success"
                                    : tenth === 1
                                    ? "default"
                                    : "error"
                                }
                              />
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
          <Grid container size={3} xs={12}></Grid>
        </Grid>
      </Grid>
      <Grid container size={{ xs: 12, md: 3, height: "50vh" }}>
        <Card sx={{ marginBottom: "15px", width: "100%", height: "50%" }}>
          <Toolbar className="card-header">
            <Typography variant="h6" align="left" className="card-title">
              Note
            </Typography>
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="demo-select-small-label"> Price</InputLabel>
              <Select
                labelId="demo-select-small-label"
                id="demo-select-small"
                value={price}
                label="Price"
                onChange={(e) => {
                  setPrice(e.target.value);
                }}
                align="left"
              >
                <MenuItem value="1000">1000</MenuItem>;
                <MenuItem value="2000">2000</MenuItem>;
                <MenuItem value="3000">3000</MenuItem>;
                <MenuItem value="5000">5000</MenuItem>;
                <MenuItem value="10000">10000</MenuItem>;
              </Select>
            </FormControl>
          </Toolbar>
          <CardContent>
            <Toolbar sx={{ width: "100%" }}>
              <Stepper orientation="vertical" sx={{ width: "100%" }}>
                {report.map((r, index) => (
                  <Step key={r.range} expanded>
                    <StepLabel>{r.range}</StepLabel>

                    {/* Always visible content */}
                    <StepContent>
                      <Toolbar
                        sx={{
                          width: "90%",
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#eff5fe",
                          borderRadius: "50px",
                          minHeight: "auto !important",
                          padding: "2px 6px !important",
                          marginBottom: "6px",
                        }}
                      >
                        <Typography>
                          <Avatar sx={{ fontSize: "12px", color: "primary" }}>
                            5 <sub>th</sub>
                          </Avatar>
                        </Typography>
                        <Toolbar
                          sx={{
                            width: "60%",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#eff5fe",
                            borderRadius: "50px",
                            minHeight: "auto !important",
                            padding: " 2px 16px !important",
                          }}
                        >
                          <Typography
                            variant="caption"
                            gutterBottom
                            sx={{ display: "block" }}
                          >
                            {r.seven}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={percentage(r.seven)}
                            sx={{
                              width: "100%",
                              height: "5px",
                              borderRadius: 5,
                              backgroundColor: "#e0e0e0",
                            }}
                          />
                        </Toolbar>
                        <Toolbar
                          sx={{
                            width: "20%",
                            padding: "6px 6px !important",
                            display: "flex",
                            justifyContent: "flex-end",
                            minHeight: "auto !important",
                          }}
                        >
                          <Typography sx={{ marginRight: "10px" }}>
                            {percentage(r.seven)}%
                          </Typography>
                          <Chip
                            label={diffMultiply(r.seven, price)}
                            size="small"
                            color={
                              diffMultiply(r.seven, price) > 2
                                ? "success"
                                : "error"
                            }
                          />
                        </Toolbar>
                      </Toolbar>
                      <Toolbar
                        sx={{
                          width: "90%",
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#eff5fe",
                          borderRadius: "50px",
                          minHeight: "auto !important",
                          padding: "2px 6px !important",
                          marginBottom: "6px",
                        }}
                      >
                        <Typography>
                          <Avatar sx={{ fontSize: "12px", color: "primary" }}>
                            6 <sub>th</sub>
                          </Avatar>
                        </Typography>
                        <Toolbar
                          sx={{
                            width: "60%",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#eff5fe",
                            borderRadius: "50px",
                            minHeight: "auto !important",
                            padding: " 2px 16px !important",
                          }}
                        >
                          <Typography
                            variant="caption"
                            gutterBottom
                            sx={{ display: "block" }}
                          >
                            {r.eight}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={percentage(r.eight)}
                            sx={{
                              width: "100%",
                              height: "5px",
                              borderRadius: 5,
                              backgroundColor: "#e0e0e0",
                            }}
                          />
                        </Toolbar>
                        <Toolbar
                          sx={{
                            width: "20%",
                            padding: "6px 6px !important",
                            display: "flex",
                            justifyContent: "flex-end",
                            minHeight: "auto !important",
                          }}
                        >
                          <Typography sx={{ marginRight: "10px" }}>
                            {percentage(r.eight)}%
                          </Typography>
                          <Chip
                            label={diffMultiply(r.eight, price)}
                            size="small"
                            color={
                              diffMultiply(r.eight, price) > 2
                                ? "success"
                                : "error"
                            }
                          />
                        </Toolbar>
                      </Toolbar>
                      <Toolbar
                        sx={{
                          width: "90%",
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#eff5fe",
                          borderRadius: "50px",
                          minHeight: "auto !important",
                          padding: "2px 6px !important",
                          marginBottom: "6px",
                        }}
                      >
                        <Typography>
                          <Avatar sx={{ fontSize: "12px", color: "primary" }}>
                            7 <sub>th</sub>
                          </Avatar>
                        </Typography>
                        <Toolbar
                          sx={{
                            width: "60%",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#eff5fe",
                            borderRadius: "50px",
                            minHeight: "auto !important",
                            padding: " 2px 16px !important",
                          }}
                        >
                          <Typography
                            variant="caption"
                            gutterBottom
                            sx={{ display: "block" }}
                          >
                            {r.ninth}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={percentage(r.ninth)}
                            sx={{
                              width: "100%",
                              height: "5px",
                              borderRadius: 5,
                              backgroundColor: "#e0e0e0",
                            }}
                          />
                        </Toolbar>
                        <Toolbar
                          sx={{
                            width: "20%",
                            padding: "6px 6px !important",
                            display: "flex",
                            justifyContent: "flex-end",
                            minHeight: "auto !important",
                          }}
                        >
                          <Typography sx={{ marginRight: "10px" }}>
                            {percentage(r.ninth)}%
                          </Typography>
                          <Chip
                            label={diffMultiply(r.ninth, price)}
                            size="small"
                            color={
                              diffMultiply(r.ninth, price) > 2
                                ? "success"
                                : "error"
                            }
                          />
                        </Toolbar>
                      </Toolbar>
                      <Toolbar
                        sx={{
                          width: "90%",
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#eff5fe",
                          borderRadius: "50px",
                          minHeight: "auto !important",
                          padding: "2px 6px !important",
                          marginBottom: "6px",
                        }}
                      >
                        <Typography>
                          <Avatar sx={{ fontSize: "12px", color: "primary" }}>
                            8 <sub>th</sub>
                          </Avatar>
                        </Typography>
                        <Toolbar
                          sx={{
                            width: "60%",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#eff5fe",
                            borderRadius: "50px",
                            minHeight: "auto !important",
                            padding: " 2px 16px !important",
                          }}
                        >
                          <Typography
                            variant="caption"
                            gutterBottom
                            sx={{ display: "block" }}
                          >
                            {r.tenth}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={percentage(r.tenth)}
                            sx={{
                              width: "100%",
                              height: "5px",
                              borderRadius: 5,
                              backgroundColor: "#e0e0e0",
                            }}
                          />
                        </Toolbar>
                        <Toolbar
                          sx={{
                            width: "20%",
                            padding: "6px 6px !important",
                            display: "flex",
                            justifyContent: "flex-end",
                            minHeight: "auto !important",
                          }}
                        >
                          <Typography sx={{ marginRight: "10px" }}>
                            {percentage(r.tenth)}%
                          </Typography>
                          <Chip
                            label={diffMultiply(r.tenth, price)}
                            size="small"
                            color={
                              diffMultiply(r.tenth, price) > 2
                                ? "success"
                                : "error"
                            }
                          />
                        </Toolbar>
                      </Toolbar>
                      <Toolbar
                        sx={{
                          width: "90%",
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#eff5fe",
                          borderRadius: "50px",
                          minHeight: "auto !important",
                          padding: "2px 6px !important",
                          marginBottom: "6px",
                        }}
                      >
                        <Typography>
                          <Avatar sx={{ fontSize: "12px", color: "primary" }}>
                            9 <sub>th</sub>
                          </Avatar>
                        </Typography>
                        <Toolbar
                          sx={{
                            width: "60%",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#eff5fe",
                            borderRadius: "50px",
                            minHeight: "auto !important",
                            padding: " 2px 16px !important",
                          }}
                        >
                          <Typography
                            variant="caption"
                            gutterBottom
                            sx={{ display: "block" }}
                          >
                            {r.eleven}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={percentage(r.eleven)}
                            sx={{
                              width: "100%",
                              height: "5px",
                              borderRadius: 5,
                              backgroundColor: "#e0e0e0",
                            }}
                          />
                        </Toolbar>
                        <Toolbar
                          sx={{
                            width: "20%",
                            padding: "6px 6px !important",
                            display: "flex",
                            justifyContent: "flex-end",
                            minHeight: "auto !important",
                          }}
                        >
                          <Typography sx={{ marginRight: "10px" }}>
                            {percentage(r.eleven)}%
                          </Typography>
                          <Chip
                            label={diffMultiply(r.eleven, price)}
                            size="small"
                            color={
                              diffMultiply(r.eleven, price) > 2
                                ? "success"
                                : "error"
                            }
                          />
                        </Toolbar>
                      </Toolbar>

                      <Toolbar
                        sx={{
                          width: "90%",
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#eff5fe",
                          borderRadius: "50px",
                          minHeight: "auto !important",
                          padding: "2px 6px !important",
                          marginBottom: "6px",
                        }}
                      >
                        <Typography>
                          <Avatar sx={{ fontSize: "12px", color: "primary" }}>
                            10 <sub>th</sub>
                          </Avatar>
                        </Typography>
                        <Toolbar
                          sx={{
                            width: "60%",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#eff5fe",
                            borderRadius: "50px",
                            minHeight: "auto !important",
                            padding: " 2px 16px !important",
                          }}
                        >
                          <Typography
                            variant="caption"
                            gutterBottom
                            sx={{ display: "block" }}
                          >
                            {r.tewel}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={percentage(r.tewel)}
                            sx={{
                              width: "100%",
                              height: "5px",
                              borderRadius: 5,
                              backgroundColor: "#e0e0e0",
                            }}
                          />
                        </Toolbar>
                        <Toolbar
                          sx={{
                            width: "20%",
                            padding: "6px 6px !important",
                            display: "flex",
                            justifyContent: "flex-end",
                            minHeight: "auto !important",
                          }}
                        >
                          <Typography sx={{ marginRight: "10px" }}>
                            {percentage(r.tewel)}%
                          </Typography>
                          <Chip
                            label={diffMultiply(r.tewel, price)}
                            size="small"
                            color={
                              diffMultiply(r.tewel, price) > 2
                                ? "success"
                                : "error"
                            }
                          />
                        </Toolbar>
                      </Toolbar>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Toolbar>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
