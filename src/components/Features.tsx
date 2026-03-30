// import React from "react";
import subtract from "../assets/subtract.png";
import feature1 from "../assets/1.png";
import feature2 from "../assets/2.png";
import feature3 from "../assets/3.png";


const Features = () => {
  return (
    <section className="bg-black text-white px-4 sm:px-6 md:px-16 py-12 sm:py-16 md:py-20">
            <img src={subtract} alt="logo" className="w-8 sm:w-10 mx-auto invert" /> <br/>
      <h2 className="text-center text-xl sm:text-2xl font-bold mb-8 sm:mb-12">Axiom Tracker Features</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        <div className="bg-white text-black rounded-lg shadow-lg">
          <img
            src={feature1}
            className="w-full rounded-t-lg"
          />
          <div className="p-4 sm:p-5">
            <h3 className="font-semibold text-base sm:text-lg mb-2">Smart Credentials Tracking</h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              Track all employee credentials in one place and get automatic alerts before they expire.
            </p>
          </div>
        </div>

        <div className="bg-white text-black rounded-lg shadow-lg">
          <img
            src={feature2}
            className="w-full rounded-t-lg"
          />
          <div className="p-4 sm:p-5">
            <h3 className="font-semibold text-base sm:text-lg mb-2">Intelligent Notifications</h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              Get smart, multi-channel alerts with customizable reminders and automatic escalation to the right people.
            </p>
          </div>
        </div>

        <div className="bg-white text-black rounded-lg shadow-lg">
          <img
            src={feature3}
            className="w-full rounded-t-lg"
          />
          <div className="p-4 sm:p-5">
            <h3 className="font-semibold text-base sm:text-lg mb-2">Real-Time Analytics</h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              Monitor compliance with live dashboards and predictive insights to identify risks early and track trends across teams.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Features;