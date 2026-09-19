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
              radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.28), transparent 38%),
              radial-gradient(circle at 85% 75%, rgba(139, 92, 246, 0.24), transparent 38%),
              linear-gradient(180deg, rgba(5, 8, 31, 0.90) 0%, rgba(7, 11, 43, 0.95) 100%),
              url("/images/cosmic-bg.jpg")
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          {/* ================= BACKGROUND EFFECTS ================= */}

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-48 right-[-100px] h-[600px] w-[600px] rounded-full bg-purple-700/25 blur-[130px]" />
            <div className="absolute bottom-[-250px] left-[-150px] h-[600px] w-[600px] rounded-full bg-blue-700/20 blur-[130px]" />
            <div className="absolute top-[35%] left-[45%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

            {/* Stars */}
            <div className="absolute top-[8%] left-[35%] h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_12px_#60a5fa]" />
            <div className="absolute top-[22%] left-[72%] h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc]" />
            <div className="absolute top-[35%] left-[12%] h-1 w-1 rounded-full bg-blue-400" />
            <div className="absolute bottom-[30%] right-[15%] h-1 w-1 rounded-full bg-purple-400" />
            <div className="absolute bottom-[15%] left-[30%] h-1 w-1 rounded-full bg-blue-400" />

            {/* Diagonal ambient light */}
            <div className="absolute -top-32 right-[12%] h-[700px] w-[90px] rotate-[32deg] bg-gradient-to-b from-purple-500/40 via-purple-600/10 to-transparent blur-2xl" />

            {/* Subtle Grid */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "70px 70px",
              }}
            />
          </div>

          {/* ================= NAVBAR ================= */}

          <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-10 lg:px-12 border-b border-white/[0.07] bg-slate-950/40 backdrop-blur-md">
            {/* Left: Back + Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.12] hover:text-white"
                title="Leave lobby and return to home"
              >
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                <span className="hidden sm:inline">Leave Lobby</span>
              </button>

              <div className="h-4 w-px bg-white/15 hidden sm:block" />

              <Logo size="sm" to="/home" subtitle="MEETING LOBBY" />
            </div>

            {/* Right: Room info + Encrypted Status */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Room pill with copy link */}
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/70 px-3.5 py-1.5 backdrop-blur-xl shadow-sm">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  Room
                </span>
                <span className="max-w-[140px] sm:max-w-[200px] truncate text-xs font-semibold text-indigo-200 font-mono">
                  {meetingCode}
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
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
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>

              {/* Security badge */}
              <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                <span className="text-xs font-medium text-emerald-300">
                  Encrypted
                </span>
                <SecurityIcon className="text-emerald-400" sx={{ fontSize: 15 }} />
              </div>
            </div>
          </header>

          {/* ================= MAIN LOBBY CARD ================= */}

          <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6 md:px-8 lg:px-12">
            <div className="relative flex w-full max-w-[1240px] flex-col overflow-hidden rounded-[28px] sm:rounded-[32px] border border-white/15 bg-slate-900/55 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8 lg:flex-row lg:p-10 gap-8 lg:gap-12 items-center">
              {/* Internal ambient glow */}
              <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

              {/* ================= LEFT COLUMN: DETAILS & FORM ================= */}

              <div className="relative z-10 flex w-full flex-1 flex-col justify-center">
                <div className="max-w-[500px] w-full mx-auto lg:mx-0">
                  {/* Category Pill */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" />
                    MeetNova Conference
                  </div>

                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[46px] leading-[1.15]">
                    Ready to join?
                  </h1>

                  <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-400">
                    Check your camera and audio, set your display name, and step
                    into the meeting.
                  </p>

                  {/* Permissions Warning Callout (if both blocked) */}
                  {!videoAvailable && !audioAvailable && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                      <WarningAmberIcon
                        sx={{ fontSize: 18, color: "#f59e0b", flexShrink: 0, mt: "1px" }}
                      />
                      <span>
                        Camera and microphone access are blocked in your browser.
                        You can still join to listen or allow permissions in the
                        address bar.
                      </span>
                    </div>
                  )}

                  {/* Username Form */}
                  <div className="mt-7 space-y-4">
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
                            backgroundColor: "rgba(15,23,42,0.65)",
                            color: "white",
                            fontSize: "1rem",
                            height: "60px",
                            "& fieldset": {
                              borderColor: "rgba(148,163,184,0.35)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(129,140,248,0.7)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#6366f1",
                              borderWidth: "1.5px",
                              boxShadow: "0 0 15px rgba(99,102,241,0.25)",
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
                        <span>{username.trim() ? "Ready" : "Name required"}</span>
                      </div>
                    </div>

                    {/* Quick Media Pre-join Settings */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {/* Mic Quick Toggle */}
                      <button
                        type="button"
                        onClick={handleAudio}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition border ${
                          audio === true
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                        }`}
                        title="Click to toggle microphone"
                      >
                        {audio === true ? (
                          <>
                            <MicIcon sx={{ fontSize: 16 }} />
                            <span>Mic is On</span>
                            {audioLevel > 5 && (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </>
                        ) : (
                          <>
                            <MicOffIcon sx={{ fontSize: 16 }} />
                            <span>Mic is Muted</span>
                          </>
                        )}
                      </button>

                      {/* Camera Quick Toggle */}
                      <button
                        type="button"
                        onClick={handleVideo}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition border ${
                          video === true
                            ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                        }`}
                        title="Click to toggle camera"
                      >
                        {video === true ? (
                          <>
                            <VideocamIcon sx={{ fontSize: 16 }} />
                            <span>Camera is On</span>
                          </>
                        ) : (
                          <>
                            <VideocamOffIcon sx={{ fontSize: 16 }} />
                            <span>Camera is Off</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Connect Button */}
                    <Button
                      variant="contained"
                      onClick={connect}
                      disabled={!username.trim()}
                      fullWidth
                      sx={{
                        mt: 2,
                        height: "62px",
                        borderRadius: "16px",
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
                      <span>Join Meeting</span>
                      <KeyboardDoubleArrowRightIcon
                        sx={{
                          marginLeft: "auto",
                          marginRight: "4px",
                        }}
                      />
                    </Button>

                    {/* Features row */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400">
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
                      <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
                        <span>• Ultra-Low Latency</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= RIGHT COLUMN: VIDEO PREVIEW ================= */}

              <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center">
                <div className="relative w-full max-w-[600px]">
                  {/* Subtle outer gradient halo */}
                  <div className="absolute -inset-4 rounded-[30px] bg-gradient-to-r from-blue-600/15 via-purple-600/25 to-fuchsia-600/15 blur-2xl pointer-events-none" />

                  {/* 16:9 Video Box */}
                  <div
                    id="lobby-video-preview"
                    className="relative aspect-video w-full overflow-hidden rounded-[24px] border border-white/20 bg-slate-950 shadow-[0_25px_70px_rgba(0,0,0,0.65)]"
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
                        {/* Ambient decorative circle */}
                        <div className="absolute h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

                        {/* Avatar */}
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

                          {/* Voice pulse ring */}
                          {audio && audioLevel > 15 && (
                            <span className="absolute -inset-2.5 rounded-full border border-emerald-400/50 animate-ping pointer-events-none" />
                          )}
                        </div>

                        {/* Camera off label */}
                        <div className="mt-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
                          <VideocamOffIcon
                            sx={{ fontSize: 15 }}
                            className="text-rose-400"
                          />
                          <span>Camera is turned off</span>
                        </div>
                      </div>
                    )}

                    {/* Gradient Overlay for Controls contrast */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-15" />

                    {/* Top Floating Badge: Username & Live Audio Activity */}
                    <div className="absolute left-4 top-4 z-20 flex items-center gap-2.5 rounded-xl border border-white/15 bg-slate-950/75 px-3 py-1.5 backdrop-blur-xl shadow-lg">
                      {/* Audio indicator */}
                      {audio ? (
                        <div className="flex items-center gap-1" title="Microphone Active">
                          {audioLevel > 5 ? (
                            <div className="flex items-end gap-0.5 h-3.5">
                              <span
                                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{
                                  height: `${Math.max(4, Math.min(14, (audioLevel / 100) * 16))}px`,
                                }}
                              />
                              <span
                                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{
                                  height: `${Math.max(6, Math.min(14, (audioLevel / 100) * 20))}px`,
                                }}
                              />
                              <span
                                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{
                                  height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 12))}px`,
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

                      <span className="max-w-[130px] sm:max-w-[200px] truncate text-xs font-semibold text-white">
                        {username.trim() || "You"}
                      </span>
                    </div>

                    {/* Top-Right: Fullscreen Toggle */}
                    <Tooltip
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
                    >
                      <button
                        onClick={handleFullscreen}
                        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-white backdrop-blur-xl transition hover:bg-white/20"
                      >
                        {isFullscreen ? (
                          <FullscreenExitIcon sx={{ fontSize: 19 }} />
                        ) : (
                          <FullscreenIcon sx={{ fontSize: 19 }} />
                        )}
                      </button>
                    </Tooltip>

                    {/* Bottom Floating Media Dock */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full border border-white/20 bg-slate-950/80 px-4 py-2 backdrop-blur-xl shadow-2xl">
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
                            width: "50px",
                            height: "50px",
                            color: audio ? "#34d399" : "#fb7185",
                            background: audio
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(244, 63, 94, 0.18)",
                            border: audio
                              ? "1px solid rgba(52, 211, 153, 0.4)"
                              : "1px solid rgba(244, 63, 94, 0.45)",
                            "&:hover": {
                              background: audio
                                ? "rgba(16, 185, 129, 0.25)"
                                : "rgba(244, 63, 94, 0.3)",
                              transform: "scale(1.05)",
                            },
                            transition: "all 0.2s ease",
                            boxShadow:
                              audio && audioLevel > 15
                                ? "0 0 15px rgba(52, 211, 153, 0.4)"
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
                            width: "50px",
                            height: "50px",
                            color: video ? "#a5b4fc" : "#fb7185",
                            background: video
                              ? "rgba(99, 102, 241, 0.15)"
                              : "rgba(244, 63, 94, 0.18)",
                            border: video
                              ? "1px solid rgba(129, 140, 248, 0.4)"
                              : "1px solid rgba(244, 63, 94, 0.45)",
                            "&:hover": {
                              background: video
                                ? "rgba(99, 102, 241, 0.25)"
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
                  <div className="mt-3.5 flex items-center justify-center gap-2 text-xs text-slate-400">
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
                        ? "Camera and microphone are active"
                        : video && !audio
                        ? "Microphone is muted"
                        : !video && audio
                        ? "Camera is off • Microphone is active"
                        : "Microphone and camera are turned off"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* ================= FOOTER ================= */}

          <footer className="relative z-10 py-3 text-center text-xs text-slate-500 border-t border-white/[0.05]">
            MeetNova • Next-Generation Video Collaboration
          </footer>
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
