export interface SoftwareApplicationSchema {
  name: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  price?: string;
  priceCurrency?: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

export interface HowToSchema {
  name: string;
  description: string;
  steps: HowToStep[];
}

export function generateSoftwareApplicationSchema(data: SoftwareApplicationSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": data.name,
    "description": data.description,
    "applicationCategory": data.applicationCategory || "UtilityApplication",
    "operatingSystem": data.operatingSystem || "Any",
    "offers": {
      "@type": "Offer",
      "price": data.price || "0",
      "priceCurrency": data.priceCurrency || "USD"
    },
    "provider": {
      "@type": "Organization",
      "name": "VectorWiz",
      "url": "https://vectorwiz.com"
    }
  };
}

export function generateHowToSchema(data: HowToSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": data.name,
    "description": data.description,
    "step": data.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text
    }))
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function injectJSONLD(schemas: object | object[]): () => void {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-managed', 'true'); // Mark for cleanup
  script.text = JSON.stringify(Array.isArray(schemas) ? schemas : [schemas]);
  document.head.appendChild(script);

  // Return cleanup function that only removes this specific script
  return () => {
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  };
}

export function setPageMetadata(metadata: {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogUrl?: string;
  ogImage?: string;
  canonicalUrl?: string;
  robots?: string;
  indexStatus?: 'index' | 'noindex';
  followStatus?: 'follow' | 'nofollow';
}): void {
  // Set title
  document.title = metadata.title;

  // Helper to update or create meta tag
  const updateMetaTag = (selector: string, attributes: Record<string, string>) => {
    let element = document.querySelector<HTMLMetaElement>(selector);
    if (!element) {
      element = document.createElement('meta');
      Object.entries(attributes).forEach(([key, value]) => {
        element!.setAttribute(key, value);
      });
      document.head.appendChild(element);
    } else {
      Object.entries(attributes).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'property') {
          element!.setAttribute(key, value);
        }
      });
    }
  };

  // Description
  updateMetaTag('meta[name="description"]', {
    name: 'description',
    content: metadata.description
  });

  // Keywords
  if (metadata.keywords && metadata.keywords.length > 0) {
    updateMetaTag('meta[name="keywords"]', {
      name: 'keywords',
      content: metadata.keywords.join(', ')
    });
  }

  // Robots
  const robotsValue = metadata.robots || (metadata.indexStatus || metadata.followStatus
    ? `${metadata.indexStatus || 'index'}, ${metadata.followStatus || 'follow'}`
    : undefined);

  if (robotsValue) {
    updateMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: robotsValue
    });
  }

  // Canonical URL
  if (metadata.canonicalUrl) {
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', metadata.canonicalUrl);
  }

  // Open Graph
  updateMetaTag('meta[property="og:title"]', {
    property: 'og:title',
    content: metadata.ogTitle || metadata.title
  });

  updateMetaTag('meta[property="og:description"]', {
    property: 'og:description',
    content: metadata.ogDescription || metadata.description
  });

  updateMetaTag('meta[property="og:type"]', {
    property: 'og:type',
    content: metadata.ogType || 'website'
  });

  updateMetaTag('meta[property="og:url"]', {
    property: 'og:url',
    content: metadata.ogUrl || window.location.href
  });

  if (metadata.ogImage) {
    updateMetaTag('meta[property="og:image"]', {
      property: 'og:image',
      content: metadata.ogImage
    });
  }
}
