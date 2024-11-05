/** @format */

"use client";

import { useMemo, useEffect, useReducer, useCallback } from "react";

import { AuthContext } from "./auth-context";
import { AuthUserType, ActionMapType, AuthStateType } from "../types";
import { APIGateway } from "../../utils/api-gateway";

import { isSessionTokenValid, getIdOrSubjectFromToken } from "@/utils/jwtUtils";

enum Types {
  INITIAL = "INITIAL",
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  LOGOUT = "LOGOUT",
}

type Payload = {
  [Types.INITIAL]: {
    user: AuthUserType;
  };
  [Types.LOGIN]: {
    user: AuthUserType;
  };
  [Types.REGISTER]: {
    user: AuthUserType;
  };
  [Types.LOGOUT]: undefined;
};

type ActionsType = ActionMapType<Payload>[keyof ActionMapType<Payload>];

// ----------------------------------------------------------------------

const initialState: AuthStateType = {
  user: null,
  loading: true,
};


const reducer = (state: AuthStateType, action: ActionsType) => {
  if (action.type === Types.INITIAL) {
    return {
      loading: false,
      user: action.payload.user,
    };
  }
  if (action.type === Types.LOGIN) {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === Types.REGISTER) {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === Types.LOGOUT) {
    return {
      ...state,
      user: null,
    };
  }
  return state;
};

// ----------------------------------------------------------------------
type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialize = useCallback(async () => {
    try {
      if (isSessionTokenValid()) {
        const user = { id: getIdOrSubjectFromToken() };
        dispatch({ type: Types.INITIAL, payload: { user: user } });
      } else {
        dispatch({ type: Types.INITIAL, payload: { user: null } });
      }
    } catch (error) {
      console.error(error);
      dispatch({
        type: Types.INITIAL,
        payload: {
          user: null,
        },
      });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // LOGIN
  const login = useCallback(async (userName: string, pwd: string) => {
    let user = null;
    let _loginStatus = Types.INITIAL;

    let loginSuccess = APIGateway.getInstance()
      ?.login(userName, pwd)
      .catch((e) => {
        console.log("login failed", e);
      });
    if (loginSuccess) {
      user = { id: getIdOrSubjectFromToken(), userName: userName };
      _loginStatus = Types.LOGIN
    }

    dispatch({
      type: _loginStatus,
      payload: {
        user: {
          ...user,
        },
      },
    });
  }, [dispatch]);

  // REGISTER
  const register = useCallback(
    async (userName: string, pwd: string, role: string) => {
      let user = null;
      let _id = APIGateway.getInstance()
        ?.registerUser(userName, pwd)
        .catch((e) => {
          console.log("login failed", e);
        });
      if (_id) {
        user = { id: _id };
      }

      dispatch({
        type: Types.REGISTER,
        payload: {
          user: {
            ...user,
          },
        },
      });
    },
    [dispatch]
  );

  // LOGOUT
  const logout = useCallback(async () => {
    APIGateway.getInstance()?.logout(); // clears token & reconfigure interceptor
    dispatch({
      type: Types.LOGOUT,
    });
  }, [dispatch]);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? "authenticated" : "unauthenticated";

  const status = state.loading ? "loading" : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: "jwt",
      loading: status === "loading",
      authenticated: status === "authenticated",
      unauthenticated: status === "unauthenticated",
      //
      login,
      register,
      logout,
    }),
    [login, logout, register, state.user, status]
  );

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
}
