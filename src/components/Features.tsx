import feature1 from "../assets/1.png";
import feature2 from "../assets/2.png";
import feature3 from "../assets/3.png";
import { FiAward, FiBell, FiBarChart2 } from "react-icons/fi";

const features = [
  {
    image: feature1,
    icon: FiAward,
    tag: "Tracking",
    title: "Smart Credentials Tracking",
    desc: "Track every employee certificate in one place. Instant visibility into active, expiring, and expired credentials across your entire team.",
    accent: "#2dd4bf",
  },
  {
    image: feature2,
    icon: FiBell,
    tag: "Alerts",
    title: "Intelligent Notifications",
    desc: "Automated multi-channel alerts at 30, 14, and 7 days before expiry. The right people get notified — automatically.",
    accent: "#60a5fa",
  },
  {
    image: feature3,
    icon: FiBarChart2,
    tag: "Analytics",
    title: "Real-Time Analytics",
    desc: "Live compliance dashboards with predictive insights. Identify risks early and track trends before they become problems.",
    accent: "#f472b6",
  },
];

const Features = () => {
  return (
    <section id="features" className="bg-black text-white py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Everything you need to<br />
              <span className="text-white/35">stay compliant.</span>
            </h2>
          </div>
          <p className="text-sm text-white/35 max-w-xs leading-relaxed sm:text-right">
            One platform. Full visibility. Zero missed renewals.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ image, icon: Icon, tag, title, desc, accent }) => (
            <div
              key={title}
              className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-white/16 hover:bg-white/[0.06] transition-all duration-300"
            >
              {/* Image */}
              <div className="relative overflow-hidden h-48">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient fade at bottom of image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Tag pill on image */}
                <div
                  className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md border border-white/10"
                  style={{ background: `${accent}22`, color: accent }}
                >
                  <Icon size={10} />
                  {tag}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5 gap-3">
                <h3 className="text-sm font-semibold text-white leading-snug">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Features;
