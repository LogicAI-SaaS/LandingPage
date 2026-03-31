import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    Server,
    Play,
    Pause,
    RotateCcw,
    Trash2,
    ExternalLink,
    ArrowLeft,
    Calendar,
    HardDrive,
    Activity,
    Settings,
    Terminal,
    Cpu,
    Database,
    X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';

interface InstanceData {
    id: number;
    uuid: string;
    name: string;
    subdomain: string;
    port: number;
    status: 'creating' | 'running' | 'stopped' | 'error';
    created_at: string;
    container_id: string;
    password_set: boolean;
}

interface ContainerStats {
    cpu: number;
    memory: number;
    memory_usage: number;
    memory_limit: number;
}

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'error' | 'warning' | 'success';
}

export default function InstancePage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [instance, setInstance] = useState<InstanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [stats, setStats] = useState<ContainerStats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showConsole, setShowConsole] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (id && token) {
            loadInstance();
        }
    }, [id, token]);

    // Update document title
    useEffect(() => {
        if (instance?.subdomain) {
            document.title = `Instance ${instance.subdomain} | LogicAI`;
        }
    }, [instance]);

    // Auto-refresh instance stats every 3 seconds when running
    useEffect(() => {
        if (instance?.status === 'running') {
            startStatsPolling();
            return () => {
                if (statsIntervalRef.current) {
                    clearInterval(statsIntervalRef.current);
                }
            };
        }
    }, [instance?.status]);

    // Auto-scroll logs to bottom
    useEffect(() => {
        if (logsEndRef.current && logs.length > 0) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const loadInstance = async () => {
        if (!token || !id) return;

        try {
            const result = await api.getInstances(token);
            const foundInstance = result.data.instances.find((i: any) => i.uuid === id || i.id === parseInt(id));

            if (foundInstance) {
                setInstance(foundInstance);
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error loading instance:', error);
        } finally {
            setLoading(false);
        }
    };

    const startStatsPolling = () => {
        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
        }

        // Poll immediately and then every 3 seconds
        fetchStats();
        statsIntervalRef.current = setInterval(fetchStats, 3000);
    };

    const fetchStats = async () => {
        if (!token || !instance) return;

        try {
            // Pour l'instant, simuler des stats réalistes
            // TODO: Implémenter l'appel API réel au backend
            const mockStats: ContainerStats = {
                cpu: Math.random() * 15 + 5, // 5-20%
                memory: Math.random() * 30 + 20, // 20-50%
                memory_usage: Math.floor(Math.random() * 512 + 256),
                memory_limit: 1024
            };
            setStats(mockStats);

            // Simuler quelques logs
            if (Math.random() > 0.7) {
                addLog('Instance running normally', 'info');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        const newLog: LogEntry = {
            timestamp: new Date().toISOString(),
            message,
            type
        };
        setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
    };

    const handleStart = async () => {
        if (!instance || !token) return;

        setActionLoading('start');
        addLog('Démarrage de l\'instance...', 'info');

        try {
            await api.startInstance(token, instance.uuid);
            addLog('Instance démarrée avec succès', 'success');
            await loadInstance();
            startStatsPolling();
        } catch (error: any) {
            addLog(`Erreur lors du démarrage: ${error.message}`, 'error');
            alert(error.message || 'Erreur lors du démarrage');
        } finally {
            setActionLoading(null);
        }
    };

    const handleStop = async () => {
        if (!instance || !token) return;

        setActionLoading('stop');
        addLog('Arrêt de l\'instance...', 'warning');

        try {
            await api.stopInstance(token, instance.uuid);
            addLog('Instance arrêtée avec succès', 'success');
            await loadInstance();
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
            }
            setStats(null);
        } catch (error: any) {
            addLog(`Erreur lors de l'arrêt: ${error.message}`, 'error');
            alert(error.message || 'Erreur lors de l\'arrêt');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestart = async () => {
        if (!instance || !token) return;

        setActionLoading('restart');
        addLog('Redémarrage de l\'instance...', 'warning');

        try {
            await api.stopInstance(token, instance.uuid);
            addLog('Instance arrêtée', 'info');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
            await api.startInstance(token, instance.uuid);
            addLog('Instance redémarrée avec succès', 'success');
            await loadInstance();
            startStatsPolling();
        } catch (error: any) {
            addLog(`Erreur lors du redémarrage: ${error.message}`, 'error');
            alert(error.message || 'Erreur lors du redémarrage');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!instance || !token) return;

        if (!confirm('Êtes-vous sûr de vouloir supprimer cette instance ? Cette action est irréversible.')) {
            return;
        }

        setActionLoading('delete');
        addLog('Suppression de l\'instance...', 'error');

        try {
            await api.deleteInstance(token, instance.uuid);
            addLog('Instance supprimée avec succès', 'success');
            navigate('/dashboard');
        } catch (error: any) {
            addLog(`Erreur lors de la suppression: ${error.message}`, 'error');
            alert(error.message || 'Erreur lors de la suppression');
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewLogs = async () => {
        if (!token || !instance) return;

        addLog('Récupération des logs Docker...', 'info');

        try {
            // TODO: Appeler l'API backend pour récupérer les logs réels du container
            // Pour l'instant, simuler des logs
            const mockLogs = [
                'Container started',
                'LogicAI initialization complete',
                'Listening on port 3000',
                'Database initialized',
                'Application ready'
            ];

            mockLogs.forEach(log => {
                addLog(log, 'info');
            });
        } catch (error: any) {
            addLog(`Erreur lors de la récupération des logs: ${error.message}`, 'error');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-green-500';
            case 'stopped': return 'bg-yellow-500';
            case 'creating': return 'bg-blue-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'running': return 'Actif';
            case 'stopped': return 'Arrêté';
            case 'creating': return 'Création en cours';
            case 'error': return 'Erreur';
            default: return 'Inconnu';
        }
    };

    const getLogColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'error': return 'text-red-400';
            case 'warning': return 'text-yellow-400';
            case 'success': return 'text-green-400';
            default: return 'text-blue-400';
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!instance) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Instance non trouvée</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="size-5 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Server className="size-6 text-orange-500" />
                            Instance-{instance.uuid}
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {instance.container_id}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowConsole(!showConsole)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            showConsole
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-gray-300'
                        }`}
                    >
                        <Terminal className="size-4" />
                        {showConsole ? 'Masquer' : 'Console'}
                    </button>
                    {instance.status === 'running' && (
                        <a
                            href={`http://localhost:${instance.port}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        >
                            <ExternalLink className="size-4" />
                            Ouvrir LogicAI
                        </a>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-lg border ${
                instance.status === 'running' ? 'bg-green-500/10 border-green-500/30' :
                instance.status === 'stopped' ? 'bg-yellow-500/10 border-yellow-500/30' :
                instance.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                'bg-blue-500/10 border-blue-500/30'
            }`}>
                <div className="flex items-center gap-3">
                    <span className={`relative flex h-3 w-3`}>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full ${
                            instance.status === 'running' ? 'bg-green-400' :
                            instance.status === 'stopped' ? 'bg-yellow-400' :
                            instance.status === 'error' ? 'bg-red-400' :
                            'bg-blue-400'
                        } opacity-75"></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor(instance.status)}`}></span>
                    </span>
                    <span className="text-white font-semibold">
                        {getStatusLabel(instance.status)}
                    </span>
                </div>
            </div>

            {/* Console (Collapsible) */}
            {showConsole && (
                <div className="bg-black rounded-lg border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                        <div className="flex items-center gap-2">
                            <Terminal className="size-4 text-gray-400" />
                            <h3 className="text-sm font-semibold text-white">Console en temps réel</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleViewLogs}
                                className="text-xs text-orange-400 hover:text-orange-300"
                            >
                                Rafraîchir les logs
                            </button>
                            <button
                                onClick={() => setLogs([])}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Effacer les logs"
                            >
                                <X className="size-3 text-gray-400" />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1">
                        {logs.length === 0 ? (
                            <p className="text-gray-500">Aucun log disponible. Cliquez sur "Rafraîchir les logs" pour récupérer les logs Docker.</p>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className={`flex gap-2 ${getLogColor(log.type)}`}>
                                    <span className="text-gray-500 shrink-0">
                                        [{new Date(log.timestamp).toLocaleTimeString('fr-FR')}]
                                    </span>
                                    <span className="break-all">{log.message}</span>
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Instance Details & Actions */}
                <div className="md:col-span-2 space-y-6">
                    {/* Informations */}
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Settings className="size-5" />
                            Informations
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-gray-400 text-sm">UUID</span>
                                    <code className="text-orange-400 text-xs">{instance.uuid.substring(0, 12)}...</code>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-gray-400 text-sm">Port</span>
                                    <code className="text-orange-400 text-xs">{instance.port}</code>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-400 text-sm">Container ID</span>
                                    <code className="text-orange-400 text-xs">{instance.container_id?.substring(0, 12)}...</code>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-gray-400 text-sm">Sous-domaine</span>
                                    <code className="text-orange-400 text-xs text-right">{instance.subdomain}</code>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-400 text-sm">URL d'accès</span>
                                    <a
                                        href={`http://localhost:${instance.port}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-400 hover:text-orange-300 text-xs font-mono flex items-center gap-1"
                                    >
                                        localhost:{instance.port}
                                        <ExternalLink className="size-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="size-5" />
                            Gestion du Container
                        </h2>

                        <div className="flex flex-wrap gap-3">
                            {instance.status === 'running' && (
                                <>
                                    <button
                                        onClick={handleStop}
                                        disabled={actionLoading !== null}
                                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                    >
                                        {actionLoading === 'stop' ? 'Arrêt...' : (
                                            <>
                                                <Pause className="size-4" />
                                                Arrêter
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={handleRestart}
                                        disabled={actionLoading !== null}
                                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                    >
                                        {actionLoading === 'restart' ? 'Redémarrage...' : (
                                            <>
                                                <RotateCcw className="size-4" />
                                                Redémarrer
                                            </>
                                        )}
                                    </button>
                                </>
                            )}

                            {instance.status === 'stopped' && (
                                <button
                                    onClick={handleStart}
                                    disabled={actionLoading !== null}
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                >
                                    {actionLoading === 'start' ? 'Démarrage...' : (
                                        <>
                                            <Play className="size-4" />
                                            Démarrer
                                        </>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={handleDelete}
                                disabled={actionLoading !== null}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            >
                                {actionLoading === 'delete' ? 'Suppression...' : (
                                    <>
                                        <Trash2 className="size-4" />
                                        Supprimer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Resources Live Stats */}
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <HardDrive className="size-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-white">Ressources</h3>
                            </div>
                            {stats && (
                                <span className="text-xs text-gray-500">Live</span>
                            )}
                        </div>

                        {stats ? (
                            <div className="space-y-4">
                                {/* CPU */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <div className="flex items-center gap-2">
                                            <Cpu className="size-4 text-blue-400" />
                                            <span className="text-gray-400">CPU</span>
                                        </div>
                                        <span className="text-white font-medium">{stats.cpu.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-linear-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${stats.cpu}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Memory */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <div className="flex items-center gap-2">
                                            <Database className="size-4 text-purple-400" />
                                            <span className="text-gray-400">Mémoire</span>
                                        </div>
                                        <span className="text-white text-xs">
                                            {formatBytes(stats.memory_usage)} / {formatBytes(stats.memory_limit)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-linear-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${stats.memory}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-gray-500">{stats.memory.toFixed(1)}%</span>
                                        <span className="text-gray-500">{formatBytes(stats.memory_usage)} utilisés</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/10">
                                    <button
                                        onClick={fetchStats}
                                        className="w-full text-center bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-2 rounded-lg text-xs transition-all"
                                    >
                                        Rafraîchir maintenant
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Activity className="size-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    {instance.status === 'running'
                                        ? 'Chargement des statistiques...'
                                        : 'Les statistiques ne sont disponibles que lorsque l\'instance est démarrée'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Created At */}
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar className="size-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-white">Créée le</h3>
                        </div>
                        <p className="text-gray-300">
                            {new Date(instance.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {/* Quick Access */}
                    {instance.status === 'running' && (
                        <div className="bg-linear-to-br from-orange-500/10 to-amber-500/10 rounded-lg p-6 border border-orange-500/30">
                            <h3 className="text-lg font-semibold text-white mb-3">Accès rapide</h3>
                            <a
                                href={`http://localhost:${instance.port}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                            >
                                Ouvrir l'interface LogicAI
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
