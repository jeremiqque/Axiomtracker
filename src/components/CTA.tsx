import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="bg-white text-black px-4 sm:px-6 md:px-16 py-20 text-center">
      <h2 className="text-xl sm:text-2xl font-bold">
        Ready to Eliminate Compliance Risks?
      </h2>

      <p className="mt-3 text-gray-700 text-sm sm:text-base">
        Start simplifying your compliance workflow today—avoid stress before it starts.
      </p>

      <Link
        to="/welcome"
        className="mt-8 inline-block bg-black text-white px-6 py-3 rounded-md font-semibold"
      >
        Get Started
      </Link>
    </section>
  );
};

export default CTA;
