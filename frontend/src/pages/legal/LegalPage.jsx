import styles from "./LegalPage.module.css";

const content = {
  terms: {
    eyebrow: "Terms of use",
    title: "fitme.io Terms",
    intro:
      "These terms explain how fitme.io should be used as a food AI, storage planner, sharing tool, and food feed.",
    updated: "May 26, 2026",
    sections: [
      {
        title: "Using fitme.io",
        text:
          "fitme.io helps users save food storage items, receive AI meal ideas from available ingredients, share storage lists, subscribe to app access, and post food stories in the feed. You are responsible for the information you add and for deciding whether a meal suggestion is right for you.",
      },
      {
        title: "Food and health information",
        text:
          "AI meal suggestions are for planning and inspiration only. fitme.io is not medical, allergy, nutrition, or safety advice. Check ingredients, expiry dates, allergies, health needs, and cooking safety before preparing or eating food.",
      },
      {
        title: "Accounts and subscriptions",
        text:
          "Some features may require an active subscription. Payment proof and payer details may be reviewed by an admin before access is approved. Admins may approve, reject, extend, or remove subscriptions when needed for account management.",
      },
      {
        title: "Sharing and feed posts",
        text:
          "When you share storage or post to the feed, other people may see the details you choose to publish. Do not post private information, harmful content, or anything you do not have permission to share.",
      },
      {
        title: "Acceptable use",
        text:
          "Do not misuse the app, attack the service, impersonate others, upload illegal content, or use fitme.io to harm another person. Accounts that abuse the service may be limited or removed.",
      },
    ],
  },
  privacy: {
    eyebrow: "Privacy policy",
    title: "fitme.io Privacy Policy",
    intro:
      "This policy explains the information fitme.io uses to run account access, food storage, AI suggestions, sharing, and the food feed.",
    updated: "May 26, 2026",
    sections: [
      {
        title: "Information we use",
        text:
          "fitme.io may use account details, profile information, food storage items, meal preferences, shared storage links, feed posts, comments, subscription status, payment proof, and payer bank details needed to review subscriptions.",
      },
      {
        title: "How the app uses data",
        text:
          "Storage and preference data help the AI suggest food to cook from what you already have. Subscription and payment data help admins confirm access. Feed data lets other users see food stories and interact with posts.",
      },
      {
        title: "Sharing choices",
        text:
          "Storage is private unless you create or send a shared storage link. Feed posts are meant for other users to see. You should only share food, profile, or account information that you are comfortable making visible.",
      },
      {
        title: "Service providers",
        text:
          "fitme.io may connect to services such as payment, bank lookup, notification, hosting, analytics, or AI providers so the app can work. These services should only receive the information needed for their task.",
      },
      {
        title: "Your control",
        text:
          "You can update your profile, manage storage, choose what to post, and contact the app admin for account or subscription questions. Some records may be kept when needed for security, payment review, or service operation.",
      },
    ],
  },
};

export function LegalPage({ type }) {
  const page = content[type] || content.terms;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        <span>Last updated: {page.updated}</span>
      </div>

      <div className={styles.sections}>
        {page.sections.map((section) => (
          <article className={styles.section} key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
