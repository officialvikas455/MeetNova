import React from "react";
import { Link } from "react-router-dom";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import "./Logo.css";

export default function Logo({
  size = "md",
  to,
  showSubtitle = true,
  subtitle = "CONNECT • MEET • GROW",
  showDot = true,
  className = "",
  onClick,
}) {
  const content = (
    <>
      <div className="meetnova-logo__icon-wrapper">
        <VideoCallIcon />
        {showDot && <span className="meetnova-logo__dot" />}
      </div>

      <div className="meetnova-logo__text">
        <h2 className="meetnova-logo__title">
          <span className="meetnova-logo__title-meet">Meet</span>
          <span className="meetnova-logo__title-nova">Nova</span>
        </h2>
        {showSubtitle && subtitle && (
          <span className="meetnova-logo__subtitle">{subtitle}</span>
        )}
      </div>
    </>
  );

  const containerClasses = [
    "meetnova-logo",
    `meetnova-logo--${size}`,
    to || onClick ? "meetnova-logo--clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={containerClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClasses} onClick={onClick}>
      {content}
    </div>
  );
}
