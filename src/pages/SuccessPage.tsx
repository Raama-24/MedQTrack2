import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract query params from URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const name = queryParams.get("name");

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-lg w-full">
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          Appointment Confirmed 🎉
        </h1>

        {name && (
          <p className="text-lg text-gray-700 mb-2">
            Thank you, <span className="font-semibold">{name}</span>!
          </p>
        )}

        {token ? (
          <>
            <p className="text-gray-600 mb-3">
              Your booking has been successfully created.
            </p>
            <p className="text-xl font-medium text-gray-800 mb-1">
              Your Token Number:
            </p>
            <div className="text-6xl font-extrabold text-blue-600 mb-6">
              #{token}
            </div>
            <p className="text-gray-500 mb-6">
              Please show this token at the hospital OPD desk.
            </p>
          </>
        ) : (
          <p className="text-gray-500 mb-6">
            Booking details not found. Please return to home.
          </p>
        )}

        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;

