import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import FAQ from "./components/FAQ";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Welcome from "./components/welcome";
import CreateAccountPage from "./components/CreateAccount";
import Login from "./components/Login";
import Success from "./components/Success";
import Dashboard from "./components/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import Activities from "./components/Activities";
import Credentials from "./components/Credentials";
import Entity from "./components/Entity";
import Empolyee from "./components/Empolyee";
import AddEmployee from "./components/AddEmployee";
import AddCredentials from "./components/AddCredentials";
import CompanyCredentials from "./components/CompanyCredentials";
import ViewDetails from "./components/ViewDetails";
import ForgottenPassword from "./components/ForgottenPassword";
import ResetConfirm from "./components/ResetConfirm";
import ResetPassword from "./components/ResetPassword";
import Settings from "./components/Settings";
import supabase from "./lib/supabase";
import { useUserRole } from "./hooks/useUserRole";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole();
  if (loading) return null;
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function CredentialEditRoute({ children }: { children: React.ReactNode }) {
  const { canEditCredentials, loading } = useUserRole();
  if (loading) return null;
  return canEditCredentials ? <>{children}</> : <Navigate to="/dashboard/credentials" replace />;
}

function AppContent() {
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    checkInitialSession();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user');
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Protect dashboard routes
  useEffect(() => {
    if (!loading && !session && window.location.pathname.startsWith('/dashboard')) {
      navigate('/login');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="w-full min-h-screen">
            <Navbar />
            <Hero />
            <About />
            <HowItWorks />
            <Features />
            <FAQ />
            <CTA />
            <Footer />
          </div>
        }
      />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/create-account" element={<CreateAccountPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ForgottenPassword />} />
      <Route path="/success" element={<Success />} />
      <Route path="/resetconfirm" element={<ResetConfirm />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/invite" element={<Empolyee />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="activities" element={<Activities />} />
        <Route path="credentials" element={<Credentials />} />
        <Route path="entity" element={<Entity />} />
        <Route path="invite" element={<AdminRoute><Empolyee /></AdminRoute>} />
        <Route path="entity/add" element={<AdminRoute><AddEmployee /></AdminRoute>} />
        <Route path="credentials/new" element={<CredentialEditRoute><AddCredentials /></CredentialEditRoute>} />
        <Route path="credentials/company" element={<CredentialEditRoute><CompanyCredentials /></CredentialEditRoute>} />
        <Route path="credentials/view" element={<ViewDetails />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
