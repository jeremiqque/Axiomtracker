import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";
import mailsent from "../assets/mailsent.png";

export default function ResetConfirm() {
  const [storedEmail, setStoredEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("reset_email");
    if (email) {
      setStoredEmail(email);
    }
  }, []);

  const handleSendEmail = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('http://localhost:3001/api/send-reset-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: storedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to send reset email');
        return;
      }

      // Navigate to success page
      navigate('/success');
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="min-h-screen flex flex-row">
        <div className="relative hidden md:block md:w-1/2 bg-black">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${privateImg})` }}
          >
            <div className="absolute inset-0 bg-black/60" />
          </div>

          <div className="relative h-full flex flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-3">
              <img
                src={subtract}
                alt="Axiom Tracker"
                className="w-8 h-8 invert"
              />
              <span className="text-xl font-semibold">Axiom Tracker</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight">
              Never Miss Your Credential
              <br />
              Renewal Again.
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-6 py-16 text-center w-full md:w-1/2">
          <img src={mailsent} alt="mail sent" className="w-40 mx-auto" />

          <h2 className="mt-8 text-2xl font-bold">
            Ready to Send Password Reset Email?
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Click continue to send the reset link to {storedEmail}
          </p>

          <button
            onClick={handleSendEmail}
            disabled={loading}
            className="w-full max-w-sm bg-black text-white py-3 rounded-md mt-6 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Continue"}
          </button>

          {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
        </div>
      </div>
    </div>
  );
}
