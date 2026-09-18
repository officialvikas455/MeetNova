import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import HomeIcon from "@mui/icons-material/Home";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HistoryIcon from "@mui/icons-material/History";
import SecurityIcon from "@mui/icons-material/Security";

import { IconButton } from "@mui/material";
import Logo from "../components/Logo.jsx";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history || []);
      } catch (error) {
        console.error("Failed to fetch meeting history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white"
      style={{
        background: `
          radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.28), transparent 38%),
          radial-gradient(circle at 85% 75%, rgba(139, 92, 246, 0.22), transparent 38%),
          linear-gradient(180deg, rgba(5, 8, 31, 0.82) 0%, rgba(7, 11, 43, 0.92) 100%),
          url("/images/cosmic-bg.jpg")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* =====================================================
          BACKGROUND
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Purple glow */}
        <div className="absolute -right-40 -top-40 h-[550px] w-[550px] rounded-full bg-purple-700/25 blur-[130px]" />

        {/* Blue glow */}
        <div className="absolute -bottom-60 -left-40 h-[600px] w-[600px] rounded-full bg-blue-700/15 blur-[130px]" />

        {/* Center glow */}
        <div className="absolute left-[40%] top-[35%] h-[450px] w-[450px] rounded-full bg-indigo-600/10 blur-[120px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />

        {/* Stars */}
        <div className="absolute left-[20%] top-[18%] h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_12px_#60a5fa]" />
        <div className="absolute right-[25%] top-[30%] h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc]" />
        <div className="absolute bottom-[20%] left-[30%] h-1 w-1 rounded-full bg-indigo-400" />
      </div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}
      <nav className="relative z-20 flex h-[80px] items-center justify-between border-b border-white/10 bg-slate-950/60 px-5 backdrop-blur-xl md:px-10">
        {/* Logo */}
        <Logo to="/home" subtitle="CONNECT • MEET • GROW" />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Secure */}
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2.5 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />

            <span className="text-xs font-medium text-emerald-300">Secure</span>

            <SecurityIcon fontSize="small" className="text-emerald-400" />
          </div>

          {/* Home */}
          <button
            onClick={() => navigate("/home")}
            className="
              group
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-3
              py-2.5
              text-slate-300
              backdrop-blur-xl
              transition-all
              duration-300
              hover:border-blue-400/30
              hover:bg-blue-500/10
              hover:text-white
              hover:shadow-lg
              hover:shadow-blue-500/10
            "
          >
            <HomeIcon
              fontSize="small"
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />

            <span className="hidden text-sm font-medium sm:block">Home</span>
          </button>
        </div>
      </nav>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Your Meetings
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Meeting History
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 md:text-base">
                View your previous MeetNova meetings and quickly access
                important meeting details.
              </p>
            </div>

            {/* Meeting count */}
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <HistoryIcon className="text-indigo-400" />
              </div>

              <div>
                <p className="text-xs text-slate-500">Total Meetings</p>

                <p className="text-lg font-bold text-white">
                  {meetings.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-indigo-500" />

              <p className="text-sm text-slate-500">
                Loading meeting history...
              </p>
            </div>
          </div>
        ) : meetings.length !== 0 ? (
          /* =====================================================
              MEETING LIST
          ===================================================== */
          <div className="grid gap-4">
            {meetings.map((meeting, index) => (
              <div
                key={meeting._id || meeting.meetingCode || index}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/10
                  bg-slate-900/50
                  p-5
                  shadow-[0_15px_50px_rgba(0,0,0,0.25)]
                  backdrop-blur-xl
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-indigo-400/30
                  hover:bg-slate-900/70
                  hover:shadow-[0_20px_60px_rgba(79,70,229,0.15)]
                "
              >
                {/* Card glow */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl transition-all duration-500 group-hover:bg-indigo-500/20" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left */}
                  <div className="flex items-center gap-4">
                    {/* Meeting icon */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 ring-1 ring-white/10">
                      <VideoCallIcon className="text-indigo-400" />
                    </div>

                    {/* Details */}
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Meeting Code
                      </p>

                      <h3 className="break-all text-base font-bold text-white md:text-lg">
                        {meeting.meetingCode}
                      </h3>

                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <CalendarTodayIcon fontSize="inherit" />

                        <span>{formatDate(meeting.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    {/* Status */}
                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                      <span className="text-xs font-medium text-emerald-300">
                        Completed
                      </span>
                    </div>

                    {/* Arrow */}
                    <IconButton
                      onClick={() => navigate(`/${meeting.meetingCode}`)}
                      sx={{
                        width: "44px",
                        height: "44px",
                        color: "#cbd5e1",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          color: "#ffffff",
                          background:
                            "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))",
                          borderColor: "rgba(129,140,248,0.4)",
                          transform: "translateX(3px)",
                        },
                      }}
                    >
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>

                {/* Bottom line */}
                <div className="relative mt-5 h-px w-full overflow-hidden bg-white/5">
                  <div className="absolute left-0 top-0 h-full w-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 group-hover:w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* =====================================================
              EMPTY STATE
          ===================================================== */
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 px-6 py-20 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {/* Glow */}
            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[100px]" />

            <div className="relative z-10 mx-auto flex max-w-md flex-col items-center">
              {/* Icon */}
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl">
                <HistoryIcon className="text-4xl text-slate-500" />
              </div>

              <h3 className="text-2xl font-bold text-white">
                No Meeting History
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                You haven't joined any meetings yet. Start your first MeetNova
                call and your meeting history will appear here.
              </p>

              <button
                onClick={() => navigate("/home")}
                className="
                  mt-7
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-blue-600
                  via-indigo-600
                  to-purple-600
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-indigo-500/20
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:shadow-xl
                  hover:shadow-indigo-500/30
                "
              >
                <HomeIcon fontSize="small" />
                Back to Home
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
