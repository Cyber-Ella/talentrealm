
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";
import { SkeletonGrid } from "./components/Skeleton";

import Landing from "./pages/Landing";
import PublicDiscover from "./pages/PublicDiscover";
import PublicTalentProfile from "./pages/PublicTalentProfile";
import PublicStudentProfile from "./pages/PublicStudentProfile";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

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

// Authentication guard
function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <SkeletonGrid count={3} />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Public routes
function PublicRoutes() {
  return (
    <>
      <Route path="/welcome" element={<Landing />} />
      <Route path="/discover" element={<PublicDiscover />} />
      <Route path="/talent/:id" element={<PublicTalentProfile />} />
      <Route path="/students/:uid" element={<PublicStudentProfile />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </>
  );
}

// Application routes
function AppLayout() {
  return (
    <Protected>
      <Layout />
    </Protected>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/welcome" element={<Landing />} />
      <Route path="/discover" element={<PublicDiscover />} />
      <Route path="/talent/:id" element={<PublicTalentProfile />} />
      <Route path="/students/:uid" element={<PublicStudentProfile />} />

      {/* Authentication */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <Protected>
            <Onboarding />
          </Protected>
        }
      />

      {/* Authenticated application */}
      <Route element={<AppLayout />}>
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

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
