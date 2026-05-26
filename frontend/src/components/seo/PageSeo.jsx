import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const siteName = "fitme.io";
const siteUrl = "https://fitme.io.copupbid.com";
const defaultTitle = "fitme.io | AI Meal Planner & Food Storage App";
const defaultDescription =
  "fitme.io is an AI meal planner and food storage app by Copupbid. Plan what to cook from available ingredients, manage pantry storage, share food lists, track budgets, and discover food ideas.";
const defaultImage = `${siteUrl}/fitme-logo.png`;
const defaultKeywords =
  "fitme.io, AI meal planner, AI food planner, pantry app, food storage app, ingredient planner, budget meal planner, recipe ideas, meal suggestions, food sharing, Copupbid";

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
  keywords = defaultKeywords,
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
    setMeta('meta[name="theme-color"]', { name: "theme-color", content: "#061121" });
    setMeta('meta[name="keywords"]', { name: "keywords", content: keywords });

    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: siteName });
    setMeta('meta[property="og:type"]', { property: "og:type", content: type });
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: url });
    setMeta('meta[property="og:image"]', { property: "og:image", content: image });
    setMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: "fitme.io logo" });
    setMeta('meta[property="og:locale"]', { property: "og:locale", content: "en_US" });

    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    setMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: "fitme.io logo" });

    setLink('link[rel="canonical"]', { rel: "canonical", href: url });
    setLink('link[rel="icon"]', { rel: "icon", type: "image/png", href: "/favicon.png" });
    setLink('link[rel="apple-touch-icon"]', { rel: "apple-touch-icon", href: "/favicon.png" });

    setJsonLd("fitme-io-jsonld", {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteName,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: defaultDescription,
      image: defaultImage,
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
  }, [description, image, keywords, location.pathname, robots, title, type]);

  return null;
}
