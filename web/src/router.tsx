import { createBrowserRouter } from "react-router";
import { Welcome } from "./views/Welcome";
import { Login } from "./views/Auth/Login";
import { Register } from "./views/Auth/Register";
import DashboardLayout from "./components/layouts/Dashboard";
import AdministrationLayout from "./components/layouts/Administration";
import Overview from "./views/Dashboard/Overview";
import InstancePage from "./views/Dashboard/[id]/Instance";
import AdminBeta from "./views/Admin/Beta";
import AdminOverview from "./views/Admin/Overview";
import AdminUserProfile from "./views/Admin/UserProfile";

export const router = createBrowserRouter([
    {
        path: "/",
        index: true,
        element: <Welcome />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <DashboardLayout />,
        children: [
            {
                path: "dashboard",
                element: <Overview />
            },
            {
                path: "dashboard/instances/:id",
                element: <InstancePage />
            }
        ]
    },
    {
        path: "/",
        element: <AdministrationLayout />,
        children: [
            {
                path: "admin",
                element: <AdminOverview />
            },
            {
                path: "admin/users/:userId",
                element: <AdminUserProfile />
            },
            {
                path: "admin/beta",
                element: <AdminBeta />
            },
        ]
    }
])