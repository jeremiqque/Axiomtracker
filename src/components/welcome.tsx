import { Link } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-row">
      {/* Left Side – Background Image */}
      <div className="relative w-1/2 bg-black min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${privateImg})`,
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative h-full flex flex-col justify-between p-6 sm:p-12 text-white">
          {/* Top */}
          <div>
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-3 text-white">
              <img src={subtract} alt="Axiom Tracker Logo" className="w-6 h-6 sm:w-8 sm:h-8 invert" />
              <span className="hidden md:block text-lg sm:text-xl font-semibold">Axiom Tracker</span>
            </div>
            <Link to="/" className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white flex items-center gap-2 cursor-pointer">
              <span className="text-lg">←</span>
              <p className="hidden md:block underline text-xs sm:text-sm">Back to Website</p>
            </Link>
          </div>

          {/* Bottom tagline */}
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold leading-tight">
            Never Miss Your Credential
            <br />
            Renewal Again.
          </h1>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-col items-center justify-center px-6 sm:px-10 py-12 sm:py-16 w-1/2">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-10">
          Hi Welcome to <br /> Axiom Tracker
        </h1>

        {/* Login Button */}
        <Link
          to="/login"
          className="w-full max-w-sm bg-gray-200 text-black py-3 rounded-md mb-4 font-medium text-sm sm:text-base justify-center flex items-center"
        >
          Login
        </Link>

        {/* Create Account Button */}
        <Link
          to="/create-account"
          className="w-full max-w-sm bg-black text-white py-3 rounded-md font-medium flex items-center justify-center text-sm sm:text-base"
        >
          Create Account
        </Link>

        {/* Powered By */}
        <p className="mt-12 sm:mt-16 text-xs text-gray-600">
          Powered by <span className="font-semibold">AxiomBlack</span>
        </p>
      </div>
    </div>
  );
}
