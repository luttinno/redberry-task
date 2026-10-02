import { useCallback } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  type Location as RouterLocation,
} from "react-router-dom";
import { AuthModal } from "./features/auth/components/AuthModal";
import { useAuth } from "./features/auth/context/useAuth";
import HomePage from "./features/home/HomePage";
import MovieDetailsPage from "./features/movies/MovieDetailsPage";
import ProfilePage from "./features/profile/ProfilePage";
import TicketsPage from "./features/profile/TicketsPage";
import BookingModal from "./features/booking/BookingModal";
import SessionsPage from "./features/sessions/SessionsPage";
import { useFilterOptions } from "./features/sessions/useFilterOptions";
import "./App.css";

function App() {
  useFilterOptions();
  const location = useLocation();
  const backgroundLocation = (
    location.state as { backgroundLocation?: RouterLocation } | null
  )?.backgroundLocation;
  const {
    token,
    status,
    modal,
    notice,
    openAuth: showAuth,
    closeAuth: dismissAuth,
    clearNotice,
    retrySessionRestore,
  } = useAuth();

  const isOpen = modal !== null;
  const mode = modal === "register" ? "register" : "login";

  const closeAuth = useCallback(() => {
    dismissAuth();
  }, [dismissAuth]);

  return (
    <div className="relative min-h-screen">
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
        <Route path="/sessions/:sessionId/seats" element={<BookingModal />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route path="/sessions/:sessionId/seats" element={<BookingModal />} />
        </Routes>
      )}

      {notice && !isOpen && (
        <aside className="session-notice" role="status">
          <span>{notice}</span>
          {token && status !== "authenticated" && (
            <button onClick={() => void retrySessionRestore()}>Retry</button>
          )}
          <button
            className="notice-close"
            aria-label="Dismiss message"
            onClick={clearNotice}
          >
            ×
          </button>
        </aside>
      )}

      {isOpen && (
        <AuthModal mode={mode} onClose={closeAuth} onSwitchMode={showAuth} />
      )}
    </div>
  );
}

export default App;
