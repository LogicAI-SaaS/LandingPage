import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  noIndex?: boolean;
}

const defaultDescription = "LogicAI est une plateforme innovante d'intelligence artificielle qui vous permet de créer, gérer et déployer des instances IA dans le cloud ou en local.";

export function SEO({
  title,
  description = defaultDescription,
  keywords = "intelligence artificielle, IA, AI, machine learning, cloud, instances, automatisation, productivité, LogicAI",
  ogImage = "/LogicAI.png",
  ogUrl = "https://logicai.com",
  noIndex = false,
}: SEOProps) {
  const fullTitle = `${title} | LogicAI`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />

      {/* Twitter */}
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
    </Helmet>
  );
}
