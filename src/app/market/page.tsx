"use client";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { LOGIN_URL, ROOT_URL, endpoints } from "@/urls";
import { Job } from "@/interfaces";
import { isSessionTokenValid } from "@/utils/jwtUtils";

function CustomTitle({ title }: { title: string }) {
  return (
    <Container
      sx={{
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
      maxWidth={false}
    >
      <Box sx={{ typography: "h4", marginTop: "20px" }}>{title}</Box>
    </Container>
  );
}

export default function Market() {
  const [userName, setUserName] = useState("sample5@sample.com");
  const [myjobs, setMyjobs] = useState<Job[]>([]);
  const [less10jobs, setLess10jobs] = useState<Job[]>([]);
  const [more10jobs, setMore10jobs] = useState<Job[]>([]);
  useEffect(() => {
    if (!isSessionTokenValid()) {
      console.error("Login failed");
      window.location.href = LOGIN_URL;
    }
    fetch(ROOT_URL + endpoints.jobs.specify_me + userName)
      .then((res) => res.json())
      .then((data: Job[]) => {
        setMyjobs(data);
      });
    fetch(ROOT_URL + endpoints.jobs.within_10_miles + userName)
      .then((res) => res.json())
      .then((data: Job[]) => {
        console.log(data);
        setLess10jobs(data);
      });
    fetch(ROOT_URL + endpoints.jobs.more_10_miles + userName)
      .then((res) => res.json())
      .then((data: Job[]) => {
        setMore10jobs(data);
      });
  }, []);

  // const res1 = await fetch(
  //   ROOT_URL + endpoints.technician.accountByuserName + `${Technician_id}`
  // );
  // const technician_account = await res1.json();
  // var current_address = technician_account.address;

  // const res2 = await fetch(`http://localhost:9000/jobs`, {
  //   cache: "no-store",
  // });
  // const jobs = await res2.json();

  // const res3 = await fetch(`http://localhost:9000/getgooglemapkey`, {
  //   cache: "no-store",
  // });
  // const data3 = await res3.json();
  // var googlemapkey = data3.key;
  // var less10jobs: Job[] = [];
  // var more10jobs: Job[] = [];

  // for (const j of jobs) {
  //   var url = encodeURI(
  //     "https://maps.googleapis.com/maps/api/distancematrix/json?destinations=" +
  //       j.customer_address +
  //       "&origins=" +
  //       current_address +
  //       "&units=imperial&key=" +
  //       googlemapkey
  //   );
  //   console.log(url);
  //   const res4 = await fetch(url);
  //   const data4 = await res4.json();
  //   var distance = Number(
  //     data4.rows[0].elements[0].distance.text.split(" ")[0]
  //   );
  //   if (distance <= 10) {
  //     less10jobs.push(j);
  //   } else {
  //     more10jobs.push(j);
  //   }
  // }

  function CustomListItemButton({ item }: { item: Job }) {
    const [open, setOpen] = useState(false);
    function handleClose() {
      setOpen(false);
    }
    function handleUpdate() {
      fetch(ROOT_URL + endpoints.technician.takeJob, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: item.id,
          technician_userName: userName,
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
      setOpen(false);
    }
    const handleClickOpen = () => {
      setOpen(true);
    };
    return (
      <ListItemButton key={item.id}>
        <ListItemText primary={item.service_name} sx={{ fontweight: "bold" }} />
        <ListItemText primary="Service Date: " secondary={item.service_date} />
        <ListItemText primary="Commissions:" secondary={item.commissions} />
        <ListItemText
          primary="Target Address:"
          secondary={item.customer_address}
        />
        <ListItemText primary="Client Name:" secondary={item.customer_name} />
        <>
          <Button onClick={handleClickOpen}>Take it</Button>
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {"Do you want to take this order?"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Please review the time and place as well as the service, you may
                not cancel your order after the service has started.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} autoFocus>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Yes</Button>
            </DialogActions>
          </Dialog>
        </>
      </ListItemButton>
    );
  }

  return (
    <Container
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
      maxWidth={false}
    >
      <CustomTitle title="Jobs for me" />
      <Box
        sx={{
          boxShadow: 3,
          backgroundColor: "background.default",
          marginTop: "15px",
          marginLeft: "30px",
          marginRight: "30px",
          borderRadius: "20px",
          width: "90vw",
          alignItems: "center",
        }}
      >
        {myjobs.map((j) => (
          <CustomListItemButton item={j} />
        ))}
      </Box>
      <CustomTitle title="Jobs within 10 miles" />
      <Box
        sx={{
          boxShadow: 3,
          backgroundColor: "background.default",
          marginTop: "15px",
          marginLeft: "30px",
          marginRight: "30px",
          borderRadius: "20px",
          width: "90vw",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {less10jobs.map((j) => (
          <CustomListItemButton item={j} />
        ))}
      </Box>
      <CustomTitle title="Jobs within 20 miles" />
      <Box
        sx={{
          boxShadow: 3,
          backgroundColor: "background.default",
          marginTop: "15px",
          marginLeft: "30px",
          marginRight: "30px",
          borderRadius: "20px",
          width: "90vw",
          alignItems: "center",
        }}
      >
        {more10jobs.map((j) => (
          <CustomListItemButton item={j} />
        ))}
      </Box>
    </Container>
  );
}
