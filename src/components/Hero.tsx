import { Link } from "react-router-dom";
import freepick from "../assets/freepick.png";
import younggirl from "../assets/younggirl.png";
import happyman from "../assets/happyman.png";
import closeup from "../assets/closeup.png";

import { FiArrowRight, FiShield, FiBell, FiUsers } from "react-icons/fi";

export default function Hero() {
  return (
    <section id="hero" className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* Background */}
      <img
        src={freepick}
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Layered overlays for depth */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full py-32">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/8 backdrop-blur-md mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
          <span className="text-xs font-medium text-white/70 tracking-wide">
            Trusted by 500+ compliance teams
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold text-white leading-[1.1] tracking-tight mb-6">
          Never miss a<br />
          <span className="text-white/40">certificate expiry</span><br />
          ever again.
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-white/50 leading-relaxed max-w-lg mb-10">
          Axiom Tracker automates credential tracking, sends expiry alerts at
          30, 14 &amp; 7 days, and keeps your entire team audit-ready — all in
          one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16 w-full sm:w-auto">
          <Link
            to="/welcome"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-950 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-black/20"
          >
            Get started free
            <FiArrowRight size={14} />
          </Link>
          <Link
            to="/create-account"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/8 border border-white/15 text-white text-sm font-medium rounded-xl hover:bg-white/14 transition-colors backdrop-blur-sm"
          >
            See how it works
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-3">
          {/* Overlapping avatars */}
          <div className="flex items-center">
            {[
              { src: younggirl, pos: 'center top'    },
              { src: happyman,  pos: 'center top'    },
              { src: closeup,   pos: 'center center' },
            ].map(({ src, pos }, i) => (
              <div
                key={i}
                className="shrink-0 w-10 h-10 rounded-full border-[2.5px] border-[#0d1117]"
                style={{
                  backgroundImage: `url(${src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: pos,
                  marginLeft: i === 0 ? 0 : '-10px',
                  zIndex: 10 - i,
                  position: 'relative',
                }}
              />
            ))}
          </div>

          {/* Label */}
          <div className="text-left">
            <p className="text-sm font-semibold text-white leading-tight">Over 10,000+</p>
            <p className="text-xs text-white/45">Active clients</p>
          </div>
        </div>

      </div>

      {/* Bottom trust bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/8 bg-black/30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          {[
            { icon: FiBell,   label: "Automated expiry alerts"  },
            { icon: FiShield, label: "End-to-end encrypted"     },
            { icon: FiUsers,  label: "Full team management"     },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={13} className="text-white/30 shrink-0" />
              <span className="text-xs text-white/40">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
