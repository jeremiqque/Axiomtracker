// import React from "react";
import subtract from "../assets/subtract.png";

const HowItWorks = () => {
  return (
    <section className="px-4 sm:px-6 md:px-16 py-12 sm:py-16">
      <img src={subtract} alt="logo" className="w-8 sm:w-10 mx-auto" /> <br/>
      <h2 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-[#282828]">How Does Axiom Tracker Work?</h2>
      <p className="text-center text-xs sm:text-sm md:text-base text-gray-600 mt-2 px-4">Get started in minutes, not months. Our simple three-step process gets you compliant fast.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">

        {/* Step 1 */}
        <div className="border rounded-lg p-4 sm:p-6 text-center shadow-sm">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto flex items-center justify-center bg-black text-white rounded-full text-xl sm:text-2xl font-bold mb-3">
            01
          </div>

          <h4 className="font-semibold text-base sm:text-lg mb-2">Upload Certifications</h4>
          <p className="text-gray-600 text-xs sm:text-sm">
            Upload all employee certificates easily into the dashboard in minutes.
          </p>
        </div>

        {/* Step 2 */}
        <div className="border rounded-lg p-4 sm:p-6 text-center shadow-sm">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto flex items-center justify-center bg-black text-white rounded-full text-xl sm:text-2xl font-bold mb-3">
            02
          </div>

          <h4 className="font-semibold text-base sm:text-lg mb-2">Set Auto-Renew Alerts</h4>
          <p className="text-gray-600 text-xs sm:text-sm">
            Get notified before any certificate expires so you never miss a deadline.
          </p>
        </div>

        {/* Step 3 */}
        <div className="border rounded-lg p-4 sm:p-6 text-center shadow-sm">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto flex items-center justify-center bg-black text-white rounded-full text-xl sm:text-2xl font-bold mb-3">
            03
          </div>

          <h4 className="font-semibold text-base sm:text-lg mb-2">Stay Compliant</h4>
          <p className="text-gray-600 text-xs sm:text-sm">
            Avoid penalty risks and compliance issues with automated reminders.
          </p>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;