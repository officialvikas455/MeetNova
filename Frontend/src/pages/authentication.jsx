import * as React from "react";
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

  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      setError("");

      if (!username || !password || (formState === 1 && !name)) {
        setError("Please fill in all required fields.");
        return;
      }

      if (formState === 0) {
        await handleLogin(username, password);
      }

      if (formState === 1) {
        const result = await handleRegister(name, username, password);

        setUsername("");
        setPassword("");
        setName("");

        setMessage(result || "Registration successful! Please login.");
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
  };

  return (
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
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar
                sx={{
                  width: 55,
                  height: 55,
                  borderRadius: "16px",
                  background: "linear-gradient(135deg,#6366f1,#2563eb)",
                  boxShadow: "0 10px 30px rgba(79,70,229,0.5)",
                }}
              >
                <VideoCall sx={{ fontSize: 32 }} />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    color: "white",
                    fontSize: { xs: 25, md: 30 },
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  MeetNova
                </Typography>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 13,
                    mt: 0.5,
                    letterSpacing: 0.5,
                  }}
                >
                  Connect • Collaborate • Create
                </Typography>
              </Box>
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
                  Welcome {formState === 0 ? "Back" : "to MeetNova"}
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
                    : "Create your account and start meeting"}
                </Typography>
              </Box>

              {/* Sign In / Sign Up */}

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

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Username"
                  value={username}
                  autoFocus={formState === 0}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={inputStyle}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
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
                  {formState === 0 ? "Login" : "Create Account"}
                </Button>
              </Box>

              {/* Bottom Text */}

              <Box
                sx={{
                  textAlign: "center",
                  mt: 3,
                }}
              >
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
