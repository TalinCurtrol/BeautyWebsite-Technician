"use client";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Box, Container } from "@mui/system";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Button, Divider, ListItemButton, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
dayjs.extend(customParseFormat);
import Badge from "@mui/material/Badge";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import { LOGIN_URL, LOGOUT_URL, ROOT_URL, endpoints } from "@/urls";
import { Transaction } from "@/interfaces";
import {
  TOKEN_KEY,
  getUserNameOrSubjectFromToken,
  isSessionTokenValid,
} from "@/utils/jwtUtils";

export default function Dashboard() {
  const [fromDate, setFromDate] = useState(dayjs("1999-01-01"));
  const [toDate, setToDate] = useState(dayjs());
  const [rightList, setRightList] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedDays, setHighlightedDays] = useState<number[]>([]);
  const [data, setData] = useState<Transaction[]>([]);
  const [m1, setM1] = useState(0);
  const [m2, setM2] = useState(0);
  const [m3, setM3] = useState(0);

  function updateStatusTime(transactionId: string, field: string) {
    fetch(ROOT_URL + endpoints.transaction.updateTime, {
      method: "POST",
      body: JSON.stringify({
        transaction_id: transactionId,
        time: dayjs().format("YYYY/MM/DD hh:mm"),
      }),
      headers: {
        "Content-Type": "application/json",

        Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
      },
    });
    window.location.reload();
  }

  function CustomTitle({ title }: { title: string }) {
    return (
      <Container
        sx={{
          display: "inline-flex",
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
        maxWidth={false}
      >
        <Box sx={{ typography: "h4", marginTop: "20px" }}>{title}</Box>
      </Container>
    );
  }

  useEffect(() => {
    // if (!isSessionTokenValid()) {
    //   console.error("Login failed");
    //   window.location.href = LOGOUT_URL;
    // }

    fetch(
      ROOT_URL +
        endpoints.transaction.getTracking +
        getUserNameOrSubjectFromToken(),
      {
        method: "GET",
        headers: {
          Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data: Transaction[]) => {
        if (data.length !== 0) {
          setData(data);
          console.log("trakcing==" + data);
        }
      });
    fetchThreeMatrics(dayjs("1999/01/01", "YYYY/MM/DD"), dayjs());
    fetchHighlightedDays(dayjs());
  }, []);

  const renderUpdateButton = (params: GridRenderCellParams<any, string>) => {
    if (params.field == "on_the_way_time" && params.value == "") {
      return (
        <strong>
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={{ marginLeft: 16 }}
            onClick={() => updateStatusTime(params.row.id + "", params.field)}
          >
            Update
          </Button>
        </strong>
      );
    } else if (
      params.field == "in_progress_time" &&
      params.value == "" &&
      params.row.on_the_way_time != ""
    ) {
      return (
        <strong>
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={{ marginLeft: 16 }}
            onClick={() => updateStatusTime(params.row.id + "", params.field)}
          >
            Update
          </Button>
        </strong>
      );
    } else if (
      params.field == "done_time" &&
      params.value == "" &&
      params.row.in_progress_time != ""
    ) {
      return (
        <strong>
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={{ marginLeft: 16 }}
            onClick={() => updateStatusTime(params.row.id + "", params.field)}
          >
            Update
          </Button>
        </strong>
      );
    } else {
      return <>{params.value}</>;
    }
  };

  const columu_title: GridColDef[] = [
    { field: "id", headerName: "ID" },
    { field: "service_name", headerName: "Service Name" },
    { field: "service_date", headerName: "Service Date" },
    {
      field: "customer_name",
      headerName: "Client Name",
    },
    { field: "customer_address", headerName: "Client Address" },
    { field: "customer_phone", headerName: "Client Phone Number" },
    { field: "current_state", headerName: "Current State" },
    { field: "commissions", headerName: "Commissions" },
    { field: "surcharge", headerName: "Surcharge" },
    { field: "accepted_time", headerName: "Accepted Time" },
    {
      field: "on_the_way_time",
      headerName: "On the way Time",
      renderCell: renderUpdateButton,
    },
    {
      field: "in_progress_time",
      headerName: "In Progress Time",
      renderCell: renderUpdateButton,
    },
    {
      field: "done_time",
      headerName: "Done Time",
      renderCell: renderUpdateButton,
    },
  ];
  function CustomListItemButton({ item }: { item: Transaction }) {
    return (
      <ListItemButton key={item.id} sx={{ width: 1 }}>
        <ListItemText
          key={item.id + "ID"}
          primary="ID"
          secondary={item.id}
          sx={{ fontweight: "bold" }}
        />
        <ListItemText
          key={item.id + "servicename"}
          primary={item.service_name}
          sx={{ fontweight: "bold" }}
        />
        <ListItemText
          key={item.id + "Commissions"}
          primary="Commissions:"
          secondary={item.commissions}
        />
        <ListItemText
          key={item.id + "Client Name"}
          primary="Client Name:"
          secondary={item.customer_name}
        />
      </ListItemButton>
    );
  }
  function ServerDay(
    props: PickersDayProps<Dayjs> & { highlightedDays?: number[] }
  ) {
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

    const isSelected =
      !props.outsideCurrentMonth &&
      highlightedDays.indexOf(props.day.date()) >= 0;

    return (
      <Badge
        key={props.day.toString()}
        overlap="circular"
        badgeContent={isSelected ? "$" : undefined}
      >
        <PickersDay
          {...other}
          outsideCurrentMonth={outsideCurrentMonth}
          day={day}
        />
      </Badge>
    );
  }
  const fetchHighlightedDays = (date: Dayjs) => {
    const selectedYearandMonth = date.format("YYYY/MM");
    fetch(ROOT_URL + endpoints.transaction.highlightDate, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
      },
      body: JSON.stringify({
        year: selectedYearandMonth.split("/")[0],
        month: selectedYearandMonth.split("/")[1],
        userName: getUserNameOrSubjectFromToken(),
      }),
    })
      .then((res) => res.json())
      .then((data: []) => {
        var a = ([] = data.map((d) => Number(d)));
        console.log(data);
        setHighlightedDays(a);
      });

    setIsLoading(false);
  };
  const handleMonthChange = (date: Dayjs) => {
    setIsLoading(true);
    setHighlightedDays([]);
    fetchHighlightedDays(date);
  };

  const handleDayChange = (date: Dayjs) => {
    var selectedDate = date.format("YYYY/MM/DD");
    fetch(ROOT_URL + endpoints.transaction.serviceListByDate, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
      },
      body: JSON.stringify({
        date: selectedDate,
        userName: getUserNameOrSubjectFromToken(),
      }),
    })
      .then((res) => res.json())
      .then((data: Transaction[]) => {
        setRightList(data);
      });
  };
  const fetchThreeMatrics = (dateF: Dayjs, dateT: Dayjs) => {
    var dateFrom = dateF.format("YYYY/MM/DD");
    var dateTo = dateT.format("YYYY/MM/DD");
    fetch(ROOT_URL + endpoints.fetchMatrics, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
      },
      body: JSON.stringify({
        dateFrom: dateFrom,
        dateTo: dateTo,
        userName: getUserNameOrSubjectFromToken(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setM1(data.m1);
        setM2(data.m2);
        setM3(data.m3);
      });
  };

  return (
    <Container
      sx={{
        display: "inline-flex",
        flexDirection: "column",

        alignItems: "center",
      }}
      maxWidth={false}
    >
      <CustomTitle title="Current tracking:" />
      {data.length == 0 && <div>No Transaction is tracking</div>}
      {data.length != 0 && (
        <DataGrid
          columns={columu_title}
          rows={data}
          sx={{ width: "90vw" }}
          initialState={{
            pagination: { paginationModel: { pageSize: 1 } },
          }}
        />
      )}

      <Box
        sx={{
          width: "80vw",
          boxShadow: 2,
          borderRadius: 5,
          fontSize: 20,
          padding: 15,
          mt: 3,
          backgroundColor: "background.default",
          justifyContent: "left",
          alignItems: "left",
          display: "inline-flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ display: "inline-flex", flexDirection: "row" }}>
          <CustomTitle title="Data from" />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={'"year", "month" and "day"'}
              views={["year", "month", "day"]}
              value={fromDate}
              onChange={(newValue: any) => {
                setFromDate(newValue);
                fetchThreeMatrics(newValue, toDate);
              }}
            />
          </LocalizationProvider>
        </Box>
        <Box sx={{ display: "inline-flex", flexDirection: "row" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <CustomTitle title="to" />
            <DatePicker
              label={'"year", "month" and "day"'}
              views={["year", "month", "day"]}
              value={toDate}
              onChange={(newValue: any) => {
                setToDate(newValue);
                fetchThreeMatrics(fromDate, newValue);
              }}
            />
          </LocalizationProvider>
        </Box>
        <Divider />
        <Box sx={{ display: "inline-flex", flexDirection: "row" }}>
          <CustomTitle title="Total Revenue:" />
          <Box sx={{ marginTop: "20px" }}>{m1}</Box>
        </Box>
        <Box sx={{ display: "inline-flex", flexDirection: "row" }}>
          <CustomTitle title="Total number of done services:" />
          <Box sx={{ marginTop: "20px" }}>{m2}</Box>
        </Box>
        <Box sx={{ display: "inline-flex", flexDirection: "row" }}>
          <CustomTitle title="Total number of Transactions:" />
          <Box sx={{ marginTop: "20px" }}>{m3}</Box>
        </Box>
      </Box>

      <CustomTitle title="Calendar:" />
      <Box
        sx={{
          width: "80vw",
          boxShadow: 2,
          borderRadius: 5,
          fontSize: 20,
          padding: 15,
          mt: 3,
          backgroundColor: "background.default",
          justifyContent: "left",
          alignItems: "left",
          display: "inline-flex",
          flexDirection: "row",
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            defaultValue={dayjs()}
            loading={isLoading}
            onChange={handleDayChange}
            onMonthChange={handleMonthChange}
            renderLoading={() => <DayCalendarSkeleton />}
            slots={{
              day: ServerDay,
            }}
            slotProps={{
              day: {
                highlightedDays,
              } as any,
            }}
          />
        </LocalizationProvider>
        <Box
          sx={{
            width: "50vw",
            boxShadow: -5,
            borderRadius: 5,
            fontSize: 20,
            padding: 15,
            mt: 3,
            backgroundColor: "background.paper",
            justifyContent: "center",
            alignItems: "center",
            display: "inline-flex",
            flexDirection: "column",
          }}
        >
          {rightList.map((t) => (
            <CustomListItemButton item={t} />
          ))}
          {rightList.length == 0 && <>No services in this day!</>}
        </Box>
      </Box>
    </Container>
  );
}
