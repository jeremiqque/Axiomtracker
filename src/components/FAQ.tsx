import { useState } from "react";
import { FiPlus, FiMinus } from "react-icons/fi";

const faqs = [
  {
    q: "How does Axiom Tracker prevent certificate expiry?",
    a: "Axiom Tracker continuously monitors all credential expiry dates and sends automatic email alerts at 30, 14, and 7 days before expiry — so your team is always ahead of deadlines.",
  },
  {
    q: "Can Axiom Tracker integrate with our existing HR systems?",
    a: "Yes. Axiom Tracker connects with most HR platforms via API, making it easy to sync employee records and credential data without manual data entry.",
  },
  {
    q: "Is our certificate data secure?",
    a: "Absolutely. All data is encrypted end-to-end using AES-256. We're SOC 2 compliant and your data is never shared with third parties.",
  },
  {
    q: "What types of certificates can Axiom Tracker manage?",
    a: "Everything — from safety and compliance certificates to medical licences, training completions, and industry-specific accreditations.",
  },
  {
    q: "How do I assign roles to team members?",
    a: "Admins can assign Admin, Employee, or Viewer roles directly from the Team Management section in Settings. Role changes take effect immediately.",
  },
  {
    q: "Is there a limit on how many credentials I can track?",
    a: "No hard limits. Axiom Tracker is built to scale with your organisation, whether you're managing 10 certificates or 10,000.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Everything you need to know about Axiom Tracker. Can't find what you're looking for?{" "}
            <a href="mailto:support@axiomtracker.com" className="text-gray-700 underline underline-offset-2 hover:text-black transition-colors">
              Get in touch.
            </a>
          </p>
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                >
                  <span className={`text-sm font-semibold transition-colors leading-snug ${isOpen ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"}`}>
                    {faq.q}
                  </span>
                  <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    isOpen
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "bg-white border-gray-200 text-gray-400 group-hover:border-gray-400"
                  }`}>
                    {isOpen
                      ? <FiMinus size={11} />
                      : <FiPlus size={11} />
                    }
                  </span>
                </button>

                {/* Answer with smooth reveal */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="pb-5 text-sm text-gray-400 leading-relaxed pr-10">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FAQ;
