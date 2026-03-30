import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface OtpVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export default function OtpVerificationPopup({ isOpen, onClose, email }: OtpVerificationPopupProps) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [message, setMessage] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const otpRefs = useRef<HTMLInputElement[]>([]);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // Only allow digits or empty
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down for backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };



  // Send OTP via backend API
  const sendOtp = async () => {
    setSendingOtp(true);
    setMessage("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the OTP received from backend
        localStorage.setItem("otp", data.otp);
        localStorage.setItem("otp_timestamp", Date.now().toString());

        setMessage("OTP sent successfully! Check your email.");
        setResendDisabled(true);
        setCountdown(60); // 60 seconds countdown
      } else {
        setMessage(data.error || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  // Initialize message when popup opens
  useEffect(() => {
    if (isOpen && email) {
      setMessage("Enter the 6-digit OTP sent to your email.");
    }
  }, [isOpen, email]);

  // Verify OTP
  const verifyOtp = async () => {
    setLoading(true);
    setMessage("");

    try {
      const storedOtp = localStorage.getItem("otp");
      const timestamp = localStorage.getItem("otp_timestamp");

      if (!storedOtp || !timestamp) {
        setMessage("OTP expired. Please request a new one.");
        return;
      }

      // Check if OTP is expired (5 minutes)
      const now = Date.now();
      const otpTime = parseInt(timestamp);
      if (now - otpTime > 5 * 60 * 1000) {
        setMessage("OTP expired. Please request a new one.");
        localStorage.removeItem("otp");
        localStorage.removeItem("otp_timestamp");
        return;
      }

      if (otp.join("") === storedOtp) {
        // Clear OTP data
        localStorage.removeItem("otp");
        localStorage.removeItem("otp_timestamp");

        // Navigate to success page
        navigate("/success");
      } else {
        setMessage("Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-30 flex items-center justify-center z-[1000] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-700 mb-6 leading-relaxed">
          We've sent a 6-digit OTP to <strong className="text-gray-900">{email}</strong>
        </p>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Enter OTP
          </label>
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (el) otpRefs.current[index] = el;
                }}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                maxLength={1}
              />
            ))}
          </div>
        </div>

        {message && (
          <p className={`text-sm mb-6 p-3 rounded-lg ${
            message.includes("successfully") || message.includes("Invalid") || message.includes("expired") || message.includes("failed")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}>
            {message}
          </p>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={verifyOtp}
            disabled={loading || otp.some(digit => digit === "")}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          <button
            onClick={sendOtp}
            disabled={sendingOtp || resendDisabled}
            className="px-6 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            {sendingOtp ? "Sending..." : resendDisabled ? `Resend in ${countdown}s` : "Resend OTP"}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Didn't receive the email? Check your spam folder or click "Resend OTP"
        </p>
      </div>
    </div>
  );
}