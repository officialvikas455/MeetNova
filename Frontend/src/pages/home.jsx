import { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";

import { Button, TextField } from "@mui/material";

import RestoreIcon from "@mui/icons-material/Restore";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import GroupsIcon from "@mui/icons-material/Groups";
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { AuthContext } from "../contexts/AuthContext";
import Logo from "../components/Logo.jsx";

// eslint-disable-next-line react-refresh/only-export-components
function HomeComponent() {
  const navigate = useNavigate();

  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) {
      return;
    }

    await addToUserHistory(meetingCode);

    navigate(`/${meetingCode}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="homePage">
      {/* =====================================================
          BACKGROUND EFFECTS
      ===================================================== */}

      <div className="homeGlow homeGlowOne"></div>
      <div className="homeGlow homeGlowTwo"></div>
      <div className="homeGlow homeGlowThree"></div>

      <div className="homeGrid"></div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="homeNavbar">
        {/* LEFT - LOGO */}
        <Logo to="/home" subtitle="CONNECT • MEET • GROW" />

        {/* RIGHT SIDE */}

        <div className="homeNavActions">
          {/* ONLINE */}

          <div className="homeOnline">
            <span></span>
            <SecurityIcon fontSize="inherit" style={{ fontSize: "14px" }} />
          </div>

          {/* HISTORY */}

          <button
            className="homeHistoryButton"
            onClick={() => navigate("/history")}
          >
            <RestoreIcon fontSize="small" />

            <span>History</span>
          </button>

          {/* DIVIDER */}

          <div className="homeDivider"></div>

          {/* LOGOUT */}

          <button className="homeLogoutButton" onClick={handleLogout}>
            <LogoutIcon fontSize="small" />

            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* =====================================================
          MAIN HERO
      ===================================================== */}

      <main className="homeMain">
        {/* LEFT CONTENT */}

        <section className="homeContent">
          {/* SMALL BADGE */}

          <div className="homeBadge">
            <span className="homeBadgeDot"></span>
            Your meeting space is ready
          </div>

          {/* HEADING */}

          <h1>
            Connect.
            <span>Communicate.</span>
            <strong>Together.</strong>
          </h1>

          {/* DESCRIPTION */}

          <p className="homeDescription">
            Experience seamless video meetings designed for teams, friends and
            family. Enter a meeting code and connect with everyone instantly.
          </p>

          {/* MEETING CARD */}

          <div className="meetingCard">
            <div className="meetingCardHeader">
              <div className="meetingCardIcon">
                <VideoCallIcon />
              </div>

              <div>
                <h3>Join a Meeting</h3>

                <p>Enter your meeting code below</p>
              </div>
            </div>

            <div className="meetingInputRow">
              <TextField
                fullWidth
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoinVideoCall();
                  }
                }}
                id="meeting-code"
                label="Meeting Code"
                placeholder="e.g. abc-defg-hij"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    backgroundColor: "rgba(255,255,255,0.045)",
                    color: "white",
                    height: "56px",

                    "& fieldset": {
                      borderColor: "rgba(148,163,184,0.25)",
                    },

                    "&:hover fieldset": {
                      borderColor: "rgba(129,140,248,0.55)",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#6366f1",
                    },
                  },

                  "& .MuiInputLabel-root": {
                    color: "#94a3b8",
                  },

                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#818cf8",
                  },

                  "& .MuiOutlinedInput-input::placeholder": {
                    color: "#64748b",
                    opacity: 1,
                  },
                }}
              />

              <Button
                onClick={handleJoinVideoCall}
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                disabled={!meetingCode.trim()}
                sx={{
                  minWidth: "130px",
                  height: "56px",

                  borderRadius: "14px",

                  textTransform: "none",

                  fontSize: "15px",

                  fontWeight: 700,

                  background: "linear-gradient(135deg,#6366f1,#2563eb)",

                  boxShadow: "0 10px 30px rgba(79,70,229,0.3)",

                  "&:hover": {
                    background: "linear-gradient(135deg,#4f46e5,#1d4ed8)",

                    boxShadow: "0 14px 35px rgba(79,70,229,0.4)",

                    transform: "translateY(-2px)",
                  },

                  "&.Mui-disabled": {
                    background: "rgba(99,102,241,0.25)",

                    color: "rgba(255,255,255,0.4)",
                  },

                  transition: "all 0.25s ease",
                }}
              >
                Join
              </Button>
            </div>

            {/* CARD FOOTER */}

            <div className="meetingCardFooter">
              <div>
                <SecurityIcon />
                Secure connection
              </div>

              <div>
                <span className="greenDot"></span>
                Ready to connect
              </div>
            </div>
          </div>

          {/* FEATURES */}

          <div className="homeFeatures">
            <div className="homeFeature">
              <div className="homeFeatureIcon">
                <VideoCallIcon />
              </div>

              <div>
                <strong>HD Video</strong>
                <span>Crystal clear calls</span>
              </div>
            </div>

            <div className="homeFeature">
              <div className="homeFeatureIcon">
                <GroupsIcon />
              </div>

              <div>
                <strong>Group Meetings</strong>
                <span>Connect everyone</span>
              </div>
            </div>

            <div className="homeFeature">
              <div className="homeFeatureIcon">
                <SecurityIcon />
              </div>

              <div>
                <strong>Secure</strong>
                <span>Private meetings</span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            RIGHT VISUAL
        ================================================= */}

        <section className="homeVisual">
          <div className="visualGlow"></div>

          {/* MAIN IMAGE */}

          <div className="homeImageCard">
            <div className="imageTopBar">
              <div className="imageDots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="serverChip">
                <SecurityIcon fontSize="inherit" style={{ fontSize: "13px" }} />
                <span>Server Connected</span>
              </div>

              <div className="liveIndicator">
                <span></span>
                LIVE
              </div>
            </div>

            <img
              src="/images/logo3.png"
              alt="MeetNova Interactive Video Conference"
              loading="eager"
            />
          </div>

          {/* FLOATING CARD */}

          <div className="floatingMeetingCard">
            <div className="floatingIcon">
              <GroupsIcon />
            </div>

            <div>
              <strong>Meeting Ready</strong>

              <span>Everyone can join</span>
            </div>

            <span className="floatingCheck">✓</span>
          </div>

          {/* FLOATING MINI CARD */}

          <div className="floatingCallCard">
            <div className="miniPeople">
              <span>V</span>
              <span>A</span>
              <span>R</span>
            </div>

            <div>
              <strong>3 people online</strong>

              <span>Join them now</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default withAuth(HomeComponent);
