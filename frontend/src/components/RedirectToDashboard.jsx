import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RedirectToDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("token") === "true"; 
    const cookieValue = Cookies.get("Mauli-Dairy")==="true";
    
    if (isAdmin && cookieValue) {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  }, []);

  return null; 
};

export default RedirectToDashboard;
