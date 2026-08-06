import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Arahkan user kembali ke halaman utama yang sesuai role.
  const handleBack = () => {
    if (user?.role.toLowerCase() === "relawan") {
      navigate("/profil-relawan");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6 text-red-500">
              <ShieldAlert size={64} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Akses Ditolak</h1>
            <p className="text-gray-600 mb-8">
              Maaf, Anda tidak dapat mengakses halaman ini. Halaman ini mungkin diperuntukkan bagi
              peran lain atau Anda tidak memiliki izin yang cukup.
            </p>
            <Button
              onClick={handleBack}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Kembali ke Halaman Utama
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Unauthorized;
