"use client";
import styles from "./app.module.css";
import React, { useEffect, useState } from "react";
import { Box, Button, Container, TextField, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../../theme";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DangerousIcon from "@mui/icons-material/Dangerous";
import Divider from "@mui/material/Divider";
import { LOGIN_URL, ROOT_URL, endpoints } from "@/urls";
import {
  TechnicianAccount,
  TECHNICIAN_STATUS_CHECK_PASS,
  TECHNICIAN_STATUS_CHECK_FAILED,
  TECHNICIAN_STATUS_CHECK_ONGOING,
  TECHNICIAN_STATUS_CHECK_WAITING,
} from "@/interfaces";
import { red } from "@mui/material/colors";
import { TOKEN_KEY, isSessionTokenValid } from "@/utils/jwtUtils";

export default function Account() {
  const [userName, setUserName] = useState("sample5@sample.com");
  const [data, setData] = useState<TechnicianAccount>({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postCode: "",
    cardNumber: "",
    verification: "",
    driverLicenseStatus: "",
    secondaryIdStatus: "",
    workingPermitStatus: "",
    driverLicenseImage: "",
    secondaryIdImage: "",
    workingPermitImage: "",
  });

  useEffect(() => {
    if (!isSessionTokenValid()) {
      console.error("Login failed");
      window.location.href = LOGIN_URL;
    }

    fetch(ROOT_URL + endpoints.technician.accountByuserName + userName)
      .then((res) => res.json())
      .then((data: TechnicianAccount) => {
        setData(data);
      });
  }, []);

  function VerificationStatus() {
    if (data.verification == "0") {
      return (
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <DangerousIcon
            color="error"
            sx={{ fontSize: 30, marginBottom: "20px" }}
          />
          <Typography
            variant="h3"
            color="error"
            sx={{ marginBottom: "20px", marginLeft: "20px" }}
          >
            Failed
          </Typography>
        </Box>
      );
    } else {
      return (
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CheckCircleIcon
            color="success"
            sx={{ fontSize: 30, marginBottom: "20px" }}
          />
          <Typography
            variant="h3"
            color="success.main"
            sx={{ marginBottom: "20px", marginLeft: "20px" }}
          >
            Successful
          </Typography>
        </Box>
      );
    }
  }

  function VerificationStatusHint() {
    if (data.verification == "0") {
      return (
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <DangerousIcon
            color="error"
            sx={{ fontSize: 20, marginBottom: "20px" }}
          />
          <Typography
            variant="h4"
            color="error"
            sx={{ marginBottom: "20px", marginLeft: "20px" }}
          >
            Please check section below to upload files required or check reasons
            for failure.
          </Typography>
        </Box>
      );
    } else {
      return (
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CheckCircleIcon
            color="success"
            sx={{ fontSize: 20, marginBottom: "20px" }}
          />
          <Typography
            variant="h4"
            color="success.main"
            sx={{ marginBottom: "20px", marginLeft: "20px" }}
          >
            Everything's fine. Salute.
          </Typography>
        </Box>
      );
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (data.cardNumber === "") {
      window.alert("You must fill card number!");
      return;
    }

    try {
      fetch(ROOT_URL + endpoints.technician.submitAccount, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((response) => {
        if (response.status == 200) {
          window.alert("successful!");
        } else {
          throw `error with status ${response.status}`;
        }
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function ImageUploader({ bindwith }: { bindwith: string }) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const formData = new FormData();

    const fileToBase64 = (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0])
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
      if (selectedFile != null) {
        try {
          await fileToBase64(selectedFile).then((result) => {
            const resultString = String(result); // 将结果转换为字符串
            console.log(resultString);
            const base64String = resultString.split(",")[1];
            setData((prevState) => ({
              ...prevState,
              [bindwith]: base64String,
            }));
          });
        } catch (error) {
          console.error("Error converting file to Base64:", error);
        }
      }

      fetch(ROOT_URL + endpoints.technician.submitAccount, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          response.json();
          console.log(response.json());
        })
        .then((data) => {
          window.alert("uploaded successfully");
          console.log("Image uploaded successfully:", data);
        })
        .catch((error) => {
          console.error("Error uploading image:", error);
        });
    };

    return (
      <div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>
    );
  }

  function UploaderBlock({
    title,
    status,
    bindwith,
  }: {
    title: string;
    status: string;
    bindwith: string;
  }) {
    const image_string = "data:image/jpeg;base64," + data[bindwith];
    return (
      <>
        <Grid container xs={12} sm={16} md={16} lg={16} marginTop={5}>
          <Typography variant="h5" marginRight={5}>
            {title}:
          </Typography>
          <img src={image_string} style={{ width: "200px", height: "150px" }} />
          <ImageUploader bindwith={bindwith} />
        </Grid>
        <Grid container xs={12} sm={16} md={16} lg={16} marginBottom={5}>
          <Typography variant="h6" marginRight={5} marginLeft={5}>
            check status:
          </Typography>
          {status == TECHNICIAN_STATUS_CHECK_FAILED && (
            <Typography color="error.main" variant="h5">
              {status}
            </Typography>
          )}
          {status == TECHNICIAN_STATUS_CHECK_PASS && (
            <Typography color="success.main" variant="h5">
              {status}
            </Typography>
          )}
          {status == TECHNICIAN_STATUS_CHECK_ONGOING && (
            <Typography color="info.main" variant="h5">
              {status}
            </Typography>
          )}
          {status == TECHNICIAN_STATUS_CHECK_WAITING && (
            <Typography color="warning.main" variant="h5">
              {status}
            </Typography>
          )}
        </Grid>
        <Divider />
      </>
    );
  }

  return (
    <Container
      sx={{
        display: "inline-flex",
        flexDirection: "column",

        alignItems: "center",
      }}
      maxWidth={false}
    >
      <Box
        sx={{
          width: "80vw",
          boxShadow: 2,
          borderRadius: 5,
          fontSize: 20,
          padding: 15,
          mt: 3,
          backgroundColor: "background.default",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h2" sx={{ marginBottom: 6 }}>
              Technician qualification Status:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <VerificationStatus />
          </Grid>
        </Grid>

        <VerificationStatusHint />
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "80vw",
          boxShadow: 2,
          borderRadius: 5,
          fontSize: 20,
          padding: 15,
          mt: 3,
          backgroundColor: "background.default",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h2" sx={{ marginBottom: 6 }}>
          Account details
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h6">First name:</Typography>
            <TextField
              required
              size="small"
              fullWidth
              defaultValue={data.firstName}
              name="first name"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  firstName: e.target.value,
                }))
              }
              variant="filled"
            ></TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h6">Last name:</Typography>
            <TextField
              required
              size="small"
              fullWidth
              defaultValue={data.lastName}
              name="last name"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  lastName: e.target.value,
                }))
              }
              variant="filled"
            ></TextField>
          </Grid>
        </Grid>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h6">E-mail:</Typography>
            <TextField
              required
              size="small"
              fullWidth
              defaultValue={data.email}
              name="email"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  email: e.target.value,
                }))
              }
              variant="filled"
            ></TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h6">Phone number:</Typography>
            <TextField
              required
              size="small"
              fullWidth
              defaultValue={data.phone}
              name="phone"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  phone: e.target.value,
                }))
              }
              variant="filled"
            ></TextField>
          </Grid>
        </Grid>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h6">Address:</Typography>
            <TextField
              required
              size="small"
              fullWidth
              defaultValue={data.address}
              name="address"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  address: e.target.value,
                }))
              }
              variant="filled"
            ></TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h6">Post Code:</Typography>
            <TextField
              required
              size="small"
              fullWidth
              defaultValue={data.postCode}
              name="postcode"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  postCode: e.target.value,
                }))
              }
              variant="filled"
            ></TextField>
          </Grid>
        </Grid>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h6">Card Number to get paid:</Typography>
            <TextField
              required
              size="small"
              fullWidth
              defaultValue={data.cardNumber}
              name="cardNumber"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  cardNumber: e.target.value,
                }))
              }
              variant="filled"
            ></TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            {data.cardNumber === "" && (
              <Typography variant="h6" sx={{ color: "red" }}>
                You need to update card then you can get paid!
              </Typography>
            )}
          </Grid>
        </Grid>

        <Box
          component={"div"}
          display={"flex"}
          justifyContent={"end"}
          sx={{ marginTop: 5 }}
        >
          <Button variant="contained" type="submit">
            Save
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          width: "80vw",
          boxShadow: 2,
          borderRadius: 5,
          fontSize: 20,
          padding: 15,
          mt: 3,
          backgroundColor: "background.default",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h2" sx={{ marginBottom: 6 }}>
          Identity files
        </Typography>
        <Typography variant="h4" color="error.main" sx={{ marginBottom: 3 }}>
          {(data.driverLicenseStatus == TECHNICIAN_STATUS_CHECK_PASS &&
            data.secondaryIdStatus == TECHNICIAN_STATUS_CHECK_PASS &&
            data.workingPermitStatus == TECHNICIAN_STATUS_CHECK_PASS) ||
            "Warning: you must uplaod and pass all identity files!"}
        </Typography>
        <UploaderBlock
          title="Driver License"
          status={data.driverLicenseStatus}
          bindwith="driverLicenseImage"
        />
        <UploaderBlock
          title="Any secondary id (e.g. passport/ photo id/ Medicare card)"
          status={data.secondaryIdStatus}
          bindwith="secondaryIdImage"
        />
        <UploaderBlock
          title="working permit/green card"
          status={data.workingPermitStatus}
          bindwith="workingPermitImage"
        />
      </Box>
    </Container>
  );
}
