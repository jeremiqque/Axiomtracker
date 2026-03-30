// import React from "react";
import subtract from "../assets/subtract.png";


const Footer = () => {
  return (
    <footer className="bg-black text-white px-4 sm:px-6 md:px-16 py-8 sm:py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">

        <div>
          <img
            src={subtract}
            alt="logo"
            className="w-8 sm:w-10 invert"
          />
          <p className="text-gray-400 mt-3 text-xs sm:text-sm leading-relaxed">
           Let’s make your estate safer and smarter.
          Contact us for bulk estate discounts or multi-location deployment.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-sm sm:text-base">QUICK LINKS</h3>
          <ul className="text-gray-400 text-xs sm:text-sm space-y-1">
            <li>Home</li> <br />
            <li>Features</li> <br />
            <li>FAQs</li> <br/>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-sm sm:text-base">CONTACT US</h3>
          <p className="text-gray-400 text-xs sm:text-sm">hello@axiomtracker.com</p>

        </div>

        <div>
          <h3 className="font-semibold mb-2 text-sm sm:text-base">Legal</h3>
          <ul className="text-gray-400 text-xs sm:text-sm space-y-1">
            <li>Terms of Service</li> <br/>
            <li>Privacy Policy</li> <br/>
          </ul>
        </div>

      </div>

      <p className="text-center text-gray-500 mt-8 sm:mt-10 text-xs sm:text-sm">
        © 2025 Axiom Tracker. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;