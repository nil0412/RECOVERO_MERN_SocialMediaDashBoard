import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks";
const PrivateRoutes = () => {

	const auth = useAuth();
	// const isAuthenticated = !!localStorage.getItem("token");
	const isAuthenticated = !!auth.user;
	return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace={true} />;
};

export default PrivateRoutes;