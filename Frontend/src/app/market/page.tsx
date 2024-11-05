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

import { LOGIN_URL, LOGOUT_URL, ROOT_URL, endpoints } from "@/urls";
import { Job } from "@/interfaces";
import {
  TOKEN_KEY,
  getUserNameOrSubjectFromToken,
  isSessionTokenValid,
} from "@/utils/jwtUtils";

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
  const [myjobs, setMyjobs] = useState<Job[]>([]);
  const [less10jobs, setLess10jobs] = useState<Job[]>([]);
  const [more10jobs, setMore10jobs] = useState<Job[]>([]);
  useEffect(() => {
    if (!isSessionTokenValid()) {
      console.error("Login failed");
      window.location.href = LOGOUT_URL;
    }

    fetch(
      ROOT_URL + endpoints.jobs.specify_me + getUserNameOrSubjectFromToken(),
      {
        method: "GET",
        headers: {
          Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data: Job[]) => {
        setMyjobs(data);
      });
    fetch(
      ROOT_URL +
        endpoints.jobs.within_10_miles +
        getUserNameOrSubjectFromToken(),
      {
        method: "GET",
        headers: {
          Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data: Job[]) => {
        console.log(data);
        setLess10jobs(data);
      });
    fetch(
      ROOT_URL + endpoints.jobs.more_10_miles + getUserNameOrSubjectFromToken(),
      {
        method: "GET",
        headers: {
          Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data: Job[]) => {
        setMore10jobs(data);
      });
  }, []);

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

          Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify({
          order_id: item.id,
          technician_userName: getUserNameOrSubjectFromToken(),
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
        <ListItemText
          primary="Job ID"
          secondary={item.id}
          sx={{ fontweight: "bold", maxWidth: "100px", minWidth: "100px" }}
        />
        <ListItemText
          primary={item.service_name}
          sx={{ fontweight: "bold", maxWidth: "250px", minWidth: "250px" }}
        />
        <ListItemText primary="Service Time: " secondary={item.service_date} />
        <ListItemText
          primary="Commissions:"
          secondary={"$" + item.commissions}
        />
        <ListItemText
          primary="Target Address:"
          secondary={item.customer_address}
          sx={{ maxWidth: "250px", minWidth: "250px" }}
        />
        <ListItemText
          primary="Client Name:"
          secondary={item.customer_name}
          sx={{ maxWidth: "250px", minWidth: "250px" }}
        />
        <>
          <Button onClick={handleClickOpen}>Take it</Button>
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title" sx={{ fontFamily: "bold" }}>
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
