import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const siteName = "fitme.io";
const siteUrl = "https://app.fitme.io.copupbid.com";
const defaultTitle = "fitme.io | AI Food Planner by Copupbid";
const defaultDescription =
  "fitme.io is an AI-powered food planner by Copupbid that helps users plan meals from available storage, ingredients, budget, and food preferences.";
const defaultImage = `${siteUrl}/favicon.svg`;

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function setLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function setJsonLd(id, data) {
  let element = document.getElementById(id);

  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

export function PageSeo({
  title = defaultTitle,
  description = defaultDescription,
  robots = "index, follow",
  image = defaultImage,
  type = "website",
}) {
  const location = useLocation();

  useEffect(() => {
    const url = `${siteUrl}${location.pathname}`;

    document.title = title;
    setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[name="robots"]', { name: "robots", content: robots });
    setMeta('meta[name="author"]', { name: "author", content: "Copupbid" });
    setMeta('meta[name="application-name"]', { name: "application-name", content: siteName });
    setMeta('meta[name="theme-color"]', { name: "theme-color", content: "#05150f" });
    setMeta('meta[name="keywords"]', {
      name: "keywords",
      content:
        "fitme.io, AI food planner, meal planner, food storage planner, ingredient planner, budget meal planner, Copupbid",
    });

    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: siteName });
    setMeta('meta[property="og:type"]', { property: "og:type", content: type });
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: url });
    setMeta('meta[property="og:image"]', { property: "og:image", content: image });

    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

    setLink('link[rel="canonical"]', { rel: "canonical", href: url });

    setJsonLd("fitme-io-jsonld", {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteName,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: defaultDescription,
      creator: {
        "@type": "Organization",
        name: "Copupbid",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    });
  }, [description, image, location.pathname, robots, title, type]);

  return null;
}
