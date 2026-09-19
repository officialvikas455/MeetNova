import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

import { Badge, Button, IconButton, TextField, Tooltip } from "@mui/material";

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
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import LockIcon from "@mui/icons-material/Lock";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";

import server from "../environment";
import Logo from "../components/Logo.jsx";
import { AuthContext } from "../contexts/AuthContext.jsx";

const server_url = server;

const connections = {};

const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

/* =====================================================
   VIDEO EFFECTS & VIRTUAL BACKGROUND PRESETS
===================================================== */

const VIDEO_EFFECTS = {
  none: {
    name: "Natural",
    filter: "none",
    icon: "📷",
    desc: "Clean camera feed",
  },
  "blur-soft": {
    name: "Soft Blur",
    filter: "blur(5px)",
    icon: "✨",
    desc: "Subtle cinematic focus",
  },
  "blur-deep": {
    name: "Deep Blur",
    filter: "blur(12px)",
    icon: "🌫️",
    desc: "Maximum privacy blur",
  },
  studio: {
    name: "Studio Pro",
    filter: "brightness(1.08) contrast(1.12) saturate(1.16)",
    icon: "💡",
    desc: "Ring-light glow",
  },
  cosmic: {
    name: "Cosmic Glow",
    filter: "hue-rotate(215deg) saturate(1.35) contrast(1.15)",
    icon: "🌌",
    desc: "Deep celestial space",
  },
  sunset: {
    name: "Sunset Dusk",
    filter: "sepia(0.26) saturate(1.38) contrast(1.08)",
    icon: "🌅",
    desc: "Golden hour ambiance",
  },
  cyber: {
    name: "Cyber Neon",
    filter: "hue-rotate(280deg) saturate(1.4) contrast(1.2)",
    icon: "🔮",
    desc: "Vibrant synthwave",
  },
  noir: {
    name: "Cinema Noir",
    filter: "grayscale(1) contrast(1.28) brightness(0.95)",
    icon: "🎬",
    desc: "Monochrome film",
  },
};

const VIRTUAL_BACKGROUNDS = {
  none: {
    name: "None",
    icon: "🚫",
    preview: "from-slate-800 to-slate-900",
    backdrop: "transparent",
  },
  office: {
    name: "Executive Office",
    icon: "🏢",
    preview: "from-slate-900 via-indigo-950 to-slate-900",
    backdrop:
      "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 27, 75, 0.92)), radial-gradient(circle at top right, #38bdf8, transparent 40%)",
  },
  galaxy: {
    name: "Cosmic Galaxy",
    icon: "🌌",
    preview: "from-purple-950 via-indigo-950 to-black",
    backdrop:
      "radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.35), transparent 50%), #05081c",
  },
  library: {
    name: "Luxury Library",
    icon: "📚",
    preview: "from-amber-950 via-stone-900 to-black",
    backdrop:
      "linear-gradient(135deg, rgba(69, 26, 3, 0.85), rgba(28, 25, 23, 0.95)), #0c0a09",
  },
  cyberpunk: {
    name: "Cyberpunk Loft",
    icon: "🏙️",
    preview: "from-fuchsia-950 via-cyan-950 to-slate-950",
    backdrop:
      "radial-gradient(circle at 10% 20%, rgba(236, 72, 153, 0.4), transparent 45%), radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.4), transparent 45%), #030712",
  },
  studio: {
    name: "Minimal Studio",
    icon: "🎙️",
    preview: "from-slate-900 to-zinc-950",
    backdrop:
      "radial-gradient(circle at center, rgba(99, 102, 241, 0.25), transparent 65%), #090d16",
  },
};

/* =====================================================
   USER-FRIENDLY QUICK PRESETS
===================================================== */

