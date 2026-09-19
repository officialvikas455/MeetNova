import axios, { HttpStatusCode } from "axios";
import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  const handleRegister = async (name, username, password, email) => {
    // eslint-disable-next-line no-useless-catch
    try {
      let request = await client.post("/register", {
        name,
        username,
        password,
        email,
      });

      if (
        request.status === HttpStatusCode.Created ||
        request.status === 201
      ) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    // eslint-disable-next-line no-useless-catch
    try {
      let request = await client.post("/login", {
        username,
        password,
      });

      if (request.status === HttpStatusCode.Ok) {
        localStorage.setItem("token", request.data.token);
        localStorage.setItem("user", JSON.stringify(request.data.user));
        if (request.data.user?.username || request.data.user?.name) {
          localStorage.setItem("username", request.data.user.username || request.data.user.name);
        }
        setUserData(request.data.user);
        navigate("/home"); // redirect after successful login
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserData(null);
    navigate("/");
  };

  const getHistoryOfUser = async () => {
    try {
      const response = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user history:", error);
      throw error;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    // eslint-disable-next-line no-useless-catch
    try {
      let request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch (error) {
      throw error;
    }
  };

  const handleResetPassword = async (username, newPassword) => {
    // eslint-disable-next-line no-useless-catch
    try {
      let response = await client.post("/reset_password", {
        username,
        newPassword,
      });

      if (response.status === HttpStatusCode.Ok || response.status === 200) {
        return response.data?.message || "Password reset successfully! Please log in.";
      }
    } catch (err) {
      throw err;
    }
  };

  const handleGoogleAuth = async (credential) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await client.post("/google_login", {
        credential,
      });

      if (response.status === 200 || response.status === HttpStatusCode.Ok) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.user?.username || response.data.user?.name) {
          localStorage.setItem("username", response.data.user.username || response.data.user.name);
        }
        setUserData(response.data.user);
        navigate("/home");
        return response.data;
      }
    } catch (err) {
      throw err;
    }
  };

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    handleGoogleAuth,
    handleResetPassword,
    handleLogout,
    getHistoryOfUser,
    addToUserHistory,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
