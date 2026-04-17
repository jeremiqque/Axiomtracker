import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import subtract from "../assets/subtract.png";

const NAV_LINKS = [
  { label: "Home",     section: "hero"      },
  { label: "Features", section: "features"  },
  { label: "FAQ",      section: "faq"       },
  { label: "Contact",  section: "contact"   },
];

const scrollTo = (section: string) => {
  const el = document.getElementById(section);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [active, setActive] = useState("hero");

  const closeMenu = () => setIsMenuOpen(false);

  // Highlight nav link based on scroll position
  useEffect(() => {
    const onScroll = () => {
      const sections = NAV_LINKS.map(l => document.getElementById(l.section));
      let current = "hero";
      sections.forEach(el => {
        if (el && window.scrollY >= el.offsetTop - 80) {
          current = el.id;
        }
      });
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="w-full bg-white shadow-sm fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo */}
        <button
          onClick={() => scrollTo("hero")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img src={subtract} alt="logo" className="w-9 h-9" />
          <h1 className="font-bold text-lg sm:text-xl">Axiom Tracker</h1>
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map(({ label, section }) => (
            <li key={section}>
              <button
                onClick={() => scrollTo(section)}
                className={`transition-colors cursor-pointer ${
                  active === section
                    ? "text-black font-semibold"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="border border-gray-200 px-4 py-2 rounded-md text-sm hover:bg-black hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/welcome"
            className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden w-10 h-10 flex flex-col justify-center items-center space-y-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`} />
          <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={closeMenu} />
      )}

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={closeMenu}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col pt-16 px-6 h-full space-y-2">
          {NAV_LINKS.map(({ label, section }) => (
            <button
              key={section}
              onClick={() => { closeMenu(); setTimeout(() => scrollTo(section), 300); }}
              className={`text-left py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                active === section
                  ? "bg-gray-100 text-black"
                  : "text-gray-500 hover:text-black hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="flex flex-col gap-3 pt-6 border-t border-gray-100 mt-4">
            <Link
              to="/login"
              onClick={closeMenu}
              className="w-full border border-gray-200 py-3 rounded-md text-sm font-medium text-center hover:bg-black hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/welcome"
              onClick={closeMenu}
              className="w-full bg-black text-white py-3 rounded-md text-sm font-medium text-center hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
