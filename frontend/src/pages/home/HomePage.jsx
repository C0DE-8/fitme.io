import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDatabase,
  FiMessageCircle,
  FiShare2,
  FiShoppingBag,
  FiZap,
} from "react-icons/fi";
import { getCurrentUser, getToken } from "../../lib/auth";
import styles from "./HomePage.module.css";

const slides = [
  {
    label: "Storage AI",
    title: "Cook from what you already have",
    text: "Add rice, tomato, fish, spices, noodles, or anything in your kitchen. fitme.io reads the storage list and suggests food that makes sense.",
    meta: ["Rice", "Tomato", "Fish"],
  },
  {
    label: "Shared storage",
    title: "Let friends help with your food list",
    text: "Share a storage link with friends or family so they can see what is available before planning meals together.",
    meta: ["Share link", "View list", "Plan together"],
  },
  {
    label: "Food feed",
    title: "Post what you cooked",
    text: "Turn meals into stories. Users can post food updates, see what others are eating, and keep the app social and fun.",
    meta: ["Stories", "Comments", "Food ideas"],
  },
];

const features = [
  {
    icon: FiDatabase,
    title: "Storage-first meal ideas",
    text: "The AI starts with your saved ingredients so suggestions feel useful, not random.",
  },
  {
    icon: FiShare2,
    title: "Storage sharing",
    text: "Send your storage list to someone else when you want help deciding what to cook.",
  },
  {
    icon: FiMessageCircle,
    title: "Food stories",
    text: "Post meals to the feed and discover what other users are cooking.",
  },
  {
    icon: FiShoppingBag,
    title: "Budget-aware planning",
    text: "See what you can cook now and what extra items may be needed.",
  },
];

const steps = [
  ["Save storage", "Add the food and ingredients you already have at home."],
  ["Ask the AI", "fitme.io checks your list and suggests the best meals to cook."],
  ["Share or post", "Share storage with friends or post your food story to the feed."],
];

export function HomePage() {
  const user = getCurrentUser();
  const hasSession = Boolean(getToken());
  const isAdmin = user?.role === "admin";
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = slides[activeSlide];
  const actionPath = useMemo(() => {
    if (!hasSession) return "/auth";
    return isAdmin ? "/admin" : "/dashboard";
  }, [hasSession, isAdmin]);

  function showPreviousSlide() {
    setActiveSlide((current) => (current === 0 ? slides.length - 1 : current - 1));
  }

  function showNextSlide() {
    setActiveSlide((current) => (current + 1) % slides.length);
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.kicker}>AI food planner for real kitchens</p>
          <h1>fitme.io helps you decide what to cook next.</h1>
          <p className={styles.lead}>
            Save your food storage, let the AI suggest meals from what you have, share storage with friends,
            and post food stories in a social feed built for everyday cooking.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} to={actionPath}>
              <span>{hasSession ? (isAdmin ? "Open admin" : "Open dashboard") : "Start planning"}</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
            <Link className={styles.secondary} to={hasSession ? "/foods" : "/auth"}>
              {hasSession ? "View feed" : "Sign in"}
            </Link>
          </div>
        </div>

        <div className={styles.slider} aria-label="fitme.io feature slider">
          <div className={styles.sliderViewport}>
            <div className={styles.sliderTrack} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {slides.map((slide) => (
                <article className={styles.slide} key={slide.title}>
                  <div className={styles.slideTop}>
                    <span>{slide.label}</span>
                    <FiZap aria-hidden="true" />
                  </div>
                  <h2>{slide.title}</h2>
                  <p>{slide.text}</p>
                  <div className={styles.metaList}>
                    {slide.meta.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.sliderControls}>
            <button type="button" onClick={showPreviousSlide} aria-label="Show previous feature">
              <FiChevronLeft aria-hidden="true" />
            </button>
            <div className={styles.dots} aria-label={`Showing ${currentSlide.label}`}>
              {slides.map((slide, index) => (
                <button
                  className={index === activeSlide ? styles.dotActive : styles.dot}
                  type="button"
                  key={slide.title}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show ${slide.label}`}
                />
              ))}
            </div>
            <button type="button" onClick={showNextSlide} aria-label="Show next feature">
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article className={styles.feature} key={feature.title}>
              <span className={styles.featureIcon}>
                <Icon aria-hidden="true" />
              </span>
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </article>
          );
        })}
      </div>

      <div className={styles.workflow}>
        <div>
          <p className={styles.kicker}>How it works</p>
          <h2>From storage to food ideas in a few steps.</h2>
        </div>
        <div className={styles.steps}>
          {steps.map(([title, text], index) => (
            <article className={styles.step} key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.feedBand}>
        <div>
          <FiClock aria-hidden="true" />
          <h2>Fun enough for daily use.</h2>
          <p>
            The app is not only a planner. It gives users a place to show what they eat, learn from other
            meals, and keep food decisions moving with friends.
          </p>
        </div>
        <Link to={hasSession ? "/foods" : "/auth"}>Explore the feed</Link>
      </div>
    </section>
  );
}
