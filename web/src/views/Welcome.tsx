import LaserFlow from "../components/ui/LaserFlow";
import LogoLoop from "../components/ui/LogoLoop";
import { LayoutDashboard, Bell, Server, Workflow, Activity, Zap, Play, Pause, RotateCcw, Trash2, Plus, Sparkles, FolderOpen, Library, LogOut, HelpCircle, BookOpen, FileCode, Check, Minus, Loader2, Download } from "lucide-react";
import { motion } from "motion/react"
import MagicBento from "../components/ui/MagicBento";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { SEO } from "@/components/SEO";

const STEPS = [
  {
    id: "01",
    title: "Créez votre instance LogicAI",
    desc: "Choisissez votre plan et déployez une ou plusieurs instances LogicAI en quelques clics. Configuration automatique incluse.",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    id: "02",
    title: "Générez vos workflows avec l'IA",
    desc: "Utilisez notre IA Make pour créer des workflows complets à partir d'un prompt. Ou créez des prompts optimisés pour vos agents IA.",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    id: "03",
    title: "Exportez via l'API",
    desc: "Intégrez vos workflows dans vos applications via notre API complète. Support JavaScript, TypeScript, Python et package NPM à venir.",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  }
];

const FAQS = [
  { q: "Puis-je héberger plusieurs instances LogicAI ?", a: "Oui, selon votre plan vous pouvez héberger de 1 instance (Free) jusqu'à un nombre illimité (Corporation). Le plan Pro offre 5 instances, et Business 20 instances." },
  { q: "L'API est-elle disponible sur tous les plans ?", a: "L'API est disponible à partir du plan Pro (29.99€/mois). Les plans Pro, Business et Corporation ont tous un accès complet à l'API. Chaque instance dispose de sa propre clé API." },
  { q: "Quelle est la différence entre les plans Business et Corporation ?", a: "Le plan Corporation offre des ressources illimitées (instances, workflows, stockage, exécutions), le white label, des intégrations personnalisées, une infrastructure dédiée et des certifications de conformité. Idéal pour les grandes entreprises." },
  { q: "Comment fonctionne l'IA Make ?", a: "Notre IA Make vous permet de générer des workflows LogicAI complets à partir d'un prompt, ou de créer des prompts optimisés pour vos agents IA. Cette fonctionnalité est disponible sur tous les plans." },
  { q: "Puis-je migrer mes workflows existants ?", a: "Absolument. Vous pouvez importer vos workflows existants et utiliser notre API (disponible dès le plan Pro) pour les exporter dans différents langages (JS, TS, Python)." }
];

