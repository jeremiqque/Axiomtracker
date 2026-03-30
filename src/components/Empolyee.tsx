import { useState } from "react";
import { Link } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";

export default function InviteEmployees() {
  const [emails, setEmails] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const sendInvitations = async () => {
    setLoading(true);
    setMessage("");

    try {
      const filteredEmails = emails.filter(email => email.trim());

      if (filteredEmails.length === 0) {
        setMessage("Please enter at least one email address.");
        return;
      }

      const response = await fetch('http://localhost:3001/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: filteredEmails }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || "Invitations sent successfully!");
        // Clear the email fields after successful send
        setEmails([""]);
      } else {
        setMessage(data.error || "Failed to send invitations.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to send invitations. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-row">
      {/* Left Side */}
      <div className="relative hidden md:block md:w-1/2 bg-black min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${privateImg})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative h-full flex flex-col justify-between p-6 sm:p-12 text-white">
          <div>
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-3 text-white">
              <img src={subtract} alt="Axiom Tracker Logo" className="w-6 h-6 sm:w-8 sm:h-8 invert" />
              <span className="hidden md:block text-lg sm:text-xl font-semibold">Axiom Tracker</span>
            </div>

            <Link
              to="/"
              className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white flex items-center gap-2 cursor-pointer"
            >
              <span className="text-lg">←</span>
              <p className="hidden md:block underline text-xs sm:text-sm">Back to Website</p>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold leading-tight">
            Never Miss Your Credential
            <br />
            Renewal Again.
          </h1>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col justify-center px-6 md:px-16 lg:px-20">
        <h2 className="text-2xl font-bold text-center">Invite Employees</h2>
        <p className="text-sm mt-1 text-gray-600 text-center">
          Invite employees to manage credentials
        </p>

        {/* INPUTS */}
        <div className="mt-8">
          {emails.map((email, index) => (
            <div key={index} className="mb-4">
              <label className="text-sm font-medium">Employee Email {index + 1}</label>
              <div className="flex gap-2 mt-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  className="flex-1 bg-gray-100 px-4 py-3 rounded-md outline-none"
                />
                {emails.length > 1 && (
                  <button
                    onClick={() => removeEmailField(index)}
                    className="px-3 py-3 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Another Employee Button */}
        <button
          onClick={addEmailField}
          className="bg-white border px-4 py-2 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white"
        >
          Add Another Employee
        </button>

        {message && (
          <p className="mt-4 text-sm text-gray-700">{message}</p>
        )}

        {/* Invite Button */}
        <button
          onClick={sendInvitations}
          disabled={loading}
          className="bg-white border px-4 py-3 mt-10 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white"
        >
          {loading ? "Sending..." : "Invite"}
        </button>
      </div>
    </div>
  );
}