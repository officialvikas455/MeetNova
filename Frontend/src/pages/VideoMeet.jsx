import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

import { Badge, Button, IconButton, TextField } from "@mui/material";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import SecurityIcon from "@mui/icons-material/Security";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";

import server from "../environment";
import styles from "../styles/videoComponent.module.css";
import Logo from "../components/Logo.jsx";

const server_url = server;

const connections = {};

const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export default function VideoMeetComponent() {
  /* =====================================================
     REFS
  ===================================================== */

  const socketRef = useRef(null);
  const socketIdRef = useRef(null);

  const localVideoref = useRef(null);
  const videoRef = useRef([]);

  /* =====================================================
     STATES
  ===================================================== */

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);

  // null means not initialized yet
  const [video, setVideo] = useState(null);
  const [audio, setAudio] = useState(null);

  const [screen, setScreen] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);

  const [showModal, setModal] = useState(false);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [newMessages, setNewMessages] = useState(0);

  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const [videos, setVideos] = useState([]);

  /* =====================================================
     PERMISSIONS
  ===================================================== */

  useEffect(() => {
    getPermissions();

    return () => {
      try {
        if (window.localStream) {
          window.localStream.getTracks().forEach((track) => {
            track.stop();
          });
        }
      } catch (e) {
        console.log(e);
      }
    };
  }, []);

  /* =====================================================
     GET PERMISSIONS
  ===================================================== */

  const getPermissions = async () => {
    try {
      let hasVideo = false;
      let hasAudio = false;

      /* ---------------- VIDEO ---------------- */

      try {
        const videoPermission = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoPermission) {
          hasVideo = true;

          videoPermission.getTracks().forEach((track) => {
            track.stop();
          });

          setVideoAvailable(true);
          console.log("Video permission granted");
        }
      } catch (error) {
        console.log("Video permission denied:", error);
        setVideoAvailable(false);
      }

      /* ---------------- AUDIO ---------------- */

      try {
        const audioPermission = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (audioPermission) {
          hasAudio = true;

          audioPermission.getTracks().forEach((track) => {
            track.stop();
          });

          setAudioAvailable(true);
          console.log("Audio permission granted");
        }
      } catch (error) {
        console.log("Audio permission denied:", error);
        setAudioAvailable(false);
      }

      /* ---------------- SCREEN ---------------- */

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      /* ---------------- INITIAL STREAM ---------------- */

      if (hasVideo || hasAudio) {
        try {
          const userMediaStream = await navigator.mediaDevices.getUserMedia({
            video: hasVideo,
            audio: hasAudio,
          });

          if (userMediaStream) {
            window.localStream = userMediaStream;

            if (localVideoref.current) {
              localVideoref.current.srcObject = userMediaStream;
            }
          }
        } catch (error) {
          console.log("Unable to get initial media stream:", error);
        }
      }
    } catch (error) {
      console.log("Permission error:", error);
    }
  };

  /* =====================================================
     MEDIA STATE EFFECT
  ===================================================== */

  useEffect(() => {
    if (video !== null && audio !== null) {
      getUserMedia();
      console.log("MEDIA STATE:", video, audio);
    }
  }, [video, audio]);

  /* =====================================================
     DISPLAY MEDIA
  ===================================================== */

  const getDislayMedia = () => {
    if (!screen) return;

    if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({
          video: true,
          audio: true,
        })
        .then(getDislayMediaSuccess)
        .catch((e) => {
          console.log("Screen sharing error:", e);
          setScreen(false);
        });
    }
  };

  /* =====================================================
     GET USER MEDIA
  ===================================================== */

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({
          video: video && videoAvailable,
          audio: audio && audioAvailable,
        })
        .then(getUserMediaSuccess)
        .catch((e) => {
          console.log("getUserMedia error:", e);
        });
    } else {
      try {
        if (localVideoref.current?.srcObject) {
          const tracks = localVideoref.current.srcObject.getTracks();

          tracks.forEach((track) => track.stop());
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  /* =====================================================
     GET MEDIA SUCCESS
  ===================================================== */

  const getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;

    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      try {
        connections[id].addStream(window.localStream);

        connections[id]
          .createOffer()
          .then((description) => {
            return connections[id].setLocalDescription(description);
          })
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({
                sdp: connections[id].localDescription,
              })
            );
          })
          .catch((e) => console.log(e));
      } catch (e) {
        console.log(e);
      }
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);

        try {
          if (localVideoref.current?.srcObject) {
            const tracks = localVideoref.current.srcObject.getTracks();

            tracks.forEach((track) => track.stop());
          }
        } catch (e) {
          console.log(e);
        }

        const blackSilence = (...args) =>
          new MediaStream([black(...args), silence()]);

        window.localStream = blackSilence();

        if (localVideoref.current) {
          localVideoref.current.srcObject = window.localStream;
        }

        for (let id in connections) {
          try {
            connections[id].addStream(window.localStream);

            connections[id]
              .createOffer()
              .then((description) => {
                return connections[id].setLocalDescription(description);
              })
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  id,
                  JSON.stringify({
                    sdp: connections[id].localDescription,
                  })
                );
              })
              .catch((e) => console.log(e));
          } catch (e) {
            console.log(e);
          }
        }
      };
    });
  };

  /* =====================================================
     SCREEN SHARE SUCCESS
  ===================================================== */

  const getDislayMediaSuccess = (stream) => {
    console.log("Screen sharing started");

    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;

    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      try {
        connections[id].addStream(window.localStream);

        connections[id]
          .createOffer()
          .then((description) => {
            return connections[id].setLocalDescription(description);
          })
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({
                sdp: connections[id].localDescription,
              })
            );
          })
          .catch((e) => console.log(e));
      } catch (e) {
        console.log(e);
      }
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        console.log("Screen sharing stopped");

        setScreen(false);

        try {
          if (localVideoref.current?.srcObject) {
            const tracks = localVideoref.current.srcObject.getTracks();

            tracks.forEach((track) => track.stop());
          }
        } catch (e) {
          console.log(e);
        }

        const blackSilence = (...args) =>
          new MediaStream([black(...args), silence()]);

        window.localStream = blackSilence();

        if (localVideoref.current) {
          localVideoref.current.srcObject = window.localStream;
        }

        getUserMedia();
      };
    });
  };

  /* =====================================================
     SIGNAL MESSAGE
  ===================================================== */

  const gotMessageFromServer = (fromId, message) => {
    try {
      const signal = JSON.parse(message);

      if (fromId === socketIdRef.current) return;

      if (!connections[fromId]) return;

      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              return connections[fromId]
                .createAnswer()
                .then((description) => {
                  return connections[fromId].setLocalDescription(description);
                })
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    fromId,
                    JSON.stringify({
                      sdp: connections[fromId].localDescription,
                    })
                  );
                });
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    } catch (error) {
      console.log("Signal error:", error);
    }
  };

  /* =====================================================
     SOCKET CONNECTION
  ===================================================== */

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, {
      secure: server_url.startsWith("https"),
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      console.log("Socket connected");

      socketRef.current.emit("join-call", window.location.href);

      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((prevVideos) => {
          const updatedVideos = prevVideos.filter(
            (video) => video.socketId !== id
          );

          videoRef.current = updatedVideos;

          return updatedVideos;
        });

        if (connections[id]) {
          try {
            connections[id].close();
          } catch (e) {
            console.log(e);
          }

          delete connections[id];
        }
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) {
            return;
          }

          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );

          /* ---------------- ICE ---------------- */

          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({
                  ice: event.candidate,
                })
              );
            }
          };

          /* ---------------- VIDEO ---------------- */

          connections[socketListId].onaddstream = (event) => {
            const existingVideo = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (existingVideo) {
              setVideos((prevVideos) => {
                const updatedVideos = prevVideos.map((video) =>
                  video.socketId === socketListId
                    ? {
                        ...video,
                        stream: event.stream,
                      }
                    : video
                );

                videoRef.current = updatedVideos;

                return updatedVideos;
              });
            } else {
              const newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((prevVideos) => {
                const updatedVideos = [...prevVideos, newVideo];

                videoRef.current = updatedVideos;

                return updatedVideos;
              });
            }
          };

          /* ---------------- LOCAL STREAM ---------------- */

          if (window.localStream) {
            try {
              connections[socketListId].addStream(window.localStream);
            } catch (e) {
              console.log(e);
            }
          } else {
            const blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);

            window.localStream = blackSilence();

            try {
              connections[socketListId].addStream(window.localStream);
            } catch (e) {
              console.log(e);
            }
          }
        });

        /* ---------------- CREATE OFFER ---------------- */

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) {
              continue;
            }

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {
              console.log(e);
            }

            connections[id2]
              .createOffer()
              .then((description) => {
                return connections[id2].setLocalDescription(description);
              })
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  id2,
                  JSON.stringify({
                    sdp: connections[id2].localDescription,
                  })
                );
              })
              .catch((e) => console.log(e));
          }
        }
      });
    });
  };

  /* =====================================================
     SILENCE TRACK
  ===================================================== */

  const silence = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    const ctx = new AudioContext();

    const oscillator = ctx.createOscillator();

    const dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    return Object.assign(dst.stream.getAudioTracks()[0], {
      enabled: false,
    });
  };

  /* =====================================================
     BLACK VIDEO TRACK
  ===================================================== */

  const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.fillRect(0, 0, width, height);

    const stream = canvas.captureStream();

    return Object.assign(stream.getVideoTracks()[0], {
      enabled: false,
    });
  };

  /* =====================================================
     VIDEO BUTTON
  ===================================================== */

  const handleVideo = () => {
    setVideo((prev) => !prev);
  };

  /* =====================================================
     AUDIO BUTTON
  ===================================================== */

  const handleAudio = () => {
    setAudio((prev) => !prev);
  };

  /* =====================================================
     SCREEN BUTTON
  ===================================================== */

  const handleScreen = () => {
    setScreen((prev) => !prev);
  };

  useEffect(() => {
    if (screen === true) {
      getDislayMedia();
    }
  }, [screen]);

  /* =====================================================
     END CALL
  ===================================================== */

  const handleEndCall = () => {
    try {
      if (localVideoref.current?.srcObject) {
        const tracks = localVideoref.current.srcObject.getTracks();

        tracks.forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }

    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    } catch (e) {
      console.log(e);
    }

    Object.keys(connections).forEach((id) => {
      try {
        connections[id].close();
      } catch (e) {
        console.log(e);
      }

      delete connections[id];
    });

    window.localStream = null;

    window.location.href = "/";
  };

  /* =====================================================
     CHAT
  ===================================================== */

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        sender: sender,
        data: data,
      },
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    if (!socketRef.current) return;

    socketRef.current.emit("chat-message", message, username);

    setMessage("");
  };

  const handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const openChat = () => {
    setModal(true);
    setNewMessages(0);
  };

  const closeChat = () => {
    setModal(false);
  };

  /* =====================================================
     CONNECT
  ===================================================== */

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);

    connectToSocketServer();
  };

  const connect = () => {
    if (!username.trim()) return;

    setAskForUsername(false);

    getMedia();
  };

  /* =====================================================
     FULLSCREEN
  ===================================================== */

  const handleFullscreen = () => {
    if (!localVideoref.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      localVideoref.current.requestFullscreen?.();
    }
  };

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white overflow-hidden">
      {askForUsername === true ? (
        /* =====================================================
           LOBBY SCREEN
        ===================================================== */

        <div
          className="relative min-h-screen w-full overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.28), transparent 38%),
              radial-gradient(circle at 85% 75%, rgba(139, 92, 246, 0.24), transparent 38%),
              linear-gradient(180deg, rgba(5, 8, 31, 0.85) 0%, rgba(7, 11, 43, 0.92) 100%),
              url("/images/cosmic-bg.jpg")
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          {/* ================= BACKGROUND ================= */}

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-48 right-[-100px] h-[600px] w-[600px] rounded-full bg-purple-700/30 blur-[120px]" />

            <div className="absolute bottom-[-250px] left-[-150px] h-[600px] w-[600px] rounded-full bg-blue-700/20 blur-[120px]" />

            <div className="absolute top-[35%] left-[45%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

            {/* Stars */}

            <div className="absolute top-[8%] left-[35%] h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_12px_#60a5fa]" />

            <div className="absolute top-[22%] left-[72%] h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc]" />

            <div className="absolute top-[35%] left-[12%] h-1 w-1 rounded-full bg-blue-400" />

            <div className="absolute bottom-[30%] right-[15%] h-1 w-1 rounded-full bg-purple-400" />

            <div className="absolute bottom-[15%] left-[30%] h-1 w-1 rounded-full bg-blue-400" />

            {/* Diagonal light */}

            <div className="absolute -top-32 right-[12%] h-[700px] w-[90px] rotate-[32deg] bg-gradient-to-b from-purple-500/50 via-purple-600/10 to-transparent blur-2xl" />

            {/* Grid */}

            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "70px 70px",
              }}
            />
          </div>

          {/* ================= NAVBAR ================= */}

          <div className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10 lg:px-12">
            {/* Logo */}
            <Logo size="lg" to="/" />

            {/* Secure */}

            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 backdrop-blur-xl shadow-lg md:px-5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />

              <span className="hidden text-xs font-medium text-slate-200 sm:block">
                Secure Connection
              </span>

              <SecurityIcon className="text-slate-200" fontSize="small" />
            </div>
          </div>

          {/* ================= MAIN ================= */}

          <div className="relative z-10 flex min-h-[calc(100vh-90px)] items-center justify-center px-5 pb-10 md:px-8">
            <div className="relative flex w-full max-w-[1250px] flex-col overflow-hidden rounded-[28px] border border-white/15 bg-slate-900/50 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-8 lg:flex-row lg:p-10">
              {/* Glow */}

              <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[100px]" />

              <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[100px]" />

              {/* ================= LEFT ================= */}

              <div className="relative z-10 flex w-full flex-1 flex-col justify-center px-2 py-8 md:px-5 lg:py-12">
                <div className="max-w-[520px]">
                  <div className="mb-5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />

                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                      Video Conference
                    </span>
                  </div>

                  <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-[52px]">
                    Enter into Lobby
                  </h2>

                  <p className="mt-6 max-w-[480px] text-base leading-7 text-slate-400 md:text-lg">
                    Check your camera and microphone, then enter a username to
                    join the meeting.
                  </p>

                  {/* Username */}

                  <div className="mt-9">
                    <TextField
                      id="username"
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <PersonIcon
                            sx={{
                              color: "#94a3b8",
                              marginRight: "10px",
                            }}
                          />
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "15px",
                          backgroundColor: "rgba(15,23,42,0.55)",
                          color: "white",
                          fontSize: "1rem",
                          height: "62px",

                          "& fieldset": {
                            borderColor: "rgba(148,163,184,0.65)",
                          },

                          "&:hover fieldset": {
                            borderColor: "rgba(129,140,248,0.8)",
                          },

                          "&.Mui-focused fieldset": {
                            borderColor: "#6366f1",
                            borderWidth: "1.5px",
                          },
                        },

                        "& .MuiInputLabel-root": {
                          color: "rgba(148,163,184,0.8)",
                        },

                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#818cf8",
                        },
                      }}
                    />

                    {/* Connect */}

                    <Button
                      variant="contained"
                      onClick={connect}
                      disabled={!username.trim()}
                      fullWidth
                      sx={{
                        mt: 3,
                        height: "64px",
                        borderRadius: "15px",
                        textTransform: "none",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        letterSpacing: "0.01em",

                        background:
                          "linear-gradient(100deg, #c026d3 0%, #7c3aed 45%, #2563eb 100%)",

                        boxShadow: "0 12px 35px rgba(99,102,241,0.35)",

                        "&:hover": {
                          background:
                            "linear-gradient(100deg, #d946ef 0%, #8b5cf6 45%, #3b82f6 100%)",

                          boxShadow: "0 15px 40px rgba(99,102,241,0.5)",

                          transform: "translateY(-2px)",
                        },

                        transition: "all 0.25s ease",

                        "&.Mui-disabled": {
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.3)",
                        },
                      }}
                    >
                      <span>Connect</span>

                      <KeyboardDoubleArrowRightIcon
                        sx={{
                          marginLeft: "auto",
                          marginRight: "4px",
                        }}
                      />
                    </Button>

                    {/* Secure */}

                    <div className="mt-7 flex items-center justify-center gap-3 text-sm text-slate-400 md:justify-start">
                      <SecurityIcon
                        className="text-emerald-400"
                        fontSize="small"
                      />

                      <span>Secure, encrypted connection</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= VIDEO ================= */}

              <div className="relative z-10 flex w-full flex-1 items-center justify-center">
                <div className="relative w-full max-w-[600px]">
                  <div className="absolute -inset-5 rounded-[35px] bg-gradient-to-r from-blue-600/20 via-purple-600/30 to-fuchsia-600/20 blur-2xl" />

                  <div className="relative aspect-video overflow-hidden rounded-[20px] border border-white/20 bg-slate-900 shadow-[0_25px_70px_rgba(0,0,0,0.55)]">
                    <video
                      ref={localVideoref}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                    {/* You */}

                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur-xl">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />

                      <span className="text-sm font-medium text-white">
                        {username || "You"}
                      </span>
                    </div>

                    {/* Fullscreen */}

                    <button
                      onClick={handleFullscreen}
                      className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white backdrop-blur-xl transition hover:bg-white/15"
                    >
                      <FullscreenIcon />
                    </button>

                    {/* Controls */}

                    <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-[24px] border border-white/15 bg-slate-950/65 px-5 py-3 backdrop-blur-xl">
                      {/* Mic */}

                      <IconButton
                        onClick={handleAudio}
                        size="medium"
                        style={{
                          color: "white",
                          width: "54px",
                          height: "54px",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        {audio === true ? <MicIcon /> : <MicOffIcon />}
                      </IconButton>

                      <div className="h-8 w-px bg-white/15" />

                      {/* Camera */}

                      <IconButton
                        onClick={handleVideo}
                        size="medium"
                        style={{
                          color: "white",
                          width: "54px",
                          height: "54px",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        {video === true ? (
                          <VideocamIcon />
                        ) : (
                          <VideocamOffIcon />
                        )}
                      </IconButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =====================================================
           ACTIVE MEETING
        ===================================================== */

        <div
          className="relative min-h-screen w-full overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.15), transparent 45%),
              radial-gradient(circle at 85% 75%, rgba(139, 92, 246, 0.12), transparent 45%),
              linear-gradient(180deg, rgba(5, 8, 31, 0.92) 0%, rgba(2, 6, 23, 0.96) 100%),
              url("/images/cosmic-bg.jpg")
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          {/* ================= BACKGROUND ================= */}

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-60 left-1/3 h-[600px] w-[600px] rounded-full bg-indigo-700/10 blur-[120px]" />

            <div className="absolute bottom-[-250px] right-[-100px] h-[600px] w-[600px] rounded-full bg-purple-700/10 blur-[120px]" />

            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "70px 70px",
              }}
            />
          </div>

          {/* ================= TOP BAR ================= */}

          <div className="relative z-20 flex h-[75px] items-center justify-between border-b border-white/10 bg-slate-950/70 px-5 backdrop-blur-xl md:px-8">
            <Logo size="sm" subtitle="VIDEO CONFERENCE" />

            {/* Meeting title */}

            <div className="hidden text-center md:block">
              <h2 className="text-sm font-semibold text-white">
                MeetNova Room
              </h2>

              <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live Meeting
              </div>
            </div>

            {/* Secure */}

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />

              <span className="hidden text-xs text-emerald-300 sm:block">
                Secure
              </span>
            </div>
          </div>

          {/* ================= MEETING AREA ================= */}

          <div className="relative z-10 h-[calc(100vh-75px)] p-3 md:p-5">
            <div className="relative flex h-full overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/50 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              {/* ================= CHAT ================= */}

              {showModal && (
                <div className="absolute bottom-24 left-4 top-4 z-40 flex w-[300px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#071126]/95 shadow-2xl backdrop-blur-2xl">
                  {/* Header */}

                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Chat</h2>

                    <button
                      onClick={closeChat}
                      className="text-2xl text-slate-400 transition hover:text-white"
                    >
                      ×
                    </button>
                  </div>

                  {/* Messages */}

                  <div className="flex-1 overflow-y-auto p-4">
                    {messages.length !== 0 ? (
                      messages.map((item, index) => (
                        <div key={index} className="mb-5">
                          <p className="mb-1 text-xs font-semibold text-blue-400">
                            {item.sender}
                          </p>

                          <div className="inline-block rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200">
                            {item.data}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No Messages Yet!</p>
                    )}
                  </div>

                  {/* Input */}

                  <div className="border-t border-white/10 p-3">
                    <div className="flex gap-2">
                      <TextField
                        value={message}
                        onChange={handleMessage}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            sendMessage();
                          }
                        }}
                        label="Enter your chat"
                        variant="outlined"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.04)",
                            color: "white",
                          },

                          "& .MuiInputLabel-root": {
                            color: "#64748b",
                          },
                        }}
                      />

                      <Button
                        variant="contained"
                        onClick={sendMessage}
                        sx={{
                          minWidth: "55px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg,#6366f1,#2563eb)",
                        }}
                      >
                        ➤
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= VIDEO AREA ================= */}

              <div className="flex h-full w-full flex-col p-4 md:p-6">
                {/* Heading */}

                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      MeetNova Room
                    </h2>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <GroupsIcon fontSize="small" />
                      {videos.length + 1} Participants
                      <span className="ml-1 flex items-end gap-[2px]">
                        <i className="h-2 w-[3px] rounded-full bg-emerald-400" />

                        <i className="h-3 w-[3px] rounded-full bg-emerald-400" />

                        <i className="h-4 w-[3px] rounded-full bg-emerald-400" />
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10">
                      ▦
                    </button>

                    <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10">
                      •••
                    </button>
                  </div>
                </div>

                {/* ================= VIDEOS ================= */}

                <div className="relative flex-1 overflow-hidden">
                  {/* Local video */}

                  <video
                    className="absolute right-2 top-2 z-20 h-[170px] w-[270px] rounded-2xl border border-white/20 bg-slate-900 object-cover shadow-2xl md:h-[210px] md:w-[330px]"
                    ref={localVideoref}
                    autoPlay
                    muted
                    playsInline
                  />

                  {/* Participants */}

                  <div className="grid h-full w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                    {videos.map((video) => (
                      <div
                        key={video.socketId}
                        className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl"
                      >
                        <video
                          data-socket={video.socketId}
                          ref={(ref) => {
                            if (ref && video.stream) {
                              ref.srcObject = video.stream;
                            }
                          }}
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                          Participant
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ================= CONTROLS ================= */}

                <div className="mt-4 flex justify-center">
                  <div className="flex items-center gap-2 rounded-[28px] border border-white/10 bg-slate-950/80 px-4 py-3 shadow-2xl backdrop-blur-xl md:gap-5 md:px-7">
                    {/* Camera */}

                    <div className="flex flex-col items-center gap-1">
                      <IconButton
                        onClick={handleVideo}
                        style={{
                          color: "white",
                          width: "58px",
                          height: "58px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {video === true ? (
                          <VideocamIcon />
                        ) : (
                          <VideocamOffIcon />
                        )}
                      </IconButton>

                      <span className="hidden text-xs text-slate-300 sm:block">
                        Camera
                      </span>
                    </div>

                    {/* Mic */}

                    <div className="flex flex-col items-center gap-1">
                      <IconButton
                        onClick={handleAudio}
                        style={{
                          color: "white",
                          width: "58px",
                          height: "58px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {audio === true ? <MicIcon /> : <MicOffIcon />}
                      </IconButton>

                      <span className="hidden text-xs text-slate-300 sm:block">
                        Mic
                      </span>
                    </div>

                    {/* End Call */}

                    <div className="flex flex-col items-center gap-1">
                      <IconButton
                        onClick={handleEndCall}
                        style={{
                          color: "white",
                          width: "64px",
                          height: "64px",
                          background: "linear-gradient(135deg,#ef4444,#f43f5e)",
                          boxShadow: "0 0 25px rgba(239,68,68,0.4)",
                        }}
                      >
                        <CallEndIcon />
                      </IconButton>

                      <span className="hidden text-xs text-slate-300 sm:block">
                        End Call
                      </span>
                    </div>

                    {/* Screen Share */}

                    {screenAvailable === true && (
                      <div className="flex flex-col items-center gap-1">
                        <IconButton
                          onClick={handleScreen}
                          style={{
                            color: "white",
                            width: "58px",
                            height: "58px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {screen === true ? (
                            <StopScreenShareIcon />
                          ) : (
                            <ScreenShareIcon />
                          )}
                        </IconButton>

                        <span className="hidden text-xs text-slate-300 sm:block">
                          Screen
                        </span>
                      </div>
                    )}

                    {/* Chat */}

                    <div className="flex flex-col items-center gap-1">
                      <Badge badgeContent={newMessages} max={999} color="error">
                        <IconButton
                          onClick={() => {
                            if (showModal) {
                              closeChat();
                            } else {
                              openChat();
                            }
                          }}
                          style={{
                            color: "white",
                            width: "58px",
                            height: "58px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <ChatIcon />
                        </IconButton>
                      </Badge>

                      <span className="hidden text-xs text-slate-300 sm:block">
                        Chat
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
