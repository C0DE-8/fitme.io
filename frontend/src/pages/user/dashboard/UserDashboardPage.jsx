import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../../../lib/api";
import { getFoodSuggestions } from "../../../lib/api/usersFoodApi";
import { getUserProfile, getUserStorage } from "../../../lib/api/userApi";
import { hasSeenStoragePrompt, markStoragePromptSeen } from "../../../lib/auth";
import styles from "./UserDashboardPage.module.css";

const foodTypes = [
  { value: "rice", label: "Rice" },
  { value: "swallow", label: "Swallow" },
  { value: "junks", label: "Junks" },
];

export function UserDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [storage, setStorage] = useState([]);
  const [selectedType, setSelectedType] = useState("rice");
  const [recommendation, setRecommendation] = useState(null);
  const [otherSuggestions, setOtherSuggestions] = useState([]);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState("");
  const [foodError, setFoodError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      setError("");

      try {
        const [profileData, storageData] = await Promise.all([
          getUserProfile(),
          getUserStorage().catch(() => []),
        ]);

        if (!alive) return;

        setProfile(profileData);
        setStorage(storageData || []);
      } catch (err) {
        if (alive) setError(getApiError(err, "Unable to load your dashboard"));
      }
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  async function runFindMeals() {
    setStorageModalOpen(false);
    setFinding(true);
    setFoodError("");
    setRecommendation(null);

    try {
      const data = await getFoodSuggestions(selectedType);
      const foods = data?.foods || [];

      setRecommendation(foods[0] || null);
      setOtherSuggestions(foods.slice(1, 5));
    } catch (err) {
      setFoodError(getApiError(err, "Could not find meal suggestions right now"));
    } finally {
      setFinding(false);
    }
  }

  function handleFindMeals(event) {
    event.preventDefault();

    if (hasSeenStoragePrompt()) {
      runFindMeals();
      return;
    }

    markStoragePromptSeen();
    setStorageModalOpen(true);
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1>Good to see you, {profile?.username || "there"}</h1>
          <p>Ask fitme AI for one meal idea based on your storage and the foods configured in fitme.io.</p>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.plannerGrid}>
        <section className={styles.askPanel}>
          <div className={styles.panelTitle}>
            <span className={styles.aiBadge}>AI</span>
            <div>
              <h2>Ask fitme AI</h2>
              <p>Choose a food style</p>
            </div>
          </div>

          <div className={styles.chips} aria-label="Food type">
            {foodTypes.map((type) => (
              <button
                className={selectedType === type.value ? styles.chipActive : styles.chip}
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value);
                  setRecommendation(null);
                  setOtherSuggestions([]);
                  setFoodError("");
                }}
                type="button"
              >
                {type.label}
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={handleFindMeals}>
            <div className={styles.storageNote}>
              <strong>{storage.length ? "Storage connected" : "Storage needs items"}</strong>
              <span>
                {storage.length
                  ? "Your saved ingredients will be used to choose a better meal match."
                  : "Add items on the Storage page before asking for the best result."}
              </span>
            </div>
            <button className={styles.primary} type="submit" disabled={finding}>
              {finding ? "Finding meal..." : "Ask fitme AI"}
            </button>
            <button
              className={styles.secondary}
              type="button"
              onClick={() => {
                setRecommendation(null);
                setOtherSuggestions([]);
                setFoodError("");
              }}
            >
              Clear response
            </button>
          </form>

          {foodError ? <p className={styles.error}>{foodError}</p> : null}
        </section>

        <section className={styles.responsePanel}>
          <div className={styles.responseHeader}>
            <h2>Best meal match</h2>
            <span>{finding ? "Checking" : selectedType}</span>
          </div>

          {finding ? (
            <div className={styles.skeleton} aria-label="Finding meal suggestion">
              <span />
              <span />
              <span />
              <div />
            </div>
          ) : recommendation ? (
            <>
              <div className={styles.recommendation}>
                <strong>{recommendation.name}</strong>
                {recommendation.image_url ? <img src={recommendation.image_url} alt="" /> : null}
                <Link className={styles.detailsLink} to={`/foods/${recommendation.type}/${recommendation.id}`}>
                  Details
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <strong>No suggestion yet.</strong>
              <p>Choose a style and tap Ask fitme AI to get a meal recommendation.</p>
            </div>
          )}

          {!finding && otherSuggestions.length ? (
            <div className={styles.otherSuggestions}>
              <div className={styles.otherHeader}>
                <h3>Other suggestions</h3>
                <span>{otherSuggestions.length} options</span>
              </div>
              <div className={styles.otherList}>
                {otherSuggestions.map((food) => (
                  <article key={food.id}>
                    <div className={styles.suggestionSummary}>
                      {food.image_url ? <img src={food.image_url} alt="" /> : <span>{food.name?.charAt(0) || "F"}</span>}
                      <div>
                        <strong>{food.name}</strong>
                      </div>
                    </div>
                    <Link to={`/foods/${food.type}/${food.id}`}>Details</Link>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {storageModalOpen ? (
          <div className={styles.modalBackdrop} role="presentation">
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Check your storage">
              <div className={styles.modalIcon}>AI</div>
              <p className={styles.kicker}>Storage check</p>
              <h2>Is your storage up to date?</h2>
              <p>
                fitme AI uses your saved storage to choose a better meal. Update it first if your pantry has changed.
              </p>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => navigate("/storage")}>
                  Update storage
                </button>
                <button type="button" onClick={runFindMeals}>
                  My storage is updated
                </button>
              </div>

              <button className={styles.modalCancel} type="button" onClick={() => setStorageModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
