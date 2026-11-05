import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import CloudinaryUploadTest from "./components/CloudinaryUploadTest";

import Landing from "./pages/Landing";
import PublicDiscover from "./pages/PublicDiscover";
import PublicTalentProfile from "./pages/PublicTalentProfile";

import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import HomePage from "./pages/Homepage";
import ProfilePage from "./pages/profile/ProfilePage";
import BrowsePage from "./pages/listings/BrowsePage";
import CreateListing from "./pages/listings/CreateListing";
import ListingDetails from "./pages/listings/ListingDetails";
import ExchangesPage from "./pages/exchanges/ExchangesPage";
import ProposeExchange from "./pages/exchanges/ProposeExchange";
import ExchangeDetails from "./pages/exchanges/ExchangeDetails";
import NotificationsPage from "./pages/notifications/NotificationsPage";

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading…</p>;

  return user ? children : <Navigate to="/welcome" />;
}

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/welcome" element={<Landing />} />
      <Route path="/discover" element={<PublicDiscover />} />
      <Route path="/talent/:id" element={<PublicTalentProfile />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cloudinary-test" element={<CloudinaryUploadTest />} />

      {/* Authenticated pages */}
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/listings/new" element={<CreateListing />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/exchanges" element={<ExchangesPage />} />
        <Route path="/exchanges/new" element={<ProposeExchange />} />
        <Route path="/exchanges/:id" element={<ExchangeDetails />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<main className="tr-not-found"><h1>That page wandered off.</h1><p>It may have moved, or the link may be out of date.</p><a href="/welcome">Back to TalentRealm ↗</a></main>} />
    </Routes>
  );
}
