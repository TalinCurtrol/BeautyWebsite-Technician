/** @format */

// ----------------------------------------------------------------------

export const TOKEN_KEY = "jwtToken";

function jwtDecode(token: string) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join("")
  );
  return JSON.parse(jsonPayload);
}

//---------------------------------------------------------------------------

export const getIdOrSubjectFromToken = (): string | null => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }
  try {
    const decodedToken = jwtDecode(token);
    console.log(decodedToken.ID);

    return decodedToken.ID;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

//---------------------------------------------------------------------------

export const isValidToken = (accessToken: string): boolean => {
  if (!accessToken) {
    return false;
  }

  const decoded = jwtDecode(accessToken);

  const currentTime = Date.now() / 1000;

  return decoded.exp > currentTime;
};

//---------------------------------------------------------------------------

export const isSessionTokenValid = (): boolean => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    return false;
  }
  return isValidToken(token);
};
//---------------------------------------------------------------------------

export const saveValidToken = (token: string): boolean => {
  if (isValidToken(token)) {
    sessionStorage.setItem(TOKEN_KEY, token);
    return true;
  }
  return false;
};

export const clearToken = (): void => {
  sessionStorage.removeItem(TOKEN_KEY);
};


export const getValidToken = (): (string | null) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (isSessionTokenValid()) {
    return sessionStorage.getItem(TOKEN_KEY);
  }
  return null;

}