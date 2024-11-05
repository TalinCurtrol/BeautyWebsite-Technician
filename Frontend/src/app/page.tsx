"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { CustomHeader, NavItem } from "./layout";
import Dashboard from "./dashboard/page";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TOKEN_KEY, isSessionTokenValid } from "@/utils/jwtUtils";
import router, { useRouter } from "next/router";
import { LOGIN_URL } from "@/urls";
import { navigate } from "./actions";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("token")) {
      console.log("app:token=" + searchParams.get("token"));
      const token = searchParams.get("token");
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
        console.log("app:isSessionTokenValid()=" + isSessionTokenValid());
        if (isSessionTokenValid()) {
          window.location.href = "/dashboard";
        } else {
          console.error("Login failed");
          window.alert("Wrong user name or password");
          window.location.href = LOGIN_URL;
        }
      }
    } else {
      window.location.href = LOGIN_URL; //back to login
    }
  }, []);
  return (
    <main>
      <Dashboard />
    </main>
  );
}
