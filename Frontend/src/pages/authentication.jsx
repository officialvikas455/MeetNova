import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CssBaseline,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  TextField,
  Typography,
  createTheme,
  ThemeProvider,
} from "@mui/material";

import {
  LockOutlined,
  Visibility,
  VisibilityOff,
  VideoCall,
  Groups,
  CalendarMonth,
  Security,
  ArrowForward,
} from "@mui/icons-material";

import { AuthContext } from "../contexts/AuthContext";
import Logo from "../components/Logo.jsx";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "../environment";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const defaultTheme = createTheme({
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
  },
  palette: {
    primary: {
      main: "#4f46e5",
    },
  },
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    handleRegister,
    handleLogin,
    handleResetPassword,
    handleGoogleAuth,
  } = React.useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/home");
    }
  }, [navigate]);

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    GOOGLE_CLIENT_ID ||
    "423089796215-mtpfs4tqk35dj80ulkt4ie1ao47rnut6.apps.googleusercontent.com";

  const handleMissingGoogleConfig = () => {
    setError(
      "To enable live Google Sign-In, please add your VITE_GOOGLE_CLIENT_ID in the frontend/.env file."
    );
  };

  const handleAuth = async () => {
    try {
      setError("");

      if (formState === 0) {
        if (!username || !password) {
          setError("Please provide both username and password.");
          return;
        }
        await handleLogin(username, password);
      }

      if (formState === 1) {
        if (!name || !username || !password || !email) {
          setError("Please fill in all required fields including your email address.");
          return;
        }
        const result = await handleRegister(name, username, password, email);

        setUsername("");
        setPassword("");
        setName("");
        setEmail("");

        setMessage(result || "Registration successful! Please login.");
        setOpen(true);

        setFormState(0);
      }

      if (formState === 2) {
        if (!username || !password || !confirmPassword) {
          setError("Please fill in all required fields.");
          return;
        }
        if (password.length < 6) {
          setError("New password must be at least 6 characters long.");
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match. Please verify.");
          return;
        }

        const result = await handleResetPassword(username, password);

        setPassword("");
        setConfirmPassword("");

        setMessage(result || "Password reset successful! Please log in.");
        setOpen(true);

        setFormState(0);
      }
    } catch (err) {
      console.log(err);

      const msg =
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";

      setError(msg);
    }
  };

  const switchForm = (state) => {
    setFormState(state);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setEmail("");
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId || "temp-google-client-id"}>
      <ThemeProvider theme={defaultTheme}>
      <CssBaseline />

      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          background:
            "radial-gradient(circle at 15% 20%, rgba(79,70,229,0.35), transparent 30%), radial-gradient(circle at 85% 80%, rgba(37,99,235,0.28), transparent 30%), #070b2b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 0, md: 3 },
        }}
      >
        <Grid
          container
          sx={{
            width: "100%",
            maxWidth: "1450px",
            minHeight: { xs: "100vh", md: "780px" },
            overflow: "hidden",
            borderRadius: { xs: 0, md: "28px" },
            boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
            background: "#090d2f",
          }}
        >
          {/* ================= LEFT SIDE ================= */}

          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              position: "relative",
              minHeight: { xs: "360px", md: "780px" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              p: { xs: 3, md: 6 },
              overflow: "hidden",

              backgroundImage: `
                linear-gradient(
                  135deg,
                  rgba(7,11,43,0.78),
                  rgba(25,22,75,0.72)
                ),
                url("https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85")
              `,

              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Background glow */}

            <Box
              sx={{
                position: "absolute",
                width: "350px",
                height: "350px",
                borderRadius: "50%",
                background: "rgba(79,70,229,0.35)",
                filter: "blur(100px)",
                top: "-100px",
                left: "-100px",
              }}
            />

            {/* Logo */}

            <Box
              sx={{
                position: "relative",
                zIndex: 2,
              }}
            >
              <Logo size="lg" to="/" subtitle="Connect • Collaborate • Create" />
            </Box>

            {/* Hero Content */}

            <Box
              sx={{
                position: "relative",
                zIndex: 2,
                maxWidth: "560px",
                mt: { xs: 4, md: 0 },
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: { xs: 30, md: 48 },
                  lineHeight: 1.1,
                }}
              >
                Better Meetings.
              </Typography>

              <Typography
                sx={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: { xs: 30, md: 48 },
                  lineHeight: 1.1,
                }}
              >
                Stronger Connections.
              </Typography>

              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: 30, md: 48 },
                  lineHeight: 1.1,
                  background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Limitless Possibilities.
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.72)",
                  fontSize: { xs: 15, md: 17 },
                  lineHeight: 1.7,
                  mt: 2,
                  maxWidth: "500px",
                }}
              >
                Experience high-quality video conferencing, real-time
                collaboration and seamless communication — anytime, anywhere.
              </Typography>
            </Box>

            {/* Feature Cards */}

            <Grid
              container
              spacing={2}
              sx={{
                position: "relative",
                zIndex: 2,
                mt: 4,
              }}
            >
              {[
                {
                  icon: <VideoCall />,
                  title: "HD Video",
                  text: "Crystal clear calls",
                },
                {
                  icon: <Groups />,
                  title: "Collaboration",
                  text: "Work together",
                },
                {
                  icon: <CalendarMonth />,
                  title: "Meetings",
                  text: "Easy scheduling",
                },
                {
                  icon: <Security />,
                  title: "Secure",
                  text: "Private meetings",
                },
              ].map((item, index) => (
                <Grid size={{ xs: 6, sm: 3 }} key={index}>
                  <Box
                    sx={{
                      p: 1.5,
                      height: "100%",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      backdropFilter: "blur(15px)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "11px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg,#6366f1,#2563eb)",
                        color: "white",
                        mb: 1,
                      }}
                    >
                      {item.icon}
                    </Box>

                    <Typography
                      sx={{
                        color: "white",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: 11,
                        mt: 0.3,
                      }}
                    >
                      {item.text}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* ================= RIGHT SIDE ================= */}

          <Grid
            size={{ xs: 12, md: 6 }}
            component={Paper}
            elevation={0}
            sx={{
              background: "linear-gradient(145deg,#ffffff 0%,#f8faff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 3, sm: 5, md: 7 },
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: "480px",
              }}
            >
              {/* Login Icon */}

              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Avatar
                  sx={{
                    width: 70,
                    height: 70,
                    margin: "0 auto",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg,#6366f1,#2563eb)",
                    boxShadow: "0 15px 35px rgba(79,70,229,0.3)",
                  }}
                >
                  <VideoCall sx={{ fontSize: 40 }} />
                </Avatar>

                <Typography
                  sx={{
                    fontSize: { xs: 28, md: 32 },
                    fontWeight: 800,
                    color: "#111936",
                    mt: 2,
                  }}
                >
                  Welcome{" "}
                  {formState === 0
                    ? "Back"
                    : formState === 1
                    ? "to MeetNova"
                    : "• Reset Password"}
                </Typography>

                <Typography
                  sx={{
                    color: "#697386",
                    mt: 0.7,
                    fontSize: 15,
                  }}
                >
                  {formState === 0
                    ? "Sign in to continue to MeetNova"
                    : formState === 1
                    ? "Create your account and start meeting"
                    : "Enter your username and choose a new password"}
                </Typography>
              </Box>

              {/* Sign In / Sign Up */}

              {formState !== 2 ? (
                <Box
                  sx={{
                    display: "flex",
                    p: 0.6,
                    borderRadius: "14px",
                    background: "#eef1f8",
                    mb: 3,
                  }}
                >
                  <Button
                    fullWidth
                    onClick={() => switchForm(0)}
                    sx={{
                      py: 1.2,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontSize: 15,
                      fontWeight: 700,
                      color: formState === 0 ? "white" : "#687086",
                      background:
                        formState === 0
                          ? "linear-gradient(90deg,#6366f1,#2563eb)"
                          : "transparent",
                      boxShadow:
                        formState === 0
                          ? "0 7px 20px rgba(79,70,229,0.25)"
                          : "none",
                      "&:hover": {
                        background:
                          formState === 0
                            ? "linear-gradient(90deg,#6366f1,#2563eb)"
                            : "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    Sign In
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => switchForm(1)}
                    sx={{
                      py: 1.2,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontSize: 15,
                      fontWeight: 700,
                      color: formState === 1 ? "white" : "#687086",
                      background:
                        formState === 1
                          ? "linear-gradient(90deg,#6366f1,#2563eb)"
                          : "transparent",
                      boxShadow:
                        formState === 1
                          ? "0 7px 20px rgba(79,70,229,0.25)"
                          : "none",
                      "&:hover": {
                        background:
                          formState === 1
                            ? "linear-gradient(90deg,#6366f1,#2563eb)"
                            : "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    Sign Up
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.2,
                    px: 2,
                    borderRadius: "12px",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}
                  >
                    Account Recovery
                  </Typography>

                  <Button
                    size="small"
                    onClick={() => switchForm(0)}
                    sx={{
                      textTransform: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#4f46e5",
                      p: 0,
                      minWidth: "auto",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    ← Back to Sign In
                  </Button>
                </Box>
              )}

              {/* Google Sign In Option */}
              {formState !== 2 && (
                <>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    {googleClientId ? (
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "center",
                          "& > div": { width: "100% !important" },
                        }}
                      >
                        <GoogleLogin
                          onSuccess={async (credentialResponse) => {
                            try {
                              if (credentialResponse.credential) {
                                await handleGoogleAuth(
                                  credentialResponse.credential
                                );
                                navigate("/home");
                              }
                            } catch (err) {
                              console.error("Google authentication error:", err);
                              let errMsg = "Google authentication failed. Please try again.";
                              if (err?.response?.status === 404) {
                                errMsg =
                                  "Backend deployment pending on Render. Please trigger 'Manual Deploy' on Render or try again in a minute.";
                              } else if (err?.response?.data?.message) {
                                errMsg = err.response.data.message;
                              } else if (err?.message) {
                                errMsg = `Google Auth error: ${err.message}`;
                              }
                              setError(errMsg);
                            }
                          }}
                          onError={() => {
                            setError(
                              "Google sign-in was unsuccessful. Please try again."
                            );
                          }}
                          theme="outline"
                          shape="rectangular"
                          size="large"
                          width="380"
                          text={formState === 0 ? "signin_with" : "signup_with"}
                        />
                      </Box>
                    ) : (
                      <Button
                        fullWidth
                        onClick={handleMissingGoogleConfig}
                        startIcon={<GoogleIcon />}
                        sx={{
                          py: 1.3,
                          borderRadius: "12px",
                          textTransform: "none",
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#1e293b",
                          background: "#ffffff",
                          border: "1px solid #d1d5db",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                          "&:hover": {
                            background: "#f8fafc",
                            borderColor: "#94a3b8",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        Continue with Google
                      </Button>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      my: 2.2,
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{ flex: 1, height: "1px", background: "#e2e8f0" }}
                    />
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#94a3b8",
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                      }}
                    >
                      or continue with username
                    </Typography>
                    <Box
                      sx={{ flex: 1, height: "1px", background: "#e2e8f0" }}
                    />
                  </Box>
                </>
              )}

              {/* Form */}

              <Box component="form" noValidate>
                {formState === 1 && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Full Name"
                    value={name}
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                    sx={inputStyle}
                  />
                )}

                {formState === 1 && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Email Address"
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={inputStyle}
                  />
                )}

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label={formState === 1 ? "Username" : "Username or Email"}
                  placeholder={
                    formState === 1
                      ? "Choose a unique username"
                      : "Enter username or email"
                  }
                  value={username}
                  autoFocus={formState === 0}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={inputStyle}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label={formState === 2 ? "New Password" : "Password"}
                  value={password}
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={inputStyle}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {formState === 2 && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Confirm New Password"
                    value={confirmPassword}
                    type={showConfirmPassword ? "text" : "password"}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={inputStyle}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                {/* Error */}

                {error && (
                  <Typography
                    sx={{
                      color: "#dc2626",
                      fontSize: 13,
                      mt: 1,
                      px: 1,
                    }}
                  >
                    {error}
                  </Typography>
                )}

                {/* Remember Me */}

                {formState === 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Checkbox
                        size="small"
                        sx={{
                          color: "#6366f1",
                          "&.Mui-checked": {
                            color: "#4f46e5",
                          },
                        }}
                      />

                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#596277",
                        }}
                      >
                        Remember me
                      </Typography>
                    </Box>

                    <Button
                      onClick={() => switchForm(2)}
                      sx={{
                        textTransform: "none",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#4f46e5",
                      }}
                    >
                      Forgot Password?
                    </Button>
                  </Box>
                )}

                {/* Submit */}

                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  onClick={handleAuth}
                  endIcon={<ArrowForward />}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.6,
                    borderRadius: "13px",
                    textTransform: "none",
                    fontSize: 16,
                    fontWeight: 700,
                    background: "linear-gradient(90deg,#6366f1,#2563eb)",
                    boxShadow: "0 12px 30px rgba(79,70,229,0.3)",
                    "&:hover": {
                      background: "linear-gradient(90deg,#4f46e5,#1d4ed8)",
                      transform: "translateY(-1px)",
                      boxShadow: "0 15px 35px rgba(79,70,229,0.35)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {formState === 0
                    ? "Login"
                    : formState === 1
                    ? "Create Account"
                    : "Reset Password"}
                </Button>
              </Box>

              {/* Bottom Text */}

              <Box
                sx={{
                  textAlign: "center",
                  mt: 3,
                }}
              >
                {formState === 2 ? (
                  <Typography
                    sx={{
                      color: "#697386",
                      fontSize: 14,
                    }}
                  >
                    Remember your password?
                    <Button
                      onClick={() => switchForm(0)}
                      sx={{
                        ml: 0.5,
                        textTransform: "none",
                        fontWeight: 700,
                        color: "#4f46e5",
                        minWidth: "auto",
                        p: 0,
                      }}
                    >
                      Sign In
                    </Button>
                  </Typography>
                ) : (
                  <Typography
                    sx={{
                      color: "#697386",
                      fontSize: 14,
                    }}
                  >
                    {formState === 0
                      ? "Don't have an account?"
                      : "Already have an account?"}

                    <Button
                      onClick={() => switchForm(formState === 0 ? 1 : 0)}
                      sx={{
                        ml: 0.5,
                        textTransform: "none",
                        fontWeight: 700,
                        color: "#4f46e5",
                        minWidth: "auto",
                        p: 0,
                      }}
                    >
                      {formState === 0 ? "Sign Up" : "Sign In"}
                    </Button>
                  </Typography>
                )}
              </Box>

              {/* Security */}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mt: 4,
                  pt: 2.5,
                  borderTop: "1px solid #e7eaf2",
                }}
              >
                <Security
                  sx={{
                    fontSize: 18,
                    color: "#4f46e5",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#7b8497",
                  }}
                >
                  Secure & Private Video Conferencing
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Snackbar */}

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        message={message}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      />
    </ThemeProvider>
  </GoogleOAuthProvider>
  );
}

/* =========================
   TEXT FIELD STYLE
========================= */

const inputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "13px",
    backgroundColor: "#ffffff",

    "& fieldset": {
      borderColor: "#dce1ec",
    },

    "&:hover fieldset": {
      borderColor: "#a5b4fc",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#6366f1",
      borderWidth: "2px",
    },
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#4f46e5",
  },
};
