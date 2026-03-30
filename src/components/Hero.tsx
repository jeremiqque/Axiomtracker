import { Link } from "react-router-dom";
import freepick from "../assets/freepick.png";
import younggirl from "../assets/younggirl.png";
import happyman from "../assets/happyman.png";
import closeup from "../assets/closeup.png";
import downright from "../assets/downright.png";

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 py-20 sm:py-0">
      {/* Background Image */}
      <img
        src={freepick}
        alt="background"
        className="absolute left-0 right-0 top-0 bottom-0 w-full h-full object-cover rounded-none sm:rounded-xl pointer-events-none"
      />

      {/* Overlay */}
      <div className="absolute left-0 right-0 top-0 bottom-0 bg-black/40 rounded-none sm:rounded-xl pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-white text-center space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full">

        {/* Top Badge */}
        <div className="bg-white text-black px-4 sm:px-6 py-2 rounded-full shadow-lg text-xs sm:text-sm">
          Welcome to Axiom Tracker
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight max-w-3xl px-4 md:px-0">
          Never Miss a <span className="text-blue-400">Certificate</span> <br />
          Expiry Again.
        </h1>

        {/* Description */}
        <p className="max-w-2xl text-gray-200 text-sm sm:text-base md:text-lg px-4 md:px-0 leading-relaxed">
          Smart certificate tracking that keeps your team compliant,
          certified, and audit-ready. Automated alerts, and real-time
          compliance dashboards in one powerful platform.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-4 px-4 md:px-0 w-full sm:w-auto">
          <Link to="/welcome" className="bg-white text-black px-6 py-3 rounded-xl font-medium shadow-md hover:opacity-90 transition w-full sm:w-auto text-center text-sm sm:text-base">
            Get Started
          </Link>

          <Link to="/create-account" className="bg-white text-black px-6 py-3 rounded-xl font-medium shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base">
            Learn How it Works
            <img src={downright} alt="" className="w-4 h-4" />
          </Link>
        </div>

        {/* Bottom Mini-card: split image group and text into separate siblings */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 sm:mt-8 w-full max-w-full px-4 sm:px-0">
          {/* Image group on a white pill background (separate from text) */}
          <div className="flex items-center bg-white rounded-full p-1 sm:p-2 shadow-sm">
            <span className="bg-white rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={younggirl}
                alt="users"
                className="w-full h-full object-cover"
              />
            </span>

            <span className="bg-white rounded-full -ml-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={happyman}
                alt="users"
                className="w-full h-full object-cover"
              />
            </span>

            <span className="bg-white rounded-full -ml-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={closeup}
                alt="users"
                className="w-full h-full object-cover"
              />
            </span>
          </div>

          {/* Text is a separate element beside the image group */}
          <div className="flex-1">
            <p className="text-white text-xs sm:text-sm leading-snug text-center sm:text-left">
              Track certifications, ensure compliance, and automate renewals effortlessly with Axiom Tracker
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}