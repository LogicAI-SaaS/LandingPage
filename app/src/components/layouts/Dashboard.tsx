import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import {
    LayoutDashboard,
    Workflow,
    Settings,
    FileCode,
    Search,
    LogOut,
    Plus,
    Sparkles,
    ChevronDown,
    ChevronRight,
    BookOpen,
    Library,
    FolderOpen,
    Users,
    Bell,
    Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUnifiedInstances } from '../../contexts/UnifiedInstancesContext';
import { BetaGate } from '../BetaGate';
import CreateInstanceModal from '../CreateInstanceModal';
import { api } from '../../services/api';

export default function DashboardLayout() {
    const { user, logout, token } = useAuth();
    const { instances, refreshInstances } = useUnifiedInstances();
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showInstancesSubMenu, setShowInstancesSubMenu] = useState(true);
    const [hasBetaAccess, setHasBetaAccess] = useState(false);
    const [betaChecked, setBetaChecked] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Vérifier l'accès bêta au chargement
    useEffect(() => {
        const checkBetaAccess = () => {
            // Les admins et mods n'ont pas besoin de clé bêta
            if (user?.role === 'admin' || user?.role === 'mod') {
                setHasBetaAccess(true);
                setBetaChecked(true);
                return;
            }

            // Vérifier dans localStorage d'abord
            const storedAccess = localStorage.getItem('hasBetaAccess');
            if (storedAccess === 'true') {
                setHasBetaAccess(true);
                setBetaChecked(true);
                return;
            }

            // Vérifier dans les données utilisateur
            if (user?.has_beta_access) {
                setHasBetaAccess(true);
                localStorage.setItem('hasBetaAccess', 'true');
            }

            setBetaChecked(true);
        };

        checkBetaAccess();
    }, [user]);

    const handleBetaUnlock = () => {
        setHasBetaAccess(true);
        // Recharger les données utilisateur
        window.location.reload();
    };

    const createInstance = () => {
        setShowCreateModal(true);
    };

    const handleSelectType = async (type: 'local' | 'cloud') => {
        if (creating || !token) return;

        setCreating(true);
        setShowCreateModal(false);
        try {
            const result = await api.createInstance(token, type);

            if (result.success) {
                setTimeout(() => refreshInstances(), 2000);
            }
        } catch (error: any) {
            console.error('Error creating instance:', error);
            alert(error.message || 'Erreur lors de la création de l\'instance');
        } finally {
            setCreating(false);
        }
    };

    // Calculate subscription limits based on user plan
    const subscription = {
        plan: user?.plan || 'free',
        max_instances: user?.plan === 'free' ? 1 : user?.plan === 'pro' ? 5 : 20
    };

    const handleLogout = async () => {
        logout();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    const getAvatarInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const menuItems = [
        { icon: <LayoutDashboard className="size-5" />, label: 'Vue d\'ensemble', path: '/dashboard' },
        { icon: <Workflow className="size-5" />, label: 'Instances', path: '/dashboard/instances', hasSubMenu: true },
        { icon: <Sparkles className="size-5" />, label: 'Logik', path: '/dashboard/logik' },
        { icon: <FolderOpen className="size-5" />, label: 'Ressources', path: '/dashboard/resources' },
        { icon: <Library className="size-5" />, label: 'Bibliothèque', path: '/dashboard/library' },
    ];

    const canUseApi = false; // Will be based on subscription plan later

    const bottomMenuItems = [
        { icon: <BookOpen className="size-5" />, label: 'Documentation', path: '/dashboard/documentation' },
        ...(canUseApi ? [{ icon: <FileCode className="size-5" />, label: 'API', path: '/dashboard/api' }] : []),
    ];

    // Afficher le BetaGate si l'utilisateur n'a pas accès bêta
    if (betaChecked && !hasBetaAccess) {
        return <BetaGate onUnlock={handleBetaUnlock} />;
    }

    // Attendre la vérification
    if (!betaChecked) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="h-full bg-bg-dark text-white flex flex-col">
            {/* Hide header and sidebar on instance dashboard pages */}
            {location.pathname.match(/\/dashboard\/instance\/[^\/]+/) ? (
                <Outlet />
            ) : (
                <>
                    {/* Top Bar */}
                    <header className="fixed top-8 left-0 right-0 h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 z-50">
                <div className="flex items-center justify-between h-full px-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center">
                            <img src="/LogicAI.ico" alt="LogicAI" className="size-full object-contain" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">LogicAI</span>
                    </Link>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl mx-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Rechercher une instance, un workflow..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* New Instance Button */}
                        <button
                            onClick={createInstance}
                            disabled={creating}
                            className="hidden md:flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                        >
                            <Plus className="size-4" />
                            {creating ? 'Création...' : 'Nouvelle instance'}
                        </button>

                        {/* Notifications - Placeholder */}
                        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-all">
                            <Bell className="size-5 text-gray-400" />
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
                            </button>
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-3 w-52 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-2 z-50">
                                    <div className="px-4 py-2 border-b border-white/10">
                                        <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'mod') && (
                                        <Link
                                            to="/admin"
                                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 transition-colors"
                                        >
                                            <Shield className="size-4" />
                                            Administration
                                        </Link>
                                    )}
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
            <aside className="fixed top-24 left-0 bottom-0 w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 z-40 overflow-y-auto">
                <nav className="p-4 space-y-1 flex flex-col h-[calc(100%-140px)]">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <div key={item.path}>
                                {item.hasSubMenu ? (
                                    <>
                                        <button
                                            onClick={() => setShowInstancesSubMenu(!showInstancesSubMenu)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all group ${isActive(item.path)
                                                ? 'bg-orange-500/10 text-amber-500 border border-orange-500/30'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`transition-colors ${isActive(item.path) ? 'text-orange-500' : 'text-gray-500 group-hover:text-orange-500'
                                                    }`}>
                                                    {item.icon}
                                                </span>
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </div>
                                            {showInstancesSubMenu ? (
                                                <ChevronDown className="size-4" />
                                            ) : (
                                                <ChevronRight className="size-4" />
                                            )}
                                        </button>
                                        {showInstancesSubMenu && instances.length > 0 && (
                                            <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                                                {instances.map((instance) => (
                                                    <Link
                                                        key={instance.id}
                                                        to={`/dashboard/instances/${instance.uuid}`}
                                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${location.pathname === `/dashboard/instances/${instance.uuid}`
                                                            ? 'bg-orange-500/5 text-amber-500'
                                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span className="font-mono text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                                                                {instance.uuid.substring(0, 4).toUpperCase()}
                                                            </span>
                                                            <span className="truncate text-xs">logic-{instance.uuid}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {instance.is_shared && (
                                                                <Users className="size-3.5 text-blue-400" />
                                                            )}
                                                            <span className={`size-2 rounded-full transition-all ${instance.status === 'running' ? 'bg-green-500 animate-pulse' :
                                                                    instance.status === 'creating' ? 'bg-yellow-500 animate-pulse' :
                                                                        instance.status === 'error' ? 'bg-red-500' :
                                                                            'bg-gray-500'
                                                                }`}></span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
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
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Bottom Menu Items */}
                    <div className="mt-auto space-y-1 pt-4 border-t border-white/10">
                        {bottomMenuItems.map((item) => (
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
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Usage Card */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-300/10 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="size-4 text-brand-orange" />
                            <span className="text-xs font-semibold text-gray-400">
                                PLAN {subscription?.plan?.toUpperCase() || 'GRATUIT'}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                                <span>Instances</span>
                                <span>{instances.filter((i: any) => !i.is_shared).length}/{subscription?.max_instances || 1}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out"
                                    style={{
                                        width: `${Math.min(100, (instances.filter((i: any) => !i.is_shared).length / (subscription?.max_instances || 1)) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>

                        {subscription?.plan !== 'business' && (
                            <Link
                                to="/#pricing"
                                className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                            >
                                {subscription?.plan === 'pro' ? 'Passer au Business' : 'Passer au Pro'}
                            </Link>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 mt-24 flex-1 overflow-auto">
                <div className={location.pathname.includes('ai-make') || location.pathname.includes('documentation') ? '' : 'p-8'}>
                    <Outlet />
                </div>
            </main>

            {/* Create Instance Modal */}
            <CreateInstanceModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSelect={handleSelectType}
                creating={creating}
            />
                </>
            )}
        </div>
    );
}
