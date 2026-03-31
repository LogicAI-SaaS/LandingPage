import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import {
    Shield,
    Users,
    Server,
    Key,
    Activity,
    Settings,
    LogOut,
    Search,
    Bell,
    ChevronDown,
    LayoutDashboard,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdministrationLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const handleLogout = async () => {
        logout();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    const getAvatarInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const adminMenuItems = [
        {
            icon: <LayoutDashboard className="size-5" />,
            label: 'Tableau de bord',
            path: '/admin',
            description: 'Statistiques générales'
        },
        {
            icon: <Key className="size-5" />,
            label: 'Accès Bêta',
            path: '/admin/beta',
            description: 'Générer des clés bêta'
        },
    ];

    return (
        <div className="min-h-screen bg-bg-dark text-white">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 z-50">
                <div className="flex items-center justify-between h-full px-6">
                    {/* Logo & Admin Badge */}
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center">
                            <img src="/LogicAI.ico" alt="LogicAI" className="size-full object-contain" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold tracking-tight">LogicAI</span>
                        </div>
                    </Link>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl mx-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Rechercher un utilisateur, une instance..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Notifications - Placeholder */}
                        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-all">
                            <Bell className="size-5 text-gray-400" />
                            <span className="absolute top-1 right-1 size-2 bg-orange-500 rounded-full animate-pulse" />
                        </button>

                        {/* Profile Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-all"
                            >
                                <div className="size-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-semibold">
                                    {user ? getAvatarInitials(user.firstName + ' ' + user.lastName) : '?'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-xs text-gray-500">Administrateur</p>
                                </div>
                            </button>
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-3 w-52 bg-[#0D0D0D] border border-white/10 rounded-lg shadow-2xl py-2 z-50">
                                    <div className="px-4 py-2 border-b border-white/10">
                                        <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 transition-colors"
                                    >
                                        <LayoutDashboard className="size-4" />
                                        Tableau de bord
                                    </Link>
                                    <Link
                                        to="/dashboard/settings"
                                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 transition-colors"
                                    >
                                        <Settings className="size-4" />
                                        Paramètres
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="size-4" />
                                        Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className="fixed top-16 left-0 bottom-0 w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 z-40 overflow-y-auto">
                <nav className="p-4 space-y-2">
                    {adminMenuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive(item.path)
                                ? 'bg-orange-500/10 text-amber-500 border border-orange-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className={`transition-colors ${isActive(item.path) ? 'text-orange-500' : 'text-gray-500 group-hover:text-orange-500'
                                }`}>
                                {item.icon}
                            </span>
                            <div className="flex-1">
                                <span className="text-sm font-medium block">{item.label}</span>
                            </div>
                        </Link>
                    ))}
                </nav>

                {/* Admin Info Card */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-white/10 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Activity className="size-4 text-orange-500" />
                            <span className="text-xs font-semibold text-gray-400">STATUS SYSTÈME</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Serveur API</span>
                                <span className="flex items-center gap-1.5 text-xs text-green-500">
                                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                                    En ligne
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">WebSocket</span>
                                <span className="flex items-center gap-1.5 text-xs text-green-500">
                                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Connecté
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Base de données</span>
                                <span className="flex items-center gap-1.5 text-xs text-green-500">
                                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-72 mt-16 min-h-[calc(100vh-4rem)]">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