export function Welcome() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Générer les initiales pour l'avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Générer le nom d'affichage
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.email || 'Utilisateur';
  };

  // Soumettre l'inscription bêta
  const handleBetaSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setSubmitMessage({ type: 'error', text: 'Veuillez entrer une adresse email valide' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/beta/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: '✓ Vous êtes inscrit à la bêta ! Vous recevrez votre clé d\'accès par email.' });
        setEmail('');
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Une erreur est survenue' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Impossible de se connecter au serveur' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Hébergement LogicAI avec IA intégrée"
        description="Déployez et gérez vos instances LogicAI en quelques clics. IA Make intégrée pour générer vos workflows automatiquement. API complète disponible pour automatiser vos tâches."
        keywords="LogicAI hébergement, intelligence artificielle, workflows automatisation, IA Make, API LogicAI, cloud instances, workflow automation"
        ogUrl="https://logicai.com"
      />
      {/* Navbar fixe */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-96 py-4 bg-black/50 backdrop-blur-md border-b border-white/10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/LogicAI.ico" alt="LogicAI" className="h-8 w-8" />
          <div className="text-xl font-bold text-white">LogicAI</div>
        </Link>

        {/* Boutons / Profil */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            // Utilisateur connecté
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300 hidden md:block">
                Bonjour, <span className="text-white font-medium">{getDisplayName()}</span>
              </span>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                      {getInitials()}
                    </div>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-52 bg-[#0D0D0D] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm text-white font-medium">{getDisplayName()}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/dashboard"
                        className="block px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        Tableau de bord
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        Paramètres
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Utilisateur non connecté
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white transition-colors hover:text-orange-500"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-600"
              >
                Commencer
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="relative bg-black" style={{ height: '140vh' }}>
        <LaserFlow
          color="#f97316"
          horizontalBeamOffset={0.1}
          verticalBeamOffset={0.0}
          wispDensity={1}
          wispSpeed={15}
          wispIntensity={5}
          flowSpeed={0.35}
          flowStrength={0.25}
          fogIntensity={0.45}
          fogScale={0.3}
          fogFallSpeed={0.6}
          decay={1.1}
          falloffStart={1.2}
          horizontalSizing={0.8}
          verticalSizing={4}
        />
        {/* Formulaire de capture d'email - à gauche de la ligne orange */}
        <div className="absolute left-[20%] top-[25%] -translate-y-1/2 w-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl font-bold tracking-tight leading-[1.1] mb-3"
          >
            <div className="text-white">Hébergement LogicAI</div>
            <div className="text-white">avec <span className="text-gray-300">IA intégrée</span></div>
            <div><span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">Simple</span> <span className="text-gray-300">& Puissant</span></div>
          </motion.h1>
          <p className="mb-6 text-lg text-gray-300 w-150">
            Déployez et gérez vos instances LogicAI en quelques clics. IA Make intégrée pour générer vos workflows automatiquement. API complète disponible.
          </p>
          <form className="flex flex-col gap-3 mb-3" onSubmit={handleBetaSignup}>
            <div className="flex flex-row space-x-3">
              <input
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-96 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-400 backdrop-blur transition-all focus:border-orange-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-32 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  "S'inscrire"
                )}
              </button>
            </div>
            {submitMessage && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm ${submitMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
              >
                {submitMessage.text}
              </motion.p>
            )}
          </form>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-gray-300"
          >
            Déjà <span className="text-orange-500 font-semibold">0+</span> utilisateur(s) intéressé(s)
          </motion.p>
        </div>

        {/* Dashboard - à droite de la ligne orange */}
        <div className="absolute left-1/2 top-[80%] w-full max-w-400 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[#0D0D0D]">
          <div className="flex h-[800px] flex-col">
            {/* Header */}
            <header className="flex items-center justify-between bg-[#0D0D0D] border-b border-white/10 p-6 rounded-t-xl">
              <div className="flex items-center gap-3">
                <img src="/LogicAI.ico" alt="LogicAI" className="h-12 w-12" />
                <div>
                  <h1 className="text-2xl font-bold text-white">LogicAI</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="bg-blue-500 hover:bg-blue-600 rounded-md py-2 px-3 text-white flex flex-row gap-2">
                  <Plus className="" />
                  <span className="">Nouvelle instance</span>
                </button>
                <Bell className="text-gray-300 hover:text-white" />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  JD
                </div>
              </div>
            </header>

            {/* Layout : Aside gauche + Main droite */}
            <div className="flex flex-1 overflow-hidden">
              {/* Aside Gauche - Sans padding */}
              <aside className="flex w-64 flex-col bg-[#0D0D0D] border-r rounded-l-xl border-white/10">
                <nav className="space-y-2 p-4">
                  <a
                    href="#"
                    className="flex items-center gap-3 rounded-lg bg-orange-500/20 px-4 py-3 text-orange-500 transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium">Vue d'ensemble</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Workflow className="h-5 w-5" />
                    <span className="font-medium">Instances</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">Logik</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <FolderOpen className="h-5 w-5" />
                    <span className="font-medium">Ressources</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Library className="h-5 w-5" />
                    <span className="font-medium">Bibliothèque</span>
                  </a>
                </nav>

                {/* Éléments en bas - toujours positionnés en bas */}
                <nav className="mt-auto space-y-2 border-t border-white/10 p-4">
                  <a
                    href="#"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span className="font-medium">Documentation</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <FileCode className="h-5 w-5" />
                    <span className="font-medium">API</span>
                  </a>
                </nav>
              </aside>

              {/* Contenu Principal */}
              <main className="flex-1 overflow-auto p-6 bg-[#010101] rounded-br-xl">
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
                      <p className="text-xs text-red-500 font-bold">-2.1%</p>
                    </div>

                    <div className="mt-5">
                      <span className="text-white font-extrabold text-xl">3</span>
                      <p className="text-gray-300">Instances actives</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-4">
                    <div className="flex justify-between items-center">
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-2 rounded-lg">
                        <Workflow className="text-white size-6" />
                      </div>
                      <p className="text-xs text-red-500 font-bold">-2.1%</p>
                    </div>

                    <div className="mt-5">
                      <span className="text-white font-extrabold text-xl">7</span>
                      <p className="text-gray-300">Worfklows executés</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-4">
                    <div className="flex justify-between items-center">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                        <Activity className="text-white size-6" />
                      </div>
                      <p className="text-xs text-green-500 font-bold">+8.1%</p>
                    </div>

                    <div className="mt-5">
                      <span className="text-white font-extrabold text-xl">1 847</span>
                      <p className="text-gray-300">Requêtes API</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-4">
                    <div className="flex justify-between items-center">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                        <Zap className="text-white size-6" />
                      </div>
                      <p className="text-xs text-green-500 font-bold">-2.1%</p>
                    </div>

                    <div className="mt-5">
                      <span className="text-white font-extrabold text-xl">6ms</span>
                      <p className="text-gray-300">Temps moyen</p>
                    </div>
                  </div>
                </div>

                {/* Graphique + Activité récente */}
                <div className="grid grid-cols-3 gap-6 mb-5">
                  {/* Graphique - 2/3 */}
                  <div className="col-span-2 rounded-lg bg-white/5 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">
                        Activité des workflows
                      </h3>
                      <select className="rounded-lg bg-white/10 px-3 py-1 text-sm text-gray-300 border-none focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option>7 derniers jours</option>
                        <option>30 derniers jours</option>
                        <option>90 derniers jours</option>
                      </select>
                    </div>
                    {/* Graphique simulé */}
                    <div className="relative h-96">
                      {/* Axes */}
                      <div className="absolute inset-0 flex items-end justify-between px-8 pb-8">
                        {[0, 20, 40, 60, 80, 100].map((_, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all hover:from-orange-500 hover:to-orange-300"
                              style={{ height: `${30 + Math.random() * 60}%` }}
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
                    </div>
                  </div>

                  {/* Activité récente - 1/3 */}
                  <div className="col-span-1 rounded-lg bg-white/5 p-4">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Activité récente
                    </h3>
                    <div className="space-y-3">
                      <div className="rounded-lg bg-white/5 p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold">
                            JD
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">Nouveau workflow créé</p>
                            <p className="text-xs text-gray-400">Jean Dupont</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">Il y a 2h</span>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-500 text-xs font-bold">
                            MA
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">Workflow exécuté</p>
                            <p className="text-xs text-gray-400">Marie Martin</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">Il y a 5h</span>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">+3
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">Instance démarrée</p>
                            <p className="text-xs text-gray-400">Système</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">Il y a 8h</span>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold">
                            PT
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">API appelée</p>
                            <p className="text-xs text-gray-400">Pierre Thomas</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">Hier</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Vos instances
                  </h3>
                  <div className="overflow-x-auto">
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
                            Subdomain
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-linear-to-br from-orange-500/10 to-amber-500/10">
                                <Server className="size-4 text-orange-500" />
                              </div>
                              <span className="text-sm text-white font-medium">instance-aQ9F3kM</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                              </span>
                              <span className="text-sm text-white font-medium">Actif</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <code className="text-orange-500 hover:text-orange-400 transition-colors font-mono">aQ9F3kM7x2C8.logicai.fr</code>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button className="rounded-lg hover:bg-white/10 transition-colors p-2 text-white" title="Pause">
                                <Pause className="h-4 w-4" />
                              </button>
                              <button className="rounded-lg hover:bg-white/10 transition-colors p-2 text-white" title="Restart">
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-linear-to-br from-orange-500/10 to-amber-500/10">
                                <Server className="size-4 text-orange-500" />
                              </div>
                              <span className="text-sm text-white font-medium">instance-T4m9QX</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
                              </span>
                              <span className="text-sm text-white font-medium">En pause</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <code className="text-orange-500 hover:text-orange-400 transition-colors font-mono">T4m9QX7A8e6.logicai.fr</code>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button className="rounded-lg hover:bg-white/10 transition-colors p-2 text-white" title="Start">
                                <Play className="h-4 w-4" />
                              </button>
                              <button className="rounded-lg hover:bg-white/10 transition-colors p-2 text-white" title="Restart">
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-linear-to-br from-orange-500/10 to-amber-500/10">
                                <Server className="size-4 text-orange-500" />
                              </div>
                              <span className="text-sm text-white font-medium">instance-q8Z3n2</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                              </span>
                              <span className="text-sm text-white font-medium">Actif</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <code className="text-orange-500 hover:text-orange-400 transition-colors font-mono">q8Z3n2L9A6r.logicai.fr</code>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button className="rounded-lg hover:bg-white/10 transition-colors p-2 text-white" title="Pause">
                                <Pause className="h-4 w-4" />
                              </button>
                              <button className="rounded-lg hover:bg-white/10 transition-colors p-2 text-white" title="Restart">
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
      {/* Reste de la page en noir */}
      <div className="bg-black" style={{ height: '20vh' }} />

      <div className="mb-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-18">
          <div className="text-sm font-medium text-gray-300 whitespace-nowrap shrink-0">
            <div>Plus de <span className="text-amber-500">3+</span> équipes</div>
            <div>nous font confiance pour leurs workflows.</div>
          </div>
          <div className="flex-1 w-96">
            <LogoLoop
              logos={[
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#3b82f6" strokeWidth="2" fill="none" />
                    </svg>
                  ),
                  title: "Slack"
                },
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                    </svg>
                  ),
                  title: "Slack"
                },
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path fill="#FF6B6B" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                  ),
                  title: "Telegram"
                },
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  ),
                  title: "Google"
                },
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path fill="#000" d="M11.77 0C5.27 0 0 5.27 0 11.77s5.27 11.77 11.77 11.77 11.77-5.27 11.77-11.77S18.27 0 11.77 0zm5.91 17.27c-.26.43-.74.58-1.17.32-3.2-1.95-7.23-2.39-11.98-1.31-.47.11-.94-.19-1.05-.66-.11-.47.19-.94.66-1.05 5.28-1.2 9.83-.67 13.46 1.55.43.26.58.74.32 1.17zm1.57-3.49c-.33.54-.96.71-1.5.38-3.68-2.26-9.28-2.92-13.62-1.6-.6.18-1.24-.17-1.42-.77-.18-.6.17-1.24.77-1.42 4.98-1.51 11.16-.76 15.4 1.85.53.33.71.96.38 1.5zm.13-3.63c-4.41-2.62-11.69-2.86-15.91-1.58-.72.22-1.49-.2-1.71-.92-.22-.72.2-1.49.92-1.71 4.84-1.47 12.74-1.19 17.73 1.77.66.39.87 1.24.48 1.9-.39.66-1.24.87-1.9.48z" />
                    </svg>
                  ),
                  title: "Spotify"
                },
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path fill="#181717" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  ),
                  title: "GitHub"
                },
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path fill="#007ACC" d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.156.086.324.127.507.127.316 0 .568-.097.756-.29a.973.973 0 0 0 .281-.705c0-.23-.074-.441-.223-.633a1.82 1.82 0 0 0-.632-.49c-.269-.143-.58-.285-.933-.426a19.456 19.456 0 0 1-1.239-.525 6.095 6.095 0 0 1-1.032-.637 3.019 3.019 0 0 1-.733-.876 2.54 2.54 0 0 1-.277-1.199c0-.6.114-1.122.343-1.56.228-.437.537-.796.926-1.076.39-.28.842-.48 1.355-.6.514-.12 1.064-.18 1.65-.18z" />
                    </svg>
                  ),
                  title: "TypeScript"
                },
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path fill="#61DAFB" d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
                    </svg>
                  ),
                  title: "React"
                },
                {
                  node: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                      <path fill="#38bdf8" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-5-9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm10 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-5 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                    </svg>
                  ),
                  title: "LogicAI"
                },
              ]}
              speed={50}
              direction="left"
              logoHeight={32}
              gap={48}
              fadeOut={false}
              fadeOutColor="#0D0D0D"
              className="p-4"
            />
          </div>
        </div>
      </div>

      <div className="px-64">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Une plateforme <span className="text-[#868686]">complète</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Hébergez, générez et exportez vos workflows avec notre plateforme tout-en-un alimentée par l'IA.
          </p>
        </div>

        <MagicBento
          enableSpotlight={true}
          enableBorderGlow={true}
          enableStars={true}
          glowColor="255, 138, 45"
          enableTilt={true}
          clickEffect={true}
          enableMagnetism={false}
        />
      </div>

      <div className="">
        <section id="how-it-works" className="py-32 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-16">
              <div className="space-y-6">
                <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
                  Comment ça <span className="text-[#868686]">fonctionne</span> ?
                </h2>
                <p className="text-lg text-gray-400 max-w-md">
                  Soyez opérationnel en quelques minutes, pas en mois. Notre processus intuitif rend l'automatisation accessible à tous.
                </p>
              </div>
              <div className="space-y-12">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="flex gap-6 group"
                  >
                    <div className={`flex flex-col items-center`}>
                      <div className={`py-3 px-4 rounded-xl flex items-center justify-center font-bold text-lg border border-white/10 transition-colors duration-300 ${step.bg} ${step.color}`}>
                        {step.id}
                      </div>
                      {i !== STEPS.length - 1 && <div className="w-0.5 h-full bg-white/10 mt-4 group-hover:bg-white/20 transition-colors" />}
                    </div>
                    <div className="pb-12">
                      <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-500 transition-colors duration-300">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed max-w-sm">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">

              <div className="relative rounded-2xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl p-2 shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                {/* Abstract Representation of "Working" */}
                <div className="relative size-full p-8 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="h-2 w-20 bg-white/20 rounded-full" />
                    <div className="size-8 rounded-full bg-white/10" />
                  </div>

                  <div className="space-y-4">
                    <motion.div
                      animate={{ x: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="h-16 w-3/4 bg-linear-to-r from-orange-500/20 to-transparent rounded-lg border border-orange-500/30"
                    />
                    <motion.div
                      animate={{ x: [0, -20, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="h-16 w-full bg-linear-to-r from-amber-200/20 to-transparent rounded-lg border border-amber-200/30 ml-auto"
                    />
                    <motion.div
                      animate={{ x: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                      className="h-16 w-2/3 bg-linear-to-r from-yellow-500/20 to-transparent rounded-lg border border-yellow-500/30"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10" />
                    <div className="h-12 w-full rounded-lg bg-white/5 border border-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="">
        avis
      </div>

      <div className="">
        <section id="pricing" className="py-32 px-4 max-w-7xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">Tarification simple</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Tous les plans incluent un essai gratuit de 14 jours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                name: "Free", 
                price: "0€", 
                desc: "Plan gratuit pour démarrer avec LogicAI", 
                features: [
                  "1 instance LogicAI",
                  "10 workflows",
                  "1 Go de stockage",
                  "1 000 exécutions/mois",
                  "Support communautaire"
                ], 
                popular: false 
              },
              { 
                name: "Pro", 
                price: "29.99€", 
                desc: "Plan professionnel pour les utilisateurs avancés", 
                features: [
                  "5 instances LogicAI",
                  "100 workflows",
                  "10 Go de stockage",
                  "50 000 exécutions/mois",
                  "Domaine personnalisé",
                  "Analytics avancées",
                  "Accès API complet",
                  "Collaboration en équipe",
                  "Support par email"
                ], 
                popular: true 
              },
              { 
                name: "Business", 
                price: "99.99€", 
                desc: "Plan entreprise pour les équipes", 
                features: [
                  "20 instances LogicAI",
                  "Workflows illimités",
                  "50 Go de stockage",
                  "500 000 exécutions/mois",
                  "Tout du plan Pro +",
                  "Support prioritaire",
                  "SLA garanti",
                  "Support dédié 24/7"
                ], 
                popular: false 
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-2xl bg-white/5 border ${plan.popular ? 'border-orange-500 shadow-[0_0_40px_-10px_rgba(255,165,0,0.3)]' : 'border-white/10'} flex flex-col h-full hover:scale-105 transition-transform duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Plus populaire
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.desc}</p>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500">/mois</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                      <div className="size-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Check className="size-3 text-white" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-semibold transition-all bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
                >
                  Bientôt disponible
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <section id="faq" className="py-32 px-4 max-w-3xl mx-auto">
        <h2 className="text-white text-4xl font-bold text-center mb-16">
          Questions fréquemment <span className="text-[#868686]"> posées</span></h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-2xl bg-bg-card overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className={`font-semibold text-lg transition-colors ${openIndex === i ? 'text-blue-500' : 'text-white'}`}>{faq.q}</span>
                {openIndex === i ? <Minus className="size-5 text-gray-400" /> : <Plus className="size-5 text-gray-400" />}
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIndex === i ? 'auto' : 0, opacity: openIndex === i ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-0 text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 pt-20 pb-10 bg-black">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-20">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="/LogicAI.ico" alt="LogicAI" className="size-full object-contain" />
              </div>
              <span className="text-white text-lg font-bold">LogicAI</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Hébergement LogicAI professionnel avec IA intégrée. Déployez, générez et exportez vos workflows en toute simplicité.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Produit</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Intégrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Entreprise</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Légal</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Conditions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sécurité</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} LogicAI Inc. Tous droits réservés.
        </div>
      </footer>

      {/* Bulle flottante - Télécharger l'app Desktop */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.5, type: "spring", stiffness: 200 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <a
          href="/downloads/LogicAI-Setup.exe"
          download="LogicAI-Setup.exe"
          className="flex items-center gap-3 bg-[#0D0D0D] border border-white/15 rounded-2xl px-5 py-4 shadow-2xl hover:border-orange-500/50 hover:shadow-[0_0_40px_-5px_rgba(249,115,22,0.3)] transition-all duration-300 group cursor-pointer"
        >
          {/* Windows logo */}
          <div className="size-10 rounded-xl bg-[#00A2ED]/10 border border-[#00A2ED]/20 flex items-center justify-center group-hover:bg-[#00A2ED]/20 transition-colors shrink-0">
            <svg viewBox="0 0 24 24" className="size-5 fill-[#00A2ED]">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-tight whitespace-nowrap">Application Desktop</p>
            <p className="text-gray-400 text-xs">Windows · v1.0.0</p>
          </div>
          <Download className="size-4 text-gray-500 group-hover:text-orange-400 group-hover:translate-y-0.5 transition-all ml-1 shrink-0" />
        </a>
      </motion.div>
