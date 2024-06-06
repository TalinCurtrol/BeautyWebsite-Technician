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
import ImageUpload from "./ImageUpload";
import { TechnicianProfile } from "@/interfaces";
import { LOGIN_URL, LOGOUT_URL, ROOT_URL, endpoints } from "@/urls";
import {
  TOKEN_KEY,
  getUserNameOrSubjectFromToken,
  isSessionTokenValid,
} from "@/utils/jwtUtils";

const TECHNICIAN_STATUS_CHECK_PASS = "pass";
const TECHNICIAN_STATUS_CHECK_FAILED = "failed";
const TECHNICIAN_STATUS_CHECK_ONGOING = "ongoing";
const TECHNICIAN_STATUS_CHECK_WAITING = "waiting for upload";

export default function Profile() {
  const [data, setData] = useState<TechnicianProfile>({
    id: 0,
    description: "",
    galleryImage1: "",
    galleryImage2: "",
    galleryImage3: "",
    galleryImage4: "",
    nailLicenseImage: "",
    facialLicenseImage: "",
    policeCheckImage: "",
    cvImage: "",
    specialty1: "",
    specialty2: "",
    specialty3: "",
  });

  useEffect(() => {
    if (!isSessionTokenValid()) {
      console.error("Login failed");
      window.location.href = LOGOUT_URL;
    }

    fetch(
      ROOT_URL +
        endpoints.technician.accountByuserName +
        getUserNameOrSubjectFromToken(),
      {
        method: "GET",
        headers: {
          Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data: TechnicianProfile) => {
        console.log(data);
        setData(data);
      });
  }, []);

  function ImageUploader({ bindwith }: { bindwith: string }) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
            console.log("照片字符串" + resultString);
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
          Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
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
  function UploaderBlock({ bindwith }: { bindwith: string }) {
    const image_string = "data:image/jpeg;base64," + data[bindwith];
    return (
      <>
        <Grid container xs={12} sm={16} md={16} lg={16} marginTop={5}>
          <img src={image_string} style={{ width: "400px", height: "300px" }} />
          <ImageUploader bindwith={bindwith} />
        </Grid>
        <Divider />
      </>
    );
  }

  function UploaderBlockwithTiltle({
    title,
    bindwith,
  }: {
    title: string;
    bindwith: string;
  }) {
    const image_string = "data:image/jpeg;base64," + data[bindwith];
    return (
      <>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "left",
            gap: 2,
          }}
        >
          <Typography variant="h5" marginRight={5}>
            {title}:
          </Typography>
          <img src={image_string} style={{ width: "200px", height: "150px" }} />
          <ImageUploader bindwith={bindwith} />
        </Box>
        <Divider />
      </>
    );
  }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      fetch(ROOT_URL + endpoints.technician.submitAccount, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${sessionStorage.getItem(TOKEN_KEY)}`,
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
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h2" sx={{ marginBottom: 6 }}>
              Technician Profile
            </Typography>
            <Typography variant="h4" sx={{ marginBottom: 6 }}>
              All blocks in your profile will show to your customers.
            </Typography>
            <Typography variant="h2" sx={{ marginBottom: 6 }}>
              Describe yourself:
            </Typography>

            <TextField
              size="medium"
              fullWidth
              defaultValue={data.description}
              name="description"
              multiline
              rows={3}
              maxRows={3}
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  description: e.target.value,
                }))
              }
            />
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
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h2" sx={{ marginBottom: 6 }}>
              Specialty
            </Typography>
            <Typography variant="h4" sx={{ marginBottom: 6 }}>
              Define your skills in few words.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h3" sx={{ marginBottom: 6 }}>
              1.
            </Typography>
            <TextField
              size="small"
              fullWidth
              defaultValue={data.specialty1}
              name="description"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  specialty1: e.target.value,
                }))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h3" sx={{ marginBottom: 6 }}>
              2.
            </Typography>
            <TextField
              size="small"
              fullWidth
              defaultValue={data.specialty2}
              name="description"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  specialty2: e.target.value,
                }))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Typography variant="h3" sx={{ marginBottom: 6 }}>
              3.
            </Typography>
            <TextField
              size="small"
              fullWidth
              defaultValue={data.specialty3}
              name="description"
              onChange={(e) =>
                setData((prevState) => ({
                  ...prevState,
                  specialty3: e.target.value,
                }))
              }
            />
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
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h2" sx={{ marginBottom: 6 }}>
          Your Gallery
        </Typography>
        <Box
          sx={{
            justifyContent: "center",
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <UploaderBlock bindwith="galleryImage1" />

          <UploaderBlock bindwith="galleryImage2" />
        </Box>
        <Box
          sx={{
            justifyContent: "center",
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <UploaderBlock bindwith="galleryImage3" />

          <UploaderBlock bindwith="galleryImage4" />
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
          Licenses
        </Typography>

        <UploaderBlockwithTiltle
          title="Nail license"
          bindwith="nailLicenseImage"
        />
        <UploaderBlockwithTiltle
          title="Facial license"
          bindwith="facialLicenseImage"
        />
        <UploaderBlockwithTiltle title="CV" bindwith="cvImage" />
        <UploaderBlockwithTiltle
          title="Police check"
          bindwith="policeCheckImage"
        />
      </Box>
    </Container>
  );
}
