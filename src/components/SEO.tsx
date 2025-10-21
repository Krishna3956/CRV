import { Helmet } from 'react-helmet-async';

type SEOProps = {
  title: string;
  description: string;
  imageUrl?: string;
  schema?: object | object[];
  canonicalUrl?: string;
};

const SEO = ({ title, description, imageUrl, schema, canonicalUrl }: SEOProps) => {
  const siteName = 'Track MCP';
  const fullTitle = `${title} - ${siteName}`;

  // Truncate description to be SEO-friendly
  const truncate = (str: string, num: number) => {
    if (str.length <= num) {
      return str;
    }
    // Find the last space within the limit
    const subString = str.substring(0, num);
    const lastSpace = subString.lastIndexOf(' ');
    return subString.substring(0, lastSpace > 0 ? lastSpace : num) + '...';
  };

  const truncatedDescription = truncate(description, 155);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      <link rel="icon" href="/favicon.png" type="image/png" />
      <meta name="description" content={truncatedDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph Tags */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {imageUrl && <meta property="og:image:alt" content={`${siteName} Logo`} />}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@trackmcp" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {imageUrl && <meta name="twitter:image:alt" content={`${siteName} Logo`} />}

      {/* JSON-LD Schema */}
      {schema &&
        (Array.isArray(schema) ? (
          schema.map((s, i) => (
            <script key={`schema-${i}`} type="application/ld+json">
              {JSON.stringify(s)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
    </Helmet>
  );
};

export default SEO;
