export default function About() {
  const stats = [
    { value: "500+", label: "Companies trust us" },
    { value: "100%", label: "Compliance rate"    },
    { value: "60%",  label: "Admin time saved"   },
    { value: "< 5m", label: "Setup time"         },
  ];

  return (
    <section className="py-24 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — text */}
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
              About
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-[1.15] mb-6">
              Compliance management,<br />
              <span className="text-gray-400">finally done right.</span>
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              Axiom Tracker automates certificate tracking, expiration alerts, and
              team compliance — so you spend less time on admin and more time on
              what actually matters.
            </p>

            {/* Divider */}
            <div className="h-px bg-gray-100 my-8" />

            {/* Inline trust line */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {["#111","#333","#555","#777"].map((bg, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-white"
                    style={{ background: bg }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Trusted by <span className="font-semibold text-gray-700">500+ organisations</span> worldwide
              </p>
            </div>
          </div>

          {/* Right — stat grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
                <p className="text-xs text-gray-400 mt-1.5 leading-snug">{label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
