import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";
import supabase from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auto-exchanges the recovery code from the URL on load.
    // onAuthStateChange fires PASSWORD_RECOVERY once that's done.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // session is now established — form is already visible
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
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

        <div className="relative h-full flex flex-col p-12 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={subtract} alt="Axiom Tracker Logo" className="w-8 h-8 invert" />
              <span className="text-xl font-semibold">Axiom Tracker</span>
            </div>
            <Link to="/" className="text-white flex items-center gap-2">
              <span className="text-lg">←</span>
              <p className="underline text-sm">Back to Website</p>
            </Link>
          </div>

          <div className="mt-auto pb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Never Miss Your Credential <br /> Renewal Again.
            </h1>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-6 sm:px-10 py-12 min-h-screen">
        <div className="w-full max-w-sm">
          {done ? (
            /* ── Success state ── */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 grid place-items-center mx-auto">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Password updated!</h2>
              <p className="text-sm text-gray-600">Your password has been reset successfully.</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-black text-white py-3 rounded-md mt-4 hover:bg-gray-800 transition-colors"
              >
                Sign in
              </button>
            </div>
          ) : (
            /* ── Reset form ── */
            <>
              <h2 className="text-2xl font-bold">Create new password</h2>
              <p className="text-sm mt-1 text-gray-600">
                Enter and confirm your new password below.
              </p>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-100 px-4 py-3 rounded-md mt-2 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-100 px-4 py-3 rounded-md mt-2 outline-none"
                  />
                </div>

                <p className="text-xs text-gray-400">Minimum 8 characters.</p>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
                >
                  {loading ? "Saving…" : "Reset Password"}
                </button>
              </div>

              <div className="text-center text-sm text-gray-600 mt-8">
                Remembered your password?{" "}
                <Link to="/login" className="font-semibold text-black hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
