"use client";
import { Box, Button, Container, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { format } from "date-fns";
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridApi,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import moment from "moment";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { navigate } from "../actions";
import { useEffect, useState } from "react";
import { Transaction } from "@/interfaces";
import { LOGIN_URL, ROOT_URL, endpoints } from "@/urls";
import { isSessionTokenValid } from "@/utils/jwtUtils";

const SERVICE_STATE_ACCEPTED = "Accepted";
const SERVICE_STATE_ON_THE_WAY = "On the way";
const SERVICE_STATE_IN_PROGRESS = "In Progress";
const SERVICE_STATE_DONE = "Done";

export default function TransactionList() {
  const [userName, setUserName] = useState("sample5@sample.com");
  const [data, setData] = useState<Transaction[]>([]);
  useEffect(() => {
    if (!isSessionTokenValid()) {
      console.error("Login failed");
      window.location.href = LOGIN_URL;
    }
    fetch(ROOT_URL + endpoints.transaction.getAllTransactions + userName)
      .then((res) => res.json())
      .then((data: Transaction[]) => {
        console.log(data);
        setData(data);
      });
  }, []);
  const router = useRouter();
  const renderUpdateButton = (params: GridRenderCellParams<any, string>) => {
    if (params.field == "on_the_way_time" && params.value == "") {
      return (
        <strong>
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={{ marginLeft: 16 }}
            onClick={() => {
              const currentDate = new Date();
              fetch(ROOT_URL + endpoints.transaction.updateTime, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  time: format(currentDate, "yyyy/MM/dd hh:mm"),
                  transaction_id: params.row.id,
                }),
              }).then((res) => {
                if (res.status === 200) {
                  window.alert("Successful !");
                  window.location.reload();
                } else {
                  window.alert("error");
                  window.location.reload();
                }
              });

              //change value and refresh here
            }}
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
            onClick={() => {
              const currentDate = new Date();
              fetch(ROOT_URL + endpoints.transaction.updateTime, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  time: format(currentDate, "yyyy/MM/dd hh:mm"),
                  transaction_id: params.row.id,
                }),
              }).then((res) => {
                if (res.status === 200) {
                  window.alert("Successful !");
                  window.location.reload();
                } else {
                  window.alert("error");
                  window.location.reload();
                }
              });
            }}
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
            onClick={() => {
              const currentDate = new Date();
              fetch(ROOT_URL + endpoints.transaction.updateTime, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  time: format(currentDate, "yyyy/MM/dd hh:mm"),
                  transaction_id: params.row.id,
                }),
              }).then((res) => {
                if (res.status === 200) {
                  window.alert("Successful !");
                  window.location.reload();
                } else {
                  window.alert("error");
                  window.location.reload();
                }
              });
            }}
          >
            Update
          </Button>
        </strong>
      );
    } else {
      return <>{params.value}</>;
    }
  };
  const renderReview = (params: GridRenderCellParams<any, number>) => {
    if (params.value == 0) {
      return (
        <strong>
          <Button
            variant="contained"
            type="button"
            color="primary"
            size="small"
            style={{ marginLeft: 16 }}
            onClick={(event) =>
              router.push(
                `/transactionlist/review?id=${params.row.id}&reviewed=${params.value}`
              )
            }
          >
            Create
          </Button>
        </strong>
      );
    } else {
      return (
        <strong>
          <Button
            variant="contained"
            type="button"
            color="primary"
            size="small"
            style={{ marginLeft: 16 }}
            onClick={(event) =>
              router.push(
                `/transactionlist/review?id=${params.row.id}&reviewed=${params.value}`
              )
            }
          >
            View
          </Button>
        </strong>
      );
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
    {
      field: "reviewed",
      headerName: "Reviewed",
      renderCell: renderReview,
    },
  ];

  // const processed_data = data.map((trans: Transaction) => {
  //   trans.accepted_time = moment(trans.accepted_time).format(
  //     "DD/MM/YYYY hh:mm:ss"
  //   );
  //   if (trans.on_the_way_time != "") {
  //     trans.on_the_way_time = moment(trans.on_the_way_time).format(
  //       "DD/MM/YYYY hh:mm:ss"
  //     );
  //   }
  //   if (trans.in_progress_time != "") {
  //     trans.in_progress_time = moment(trans.in_progress_time).format(
  //       "DD/MM/YYYY hh:mm:ss"
  //     );
  //   }
  //   if (trans.done_time != "") {
  //     trans.done_time = moment(trans.done_time).format("DD/MM/YYYY hh:mm:ss");
  //   }
  //   return trans;
  // });

  return (
    <Container
      sx={{
        display: "inline-flex",
        flexDirection: "column",

        alignItems: "center",
      }}
      maxWidth={false}
    >
      <Typography variant="h2" sx={{ marginBottom: 6, marginTop: 4 }}>
        My Transactions
      </Typography>
      <DataGrid
        columns={columu_title}
        rows={data}
        sx={{ width: "90vw" }}
        initialState={{
          pagination: { paginationModel: { pageSize: 8 } },
        }}
        pageSizeOptions={[5, 10, 25]}
      />
    </Container>
  );
}
