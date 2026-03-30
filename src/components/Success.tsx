import { Link } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";
import correct from "../assets/correct.png";

export default function SetupSuccess() {
      return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side – Background Image */}
      <div className="relative hidden md:block md:w-1/2 bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${privateImg})`,
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          {/* Top */}
          <div>
            <div className="absolute top-6 left-6 flex items-center gap-3 text-white">
              <img src={subtract} alt="Axiom Tracker Logo" className="w-8 h-8 invert" />
              <span className="text-xl font-semibold">Axiom Tracker</span>
            </div>
            <Link to="/" className="absolute top-6 right-6 text-white flex items-center gap-2 cursor-pointer">
              <span className="text-lg">←</span>
              <p className="underline text-sm">Back to Website</p>
            </Link>
          </div>

          {/* Bottom tagline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Never Miss Your Credential
            <br />
            Renewal Again.
          </h1>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col items-center justify-center px-6 sm:px-10 w-full md:w-1/2">
       <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center bg-green-100">
  <img src={correct} alt="success" className="w-16 sm:w-20 md:w-24" />
</div>


        <h1 className="text-xl sm:text-2xl font-bold mt-6">
          Password Reset Successful
        </h1>

        <p className="text-gray-600 mt-3 text-center max-w-sm">
          Your password has been updated successfully
        </p>

        <Link
          to="/login"
          className="mt-10 w-full max-w-sm bg-black text-white py-3 rounded-md font-medium text-center"
        >
          Login
        </Link>
      </div>
      </div>
  );
}