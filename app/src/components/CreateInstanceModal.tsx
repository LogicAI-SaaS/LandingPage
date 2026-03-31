import { X, Server, Cloud } from 'lucide-react';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'local' | 'cloud') => void;
  creating: boolean;
}

export default function CreateInstanceModal({ isOpen, onClose, onSelect, creating }: CreateInstanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Créer une nouvelle instance</h2>
            <p className="text-sm text-gray-400 mt-1">Choisissez où héberger votre instance</p>
          </div>
          <button
            onClick={onClose}
            disabled={creating}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Local Option */}
          <button
            onClick={() => onSelect('local')}
            disabled={creating}
            className="w-full group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-orange-500/50 hover:bg-orange-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1">Local</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Déployer localement avec Docker
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-400 border border-blue-500/20">
                    Docker Desktop requis
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-green-400 border border-green-500/20">
                    Gratuit
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Cloud Option */}
          <button
            onClick={() => onSelect('cloud')}
            disabled={creating}
            className="w-full group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-orange-500/50 hover:bg-orange-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1">Cloud</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Hébergé sur les serveurs LogicAI
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-purple-400 border border-purple-500/20">
                    Aucune configuration
                  </span>
                  <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-orange-400 border border-orange-500/20">
                    Inclus avec votre plan
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Vous pourrez changer le type d'instance ultérieurement
          </p>
        </div>
      </div>
    </div>
  );
}
