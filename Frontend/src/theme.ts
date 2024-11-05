'use client';
import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
    spacing: 4,
    typography: {
      fontFamily: ["Roboto", "Cardo", "Open Sans"].join(","),
      h1: {
        fontSize: "35px",
        fontFamily: "Cardo",
      },
      h2: {
        fontSize: "30px",
        fontFamily: "Cardo",
        fontWeight: "bold",
      },
      h3: {
        fontSize: "25px",
        fontFamily: "Roboto",
        fontWeight: "bold",
      },
      h4: {
        fontSize: "20px",
        fontFamily: "Cardo",
        fontWeight: "bold",
      },
      h5: {
        fontSize: "20px",
        fontFamily: "Roboto",
        fontWeight: "bold",
      },
      h6: {
        fontSize: "15px",
        fontFamily: "Cardo",
        fontWeight: "bold",
      },
      body1: {
        fontSize: "17px",
        fontFamily: "Cardo",
        fontWeight: "bold",
      },
      body2: {
        fontSize: "15px",
        fontFamily: "Cardo",
      },
      caption: {
        fontSize: "13px",
        fontFamily: "Cardo",
      },
    },
    palette: {
      background: {
        default: "#fffffe",
        paper: "#f5f0ef",
      },
      primary: {
        main: "#fd1c79",
      },
      secondary: {
        main: "#f5f0ef",
      },
      error: {
        main: "#D72A2A",
      },
      warning: {
        main: "#FC7B09",
      },
      info: {
        main: "#6B7D6A",
      },
      success: {
        main: "#06C200",
      },
      text: {
        primary: "#000000",
        secondary: "#222222",
      },
    },
  });

export default theme;
