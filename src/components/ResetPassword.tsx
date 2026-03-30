import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";

export default function InviteEmployees() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Get email from localStorage
    const emailParam = localStorage.getItem("reset_email");

    if (emailParam) {
      setEmail(emailParam);
      // For simplicity, set a dummy token or handle without token
      setToken("dummy_token");
    } else {
      setMessage("No email found. Please go back and enter your email.");
    }
  }, []);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setMessage("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (!token || !email) {
      setMessage("Invalid reset link. Please request a new password reset.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to reset password');
        return;
      }

      setMessage("Password reset successful");

      setTimeout(() => {
        navigate("/resetconfirm");
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT SIDE */}
      <div className="relative hidden md:block md:w-1/2 bg-black min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${privateImg})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <div>
            <div className="absolute top-6 left-6 flex items-center gap-3 text-white">
              <img src={subtract} alt="Axiom Tracker Logo" className="w-8 h-8 invert" />
              <span className="hidden md:block text-xl font-semibold">Axiom Tracker</span>
            </div>

            <Link
              to="/"
              className="absolute top-6 right-6 text-white flex items-center gap-2 cursor-pointer"
            >
              <span className="text-lg">←</span>
              <p className="hidden md:block underline text-sm">Back to Website</p>
            </Link>
          </div>

          <div className="absolute bottom-10 left-6 text-white">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Never Miss Your Credential <br /> Renewal Again.
            </h1>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 lg:w-1/2 bg-white flex items-center justify-center px-6 sm:px-10 py-6 sm:py-10 md:py-12 min-h-screen">
        <div className="w-full max-w-md space-y-6 sm:space-y-10">
          <div>
            <h2 className="text-2xl font-bold">Reset Password</h2>
            <p className="text-sm mt-2 text-gray-600">
              Let’s get you back into your account.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-100 px-4 py-3 rounded-md outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-100 px-4 py-3 rounded-md outline-none"
            />
          </div>

          <div className="text-xs text-gray-600">
            Password must include at least 8 characters, including numbers and symbols
          </div>

          {message && (
            <p className="text-sm text-gray-700">{message}</p>
          )}

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-md disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <div className="text-center text-xs sm:text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/resetcomfirm" className="font-semibold text-black hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}