import { FiUploadCloud, FiBell, FiShield } from "react-icons/fi";

const steps = [
  {
    number: "01",
    icon: FiUploadCloud,
    title: "Upload Certifications",
    desc: "Import all employee certificates into the dashboard in minutes. Bulk upload or add one by one.",
  },
  {
    number: "02",
    icon: FiBell,
    title: "Set Auto-Renew Alerts",
    desc: "Automatic reminders go out at 30, 14, and 7 days before expiry — to you and your team.",
  },
  {
    number: "03",
    icon: FiShield,
    title: "Stay Compliant",
    desc: "Real-time dashboards keep your organisation audit-ready with zero manual effort.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-sm text-white/40 max-w-xs mx-auto leading-relaxed">
            Three simple steps. No IT team required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map(({ number, icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="flex flex-col gap-10 p-7 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/12 transition-all duration-200"
            >
              {/* Step number */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 grid place-items-center">
                  <Icon size={16} className="text-white/50" />
                </div>
                <span className="text-xs font-semibold text-white/20 tabular-nums tracking-widest">
                  {number}
                </span>
              </div>

              {/* Text */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-2.5">{title}</h4>
                <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
