import { useNavigate } from "react-router-dom";

export default function LoginOptions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h2 className="text-2xl font-semibold mb-4">Select Login Type</h2>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate("/admin-login")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-60"
        >
          Admin Login
        </button>
        <button
          onClick={() => navigate("/doctorlogin")}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 w-60"
        >
          Doctor Login
        </button>
      </div>
    </div>
  );
}
