const FAQ = () => {
  return (
    <section className="px-4 sm:px-6 md:px-16 py-20 bg-gray-100">
      <h2 className="text-center text-xl sm:text-2xl font-bold mb-10">Frequently Asked Questions</h2>

      <div className="max-w-3xl mx-auto space-y-4">

        <details className="bg-white p-4 rounded-md shadow-sm">
          <summary className="cursor-pointer font-semibold">
            How does Axiom Tracker prevent certificate expiry?
          </summary>
          <p className="mt-2 text-gray-600 text-sm">
            It sends automatic alerts before any certificate expires.
          </p>
        </details>

        <details className="bg-white p-4 rounded-md shadow-sm">
          <summary className="cursor-pointer font-semibold">
            Can Axiom Tracker integrate with our existing HR systems?
          </summary>
          <p className="mt-2 text-gray-600 text-sm">
            Yes, it integrates with most HR platforms via API.
          </p>
        </details>

        <details className="bg-white p-4 rounded-md shadow-sm">
          <summary className="cursor-pointer font-semibold">
            Is our certificate data secure?
          </summary>
          <p className="mt-2 text-gray-600 text-sm">
            Absolutely — all data is encrypted end-to-end.
          </p>
        </details>

        <details className="bg-white p-4 rounded-md shadow-sm">
          <summary className="cursor-pointer font-semibold">
            What types of certificates can Axiom Tracker manage?
          </summary>
          <p className="mt-2 text-gray-600 text-sm">
            From safety to medical to compliance certificates — everything is supported.
          </p>
        </details>

      </div>
    </section>
  );
};

export default FAQ;