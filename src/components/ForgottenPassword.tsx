import { useState } from "react";
import { Link } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";
import supabase from "../lib/supabase";

export default function ForgottenPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) {
      setMessage("Please enter your email");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT SIDE */}
      <div className="relative hidden md:block md:w-1/2 bg-black">
        <img
          src={privateImg}
          alt="background"
          className="absolute inset-0 bg-cover bg-center"
        />

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
      <div className="flex flex-col items-center justify-center px-6 sm:px-10 py-12 sm:py-16 w-full md:w-1/2">
        {sent ? (
          <div className="w-full max-w-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 grid place-items-center mx-auto">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-sm text-gray-600">
              We sent a password reset link to <span className="font-medium text-gray-900">{email}</span>.
              Click the link in the email to set a new password.
            </p>
            <p className="text-xs text-gray-400">Didn’t receive it? Check your spam folder.</p>
            <Link to="/login" className="block mt-4 text-sm font-semibold text-black hover:underline">
              Back to Sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold">Forgot Password?</h2>
            <p className="text-sm mt-1 text-gray-600">
              Let’s get you back into your account.
            </p>

            <div className="mt-8 w-full max-w-sm">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full bg-gray-100 px-4 py-3 rounded-md mt-2 outline-none"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full max-w-sm bg-black text-white py-3 rounded-md mt-6 disabled:opacity-50"
            >
              {loading ? "Please Wait..." : "Continue"}
            </button>

            {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

            <div className="text-center text-xs sm:text-sm text-gray-600 mt-8">
              Remembered your password?{" "}
              <Link to="/login" className="font-semibold text-black hover:underline">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}