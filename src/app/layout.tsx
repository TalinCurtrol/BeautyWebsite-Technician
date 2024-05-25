"use client";
import { Inter } from "next/font/google";
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import * as React from "react";
import { createTheme } from "@mui/material/styles";
import { TabsList } from "@mui/base/TabsList";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Cookies from "js-cookie";
import theme from "../theme";
import { ThemeProvider } from "@mui/material/styles";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { Select } from "@mui/material";
import { TOKEN_KEY } from "@/utils/jwtUtils";
import { LOGIN_URL, LOGOUT_URL } from "@/urls";

const inter = Inter({ subsets: ["latin"] });

export interface NavItem {
  label: string;
  href?: string;
  value: number;
}
function samePageLinkNavigation(
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return false;
  }
  return true;
}

interface LinkTabProps {
  label?: string;
  href?: string;
  selected?: boolean;
  value: number;
  key: string;
}

function LinkTab(props: LinkTabProps) {
  if (props.href == "/dashboard") {
    return (
      <Tab
        component="a"
        sx={{ fontWeight: "bold", fontSize: "17px" }}
        onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          // Routing libraries handle this, you can remove the onClick handle when using them.
          if (samePageLinkNavigation(event)) {
            event.preventDefault();
            window.location.href = props.href ?? "#";
          }
        }}
        aria-current={props.selected && "page"}
        {...props}
      />
    );
  } else {
    return (
      <Tab
        component="a"
        sx={{ fontWeight: "bold", fontSize: "17px" }}
        // onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        //   // Routing libraries handle this, you can remove the onClick handle when using them.
        //   if (samePageLinkNavigation(event)) {
        //     event.preventDefault();
        //     window.location.href = props.href ?? "#";
        //   }
        // }}
        aria-current={props.selected && "page"}
        {...props}
      />
    );
  }
}

export function CustomHeader({ items }: { items: NavItem[] }) {
  const currnetid = Cookies.get("headerid");

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (
      event.type !== "click" ||
      (event.type === "click" &&
        samePageLinkNavigation(
          event as React.MouseEvent<HTMLAnchorElement, MouseEvent>
        ))
    ) {
      Cookies.set("headerid", "" + newValue);
    }
  };

  return (
    <AppBar
      position="sticky"
      component="header"
      style={{
        height: "80px",
        width: "100%",
        backgroundColor: "white",
      }}
    >
      <Container
        sx={{
          display: "inline-flex",
          flexDirection: "row",
          justifyContent: "space-around",
        }}
        maxWidth="xl"
      >
        <Container
          sx={{
            display: "inline-flex",
            flexDirection: "row",
            justifyContent: "left",
          }}
          maxWidth="sm"
        >
          <Box
            component="img"
            sx={{
              height: 50,
              width: 50,
              marginTop: "13px",
              marginRight: "10px",
            }}
            alt="The house from the offer."
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&w=350&dpr=2"
          />
          <Box
            sx={{
              color: "text.primary",
              typography: "h3",
              marginTop: "25px",
            }}
          >
            XCLUSIVE PAMPERING
          </Box>
        </Container>

        <Container
          sx={{
            display: "inline-flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
          maxWidth="md"
        >
          <Box
            sx={{
              marginTop: "12px",
              display: "inline-flex",
              flexDirection: "row",
            }}
          >
            <Tabs
              value={currnetid ? +currnetid : 0}
              defaultValue={currnetid ? +currnetid : 0}
              onChange={handleChange}
              role="navigation"
              textColor="primary"
              indicatorColor="primary"
            >
              {items.map((navItem: NavItem) => (
                <LinkTab
                  value={navItem.value}
                  key={"" + navItem.value}
                  label={navItem.label}
                  href={navItem.href ?? "#"}
                />
              ))}
            </Tabs>
            <Button
              variant="contained"
              sx={{
                marginTop: "5px",
                marginLeft: "10px",
                height: "35px",
                width: "106px",
                fontWeight: "bold",
                padding: 0,
              }}
              onClick={() => {
                sessionStorage.removeItem(TOKEN_KEY);
                window.location.href = LOGOUT_URL;
              }}
            >
              LOG OUT
            </Button>
          </Box>
        </Container>
      </Container>
    </AppBar>
  );
}

export const NAV_ITEMS: Array<NavItem> = [
  {
    label: "Dash Board",
    href: "/",
    value: 0,
  },

  {
    label: "Order History",
    href: "/transactionlist",
    value: 1,
  },
  {
    label: "Market",
    href: "/market",
    value: 2,
  },
  {
    label: "Profile",
    href: "/profile",
    value: 3,
  },
  {
    label: "Account",
    href: "/account",
    value: 4,
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CustomHeader items={NAV_ITEMS} />
            <main>{children}</main>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