const SIMPLE_EFFECTS = [
  {
    id: "none",
    name: "None",
    icon: "🚫",
    desc: "Original camera",
    effect: "none",
    bg: "none",
  },
  {
    id: "blur-soft",
    name: "Blur",
    icon: "🌫️",
    desc: "Soft portrait focus",
    effect: "blur-soft",
    bg: "none",
  },
  {
    id: "blur-deep",
    name: "Deep Blur",
    icon: "✨",
    desc: "Privacy background",
    effect: "blur-deep",
    bg: "none",
  },
  {
    id: "studio",
    name: "Studio Glow",
    icon: "💡",
    desc: "Clear & warm lighting",
    effect: "studio",
    bg: "none",
  },
  {
    id: "office",
    name: "Office",
    icon: "🏢",
    desc: "Executive room",
    effect: "none",
    bg: "office",
  },
  {
    id: "cosmic",
    name: "Cosmic",
    icon: "🌌",
    desc: "Galaxy space vibe",
    effect: "cosmic",
    bg: "galaxy",
  },
];

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const params = useParams();
  const { userData } = useContext(AuthContext);

  const meetingCode =
    params.url || window.location.pathname.replace(/^\//, "") || "room";

  const handleSelectSimpleEffect = (item) => {
    setVideoEffect(item.effect);
    setVirtualBg(item.bg);
  };

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
  const [username, setUsername] = useState(() => {
    return (
      userData?.name ||
      userData?.username ||
      localStorage.getItem("username") ||
      ""
    );
  });

  const [videos, setVideos] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // New in-meeting feature states
  const [videoEffect, setVideoEffect] = useState("none");
  const [virtualBg, setVirtualBg] = useState("none");
  const [showEffectsModal, setShowEffectsModal] = useState(false);
  const [layoutMode, setLayoutMode] = useState("speaker"); // "speaker" (Zoom style: big user, small self) | "grid" (Gallery)
  const [isSelfViewMinimized, setIsSelfViewMinimized] = useState(false);
  const [pinnedParticipant, setPinnedParticipant] = useState(null);
  const [participantNames, setParticipantNames] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);

  const messagesEndRef = useRef(null);

  /* =====================================================
     MEETING DURATION TIMER
  ===================================================== */

  useEffect(() => {
    if (askForUsername) return;
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [askForUsername]);

  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins % 60).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  /* =====================================================
     AUTO SCROLL CHAT TO BOTTOM
  ===================================================== */

  useEffect(() => {
    if (showModal) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showModal]);

  /* =====================================================
     USER DATA SYNC
  ===================================================== */

  useEffect(() => {
    if (!username && (userData?.name || userData?.username)) {
      setUsername(userData.name || userData.username);
    }
  }, [userData]);

  /* =====================================================
     FULLSCREEN LISTENER
  ===================================================== */

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* =====================================================
     LIVE AUDIO METER (LOBBY ONLY)
  ===================================================== */

  useEffect(() => {
    if (!askForUsername || !audio || !window.localStream) {
      setAudioLevel(0);
      return;
    }

    const audioTracks = window.localStream.getAudioTracks();
    if (!audioTracks.length || !audioTracks[0].enabled) {
      setAudioLevel(0);
      return;
    }

    let isSubscribed = true;
    let audioCtx = null;
    let animId = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const stream = new MediaStream([audioTracks[0]]);
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!isSubscribed) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(level);

        animId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.log("Audio visualizer error:", e);
    }

    return () => {
      isSubscribed = false;
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== "closed") {
        try {
          audioCtx.close();
        } catch (e) {
          console.log(e);
        }
      }
    };
  }, [askForUsername, audio]);

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

      setVideo(hasVideo);
      setAudio(hasAudio);
    } catch (error) {
      console.log("Permission error:", error);
      setVideo(false);
      setAudio(false);
    }
  };

  /* =====================================================
     MEDIA STATE EFFECT (ACTIVE CALL ONLY)
  ===================================================== */

  useEffect(() => {
    if (!askForUsername && video !== null && audio !== null) {
      getUserMedia();
      console.log("MEDIA STATE:", video, audio);
    }
  }, [video, audio, askForUsername]);

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

      // Real-time Participant Username Exchange
      if (signal.type === "user-info" && signal.username) {
        setParticipantNames((prev) => ({
          ...prev,
          [fromId]: signal.username,
        }));
        return;
      }

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

        setParticipantNames((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
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
        // Broadcast our username to all other peers in the meeting
        clients.forEach((cId) => {
          if (cId !== socketIdRef.current) {
            socketRef.current.emit(
              "signal",
              cId,
              JSON.stringify({
                type: "user-info",
                username: username.trim() || "Participant",
              })
            );
          }
        });
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

  const handleVideo = async () => {
    if (askForUsername) {
      if (!videoAvailable) return;
      const nextState = !video;
      setVideo(nextState);

      if (window.localStream) {
        const videoTracks = window.localStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks.forEach((track) => {
            track.enabled = nextState;
          });
        } else if (nextState) {
          try {
            const vStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            const vTrack = vStream.getVideoTracks()[0];
            if (vTrack && window.localStream) {
              window.localStream.addTrack(vTrack);
              if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
              }
            }
          } catch (err) {
            console.error("Failed to restore video track:", err);
          }
        }
      }
    } else {
      setVideo((prev) => !prev);
    }
  };

  /* =====================================================
     AUDIO BUTTON
  ===================================================== */

  const handleAudio = async () => {
    if (askForUsername) {
      if (!audioAvailable) return;
      const nextState = !audio;
      setAudio(nextState);

      if (window.localStream) {
        const audioTracks = window.localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks.forEach((track) => {
            track.enabled = nextState;
          });
        } else if (nextState) {
          try {
            const aStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            const aTrack = aStream.getAudioTracks()[0];
            if (aTrack && window.localStream) {
              window.localStream.addTrack(aTrack);
            }
          } catch (err) {
            console.error("Failed to restore audio track:", err);
          }
        }
      }
    } else {
      setAudio((prev) => !prev);
    }
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
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (socketIdSender && sender) {
      setParticipantNames((prev) => ({
        ...prev,
        [socketIdSender]: sender,
      }));
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        sender: sender,
        data: data,
        time: timeStr,
        isSelf: socketIdSender === socketIdRef.current || sender === username,
        socketIdSender: socketIdSender,
      },
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  const sendMessage = (customText) => {
    const textToSend =
      typeof customText === "string" ? customText.trim() : message.trim();
    if (!textToSend) return;

    if (!socketRef.current) return;

    socketRef.current.emit("chat-message", textToSend, username);

    if (typeof customText !== "string") {
      setMessage("");
    }
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
    // Preserve user's lobby choices
    if (window.localStream) {
      window.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !!video;
      });
      window.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !!audio;
      });
    }

    connectToSocketServer();
  };

  const connect = () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    try {
      localStorage.setItem("username", trimmed);
    } catch (e) {
      console.log(e);
    }

    setAskForUsername(false);

    getMedia();
  };

  /* =====================================================
     FULLSCREEN
  ===================================================== */

  const handleFullscreen = () => {
    const target =
      document.getElementById("lobby-video-preview") || localVideoref.current;
    if (!target) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      target.requestFullscreen?.().catch(() => {});
    }
  };

  /* =====================================================
     COPY LINK & NAVIGATION
  ===================================================== */

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.log("Copy error:", err);
    }
  };

  const handleBackToHome = () => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }
    navigate("/home");
  };

  /* =====================================================
     CHAT MESSAGE LINK PARSER
  ===================================================== */

  const renderMessageContent = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-sky-300 hover:text-sky-200 break-all font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
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
          className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#070b1e]"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.18), transparent 40%),
              radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15), transparent 40%),
              #030712
            `,
          }}
        >
          {/* ================= HEADER ================= */}
          <header className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-8 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
            {/* Left: Back button + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                title="Leave lobby and return to home"
              >
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                <span>Leave</span>
              </button>

              <div className="h-4 w-px bg-white/10 hidden sm:block" />

              <Logo size="sm" to="/home" />
            </div>

            {/* Right: Room ID Pill with copy */}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 px-3.5 py-1.5 text-xs shadow-sm">
              <span className="text-[11px] text-slate-400 font-mono">Room:</span>
              <span className="font-mono font-semibold text-indigo-200 max-w-[140px] truncate">{meetingCode}</span>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition ${
                  copied ? "text-emerald-300 font-semibold" : "text-slate-300 hover:text-white"
                }`}
                title="Copy meeting invite link"
              >
                {copied ? <CheckIcon sx={{ fontSize: 13 }} /> : <ContentCopyIcon sx={{ fontSize: 13 }} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </header>

          {/* ================= MAIN LOBBY CARD ================= */}
          <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto">
            <div className="flex w-full flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
              {/* ================= LEFT: CAMERA & MIC PREVIEW ================= */}
              <div className="w-full lg:w-[58%] flex flex-col items-center">
                {/* 16:9 Video Box */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-slate-950 shadow-2xl">
                  {/* Live Video Tag */}
                  <video
                    ref={localVideoref}
                    autoPlay
                    muted
                    playsInline
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      video && videoAvailable ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  />

                  {/* Camera Off / Avatar Placeholder */}
                  {(!video || !videoAvailable) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-10">
                      <div
                        className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full text-3xl sm:text-4xl font-bold text-white shadow-xl transition-all duration-200"
                        style={{
                          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                          boxShadow: audio && audioLevel > 15 ? "0 0 25px rgba(52, 211, 153, 0.5)" : "none",
                          border: audio && audioLevel > 15 ? "3px solid #34d399" : "2px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        {(username.trim()[0] || "Y").toUpperCase()}
                      </div>
                      <p className="mt-3 text-xs text-slate-400 font-medium">Camera is turned off</p>
                    </div>
                  )}

                  {/* Bottom Center: Clear Round Toggle Buttons */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full bg-black/65 px-4 py-2 backdrop-blur-xl border border-white/15 shadow-xl">
                    {/* Mic Button */}
                    <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>
                      <IconButton
                        onClick={handleAudio}
                        sx={{
                          width: "46px",
                          height: "46px",
                          color: audio ? "#34d399" : "#fb7185",
                          background: audio ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.25)",
                          border: audio ? "1px solid rgba(52, 211, 153, 0.5)" : "1px solid rgba(244, 63, 94, 0.5)",
                          "&:hover": {
                            background: audio ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.35)",
                            transform: "scale(1.05)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        {audio ? <MicIcon /> : <MicOffIcon />}
                      </IconButton>
                    </Tooltip>

                    {/* Camera Button */}
                    <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                      <IconButton
                        onClick={handleVideo}
                        sx={{
                          width: "46px",
                          height: "46px",
                          color: video ? "#818cf8" : "#fb7185",
                          background: video ? "rgba(99, 102, 241, 0.2)" : "rgba(244, 63, 94, 0.25)",
                          border: video ? "1px solid rgba(129, 140, 248, 0.5)" : "1px solid rgba(244, 63, 94, 0.5)",
                          "&:hover": {
                            background: video ? "rgba(99, 102, 241, 0.3)" : "rgba(244, 63, 94, 0.35)",
                            transform: "scale(1.05)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        {video ? <VideocamIcon /> : <VideocamOffIcon />}
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>

                {/* Subtle Status Line Under Preview */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  {audio ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className={`h-2 w-2 rounded-full bg-emerald-400 ${audioLevel > 5 ? "animate-pulse" : ""}`} />
                      {audioLevel > 5 ? "Speaking..." : "Microphone active"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Microphone muted
                    </span>
                  )}
                  <span>•</span>
                  <span>{video ? "Camera on" : "Camera off"}</span>
                </div>
              </div>

              {/* ================= RIGHT: SIMPLE JOIN CARD ================= */}
              <div className="w-full lg:w-[42%] flex flex-col justify-center rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Ready to join?
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Meeting room: <span className="font-mono text-indigo-300 font-medium">{meetingCode}</span>
                </p>

                {/* Permissions Warning if blocked */}
                {!videoAvailable && !audioAvailable && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <WarningAmberIcon sx={{ fontSize: 16, flexShrink: 0, mt: 0.5, color: "#f59e0b" }} />
                    <span>Camera and mic access are blocked. You can still join to listen or grant permission in browser settings.</span>
                  </div>
                )}

                {/* Name Input & Join Form */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Your Name
                    </label>
                    <TextField
                      id="username"
                      placeholder="e.g. Alex Morgan"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && username.trim()) {
                          connect();
                        }
                      }}
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <PersonIcon sx={{ color: "#818cf8", mr: 1, fontSize: 20 }} />
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          backgroundColor: "rgba(15, 23, 42, 0.8)",
                          color: "white",
                          fontSize: "0.95rem",
                          height: "52px",
                          "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                          "&:hover fieldset": { borderColor: "rgba(129,140,248,0.5)" },
                          "&.Mui-focused fieldset": { borderColor: "#818cf8", borderWidth: "1.5px" },
                        },
                      }}
                    />
                    <span className="mt-1 block text-[11px] text-slate-500">
                      Press Enter to join directly
                    </span>
                  </div>

                  {/* Join CTA Button */}
                  <Button
                    variant="contained"
                    onClick={connect}
                    disabled={!username.trim()}
                    fullWidth
                    sx={{
                      height: "52px",
                      borderRadius: "14px",
                      textTransform: "none",
                      fontSize: "1rem",
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                      boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)",
                        boxShadow: "0 10px 28px rgba(99,102,241,0.5)",
                      },
                      "&.Mui-disabled": {
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.3)",
                      },
                    }}
                  >
                    Join Meeting
                  </Button>

                  {/* Quick Share Link */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span>Invite others:</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition font-medium"
                    >
                      {copied ? (
                        <>
                          <CheckIcon sx={{ fontSize: 14, color: "#34d399" }} />
                          <span className="text-emerald-400">Link copied!</span>
                        </>
                      ) : (
                        <>
                          <ContentCopyIcon sx={{ fontSize: 13 }} />
                          <span>Copy meeting link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* ================= FOOTER ================= */}
          <footer className="relative z-10 py-3 text-center text-xs text-slate-400/60 border-t border-white/[0.05]">
            MeetNova • Secure Video Meetings
          </footer>
        </div>
      ) : (
        /* =====================================================
           ACTIVE MEETING
        ===================================================== */

        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-[#070b1e] to-slate-950 text-white selection:bg-indigo-500 selection:text-white">
          {/* ================= AMBIENT BACKGROUND ================= */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-60 left-1/3 h-[600px] w-[600px] rounded-full bg-indigo-700/10 blur-[140px]" />
            <div className="absolute -bottom-60 right-1/4 h-[600px] w-[600px] rounded-full bg-purple-700/10 blur-[140px]" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
          </div>

          {/* ================= TOP HEADER BAR ================= */}
          <header className="relative z-30 flex h-[64px] flex-shrink-0 items-center justify-between border-b border-white/[0.08] bg-slate-950/70 px-4 sm:px-6 backdrop-blur-2xl">
            {/* Left: Logo + Room Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Logo size="sm" to="/home" subtitle="CONFERENCE" />

              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 backdrop-blur-md">
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  Room:
                </span>
                <span className="max-w-[130px] truncate text-xs font-mono font-bold text-indigo-200">
                  {meetingCode}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="ml-0.5 flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-200 transition hover:bg-white/20"
                  title="Copy meeting invite link"
                >
                  {copied ? (
                    <CheckIcon sx={{ fontSize: 13, color: "#34d399" }} />
                  ) : (
                    <ContentCopyIcon sx={{ fontSize: 13 }} />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Center: Live Meeting Duration Timer */}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1 text-xs backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="hidden xs:inline text-[11px] font-semibold text-slate-300">
                Live
              </span>
              <span className="hidden xs:inline text-slate-500">•</span>
              <AccessTimeIcon sx={{ fontSize: 14, color: "#818cf8" }} />
              <span className="font-mono text-xs font-bold text-indigo-200">
                {formatElapsedTime(elapsedTime)}
              </span>
            </div>

            {/* Right: Participant Count + Layout Toggle + Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Participant count chip */}
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                <GroupsIcon sx={{ fontSize: 15, color: "#34d399" }} />
                <span className="font-semibold text-white">
                  {videos.length + 1}
                </span>
                <span className="hidden sm:inline">Online</span>
              </div>

              {/* Layout Switcher (Speaker vs Gallery View) */}
              <Tooltip
                title={
                  layoutMode === "speaker"
                    ? "Switch to Gallery Grid View"
                    : "Switch to Zoom Speaker View"
                }
              >
                <button
                  onClick={() =>
                    setLayoutMode((prev) =>
                      prev === "speaker" ? "grid" : "speaker"
                    )
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                    layoutMode === "speaker"
                      ? "border-indigo-500/50 bg-indigo-500/25 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.25)]"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {layoutMode === "speaker" ? (
                    <>
                      <GridViewIcon sx={{ fontSize: 15 }} />
                      <span className="hidden sm:inline">Gallery</span>
                    </>
                  ) : (
                    <>
                      <ViewSidebarIcon sx={{ fontSize: 15 }} />
                      <span className="hidden sm:inline">Speaker</span>
                    </>
                  )}
                </button>
              </Tooltip>

              {/* Effects Modal Trigger in Header */}
              <Tooltip title="Video Background & Effects">
                <button
                  onClick={() => setShowEffectsModal(true)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                    videoEffect !== "none" || virtualBg !== "none"
                      ? "border-purple-500/50 bg-purple-500/25 text-purple-300"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <AutoFixHighIcon sx={{ fontSize: 17 }} />
                </button>
              </Tooltip>

              {/* Fullscreen Toggle */}
              <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                <button
                  onClick={handleFullscreen}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10"
                >
                  {isFullscreen ? (
                    <FullscreenExitIcon sx={{ fontSize: 17 }} />
                  ) : (
                    <FullscreenIcon sx={{ fontSize: 17 }} />
                  )}
                </button>
              </Tooltip>
            </div>
          </header>

          {/* ================= MAIN CONTENT (STAGE + CHAT PANEL) ================= */}
          <main className="relative z-10 flex flex-1 overflow-hidden p-2 sm:p-3 md:p-4 gap-3">
            {/* ================= VIDEO STAGE ================= */}
            <div className="relative flex flex-1 flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] border border-white/10 bg-slate-900/40 backdrop-blur-xl">
              {/* STAGE HEADER / STATUS ROW */}
              <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-white">
                    {meetingCode.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>
                    {videos.length === 0
                      ? "Sole Participant"
                      : `${videos.length + 1} People in Meeting`}
                  </span>
                </div>

                {/* Active Video Effect / Background Indicator */}
                {(videoEffect !== "none" || virtualBg !== "none") && (
                  <button
                    onClick={() => setShowEffectsModal(true)}
                    className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-medium text-purple-300 transition hover:bg-purple-500/25"
                  >
                    <AutoFixHighIcon sx={{ fontSize: 13 }} />
                    <span>
                      {videoEffect !== "none"
                        ? VIDEO_EFFECTS[videoEffect]?.name
                        : VIRTUAL_BACKGROUNDS[virtualBg]?.name}
                    </span>
                  </button>
                )}
              </div>

              {/* VIDEO GRID AREA */}
              <div className="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-3">
                {/* ---------------- SCENARIO 1: USER IS ALONE IN CALL ---------------- */}
                {videos.length === 0 ? (
                  <div className="relative flex h-full w-full max-w-[900px] flex-col items-center justify-center">
                    {/* Waiting For Others Banner */}
                    <div className="absolute top-2 z-20 flex items-center gap-2.5 rounded-full border border-indigo-400/30 bg-slate-950/85 px-4 py-1.5 text-xs text-slate-200 backdrop-blur-xl shadow-xl">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                      <span>Waiting for others to join</span>
                      <button
                        onClick={handleCopyLink}
                        className="ml-1 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-400/30 transition hover:bg-indigo-500/30"
                      >
                        {copied ? "Link Copied!" : "Share Invite Link"}
                      </button>
                    </div>

                    {/* Local Video Tile in Main Stage */}
                    <div
                      className={`relative aspect-video w-full max-h-[calc(100%-80px)] overflow-hidden rounded-[22px] border transition-all duration-300 shadow-2xl ${
                        audio && audioLevel > 15
                          ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.35)]"
                          : "border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                      }`}
                      style={{
                        background:
                          virtualBg !== "none"
                            ? VIRTUAL_BACKGROUNDS[virtualBg]?.backdrop
                            : "#020617",
                      }}
                    >
                      {/* Live Video Tag */}
                      <video
                        ref={localVideoref}
                        autoPlay
                        muted
                        playsInline
                        className={`h-full w-full object-cover transition-opacity duration-300 ${
                          video && videoAvailable
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                        }`}
                        style={{
                          filter: VIDEO_EFFECTS[videoEffect]?.filter || "none",
                        }}
                      />

                      {/* Camera Off Avatar */}
                      {(!video || !videoAvailable) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-md">
                          <div
                            className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full text-3xl sm:text-4xl font-extrabold text-white shadow-2xl transition-all duration-300"
                            style={{
                              background:
                                "radial-gradient(circle at 35% 35%, #a855f7, #6366f1 65%, #1e1b4b 100%)",
                              boxShadow:
                                audio && audioLevel > 15
                                  ? "0 0 35px rgba(52, 211, 153, 0.55)"
                                  : "0 0 30px rgba(99, 102, 241, 0.35)",
                              border:
                                audio && audioLevel > 15
                                  ? "3px solid #34d399"
                                  : "2px solid rgba(165, 180, 252, 0.4)",
                            }}
                          >
                            {(username.trim()[0] || "Y").toUpperCase()}
                          </div>
                          <div className="mt-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1 text-xs font-medium text-slate-300 shadow-sm">
                            <VideocamOffIcon
                              sx={{ fontSize: 14, color: "#fb7185" }}
                            />
                            <span>Camera is turned off</span>
                          </div>
                        </div>
                      )}

                      {/* Bottom-Left: Participant Name & Status Badge */}
                      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 backdrop-blur-xl shadow-lg">
                        {audio ? (
                          <MicIcon sx={{ fontSize: 14, color: "#34d399" }} />
                        ) : (
                          <MicOffIcon sx={{ fontSize: 14, color: "#fb7185" }} />
                        )}
                        <span className="max-w-[140px] sm:max-w-[200px] truncate text-xs font-semibold text-white">
                          {username.trim() || "You"} (You)
                        </span>
                        {videoEffect !== "none" && (
                          <span className="rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-400/30">
                            {VIDEO_EFFECTS[videoEffect]?.name}
                          </span>
                        )}
                      </div>

                      {/* Top-Right: Effects Shortcut */}
                      <button
                        onClick={() => setShowEffectsModal(true)}
                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-xl transition hover:bg-white/20"
                        title="Change Background or Effect"
                      >
                        <AutoFixHighIcon sx={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ---------------- SCENARIO 2: LIVE CONFERENCING (ZOOM STYLE) ---------------- */
                  layoutMode === "speaker" ? (
                    /* ================= ZOOM SPEAKER VIEW (USER LOOKS BIG, MY STREAM SMALL) ================= */
                    <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden">
                      {(() => {
                        const activeSpeaker =
                          (pinnedParticipant &&
                            videos.find((v) => v.socketId === pinnedParticipant)) ||
                          videos[0];
                        const otherParticipants = videos.filter(
                          (v) => v.socketId !== activeSpeaker?.socketId
                        );
                        const peerDisplayName = activeSpeaker
                          ? participantNames[activeSpeaker.socketId] || "Participant"
                          : "Participant";
                        const isPinned =
                          pinnedParticipant === activeSpeaker?.socketId;

                        return (
                          <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden">
                            {/* Top Strip of other participants (if > 1 other participant) */}
                            {otherParticipants.length > 0 && (
                              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 overflow-x-auto max-w-[calc(100%-180px)] sm:max-w-[calc(100%-280px)] rounded-2xl bg-black/60 p-1.5 backdrop-blur-xl border border-white/15 shadow-xl">
                                {otherParticipants.map((peer, idx) => {
                                  const name =
                                    participantNames[peer.socketId] ||
                                    `User ${idx + 1}`;
                                  return (
                                    <button
                                      key={peer.socketId}
                                      onClick={() =>
                                        setPinnedParticipant(peer.socketId)
                                      }
                                      className="group relative h-[60px] sm:h-[72px] aspect-video flex-shrink-0 overflow-hidden rounded-xl border border-white/20 bg-slate-900 transition hover:border-indigo-400 hover:scale-105"
                                      title={`Click to view ${name} in main stage`}
                                    >
                                      <video
                                        data-socket={peer.socketId}
                                        ref={(ref) => {
                                          if (ref && peer.stream) {
                                            ref.srcObject = peer.stream;
                                          }
                                        }}
                                        autoPlay
                                        playsInline
                                        className="h-full w-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-85" />
                                      <span className="absolute bottom-1 left-1.5 max-w-[90%] truncate text-[9px] font-semibold text-white">
                                        {name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* BIG REMOTE PARTICIPANT (MAIN STAGE) */}
                            <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/15 bg-slate-950 shadow-2xl flex items-center justify-center">
                              {activeSpeaker && (
                                <>
                                  <video
                                    data-socket={activeSpeaker.socketId}
                                    ref={(ref) => {
                                      if (ref && activeSpeaker.stream) {
                                        ref.srcObject = activeSpeaker.stream;
                                      }
                                    }}
                                    autoPlay
                                    playsInline
                                    className="h-full w-full object-cover"
                                  />

                                  {/* Fallback Cosmic Avatar if stream is blank */}
                                  <div className="pointer-events-none absolute inset-0 -z-10 flex flex-col items-center justify-center bg-slate-900">
                                    <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 text-3xl sm:text-4xl font-extrabold text-white shadow-2xl">
                                      {(peerDisplayName[0] || "P").toUpperCase()}
                                    </div>
                                    <span className="mt-3 text-sm font-medium text-slate-300">
                                      {peerDisplayName}
                                    </span>
                                  </div>

                                  {/* Speaker Name Tag (Bottom-Left) */}
                                  <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-3.5 py-1.5 backdrop-blur-xl shadow-xl">
                                    <MicIcon sx={{ fontSize: 14, color: "#34d399" }} />
                                    <span className="max-w-[150px] sm:max-w-[240px] truncate text-xs font-bold text-white">
                                      {peerDisplayName}
                                    </span>
                                    {isPinned && (
                                      <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                                        PINNED
                                      </span>
                                    )}
                                  </div>

                                  {/* Pin / Spotlight Action (Top-Right) */}
                                  <button
                                    onClick={() =>
                                      setPinnedParticipant((prev) =>
                                        prev === activeSpeaker.socketId
                                          ? null
                                          : activeSpeaker.socketId
                                      )
                                    }
                                    className={`absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-xl transition ${
                                      isPinned
                                        ? "border-amber-400 bg-amber-400/25 text-amber-300"
                                        : "border-white/15 bg-black/60 text-white/80 hover:bg-white/20 hover:text-white"
                                    }`}
                                    title={isPinned ? "Unpin Speaker" : "Pin Speaker"}
                                  >
                                    {isPinned ? (
                                      <PushPinIcon sx={{ fontSize: 16 }} />
                                    ) : (
                                      <PushPinOutlinedIcon sx={{ fontSize: 16 }} />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>

                            {/* SMALL LOCAL STREAM (ZOOM PICTURE-IN-PICTURE TILE) */}
                            <div
                              className={`absolute top-3.5 right-3.5 z-30 transition-all duration-200 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl group ${
                                isSelfViewMinimized
                                  ? "h-9 rounded-full px-3 py-1 flex items-center gap-1.5 cursor-pointer bg-slate-900/90 border border-white/20 hover:border-white/40"
                                  : "w-36 xs:w-44 sm:w-56 md:w-64 aspect-video rounded-2xl border hover:scale-[1.02]"
                              } ${
                                !isSelfViewMinimized && audio && audioLevel > 15
                                  ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                                  : "border-white/20 bg-slate-950"
                              }`}
                              style={{
                                background:
                                  !isSelfViewMinimized && virtualBg !== "none"
                                    ? VIRTUAL_BACKGROUNDS[virtualBg]?.backdrop
                                    : "#020617",
                              }}
                            >
                              {isSelfViewMinimized ? (
                                <button
                                  onClick={() => setIsSelfViewMinimized(false)}
                                  className="flex items-center gap-1.5 text-xs text-white"
                                  title="Expand Self View"
                                >
                                  {audio ? (
                                    <MicIcon sx={{ fontSize: 13, color: "#34d399" }} />
                                  ) : (
                                    <MicOffIcon sx={{ fontSize: 13, color: "#fb7185" }} />
                                  )}
                                  <span className="font-semibold">
                                    {username.trim() || "You"} (You)
                                  </span>
                                  <span className="text-[10px] text-indigo-300 underline ml-1">
                                    Expand
                                  </span>
                                </button>
                              ) : (
                                <>
                                  <video
                                    ref={(el) => {
                                      localVideoref.current = el;
                                      if (
                                        el &&
                                        window.localStream &&
                                        el.srcObject !== window.localStream
                                      ) {
                                        el.srcObject = window.localStream;
                                      }
                                    }}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                                      video && videoAvailable
                                        ? "opacity-100"
                                        : "opacity-0 pointer-events-none"
                                    }`}
                                    style={{
                                      filter: VIDEO_EFFECTS[videoEffect]?.filter || "none",
                                    }}
                                  />

                                  {/* Camera Off Avatar in PiP */}
                                  {(!video || !videoAvailable) && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-md">
                                      <div
                                        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-xl sm:text-2xl font-bold text-white shadow-lg"
                                        style={{
                                          background:
                                            "radial-gradient(circle at 35% 35%, #a855f7, #6366f1 65%, #1e1b4b 100%)",
                                        }}
                                      >
                                        {(username.trim()[0] || "Y").toUpperCase()}
                                      </div>
                                    </div>
                                  )}

                                  {/* PiP Name Tag */}
                                  <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                                    {audio ? (
                                      <MicIcon sx={{ fontSize: 12, color: "#34d399" }} />
                                    ) : (
                                      <MicOffIcon sx={{ fontSize: 12, color: "#fb7185" }} />
                                    )}
                                    <span className="max-w-[80px] sm:max-w-[100px] truncate">
                                      {username.trim() || "You"} (You)
                                    </span>
                                  </div>

                                  {/* Top-Right PiP Controls */}
                                  <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                                    <button
                                      onClick={() => setShowEffectsModal(true)}
                                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white border border-white/20 hover:bg-purple-600 transition"
                                      title="Change Effect"
                                    >
                                      <AutoFixHighIcon sx={{ fontSize: 12 }} />
                                    </button>
                                    <button
                                      onClick={() => setIsSelfViewMinimized(true)}
                                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white border border-white/20 hover:bg-slate-800 transition text-[11px] font-bold"
                                      title="Minimize Self View"
                                    >
                                      —
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* ================= ZOOM GALLERY / GRID VIEW ================= */
                    <div
                      className={`h-full w-full grid gap-3.5 ${
                        videos.length === 1
                          ? "grid-cols-1 md:grid-cols-2"
                          : videos.length <= 3
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-2 lg:grid-cols-3"
                      }`}
                    >
                      {/* Local User Tile */}
                      <div
                        className={`relative min-h-[180px] overflow-hidden rounded-[20px] border transition-all duration-200 shadow-lg h-full w-full ${
                          audio && audioLevel > 15
                            ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                            : "border-white/15 bg-slate-950"
                        }`}
                        style={{
                          background:
                            virtualBg !== "none"
                              ? VIRTUAL_BACKGROUNDS[virtualBg]?.backdrop
                              : "#020617",
                        }}
                      >
                        <video
                          ref={(el) => {
                            localVideoref.current = el;
                            if (
                              el &&
                              window.localStream &&
                              el.srcObject !== window.localStream
                            ) {
                              el.srcObject = window.localStream;
                            }
                          }}
                          autoPlay
                          muted
                          playsInline
                          className={`h-full w-full object-cover transition-opacity duration-300 ${
                            video && videoAvailable
                              ? "opacity-100"
                              : "opacity-0 pointer-events-none"
                          }`}
                          style={{
                            filter: VIDEO_EFFECTS[videoEffect]?.filter || "none",
                          }}
                        />

                        {(!video || !videoAvailable) && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-md">
                            <div
                              className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full text-2xl sm:text-3xl font-extrabold text-white shadow-xl"
                              style={{
                                background:
                                  "radial-gradient(circle at 35% 35%, #a855f7, #6366f1 65%, #1e1b4b 100%)",
                              }}
                            >
                              {(username.trim()[0] || "Y").toUpperCase()}
                            </div>
                          </div>
                        )}

                        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold backdrop-blur-xl text-white">
                          {audio ? (
                            <MicIcon sx={{ fontSize: 13, color: "#34d399" }} />
                          ) : (
                            <MicOffIcon sx={{ fontSize: 13, color: "#fb7185" }} />
                          )}
                          <span className="max-w-[120px] truncate">
                            {username.trim() || "You"} (You)
                          </span>
                        </div>
                      </div>

                      {/* Remote Participants */}
                      {videos.map((remotePeer, idx) => {
                        const peerDisplayName =
                          participantNames[remotePeer.socketId] ||
                          `Participant ${idx + 1}`;

                        return (
                          <div
                            key={remotePeer.socketId}
                            className="relative min-h-[180px] overflow-hidden rounded-[20px] border border-white/15 bg-slate-950 shadow-lg h-full w-full"
                          >
                            <video
                              data-socket={remotePeer.socketId}
                              ref={(ref) => {
                                if (ref && remotePeer.stream) {
                                  ref.srcObject = remotePeer.stream;
                                }
                              }}
                              autoPlay
                              playsInline
                              className="h-full w-full object-cover"
                            />

                            <div className="pointer-events-none absolute inset-0 -z-10 flex flex-col items-center justify-center bg-slate-900">
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-2xl font-bold text-white">
                                {peerDisplayName[0].toUpperCase()}
                              </div>
                            </div>

                            <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold backdrop-blur-xl text-white">
                              <MicIcon sx={{ fontSize: 13, color: "#34d399" }} />
                              <span className="max-w-[130px] sm:max-w-[180px] truncate">
                                {peerDisplayName}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              {/* ================= FLOATING CONTROL DOCK ================= */}
              <div className="relative z-20 flex justify-center pb-3 pt-1">
                <div className="flex items-center gap-2 sm:gap-4 rounded-[26px] border border-white/15 bg-slate-950/85 px-4 py-2.5 shadow-2xl backdrop-blur-2xl">
                  {/* Mic Toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Tooltip
                      title={
                        audio ? "Mute Microphone" : "Unmute Microphone"
                      }
                    >
                      <IconButton
                        onClick={handleAudio}
                        sx={{
                          width: "50px",
                          height: "50px",
                          color: audio ? "#34d399" : "#fb7185",
                          background: audio
                            ? "rgba(16, 185, 129, 0.16)"
                            : "rgba(244, 63, 94, 0.18)",
                          border: audio
                            ? "1px solid rgba(52, 211, 153, 0.45)"
                            : "1px solid rgba(244, 63, 94, 0.45)",
                          "&:hover": {
                            background: audio
                              ? "rgba(16, 185, 129, 0.28)"
                              : "rgba(244, 63, 94, 0.3)",
                            transform: "scale(1.05)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        {audio === true ? <MicIcon /> : <MicOffIcon />}
                      </IconButton>
                    </Tooltip>
                    <span className="text-[10px] font-medium text-slate-300">
                      Mic
                    </span>
                  </div>

                  {/* Camera Toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Tooltip
                      title={video ? "Turn Off Camera" : "Turn On Camera"}
                    >
                      <IconButton
                        onClick={handleVideo}
                        sx={{
                          width: "50px",
                          height: "50px",
                          color: video ? "#a5b4fc" : "#fb7185",
                          background: video
                            ? "rgba(99, 102, 241, 0.16)"
                            : "rgba(244, 63, 94, 0.18)",
                          border: video
                            ? "1px solid rgba(129, 140, 248, 0.45)"
                            : "1px solid rgba(244, 63, 94, 0.45)",
                          "&:hover": {
                            background: video
                              ? "rgba(99, 102, 241, 0.28)"
                              : "rgba(244, 63, 94, 0.3)",
                            transform: "scale(1.05)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        {video === true ? (
                          <VideocamIcon />
                        ) : (
                          <VideocamOffIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    <span className="text-[10px] font-medium text-slate-300">
                      Camera
                    </span>
                  </div>

                  {/* Effects / Virtual Background Toggle with Floating Popover */}
                  <div className="relative flex flex-col items-center gap-1">
                    <Tooltip title="Background & Blur Effects">
                      <IconButton
                        onClick={() => setShowEffectsModal((prev) => !prev)}
                        sx={{
                          width: "50px",
                          height: "50px",
                          color:
                            videoEffect !== "none" || virtualBg !== "none"
                              ? "#c084fc"
                              : "#cbd5e1",
                          background:
                            videoEffect !== "none" || virtualBg !== "none"
                              ? "rgba(192, 132, 252, 0.2)"
                              : "rgba(255, 255, 255, 0.06)",
                          border:
                            videoEffect !== "none" || virtualBg !== "none"
                              ? "1px solid rgba(192, 132, 252, 0.5)"
                              : "1px solid rgba(255, 255, 255, 0.12)",
                          "&:hover": {
                            background: "rgba(192, 132, 252, 0.25)",
                            transform: "scale(1.05)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        <AutoFixHighIcon />
                      </IconButton>
                    </Tooltip>
                    <span className="text-[10px] font-medium text-slate-300">
                      Effects
                    </span>

                    {/* ================= COMPACT USER-FRIENDLY EFFECTS POPOVER ================= */}
                    {showEffectsModal && (
                      <div className="absolute bottom-[66px] left-1/2 -translate-x-1/2 z-50 w-[290px] sm:w-[320px] rounded-2xl border border-white/20 bg-slate-950/95 p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-fadeIn">
                        {/* Popover Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <AutoFixHighIcon
                              sx={{ fontSize: 16, color: "#c084fc" }}
                            />
                            <span className="text-xs font-bold text-white">
                              Visual Effects
                            </span>
                          </div>
                          <button
                            onClick={() => setShowEffectsModal(false)}
                            className="text-slate-400 hover:text-white transition p-1 rounded-md hover:bg-white/10 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Grid of 6 Friendly Presets */}
                        <div className="grid grid-cols-2 gap-2">
                          {SIMPLE_EFFECTS.map((item) => {
                            const isActive =
                              (item.id === "none" &&
                                videoEffect === "none" &&
                                virtualBg === "none") ||
                              (item.id === "blur-soft" &&
                                videoEffect === "blur-soft") ||
                              (item.id === "blur-deep" &&
                                videoEffect === "blur-deep") ||
                              (item.id === "studio" &&
                                videoEffect === "studio") ||
                              (item.id === "office" &&
                                virtualBg === "office") ||
                              (item.id === "cosmic" &&
                                (virtualBg === "galaxy" ||
                                  videoEffect === "cosmic"));

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectSimpleEffect(item)}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-150 active:scale-95 ${
                                  isActive
                                    ? "border-purple-400 bg-purple-500/25 shadow-[0_0_12px_rgba(192,132,252,0.3)] text-white"
                                    : "border-white/10 bg-slate-900/80 text-slate-300 hover:border-white/25 hover:bg-slate-800/80"
                                }`}
                              >
                                <span className="text-base">{item.icon}</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold truncate leading-tight">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 truncate leading-tight">
                                    {item.desc}
                                  </span>
                                </div>
                                {isActive && (
                                  <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Screen Share */}
                  {screenAvailable === true && (
                    <div className="flex flex-col items-center gap-1">
                      <Tooltip
                        title={
                          screen ? "Stop Sharing Screen" : "Share Screen"
                        }
                      >
                        <IconButton
                          onClick={handleScreen}
                          sx={{
                            width: "50px",
                            height: "50px",
                            color: screen ? "#34d399" : "#cbd5e1",
                            background: screen
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(255, 255, 255, 0.06)",
                            border: screen
                              ? "1px solid rgba(52, 211, 153, 0.5)"
                              : "1px solid rgba(255, 255, 255, 0.12)",
                            "&:hover": {
                              background: "rgba(255, 255, 255, 0.12)",
                              transform: "scale(1.05)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          {screen === true ? (
                            <StopScreenShareIcon />
                          ) : (
                            <ScreenShareIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <span className="text-[10px] font-medium text-slate-300">
                        Screen
                      </span>
                    </div>
                  )}

                  {/* Chat Toggle with Unread Badge */}
                  <div className="flex flex-col items-center gap-1">
                    <Tooltip title={showModal ? "Close Chat" : "Meeting Chat"}>
                      <Badge
                        badgeContent={newMessages}
                        max={999}
                        color="error"
                      >
                        <IconButton
                          onClick={() => {
                            if (showModal) {
                              closeChat();
                            } else {
                              openChat();
                            }
                          }}
                          sx={{
                            width: "50px",
                            height: "50px",
                            color: showModal ? "#818cf8" : "#cbd5e1",
                            background: showModal
                              ? "rgba(99, 102, 241, 0.25)"
                              : "rgba(255, 255, 255, 0.06)",
                            border: showModal
                              ? "1px solid rgba(129, 140, 248, 0.5)"
                              : "1px solid rgba(255, 255, 255, 0.12)",
                            "&:hover": {
                              background: "rgba(99, 102, 241, 0.2)",
                              transform: "scale(1.05)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          <ChatIcon />
                        </IconButton>
                      </Badge>
                    </Tooltip>
                    <span className="text-[10px] font-medium text-slate-300">
                      Chat
                    </span>
                  </div>

                  <div className="h-7 w-px bg-white/15" />

                  {/* Leave / End Call */}
                  <div className="flex flex-col items-center gap-1">
                    <Tooltip title="Leave Meeting">
                      <IconButton
                        onClick={handleEndCall}
                        sx={{
                          width: "54px",
                          height: "54px",
                          color: "white",
                          background:
                            "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                          boxShadow: "0 0 20px rgba(239, 68, 68, 0.45)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
                            boxShadow: "0 0 25px rgba(239, 68, 68, 0.6)",
                            transform: "scale(1.05)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        <CallEndIcon />
                      </IconButton>
                    </Tooltip>
                    <span className="text-[10px] font-medium text-rose-400">
                      Leave
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Backdrop for closing chat on phone tap */}
            {showModal && (
              <div
                onClick={closeChat}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fadeIn"
              />
            )}

            {/* ================= USER-FRIENDLY IN-CALL CHAT PANEL ================= */}
            {showModal && (
              <aside className="fixed inset-y-0 right-0 z-50 flex w-full sm:w-[360px] md:relative md:inset-auto md:z-30 md:w-[350px] lg:w-[380px] flex-col overflow-hidden border-l border-white/10 md:border md:rounded-[24px] bg-[#070e22]/98 shadow-2xl backdrop-blur-2xl transition-all duration-300">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.03]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                      <ChatIcon sx={{ fontSize: 18 }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        In-Call Messages
                        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                          {videos.length + 1}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Chat with meeting participants
                      </p>
                    </div>
                  </div>

                  <Tooltip title="Close Chat">
                    <button
                      onClick={closeChat}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                      aria-label="Close Chat"
                    >
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                  </Tooltip>
                </div>

                {/* Privacy Context Notice */}
                <div className="flex items-center gap-2 border-b border-white/[0.08] bg-slate-950/70 px-4 py-2 text-[11px] text-slate-400">
                  <LockIcon sx={{ fontSize: 13, color: "#818cf8", flexShrink: 0 }} />
                  <span>
                    Messages are only visible during the call and disappear after you leave.
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      const isSelf = item.isSelf;
                      const senderName = item.sender || "Participant";
                      const initial = senderName[0]?.toUpperCase() || "P";

                      return (
                        <div
                          key={index}
                          className={`flex flex-col ${
                            isSelf ? "items-end" : "items-start"
                          }`}
                        >
                          {/* Sender Info & Timestamp */}
                          <div
                            className={`flex items-center gap-1.5 mb-1 text-[11px] ${
                              isSelf ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            <span
                              className={`font-semibold ${
                                isSelf ? "text-indigo-300" : "text-emerald-400"
                              }`}
                            >
                              {isSelf ? "You" : senderName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {item.time || ""}
                            </span>
                          </div>

                          {/* Message Bubble */}
                          <div className="flex items-end gap-2 max-w-[85%]">
                            {!isSelf && (
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-200 border border-white/10">
                                {initial}
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words shadow-md ${
                                isSelf
                                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs"
                                  : "bg-slate-800/90 border border-white/10 text-slate-200 rounded-tl-xs backdrop-blur-md"
                              }`}
                            >
                              {renderMessageContent(item.data)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Friendly Empty State with One-Click Starters */
                    <div className="flex h-full flex-col items-center justify-center text-center p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-indigo-400 mb-2 shadow-inner">
                        <EmojiEmotionsIcon sx={{ fontSize: 24 }} />
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        No messages yet
                      </h4>
                      <p className="mt-1 text-xs text-slate-400 max-w-[220px]">
                        Start the conversation or tap a quick message below:
                      </p>

                      {/* 1-Click Starter Quick Chips */}
                      <div className="mt-4 flex flex-col gap-2 w-full max-w-[240px]">
                        {[
                          { text: "👋 Say Hello", msg: "Hello everyone! 👋" },
                          { text: "👍 Audio is clear!", msg: "Audio and video are working great! 👍" },
                          { text: "✋ Quick question", msg: "I have a quick question ✋" },
                        ].map((chip) => (
                          <button
                            key={chip.text}
                            onClick={() => sendMessage(chip.msg)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs font-medium text-slate-300 transition hover:border-indigo-400/40 hover:bg-indigo-500/15 hover:text-white active:scale-95"
                          >
                            <span>{chip.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reaction Emojis Tray */}
                <div className="flex items-center justify-between border-t border-white/[0.08] bg-slate-950/60 px-3 py-1.5">
                  {["👋", "👍", "👏", "❤️", "😂", "🔥", "🎉", "🚀"].map((emoji) => (
                    <Tooltip key={emoji} title={`Send ${emoji}`}>
                      <button
                        onClick={() => sendMessage(emoji)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-sm transition hover:scale-125 hover:bg-white/10 active:scale-95"
                      >
                        {emoji}
                      </button>
                    </Tooltip>
                  ))}
                </div>

                {/* Message Input Bar */}
                <div className="border-t border-white/10 bg-slate-950/90 p-3">
                  <div className="flex items-center gap-2">
                    <TextField
                      value={message}
                      onChange={handleMessage}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Send a message to everyone..."
                      variant="outlined"
                      size="small"
                      fullWidth
                      InputProps={{
                        endAdornment: message.trim() ? (
                          <button
                            onClick={() => setMessage("")}
                            className="text-slate-400 hover:text-white p-1 text-xs"
                            title="Clear message"
                          >
                            ✕
                          </button>
                        ) : null,
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          backgroundColor: "rgba(15, 23, 42, 0.85)",
                          color: "white",
                          fontSize: "0.88rem",
                          "& fieldset": {
                            borderColor: "rgba(148, 163, 184, 0.25)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(129, 140, 248, 0.6)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#818cf8",
                          },
                        },
                      }}
                    />

                    <Tooltip title={message.trim() ? "Send (Enter)" : "Type a message"}>
                      <span>
                        <IconButton
                          onClick={() => sendMessage()}
                          disabled={!message.trim()}
                          sx={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "12px",
                            background: message.trim()
                              ? "linear-gradient(135deg, #6366f1, #a855f7)"
                              : "rgba(255,255,255,0.06)",
                            color: "white",
                            boxShadow: message.trim()
                              ? "0 0 12px rgba(99,102,241,0.4)"
                              : "none",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #4f46e5, #9333ea)",
                            },
                            "&.Mui-disabled": {
                              color: "rgba(255,255,255,0.2)",
                            },
                          }}
                        >
                          <SendIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-500">
                    <span>Press Enter to send</span>
                    <span>Shift + Enter for new line</span>
                  </div>
                </div>
              </aside>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
