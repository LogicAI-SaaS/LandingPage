import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Server, Zap, Pause, Trash2, Play, Plus, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUnifiedInstances } from '../../contexts/UnifiedInstancesContext';
import { useToast } from '../../contexts/ToastContext';
import { useTabs } from '../../contexts/TabsContext';
import { api } from '../../services/api';

export default function Overview() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { instances } = useUnifiedInstances();
    const { success, danger } = useToast();
    const { openTab } = useTabs();
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

    const handleAction = async (instanceId: string, action: 'start' | 'stop' | 'delete') => {
        if (action === 'delete') {
            // Afficher un toast de confirmation avec actions
            danger(
                'Supprimer l\'instance ?',
                'Cette action est irréversible. Voulez-vous vraiment supprimer cette instance ?',
                [
                    {
                        label: 'Confirmer',
                        onClick: async () => {
                            setActionLoading(prev => ({ ...prev, [instanceId]: true }));
                            try {
                                await api.deleteInstance(token!, instanceId);
                                success('Instance supprimée', 'L\'instance a été supprimée avec succès');
                                // Refresh sera fait automatiquement par WebSocket
                            } catch (error: any) {
                                danger('Erreur', error.message || 'Erreur lors de la suppression');
                                setActionLoading(prev => ({ ...prev, [instanceId]: false }));
                            }
                        },
                        variant: 'danger'
                    },
                    {
                        label: 'Annuler',
                        onClick: () => {
                            // Faire rien, le toast se fermera
                        },
                        variant: 'secondary'
                    }
                ]
            );
            return;
        }

        // Pour start et stop, exécuter directement
        setActionLoading(prev => ({ ...prev, [instanceId]: true }));
        try {
            if (action === 'start') {
                await api.startInstance(token!, instanceId);
                success('Instance démarrée', 'L\'instance a été démarrée avec succès');
            } else if (action === 'stop') {
                await api.stopInstance(token!, instanceId);
                success('Instance arrêtée', 'L\'instance a été arrêtée avec succès');
            }
            // Refresh sera fait automatiquement par WebSocket
        } catch (error: any) {
            danger('Erreur', error.message || `Erreur lors de l'action ${action}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [instanceId]: false }));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running':
                return (
                    <>
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                        </span>
                        <span className="text-sm text-white font-medium">Actif</span>
                    </>
                );
            case 'stopped':
                return (
                    <>
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
                        </span>
                        <span className="text-sm text-white font-medium">En pause</span>
                    </>
                );
            default:
                return (
                    <>
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                        </span>
                        <span className="text-sm text-white font-medium">Erreur</span>
                    </>
                );
        }
    };

    const activeInstances = instances.filter(i => i.status === 'running').length;
    const stoppedInstances = instances.filter(i => i.status === 'stopped').length;

    return (
        <main className="flex-1 overflow-auto bg-transparent">
            <div className="flex flex-col mb-3">
                <h2 className="text-2xl font-bold text-white">Vue d'ensemble</h2>
                <p className="text-gray-400">
                    Bienvenue sur votre tableau de bord LogicAI
                </p>
            </div>

            {/* Stats Grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white/5 p-4">
                    <div className="flex justify-between items-center">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                            <Server className="text-white size-6" />
                        </div>
                    </div>

                    <div className="mt-5">
                        <span className="text-white font-extrabold text-xl">{instances.length}</span>
                        <p className="text-gray-300">Instances totales</p>
                    </div>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                    <div className="flex justify-between items-center">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                            <Play className="text-white size-6" />
                        </div>
                    </div>

                    <div className="mt-5">
                        <span className="text-white font-extrabold text-xl">{activeInstances}</span>
                        <p className="text-gray-300">Instances actives</p>
                    </div>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                    <div className="flex justify-between items-center">
                        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-2 rounded-lg">
                            <Pause className="text-white size-6" />
                        </div>
                    </div>

                    <div className="mt-5">
                        <span className="text-white font-extrabold text-xl">{stoppedInstances}</span>
                        <p className="text-gray-300">Instances en pause</p>
                    </div>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                    <div className="flex justify-between items-center">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                            <Zap className="text-white size-6" />
                        </div>
                    </div>

                    <div className="mt-5">
                        <span className="text-white font-extrabold text-xl">
                            {instances.length > 0 ? instances[0].port || 'N/A' : 'N/A'}
                        </span>
                        <p className="text-gray-300">Dernier port</p>
                    </div>
                </div>
            </div>

            {/* Graphique + Activité récente */}
            <div className="grid grid-cols-3 gap-6 mb-5">
                {/* Graphique - 2/3 */}
                <div className="col-span-2 rounded-lg bg-white/5 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">
                            Activité des instances
                        </h3>
                        <select className="rounded-lg bg-white/10 px-3 py-1 text-sm text-gray-300 border-none focus:outline-none focus:ring-2 focus:ring-orange-500">
                            <option>7 derniers jours</option>
                            <option>30 derniers jours</option>
                            <option>90 derniers jours</option>
                        </select>
                    </div>
                    {/* Graphique simulé */}
                    <div className="relative h-96">
                        {instances.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                Aucune instance créée
                            </div>
                        ) : (
                            <>
                                {/* Axes */}
                                <div className="absolute inset-0 flex items-end justify-between px-8 pb-8">
                                    {[0, 20, 40, 60, 80, 100].map((_, index) => (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                            <div
                                                className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all hover:from-orange-500 hover:to-orange-300"
                                                style={{ height: `${instances.length > 0 ? 30 + Math.random() * 60 : 5}%` }}
                                            />
                                            <span className="text-xs text-gray-500">
                                                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][index]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {/* Lignes de grille horizontales */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-8 px-8">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="border-t border-white/5" />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Activité récente - 1/3 */}
                <div className="col-span-1 rounded-lg bg-white/5 p-4">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                        État du système
                    </h3>
                    <div className="space-y-3">
                        <div className="rounded-lg bg-white/5 p-3">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold">
                                    <Server className="size-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">Instances disponibles</p>
                                    <p className="text-xs text-gray-400">{instances.length} / illimité</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">Plan actuel</span>
                        </div>
                        <div className="rounded-lg bg-white/5 p-3">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-500 text-xs font-bold">
                                    <Play className="size-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">Instances actives</p>
                                    <p className="text-xs text-gray-400">{activeInstances} en cours d'exécution</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">Maintenant</span>
                        </div>
                        {instances.length === 0 && (
                            <div className="rounded-lg bg-white/5 p-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold">
                                        <Plus className="size-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">Commencez maintenant</p>
                                        <p className="text-xs text-gray-400">Créez votre première instance</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">Conseil</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white/5 p-6 rounded-lg">
                <div className='flex justify-between items-center mb-4'>
                    <h3 className="text-lg font-semibold text-white">
                        Vos instances
                    </h3>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className='flex flex-row items-center gap-2 bg-orange-500 hover:bg-orange-600 rounded-md px-3 py-2 text-sm transition-colors'
                    >
                        <Plus className='size-4' />
                        Nouvelle instance
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {instances.length === 0 ? (
                        <div className="text-center py-12">
                            <Server className="size-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400 mb-2">Aucune instance créée</p>
                            <p className="text-gray-500 text-sm mb-4">Créez votre première instance pour commencer</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className='inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 rounded-md px-4 py-2 text-sm text-white transition-colors'
                            >
                                <Plus className='size-4' />
                                Créer une instance
                            </button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                                        Instance
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                                        Port
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {instances.map((instance) => (
                                    <tr
                                        key={instance.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => {
                                          if (!actionLoading[instance.uuid]) {
                                            const tab = openTab({
                                              id: instance.id,
                                              name: instance.name || `instance-${instance.uuid?.substring(0, 8)}`,
                                              uuid: instance.uuid,
                                              port: instance.port
                                            });
                                            navigate(`/dashboard/instances/${instance.uuid}`);
                                          }
                                        }}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10">
                                                    <Server className="size-4 text-orange-500" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-white font-medium">{instance.name || `instance-${instance.uuid?.substring(0, 8)}`}</span>
                                                    {instance.is_shared && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
                                                            <Users className="size-3" />
                                                            Partagée
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(instance.status)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <code className="text-orange-500 hover:text-orange-400 transition-colors font-mono">{instance.port || 'N/A'}</code>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {!instance.is_shared && (
                                                    <>
                                                        {instance.status === 'running' ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleAction(instance.uuid, 'stop'); }}
                                                                disabled={actionLoading[instance.uuid]}
                                                                className="rounded-lg hover:bg-white/10 transition-colors p-2 text-white disabled:opacity-50"
                                                                title="Pause"
                                                            >
                                                                {actionLoading[instance.uuid] ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleAction(instance.uuid, 'start'); }}
                                                                disabled={actionLoading[instance.uuid]}
                                                                className="rounded-lg hover:bg-white/10 transition-colors p-2 text-white disabled:opacity-50"
                                                                title="Start"
                                                            >
                                                                {actionLoading[instance.uuid] ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAction(instance.uuid, 'delete'); }}
                                                            disabled={actionLoading[instance.uuid]}
                                                            className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            {actionLoading[instance.uuid] ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </button>
                                                    </>
                                                )}
                                                {instance.is_shared && (
                                                    <span className="text-xs text-gray-500 pr-2">Accès membre</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </main>
    );
}
