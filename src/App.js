import React, { use, useEffect, useMemo, useRef, useState } from "react";
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
import { threeRound } from "./threeDataService";
import { PieChart } from "@mui/x-charts/PieChart";
import InsertInvitationIcon from "@mui/icons-material/InsertInvitation";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Accordion from "@mui/material/Accordion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Checkbox from "@mui/material/Checkbox";
export default function App() {
  const [status, setStatus] = useState("Idle");
  const [rounds, setRounds] = useState([]);
  const [selectCollection, setSelectCollection] = useState("ThreeNumber");
  const [autocall, setAutoCall] = useState(0);
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

        checkLast10ForOne(today, timeArray);

        // Firebase save data based on 10th ele or 11th ele
        const ele10 = Object.values(timeArray[timeArray.length - 16]);
        const firstLen = ele10.toString().split(".")[0]?.length || 0;
        // console.log(ele10[0]);

        //const firstStr = ele10.toString();

        const getCompArr = timeArray.slice(-17);
        if (ele10[0] > 1 && ele10[0] < 1.2) saveGameRound(today, getCompArr);
        if (ele10[0] > 100) threeRound(today, getCompArr);
        /// Onclick condition

        const currentFirst = Object.values(timeArray[timeArray.length - 1])[0];

        if (lastFirstElement !== currentFirst) {
          targetIndexesRef.current.forEach((index) => {
            const offset = index + 1;

            if (timeArray.length > offset) {
              const targetFirst = Object.values(
                timeArray[timeArray.length - offset]
              );

              if (targetFirst[0] > 100) {
                //console.log("Trigger:", index + 2, targetFirst[0]);
                handleClick();
              }
            }
          });

          lastFirstElement = currentFirst;
        }
      }
    } catch {}
  };
  const [targetIndexes, setTargetIndexes] = useState([]);
  const targetIndexesRef = useRef([]);
  const handleCheckboxChange = (index) => {
    setTargetIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };
  useEffect(() => {
    targetIndexesRef.current = targetIndexes;
  }, [targetIndexes]);

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
      const docRef = doc(db, selectCollection, selectDay);
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
  }, [selectDay, selectCollection, autocall]);

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

  const filteredData = useMemo(() => {
    return sortedData.filter(([, rounds]) => {
      const beforeFirst = Object.values(rounds?.[0] ?? {})[0];
      const targetFirst = Object.values(rounds?.[1] ?? {})[0];

      return (
        typeof beforeFirst === "number" &&
        typeof targetFirst === "number" &&
        //&&
        // // high to low
        // beforeFirst >= targetFirst &&
        // beforeFirst >= 8 &&
        // beforeFirst <= 50 &&
        // targetFirst < 1.6

        /// try
        targetFirst >= 1.1
        // beforeFirst >= 8
      );
    });
  }, [sortedData]);

  // Handling select day
  const [docIds, setDocIds] = useState([]);
  async function getAllDocIds() {
    const colRef = collection(db, selectCollection);
    const snapshot = await getDocs(colRef);

    const docIds = snapshot.docs.map((doc) => doc.id);

    console.log(docIds);
    return docIds;
  }

  useEffect(() => {
    getAllDocIds().then(setDocIds);
  }, [selectCollection]);
  // Drawer
  const [open, setOpen] = useState(false);
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
  // Daily data
  const [dailyTarget, setDailyTarget] = useState("0/0");
  const [dailyTotal, setDailyTotal] = useState(0);
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [eighthStat, setEighthStat] = useState("0/0");

  const { greaterThanTwo, total } = filteredData.reduce(
    (acc, [, rounds]) => {
      const eight = Object.values(rounds?.[11] ?? {})[0];

      if (typeof eight === "number") {
        acc.total++; // total length
        if (eight > 2) acc.greaterThanTwo++; // > 2 count
      }

      return acc;
    },
    {
      greaterThanTwo: 0,
      total: 0,
    }
  );
  const eighthResult = `${greaterThanTwo}/${total}`;
  const dailyPercentage = `${greaterThanTwo}/5`;
  useEffect(() => {
    setEighthStat(eighthResult);
    setDailyTarget(dailyPercentage);
  }, [eighthResult]);
  const progressValue = (data) => {
    if (!data) return 0;

    const [x, y] = data.split("/").map(Number);
    if (!y || isNaN(x) || isNaN(y)) return 0;

    return Math.round((x / y) * 100);
  };

  const DrawerList = (
    <Box sx={{ height: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <div
        style={{ flex: "6 1 0%", padding: 20, overflowY: "auto", width: "50%" }}
      >
        {rounds.length === 0 && <div>No data yet</div>}

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
                .map((r, idx, arr) => {
                  const time = Object.keys(r)[0];
                  const len = arr.length;

                  const targetPositions = targetIndexesRef.current.map(
                    (i) => len - (i + 1)
                  );
                  const isGreen = targetPositions.includes(idx);

                  return (
                    <span
                      key={idx}
                      style={{ flex: "0 0 9%", padding: "10px" }}
                      className={isGreen ? "green" : ""}
                    >
                      {(() => {
                        const value = r[time];
                        const isInt = Number.isInteger(value);

                        return isInt ? (
                          <b>{value}</b>
                        ) : (
                          <>
                            {value}
                            <small style={{ marginLeft: "6px", color: "gray" }}>
                              {value > 40 ? "->" : ""}
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
    let [h, m] = time.split(":").map(Number); // seconds ignored

    if (modifier === "PM" && h !== 12) h += 12;
    if (modifier === "AM" && h === 12) h = 0;

    return h * 60 + m;
  };
  // Collection based data
  const COLLECTION_CONFIG = {
    Onepointone: {
      startIndex: 11, // 10th (0-based array)
      endIndex: 16, // 15th
      labelStart: 10,
    },
    ThreeNumber: {
      startIndex: 2, // 2nd
      endIndex: 16, // 7th
      labelStart: 2,
    },
  };
  const RANGE_COLORS = [
    "rgba(23, 107, 239, 0.2)",
    "rgba(255, 62, 48, 0.2)",
    "rgba(247, 181, 41,0.2)",
    "rgba(23, 156, 82, 0.2)",
    "rgba(234, 0, 94, 0.2)",
    "rgba(116, 77, 169, 0.2)",
  ];
  const DARKRANGE_COLORS = [
    "rgba(23, 107, 239)",
    "rgba(255, 62, 48)",
    "rgba(247, 181, 41)",
    "rgba(23, 156, 82)",
    "rgba(234, 0, 94)",
    "rgba(116, 77, 169)",
  ];
  const rows = useMemo(() => {
    const cfg = COLLECTION_CONFIG[selectCollection];

    return Array.from({ length: cfg.endIndex - cfg.startIndex + 1 }, (_, i) => {
      const pos = cfg.labelStart + i;
      return {
        key: `pos_${pos}`,
        label: `${pos}th`,
        color: RANGE_COLORS[i % RANGE_COLORS.length],
        dark: DARKRANGE_COLORS[i % DARKRANGE_COLORS.length],
        dataIndex: cfg.startIndex + i,
      };
    });
  }, [selectCollection]);

  //console.log(data);

  const [price, setPrice] = useState(100);
  const diffMultiply = (value, price) => {
    if (!value?.includes("/")) return 0;

    const [a, b] = value.split("/").map(Number);
    return isNaN(a) || isNaN(b) ? 0 : (a * 2 - b) * price;
  };
  const percentage = (data) => {
    if (!data || typeof data !== "string") return 0;
    const [num, den] = data.split("/");
    if (!num || !den || isNaN(num) || isNaN(den) || +den === 0) {
      return 0;
    }
    return Math.round((+num / +den) * 100);
  };

  /// ---------------- Click Bet -------------------------///
  const handleClick = async () => {
    console.log("called");
    await fetch("http://localhost:9000/bet-click", {
      method: "POST",
    });
  };

  ////
  const [selectedKey, setSelectedKey] = useState("eleven");

  const counts = useMemo(() => {
    const base = {};
    rows.forEach((r) => {
      base[r.key] = { between23: 0, greater3: 0 };
    });

    filteredData.forEach(([, rounds]) => {
      rows.forEach((r) => {
        const val = Object.values(rounds?.[r.dataIndex] ?? {})[0];
        if (typeof val !== "number") return;

        if (val > 2 && val <= 3) base[r.key].between23++;
        if (val > 3) base[r.key].greater3++;
      });
    });

    return base;
  }, [filteredData, rows]);

  const totalCount = filteredData.length;

  const between23 = counts[selectedKey]?.between23 ?? 0;
  const greater3 = counts[selectedKey]?.greater3 ?? 0;

  const failed = totalCount - (between23 + greater3);

  const profit = greater3 * 3 * price;
  const loss = failed * 2 * price;
  const net = profit + greater3 * price - loss;
  const TABLE_COLUMNS = [
    { key: "ten", label: "10th" },
    { key: "eleven", label: "11th" },
    { key: "twelve", label: "12th" },
    { key: "thirteen", label: "13th" },
    { key: "fourteen", label: "14th" },
    { key: "fifteen", label: "15th" },
  ];

  // Tagrget val
  const [targetVal, setTargetVal] = useState(0);
  const handleTarget = (e) => {
    setTargetVal(e.target.value);
    console.log(e.target.value);
  };
  const chatData = [
    {
      id: 0,
      label: "Between 2 to 3",
      value: counts[selectedKey]?.between23 ?? 0,
    },
    {
      id: 1,
      label: "Greater than 3",
      value: counts[selectedKey]?.greater3 ?? 0,
    },
    {
      id: 2,
      label: "Under 2",
      value: Math.max(
        0,
        totalCount -
          ((counts[selectedKey]?.between23 ?? 0) +
            (counts[selectedKey]?.greater3 ?? 0))
      ),
    },
  ].filter((d) => d.value > 0);

  const formatIndian = (num) => {
    return Number(num).toLocaleString("en-IN");
  };

  ///------------ Note
  const generateHourlyRanges = (
    startHour = 6,
    endHour = 21 // 9 PM (24-hr)
  ) => {
    const ranges = [];

    for (let h = startHour; h < endHour; h++) {
      const start = new Date(0, 0, 0, h, 0);
      const end = new Date(0, 0, 0, h + 1, 0);

      const format = (d) =>
        d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

      ranges.push({
        label: `${format(start)} - ${format(end)}`,
        start: format(start),
        end: format(end),
      });
    }

    return ranges;
  };
  const timeRanges = useMemo(() => generateHourlyRanges(6, 21), []);

  const [rangeVal, setRangeVal] = useState(2);
  const analyzeRange = (data, startMin, endMin) => {
    const gt3 = {};
    const bt23 = {};
    const failed = {};

    rows.forEach((r) => {
      gt3[r.key] = 0;
      bt23[r.key] = 0;
      failed[r.key] = 0;
    });

    let total = 0;

    Object.entries(data || {}).forEach(([time, values]) => {
      const currentMin = timeToMinutes(time);

      if (currentMin >= startMin && currentMin < endMin) {
        total++;

        rows.forEach((r) => {
          const val = Object.values(values?.[r.dataIndex] ?? {})[0];
          if (typeof val !== "number") return;

          if (val > 3) gt3[r.key]++;
          else if (val > 2) bt23[r.key]++;
          else failed[r.key]++;
        });
      }
    });

    return {
      total,
      counts: { gt3, bt23, failed },
      values: Object.fromEntries(
        rows.map((r) => [
          r.key,
          `${gt3[r.key] + bt23[r.key]}/${total}`, // keep % logic unchanged
          // `${gt3[r.key] * 2}+${bt23[r.key]} - ${failed[r.key]}`,
        ])
      ),
    };
  };

  const analyzeTimeRangesMerged = (data) => {
    const baseStartMin = timeToMinutes(timeRanges[0].start);

    return [...timeRanges]
      .map((range, index) => {
        const startMin = timeToMinutes(range.start);
        const endMin = timeToMinutes(range.end);

        const independent = analyzeRange(data, startMin, endMin, rangeVal);
        const cumulative = analyzeRange(data, baseStartMin, endMin, rangeVal);

        return {
          range: range.label,
          color: RANGE_COLORS[index % RANGE_COLORS.length],
          independent: independent.values,
          cumulative: cumulative.values,
        };
      })
      .reverse(); //
  };

  const filteredDataObject = useMemo(
    () => Object.fromEntries(filteredData),
    [filteredData]
  );

  const report = useMemo(
    () => analyzeTimeRangesMerged(filteredDataObject),
    [filteredDataObject, timeRanges, rangeVal]
  );
  useEffect(() => {
    if (rows.length) {
      setSelectedKey(rows[0].key);
    }
  }, [rows]);
  return (
    <Grid container spacing={2}>
      <Grid container size={{ xs: 12, md: 12 }}>
        <Grid size={{ xs: 12, md: 12 }}>
          <Card
            sx={{
              marginBottom: "15px",
              display: "flex",
              alignItems: "end",
              justifyContent: "end",
            }}
          >
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="target-label"> Collection</InputLabel>
              <Select
                label="Collection"
                value={selectCollection}
                onChange={(e) => setSelectCollection(e.target.value)}
              >
                <MenuItem value="Onepointone">Onepointone</MenuItem>
                <MenuItem value="ThreeNumber">ThreeNumber</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ m: 1 }}>
              <InputLabel>Target</InputLabel>
              <Select
                value={selectedKey}
                label="Target"
                onChange={(e) => setSelectedKey(e.target.value)}
              >
                {rows.map((r) => (
                  <MenuItem key={r.key} value={r.key}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="price-label"> Price</InputLabel>
              <Select
                labelId="price-label"
                id="price-select-small"
                value={price}
                label="Price"
                onChange={(e) => {
                  setPrice(e.target.value);
                }}
                align="left"
              >
                <MenuItem value="100">100</MenuItem>;
                <MenuItem value="200">200</MenuItem>;
                <MenuItem value="500">500</MenuItem>;
                <MenuItem value="1000">1000</MenuItem>;
                <MenuItem value="2000">2000</MenuItem>;
                <MenuItem value="3000">3000</MenuItem>;
                <MenuItem value="5000">5000</MenuItem>;
                <MenuItem value="10000">10000</MenuItem>;
              </Select>
            </FormControl>
          </Card>
        </Grid>
      </Grid>
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
                  <Typography variant="h6" className="card-title">
                    Playwright Observer
                  </Typography>
                  <IconButton aria-label="data" onClick={toggleDrawer(true)}>
                    <BrowserUpdatedIcon />
                  </IconButton>
                </Toolbar>
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      flexDirection: "column",
                    }}
                  >
                    <Button variant="contained" onClick={startObserver}>
                      Start Observer
                    </Button>
                    <p>
                      Status: <b>{status}</b>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ marginBottom: "15px" }}>
                <Toolbar className="card-header">
                  <Typography variant="h6" className="card-title">
                    Daily History
                  </Typography>
                </Toolbar>

                <CardContent className="payment">
                  <Toolbar className="card-header">
                    <Typography variant="caption">
                      Total <span>({totalCount} × 2)</span>
                    </Typography>
                    <span>{formatIndian(totalCount * price)}</span>
                  </Toolbar>

                  <Toolbar className="card-header">
                    <Typography variant="caption">
                      Between 2 to 3 <span>({between23}× 1)</span>
                    </Typography>
                    <span>{formatIndian(between23 * price)}</span>
                  </Toolbar>

                  <Toolbar className="card-header">
                    <Typography variant="caption">
                      Greater than 3 <span>({greater3} × 2)</span>
                    </Typography>
                    <span>{formatIndian(greater3 * 2 * price)}</span>
                  </Toolbar>

                  <Toolbar className="card-header">
                    <Typography variant="caption">
                      Failed <span>({failed} × 2)</span>
                    </Typography>
                    <span>{formatIndian(failed * 2 * price)}</span>
                  </Toolbar>

                  <Toolbar className="card-header">
                    <span />
                    <Typography
                      variant="h5"
                      color={net >= 0 ? "success.main" : "error.main"}
                    >
                      ₹ {formatIndian(net)}
                    </Typography>
                  </Toolbar>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ marginBottom: "15px" }}>
                <Toolbar className="card-header">
                  <Typography variant="h6" align="left" className="card-title">
                    Today Trends
                  </Typography>
                </Toolbar>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PieChart
                      series={[
                        {
                          innerRadius: 80,
                          outerRadius: 100,
                          data: chatData ?? [],
                        },
                      ]}
                      legend={{ hidden: true }}
                      width={250}
                      height={220}
                    />
                  </Box>
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
                </Toolbar>
                <Table sx={{ width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={4}>Target</TableCell>
                      {rows.map((row, index) => {
                        return (
                          <TableCell align="center">
                            <Checkbox
                              checked={targetIndexes.includes(index)}
                              onChange={() => handleCheckboxChange(index)}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4}>Current Value</TableCell>
                      {report.length > 0 &&
                        rows.map((row) => {
                          const latestReport = report[0]; // ✅ NOT report.length - 1
                          const cumulativeValue =
                            latestReport.cumulative[row.key] ?? 0;

                          return (
                            <TableCell>
                              <Chip
                                key={row.key}
                                label={diffMultiply(cumulativeValue, price)}
                                size="small"
                                color={
                                  diffMultiply(cumulativeValue, price) > 2
                                    ? "success"
                                    : "error"
                                }
                              />
                            </TableCell>
                          );
                        })}
                    </TableRow>
                    <TableRow>
                      <TableCell>S.No</TableCell>
                      <TableCell>Time</TableCell>
                      {/*  <TableCell>Data</TableCell>*/}
                      <TableCell align="center">Before</TableCell>
                      <TableCell align="center">Target</TableCell>

                      {rows.map((row) => (
                        <TableCell align="center" key={row.key}>
                          {row.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredData.map(([groupTime, rounds], index) => (
                      <TableRow key={groupTime}>
                        <TableCell>{filteredData.length - index}</TableCell>
                        <TableCell style={{ whiteSpace: "nowrap" }}>
                          {groupTime}
                        </TableCell>

                        {/*  <TableCell sx={{ display: "flex", flexWrap: "wrap" }}>
                          {rounds.map((item, i) => (
                            <Tooltip key={i} title={Object.keys(item)[0]}>
                              <Chip
                                label={Object.values(item)[0]}
                                sx={{ m: "2px" }}
                              />
                            </Tooltip>
                          ))}
                        </TableCell>*/}

                        <TableCell align="center">
                          <Chip label={Object.values(rounds?.[0] ?? {})[0]} />
                        </TableCell>

                        <TableCell align="center">
                          <Chip label={Object.values(rounds?.[1] ?? {})[0]} />
                        </TableCell>

                        {rows.map((row) => {
                          const value = Object.values(
                            rounds?.[row.dataIndex] ?? {}
                          )[0];
                          const tooltip = Object.keys(
                            rounds?.[row.dataIndex] ?? {}
                          )[0];

                          return (
                            <TableCell align="center" key={row.key}>
                              <Tooltip title={tooltip}>
                                <Chip
                                  label={value}
                                  color={
                                    value >= rangeVal
                                      ? "success"
                                      : value === 1
                                      ? "default"
                                      : "error"
                                  }
                                />
                              </Tooltip>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
          <Grid container size={3} xs={12}></Grid>
        </Grid>
      </Grid>
      <Grid container size={{ xs: 12, md: 3 }} sx={{ height: "100vh" }}>
        <Card
          sx={{
            marginBottom: "15px",
            width: "100%",
            height: "100%",
            paddingBottom: "86px",
          }}
        >
          <Toolbar className="card-header">
            <Typography variant="h6" align="left" className="card-title">
              Note
            </Typography>
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="target-label"> Range</InputLabel>
              <Select
                label="Range"
                value={rangeVal}
                onChange={(e) => setRangeVal(e.target.value)}
              >
                <MenuItem value="2">2</MenuItem>
                <MenuItem value="3">3</MenuItem>
              </Select>
            </FormControl>
          </Toolbar>
          <CardContent
            style={{
              height: "100%",
              overflowY: "auto",
            }}
          >
            {report.map((r) => (
              <>
                <Accordion key={r.range}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={r.range}
                    id={r.range}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 1,
                        fontWeight: "600",
                        color: "rgba(125, 125, 125, 0.87)",
                        backgroundColor: "rgba(0, 0, 0, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        padding: "6px",
                        borderRadius: "3px",
                        margin: "0px",
                      }}
                    >
                      <InsertInvitationIcon sx={{ mr: 1 }} />
                      {r.range}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {rows.map((row) => {
                      const independentValue = r.independent[row.key];
                      const cumulativeValue = r.cumulative[row.key];

                      return (
                        <Box
                          key={row.key}
                          sx={{
                            display: "flex",
                            borderBottom: "1px solid #eee",
                            mb: 1,
                            pb: 0.5,
                            justifyContent: "space-between",
                          }}
                        >
                          {/* Left: Label */}
                          <Avatar
                            sx={{
                              fontSize: "12px",
                              borderRadius: "2px !important",
                              backgroundColor: row.color,
                              color: row.dark,
                            }}
                          >
                            {row.label}
                          </Avatar>

                          {/* Middle: Independent + Cumulative */}
                          <Box
                            sx={{
                              width: "65%",
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            {/* Independent */}
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography variant="caption">
                                  {independentValue}
                                </Typography>
                                <Typography sx={{ fontSize: "0.75rem" }}>
                                  {percentage(independentValue)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={percentage(independentValue)}
                                sx={{
                                  height: 5,
                                  borderRadius: 5,
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Right: Profit / Loss (based on cumulative) */}
                          <Box
                            sx={{
                              width: "15%",
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="caption">
                              {/* {cumulativeValue} */}
                              {percentage(cumulativeValue)}%
                            </Typography>
                            <Chip
                              label={diffMultiply(cumulativeValue, price)}
                              size="small"
                              color={
                                diffMultiply(cumulativeValue, price) > 2
                                  ? "success"
                                  : "error"
                              }
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
                {/* <Box
                  key={r.range}
                  sx={{
                    mb: 2,
                    p: 1,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    backgroundColor: "#fff",
                  }}
                >
                 
                </Box> */}
              </>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
