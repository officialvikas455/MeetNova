
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";

import LandingPage from "./pages/landing.jsx";
import Authentication from "./pages/authentication.jsx";
import VideoMeetComponent from "./pages/VideoMeet.jsx";
import HomeComponent from "./pages/home.jsx";

import "./App.css";

import * as AuthContextJsx from "./contexts/AuthContext.jsx";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthContextJsx.AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/auth" element={<Authentication />} />
            <Route path="/home" element={<HomeComponent/>}></Route>
            <Route path="/history" element={<History/>}></Route>

            <Route path="/:url" element={<VideoMeetComponent />} />
          </Routes>
        </AuthContextJsx.AuthProvider>
      </Router>
    </div>
  );
}

export default App;
