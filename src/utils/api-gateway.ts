/** @format */

import axios, { AxiosInstance } from "axios";
import {
  clearToken,
  getIdOrSubjectFromToken,
  getValidToken,
  isSessionTokenValid,
  saveValidToken,
} from "./jwtUtils";

//implements singleton
export class APIGateway {

  public static readonly end_point = {
    home: "/",
    auth: {
      login: "/auth/login",
      logout: "/auth/login",
      register: "/auth/register",
    },
    account: {},
    dashboard: {},
    market: {},
    profile: {
      technicnianProfile: "/technician/profile",
    },
    transaction: {},
  };
  private static gatewayInstance: APIGateway | undefined;
  API_GATEWAY_HOST = process.env.NEXT_PUBLIC_API_HOST;
  allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS;


  private axiosInstance: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_HOST,
    headers: {
      "X-Exclusive-Pampering-App": "Technician-App",
      "Content-Type": "application/json",
      "Cache-Control": "max-age=3600, private",
      "Content-Encoding": "gzip,compress",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Access-Control-Allow-Origin": "",
    },
  });


  // interceptors
  public configureRequestInterceptor() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        try {
          const token = getValidToken();
          if (token)
            config.headers.Authorization = `Bearer ${token}`;
          return config;
        } catch (error) {
          return Promise.reject(error);
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  public logout(): void {
    clearToken();
    this.configureRequestInterceptor();
  }

  public login(userName: string, password: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.axiosInstance) { throw Error("instance issue"); }
        await this.axiosInstance.post(
          APIGateway.end_point.auth.login,
          { userName, password }
        ).then((res) => { saveValidToken(res.data); res.data; }).catch((e) => console.log(e));

        if (isSessionTokenValid()) {
          resolve(true);
        } else { reject("Login failed: No token"); }
      } catch (error) {
        reject(error);
      }
    });
  }

  public registerUser(_userName: string, _password: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.axiosInstance.post(
          APIGateway.end_point.auth.register,
          { userName: _userName, password: _password, role: "ROLE_TECH" }
        );
        const { token } = response?.data;
        if (token) {
          saveValidToken(token);
          resolve(getIdOrSubjectFromToken());
        } else {
          reject("Login failed: No token");
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public request(end_point: string, _method: string): Promise<any> | undefined {
    return this.axiosInstance
      ?.request({ url: end_point, method: _method })
      .then((res) => res.data);
  }

  public post(end_point: string, data: any) {
    let res = this.axiosInstance.post(data).catch((e) => console.log(e));
  }

  public get(end_point: string): Promise<any> {
    return this.axiosInstance
      .get(end_point)
      .then((res) => res.data)
      .catch((e) => console.log(e));
  }

  public put(end_point: string, data: any) {
    this.axiosInstance.post(data).catch((e) => console.log(e));
  }

  public getWithLimit(
    end_point: string,
    _limit: number
  ): Promise<any> | undefined {
    return this.axiosInstance
      ?.request({
        method: "get",
        params: {
          limit: _limit,
        },
      })
      .then((res) => res.data)
      .catch((e) => console.log(e));
  }

  //

  //singleton class
  private APIGateway() {
    this.configureRequestInterceptor();
  }

  public static getInstance(): APIGateway | undefined {
    if (APIGateway.gatewayInstance == undefined) {
      APIGateway.gatewayInstance = new APIGateway();
    }
    /// work around a bug.//////////
    APIGateway.gatewayInstance.configureRequestInterceptor();
    ///////////////////////
    return APIGateway.gatewayInstance;
  }
}
