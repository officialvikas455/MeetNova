import "../App.css";

import { Link, useNavigate } from "react-router-dom";

import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import GroupsIcon from "@mui/icons-material/Groups";
import SecurityIcon from "@mui/icons-material/Security";
import BoltIcon from "@mui/icons-material/Bolt";

import Logo from "../components/Logo.jsx";

export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      {/* ================= NAVBAR ================= */}

      <nav className="landingNavbar">
        <Logo to="/" subtitle="Connect • Collaborate • Create" />

        <div className="navlist">
          <p onClick={() => router("/dfjkikdf")}>Join as Guest</p>

          <Link to="/auth" className="navLogin">
            Login
          </Link>

          <Link to="/auth" className="navRegister">
            Register
          </Link>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}

      <main className="landingMainContent">
        {/* ================= LEFT CONTENT ================= */}

        <div className="landingText">
          <div className="smallBadge">
            <span className="pulseDot"></span>
            The future of video meetings
          </div>

          <h1>
            Connect with
            <span className="highlight">your loved ones.</span>
          </h1>

          <p>
            Bring your team, friends and family closer with seamless HD video
            calls. Meet from anywhere, anytime.
          </p>

          {/* ================= CTA BUTTONS ================= */}

          <div className="heroButtons">
            <Link className="ctaButton" to="/auth">
              Get Started
              <KeyboardDoubleArrowRightIcon />
            </Link>

            <button className="guestButton" onClick={() => router("/dfjkikdf")}>
              Join as Guest
            </button>
          </div>

          {/* ================= TRUST SECTION ================= */}

          <div className="trustedSection">
            <div className="avatars">
              <div className="avatar avatar1">A</div>

              <div className="avatar avatar2">R</div>

              <div className="avatar avatar3">V</div>

              <div className="avatar avatar4">S</div>
            </div>

            <div>
              <div className="stars">★★★★★</div>

              <span>Trusted by teams everywhere</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="landingImage">
          {/* Background Glow */}

          <div className="heroGlow"></div>

          {/* Video Preview */}

          <div className="videoPreview">
            <img src="/images/mobile.png" alt="Video meeting preview" />

            {/* ================= ONLINE BADGE ================= */}

            <div className="onlineBadge">
              <span></span>
              Meeting is live
            </div>

            {/* ================= PARTICIPANT CARD ================= */}

            <div className="participantCard">
              <div className="miniAvatar">V</div>

              <div>
                <strong>Vikas</strong>

                <span>is speaking...</span>
              </div>

              {/* Sound Animation */}

              <div className="soundBars">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= FEATURES ================= */}

      <section className="featuresSection">
        {/* HD VIDEO */}

        <div className="featureCard">
          <div className="featureIcon">
            <VideoCallIcon />
          </div>

          <div>
            <h3>HD Video Calls</h3>

            <p>Crystal-clear video meetings with smooth communication.</p>
          </div>
        </div>

        {/* COLLABORATION */}

        <div className="featureCard">
          <div className="featureIcon">
            <GroupsIcon />
          </div>

          <div>
            <h3>Real-time Collaboration</h3>

            <p>Connect with your team, friends and family instantly.</p>
          </div>
        </div>

        {/* SECURITY */}

        <div className="featureCard">
          <div className="featureIcon">
            <SecurityIcon />
          </div>

          <div>
            <h3>Secure Meetings</h3>

            <p>Your conversations stay private and protected.</p>
          </div>
        </div>

        {/* SPEED */}

        <div className="featureCard">
          <div className="featureIcon">
            <BoltIcon />
          </div>

          <div>
            <h3>Fast & Simple</h3>

            <p>Create or join meetings in just a few seconds.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
