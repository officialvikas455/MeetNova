
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import LandingPage from "./pages/landing.jsx";
import Authentication from "./pages/authentication.jsx";
import VideoMeetComponent from "./pages/VideoMeet.jsx";
import HomeComponent from "./pages/home.jsx";
import History from "./pages/history.jsx";

import "./App.css";

import * as AuthContextJsx from "./contexts/AuthContext.jsx";

const theme = createTheme({
  typography: {
    fontFamily: "'Telex', sans-serif",
    allVariants: {
      fontFamily: "'Telex', sans-serif",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Router>
          <AuthContextJsx.AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route path="/auth" element={<Authentication />} />
              <Route path="/home" element={<HomeComponent />}></Route>
              <Route path="/history" element={<History />}></Route>

              <Route path="/:url" element={<VideoMeetComponent />} />
            </Routes>
          </AuthContextJsx.AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
