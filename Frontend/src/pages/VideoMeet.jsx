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

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const params = useParams();
  const { userData } = useContext(AuthContext);

  const meetingCode =
    params.url || window.location.pathname.replace(/^\//, "") || "room";

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
  const [layoutMode, setLayoutMode] = useState("grid"); // "grid" | "speaker"
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
     RETURN
  ===================================================== */

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white overflow-hidden">
      {askForUsername === true ? (
        /* =====================================================
           LOBBY SCREEN
        ===================================================== */

        <div
          className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden"
          style={{
            background: `
              radial-gradient(circle at 18% 18%, rgba(99, 102, 241, 0.28), transparent 36%),
              radial-gradient(circle at 82% 80%, rgba(139, 92, 246, 0.24), transparent 36%),
              linear-gradient(180deg, rgba(5, 8, 31, 0.90) 0%, rgba(7, 11, 43, 0.96) 100%),
              url("/images/cosmic-bg.jpg")
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          {/* ================= BACKGROUND EFFECTS ================= */}

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-20 h-[550px] w-[550px] rounded-full bg-purple-700/20 blur-[130px]" />
            <div className="absolute -bottom-40 -left-20 h-[550px] w-[550px] rounded-full bg-blue-700/18 blur-[130px]" />
            <div className="absolute top-[35%] left-[45%] h-[380px] w-[380px] rounded-full bg-indigo-600/10 blur-[100px]" />

            {/* Ambient Star Sparkles */}
            <div className="absolute top-[10%] left-[32%] h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_12px_#60a5fa]" />
            <div className="absolute top-[24%] left-[70%] h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc]" />
            <div className="absolute top-[38%] left-[14%] h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            <div className="absolute bottom-[28%] right-[16%] h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
            <div className="absolute bottom-[16%] left-[28%] h-1 w-1 rounded-full bg-blue-400" />

            {/* Subtle cyber grid */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
          </div>

          {/* ================= NAVBAR ================= */}

          <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 md:px-10 lg:px-12 border-b border-white/[0.08] bg-slate-950/45 backdrop-blur-xl">
            {/* Left: Leave Lobby + Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleBackToHome}
                className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-xl transition duration-200 hover:border-white/30 hover:bg-white/[0.12] hover:text-white"
                title="Leave lobby and return to home"
              >
                <ArrowBackIcon
                  sx={{ fontSize: 16 }}
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                />
                <span className="hidden sm:inline">Leave Lobby</span>
              </button>

              <div className="h-4 w-px bg-white/15 hidden sm:block" />

              <Logo size="sm" to="/home" subtitle="MEETING LOBBY" />
            </div>

            {/* Right: Room ID Pill + Security Badge */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Room pill with copy link */}
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/80 px-3.5 py-1.5 backdrop-blur-xl shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Room
                </span>
                <span className="max-w-[130px] sm:max-w-[200px] truncate text-xs font-semibold text-indigo-200 font-mono">
                  {meetingCode}
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition duration-200 ${
                    copied
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10"
                  }`}
                  title="Copy meeting invite link"
                >
                  {copied ? (
                    <CheckIcon sx={{ fontSize: 13, color: "#34d399" }} />
                  ) : (
                    <ContentCopyIcon sx={{ fontSize: 13 }} />
                  )}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              {/* Security badge */}
              <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                <span className="text-xs font-medium text-emerald-300">
                  Encrypted HD
                </span>
                <SecurityIcon className="text-emerald-400" sx={{ fontSize: 15 }} />
              </div>
            </div>
          </header>

          {/* ================= MAIN LOBBY CARD ================= */}

          <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 w-full">
            <div className="relative flex w-full max-w-[1200px] flex-col lg:flex-row items-center justify-between gap-7 lg:gap-10 xl:gap-12 rounded-[28px] sm:rounded-[32px] border border-white/[0.14] bg-slate-900/60 p-5 sm:p-7 lg:p-9 shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
              {/* Internal ambient glows */}
              <div className="absolute -right-32 -top-32 h-[450px] w-[450px] rounded-full bg-purple-600/15 blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 h-[450px] w-[450px] rounded-full bg-blue-600/12 blur-[100px] pointer-events-none" />

              {/* ================= LEFT / TOP: FORM SECTION ================= */}

              <div className="relative z-10 w-full lg:w-[480px] lg:flex-shrink-0 order-2 lg:order-1 flex flex-col justify-center">
                {/* Category Pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-indigo-300 w-fit backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  Ready to Connect
                </div>

                <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-white leading-[1.18]">
                  Join <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">MeetNova</span>
                </h1>

                <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300/80">
                  Configure your devices, set your display name, and enter your meeting room.
                </p>

                {/* Permissions Warning Callout */}
                {!videoAvailable && !audioAvailable && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                    <WarningAmberIcon
                      sx={{ fontSize: 18, color: "#f59e0b", flexShrink: 0, mt: "1px" }}
                    />
                    <span>
                      Camera and microphone access are blocked in your browser.
                      You can still join to listen or grant permission in the address bar.
                    </span>
                  </div>
                )}

                {/* Username & Join Controls */}
                <div className="mt-6 space-y-4">
                  <div>
                    <TextField
                      id="username"
                      label="Your Display Name"
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
                          <PersonIcon
                            sx={{
                              color: "#818cf8",
                              marginRight: "10px",
                            }}
                          />
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "16px",
                          backgroundColor: "rgba(15,23,42,0.7)",
                          color: "white",
                          fontSize: "1rem",
                          height: "56px",
                          "& fieldset": {
                            borderColor: "rgba(148,163,184,0.3)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(129,140,248,0.7)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#818cf8",
                            borderWidth: "1.5px",
                            boxShadow: "0 0 16px rgba(99,102,241,0.25)",
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
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>Press Enter to join directly</span>
                      <span className={username.trim() ? "text-emerald-400 font-medium" : "text-slate-500"}>
                        {username.trim() ? "Name ready" : "Name required"}
                      </span>
                    </div>
                  </div>

                  {/* Pre-join Quick Toggles - Symmetrical 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-0.5">
                    {/* Mic Quick Toggle */}
                    <button
                      type="button"
                      onClick={handleAudio}
                      className={`group relative flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.98] border ${
                        audio === true
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_16px_rgba(16,185,129,0.12)]"
                          : "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                      }`}
                      title="Click to toggle microphone"
                    >
                      {audio === true ? (
                        <>
                          <MicIcon sx={{ fontSize: 17 }} />
                          <span>Mic is On</span>
                          {audioLevel > 5 && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                          )}
                        </>
                      ) : (
                        <>
                          <MicOffIcon sx={{ fontSize: 17 }} />
                          <span>Mic is Muted</span>
                        </>
                      )}
                    </button>

                    {/* Camera Quick Toggle */}
                    <button
                      type="button"
                      onClick={handleVideo}
                      className={`group relative flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.98] border ${
                        video === true
                          ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 shadow-[0_0_16px_rgba(99,102,241,0.12)]"
                          : "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                      }`}
                      title="Click to toggle camera"
                    >
                      {video === true ? (
                        <>
                          <VideocamIcon sx={{ fontSize: 17 }} />
                          <span>Camera is On</span>
                        </>
                      ) : (
                        <>
                          <VideocamOffIcon sx={{ fontSize: 17 }} />
                          <span>Camera is Off</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Join Button */}
                  <Button
                    variant="contained"
                    onClick={connect}
                    disabled={!username.trim()}
                    fullWidth
                    sx={{
                      mt: 1,
                      height: "56px",
                      borderRadius: "16px",
                      textTransform: "none",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      background:
                        "linear-gradient(100deg, #c026d3 0%, #7c3aed 45%, #2563eb 100%)",
                      boxShadow: "0 12px 35px rgba(99,102,241,0.35)",
                      "&:hover": {
                        background:
                          "linear-gradient(100deg, #d946ef 0%, #8b5cf6 45%, #3b82f6 100%)",
                        boxShadow: "0 15px 40px rgba(99,102,241,0.55)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.25s ease",
                      "&.Mui-disabled": {
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.3)",
                      },
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Join Meeting</span>
                      <KeyboardDoubleArrowRightIcon sx={{ fontSize: 20 }} />
                    </div>
                  </Button>

                  {/* Trust & Quality Features */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.08] text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <SecurityIcon
                        sx={{ fontSize: 14 }}
                        className="text-emerald-400"
                      />
                      <span>End-to-End Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraphicEqIcon
                        sx={{ fontSize: 14 }}
                        className="text-blue-400"
                      />
                      <span>HD Spatial Audio</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                      <span>Low Latency P2P</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= RIGHT / TOP: VIDEO PREVIEW ================= */}

              <div className="relative z-10 w-full flex-1 max-w-[620px] order-1 lg:order-2 flex flex-col items-center justify-center">
                <div className="relative w-full">
                  {/* Subtle outer halo */}
                  <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-r from-blue-600/15 via-purple-600/25 to-fuchsia-600/15 blur-2xl pointer-events-none" />

                  {/* 16:9 Video Container */}
                  <div
                    id="lobby-video-preview"
                    className="relative aspect-video w-full overflow-hidden rounded-[22px] border border-white/20 bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]"
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
                    />

                    {/* Camera Off / Avatar State */}
                    {(!video || !videoAvailable) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-md z-10">
                        {/* Soft background glow */}
                        <div className="absolute h-48 w-48 rounded-full bg-indigo-500/12 blur-2xl pointer-events-none" />

                        {/* Cosmic Avatar */}
                        <div
                          className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full text-3xl sm:text-4xl font-extrabold text-white transition-all duration-300 shadow-2xl"
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
                            transform:
                              audio && audioLevel > 15 ? "scale(1.04)" : "scale(1)",
                          }}
                        >
                          <span>
                            {(username.trim()[0] || "Y").toUpperCase()}
                          </span>

                          {/* Voice pulse wave */}
                          {audio && audioLevel > 15 && (
                            <span className="absolute -inset-2.5 rounded-full border border-emerald-400/50 animate-ping pointer-events-none" />
                          )}
                        </div>

                        {/* Camera off badge */}
                        <div className="mt-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1 text-xs font-medium text-slate-300 shadow-sm">
                          <VideocamOffIcon
                            sx={{ fontSize: 14 }}
                            className="text-rose-400"
                          />
                          <span>Camera is turned off</span>
                        </div>
                      </div>
                    )}

                    {/* Gradient Overlay for controls contrast */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-15" />

                    {/* Top Floating Badge: Username & Live Audio Activity */}
                    <div className="absolute left-3.5 top-3.5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 backdrop-blur-xl shadow-lg">
                      {/* Audio indicator */}
                      {audio ? (
                        <div className="flex items-center gap-1" title="Microphone Active">
                          {audioLevel > 5 ? (
                            <div className="flex items-end gap-0.5 h-3">
                              <span
                                className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{
                                  height: `${Math.max(3, Math.min(12, (audioLevel / 100) * 14))}px`,
                                }}
                              />
                              <span
                                className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{
                                  height: `${Math.max(5, Math.min(12, (audioLevel / 100) * 16))}px`,
                                }}
                              />
                              <span
                                className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{
                                  height: `${Math.max(3, Math.min(12, (audioLevel / 100) * 10))}px`,
                                }}
                              />
                            </div>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                          )}
                        </div>
                      ) : (
                        <span
                          className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                          title="Microphone Muted"
                        />
                      )}

                      <span className="max-w-[120px] sm:max-w-[180px] truncate text-xs font-semibold text-white">
                        {username.trim() || "You"}
                      </span>
                    </div>

                    {/* Top-Right: Fullscreen Toggle */}
                    <Tooltip
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
                    >
                      <button
                        onClick={handleFullscreen}
                        className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-xl transition hover:bg-white/20"
                      >
                        {isFullscreen ? (
                          <FullscreenExitIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <FullscreenIcon sx={{ fontSize: 18 }} />
                        )}
                      </button>
                    </Tooltip>

                    {/* Bottom Floating Media Dock */}
                    <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3.5 rounded-full border border-white/20 bg-black/75 px-4 py-2 backdrop-blur-2xl shadow-2xl">
                      {/* Mic Button */}
                      <Tooltip
                        title={
                          audio
                            ? "Turn off microphone"
                            : "Turn on microphone"
                        }
                      >
                        <IconButton
                          onClick={handleAudio}
                          size="medium"
                          sx={{
                            width: "48px",
                            height: "48px",
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
                            boxShadow:
                              audio && audioLevel > 15
                                ? "0 0 16px rgba(52, 211, 153, 0.45)"
                                : "none",
                          }}
                        >
                          {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                      </Tooltip>

                      <div className="h-6 w-px bg-white/20" />

                      {/* Camera Button */}
                      <Tooltip
                        title={
                          video
                            ? "Turn off camera"
                            : "Turn on camera"
                        }
                      >
                        <IconButton
                          onClick={handleVideo}
                          size="medium"
                          sx={{
                            width: "48px",
                            height: "48px",
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
                    </div>
                  </div>

                  {/* Device Status Under Preview */}
                  <div className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs text-slate-300 w-fit mx-auto backdrop-blur-md">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        video && audio
                          ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                          : !video && !audio
                          ? "bg-rose-500"
                          : "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
                      }`}
                    />
                    <span>
                      {video && audio
                        ? "Camera & microphone ready"
                        : video && !audio
                        ? "Microphone is muted"
                        : !video && audio
                        ? "Camera off • Microphone ready"
                        : "Camera & microphone disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* ================= FOOTER ================= */}

          <footer className="relative z-10 py-3 text-center text-xs text-slate-400/70 border-t border-white/[0.05]">
            MeetNova • Next-Generation Video Collaboration
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

              {/* Layout Switcher (Grid vs Speaker View) */}
              <Tooltip
                title={
                  layoutMode === "grid"
                    ? "Switch to Speaker View"
                    : "Switch to Grid View"
                }
              >
                <button
                  onClick={() =>
                    setLayoutMode((prev) =>
                      prev === "grid" ? "speaker" : "grid"
                    )
                  }
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                    layoutMode === "speaker"
                      ? "border-indigo-500/50 bg-indigo-500/25 text-indigo-300"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {layoutMode === "grid" ? (
                    <ViewSidebarIcon sx={{ fontSize: 17 }} />
                  ) : (
                    <GridViewIcon sx={{ fontSize: 17 }} />
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
                  /* ---------------- SCENARIO 2: MULTIPLE PARTICIPANTS (GRID & SPEAKER) ---------------- */
                  <div
                    className={`h-full w-full ${
                      layoutMode === "grid"
                        ? `grid gap-3.5 ${
                            videos.length === 1
                              ? "grid-cols-1 md:grid-cols-2"
                              : videos.length <= 3
                              ? "grid-cols-1 sm:grid-cols-2"
                              : "grid-cols-2 lg:grid-cols-3"
                          }`
                        : "flex flex-col gap-3"
                    }`}
                  >
                    {/* 1. Local User Video Tile */}
                    <div
                      className={`relative min-h-[180px] overflow-hidden rounded-[20px] border transition-all duration-200 shadow-lg ${
                        layoutMode === "speaker"
                          ? "h-[180px] w-[260px] flex-shrink-0"
                          : "h-full w-full"
                      } ${
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

                      {/* Participant Name Badge */}
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

                    {/* 2. Remote Participants Video Tiles */}
                    {videos.map((remotePeer, idx) => {
                      const peerDisplayName =
                        participantNames[remotePeer.socketId] ||
                        `Participant ${idx + 1}`;
                      const isPinned =
                        pinnedParticipant === remotePeer.socketId;

                      return (
                        <div
                          key={remotePeer.socketId}
                          className={`relative min-h-[180px] overflow-hidden rounded-[20px] border border-white/15 bg-slate-950 shadow-lg ${
                            layoutMode === "speaker" && !isPinned
                              ? "h-[180px] w-[260px] flex-shrink-0"
                              : "h-full w-full"
                          }`}
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

                          {/* Fallback Cosmic Avatar if stream is black/empty */}
                          <div className="pointer-events-none absolute inset-0 -z-10 flex flex-col items-center justify-center bg-slate-900">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-2xl font-bold text-white">
                              {peerDisplayName[0].toUpperCase()}
                            </div>
                          </div>

                          {/* Participant Name Badge */}
                          <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold backdrop-blur-xl text-white">
                            <MicIcon sx={{ fontSize: 13, color: "#34d399" }} />
                            <span className="max-w-[130px] sm:max-w-[180px] truncate">
                              {peerDisplayName}
                            </span>
                          </div>

                          {/* Pin / Spotlight Action in Top-Right */}
                          <button
                            onClick={() =>
                              setPinnedParticipant((prev) =>
                                prev === remotePeer.socketId
                                  ? null
                                  : remotePeer.socketId
                              )
                            }
                            className={`absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-xl transition ${
                              isPinned
                                ? "border-amber-400 bg-amber-400/20 text-amber-300"
                                : "border-white/15 bg-black/50 text-white/80 hover:bg-white/20"
                            }`}
                            title={
                              isPinned ? "Unpin Participant" : "Pin Participant"
                            }
                          >
                            {isPinned ? (
                              <PushPinIcon sx={{ fontSize: 14 }} />
                            ) : (
                              <PushPinOutlinedIcon sx={{ fontSize: 14 }} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
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

                  {/* Effects / Virtual Background Toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Tooltip title="Virtual Backgrounds & Camera Filters">
                      <IconButton
                        onClick={() => setShowEffectsModal(true)}
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

            {/* ================= ZOOM-STYLE PREMIUM CHAT PANEL ================= */}
            {showModal && (
              <aside className="relative z-30 flex w-full md:w-[360px] lg:w-[380px] flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] border border-white/15 bg-[#070e22]/95 shadow-2xl backdrop-blur-2xl transition-all duration-300">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                      <ChatIcon sx={{ fontSize: 16 }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Meeting Chat
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {videos.length + 1} participants in call
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={closeChat}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                    title="Close Chat"
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>

                {/* Zoom Recipient Banner: "To: Everyone" */}
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-slate-950/60 px-4 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <LockIcon sx={{ fontSize: 13, color: "#818cf8" }} />
                    <span className="text-slate-400">To:</span>
                    <span className="rounded-md border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 font-semibold text-indigo-200">
                      Everyone
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Public Chat
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
                              {item.data}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Clean Empty State */
                    <div className="flex h-full flex-col items-center justify-center text-center p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-indigo-400 mb-3 shadow-inner">
                        <EmojiEmotionsIcon sx={{ fontSize: 28 }} />
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        No messages yet
                      </h4>
                      <p className="mt-1 text-xs text-slate-400 max-w-[200px]">
                        Send a quick reaction or message to everyone in the
                        room.
                      </p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Zoom Quick Reaction Emojis Bar */}
                <div className="flex items-center justify-between border-t border-white/[0.08] bg-slate-950/40 px-3 py-1.5">
                  {["👍", "👏", "❤️", "😂", "🔥", "🎉", "🚀"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendMessage(emoji)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-sm transition hover:scale-125 hover:bg-white/10 active:scale-95"
                      title={`Send ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Zoom-style Message Input */}
                <div className="border-t border-white/10 bg-slate-950/80 p-3">
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
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          backgroundColor: "rgba(15, 23, 42, 0.8)",
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
                  </div>
                  <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-slate-500">
                    <span>Press Enter to send</span>
                    <span>Shift + Enter for new line</span>
                  </div>
                </div>
              </aside>
            )}
          </main>

          {/* ================= VIDEO BACKGROUND & EFFECTS MODAL ================= */}
          {showEffectsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
              <div className="relative flex w-full max-w-[680px] max-h-[90vh] flex-col overflow-hidden rounded-[26px] border border-white/20 bg-[#070e22]/95 p-6 shadow-2xl backdrop-blur-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                      <AutoFixHighIcon sx={{ fontSize: 20 }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Video Background & Effects
                      </h3>
                      <p className="text-xs text-slate-400">
                        Choose your real-time camera filter and virtual
                        ambiance
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowEffectsModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <CloseIcon sx={{ fontSize: 20 }} />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
                  {/* LIVE PREVIEW BOX */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Live Camera Preview
                      </span>
                      <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300 border border-purple-400/30">
                        Active: {VIDEO_EFFECTS[videoEffect]?.name}
                      </span>
                    </div>

                    <div
                      className="relative aspect-video w-full max-w-[380px] mx-auto overflow-hidden rounded-2xl border border-white/20 shadow-xl"
                      style={{
                        background:
                          virtualBg !== "none"
                            ? VIRTUAL_BACKGROUNDS[virtualBg]?.backdrop
                            : "#0f172a",
                      }}
                    >
                      <video
                        ref={(ref) => {
                          if (ref && window.localStream) {
                            ref.srcObject = window.localStream;
                          }
                        }}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                        style={{
                          filter: VIDEO_EFFECTS[videoEffect]?.filter || "none",
                        }}
                      />
                      <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        {username.trim() || "You"} (Preview)
                      </div>
                    </div>
                  </div>

                  {/* 1. CAMERA FILTERS & BLUR */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                      Camera Filter & Focus
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {Object.entries(VIDEO_EFFECTS).map(([id, effect]) => {
                        const isSelected = videoEffect === id;

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setVideoEffect(id)}
                            className={`flex flex-col items-start p-3 rounded-xl border text-left transition duration-200 active:scale-95 ${
                              isSelected
                                ? "border-purple-400 bg-purple-500/20 shadow-[0_0_15px_rgba(192,132,252,0.3)]"
                                : "border-white/10 bg-slate-900/60 hover:border-white/25 hover:bg-slate-900"
                            }`}
                          >
                            <span className="text-lg mb-1">{effect.icon}</span>
                            <span className="text-xs font-bold text-white">
                              {effect.name}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {effect.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. VIRTUAL BACKGROUND AMBIANCE */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                      Virtual Background Environment
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {Object.entries(VIRTUAL_BACKGROUNDS).map(([id, bg]) => {
                        const isSelected = virtualBg === id;

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setVirtualBg(id)}
                            className={`flex flex-col items-start p-3 rounded-xl border text-left transition duration-200 active:scale-95 ${
                              isSelected
                                ? "border-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                : "border-white/10 bg-slate-900/60 hover:border-white/25 hover:bg-slate-900"
                            }`}
                          >
                            <span className="text-lg mb-1">{bg.icon}</span>
                            <span className="text-xs font-bold text-white">
                              {bg.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end border-t border-white/10 pt-4">
                  <Button
                    variant="contained"
                    onClick={() => setShowEffectsModal(false)}
                    sx={{
                      borderRadius: "12px",
                      px: 3,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      background:
                        "linear-gradient(100deg, #c026d3 0%, #7c3aed 100%)",
                    }}
                  >
                    Done & Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
