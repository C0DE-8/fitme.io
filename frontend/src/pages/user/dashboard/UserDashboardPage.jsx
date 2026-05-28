import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { getFoodSuggestions, markFoodAsEaten } from "../../../lib/api/usersFoodApi";
import { getUserProfile, getUserStorage } from "../../../lib/api/userApi";
import { hasSeenStoragePrompt, markStoragePromptSeen } from "../../../lib/auth";
import styles from "./UserDashboardPage.module.css";

const foodTypes = [
  { value: "rice", label: "Rice" },
  { value: "swallow", label: "Swallow" },
  { value: "junks", label: "Others" },
];

function foodTypeLabel(value) {
  return foodTypes.find((type) => type.value === value)?.label || value;
}

function formatMoney(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function missingSummary(food) {
  const count = food?.missingIngredients?.length || 0;
  if (!count) return "Ready from storage";
  return `${count} missing ingredient${count === 1 ? "" : "s"}`;
}

export function UserDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [storage, setStorage] = useState([]);
  const [selectedType, setSelectedType] = useState("rice");
  const [recommendation, setRecommendation] = useState(null);
  const [otherSuggestions, setOtherSuggestions] = useState([]);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [finding, setFinding] = useState(false);
  const [markingEatenId, setMarkingEatenId] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        const [profileData, storageData] = await Promise.all([
          getUserProfile(),
          getUserStorage().catch(() => []),
        ]);

        if (!alive) return;

        setProfile(profileData);
        setStorage(storageData || []);
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Unable to load your dashboard"), { title: "Dashboard unavailable" });
      }
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, [toast]);

  async function runFindMeals() {
    setStorageModalOpen(false);
    setFinding(true);
    setRecommendation(null);

    try {
      const data = await getFoodSuggestions(selectedType);
      const foods = data?.foods || [];

      setRecommendation(foods[0] || null);
      setOtherSuggestions(foods.slice(1, 5));
    } catch (err) {
      toast.error(getApiError(err, "Could not find meal suggestions right now"), { title: "Meal search failed" });
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

  async function markSuggestionEaten(food) {
    setMarkingEatenId(food.id);

    try {
      await markFoodAsEaten(food.id);
      toast.success(`${food.name} marked as eaten.`, { title: "Suggestion rotated" });
      await runFindMeals();
    } catch (err) {
      toast.error(getApiError(err, "Unable to mark this food as eaten"), { title: "Update failed" });
    } finally {
      setMarkingEatenId(null);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1>Good to see you, {profile?.username || "there"}</h1>
          <p>Ask fitme AI for one meal idea based on your storage and the foods configured in fitme.io.</p>
        </div>
      </div>

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
              }}
            >
              Clear response
            </button>
          </form>

        </section>

        <section className={styles.responsePanel}>
          <div className={styles.responseHeader}>
            <h2>Best meal match</h2>
            <span>{finding ? "Checking" : foodTypeLabel(selectedType)}</span>
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
                {recommendation.message ? <p>{recommendation.message}</p> : null}
                <dl>
                  <div>
                    <dt>Estimated cost</dt>
                    <dd>{formatMoney(recommendation.estimated_cost)}</dd>
                  </div>
                  <div>
                    <dt>Storage match</dt>
                    <dd>{missingSummary(recommendation)}</dd>
                  </div>
                </dl>
                {recommendation.favorited || recommendation.recently_eaten ? (
                  <div className={styles.preferenceNote}>
                    {recommendation.favorited ? <span>Favorite match</span> : null}
                    {recommendation.recently_eaten ? <span>Recently eaten</span> : null}
                  </div>
                ) : null}
                <div className={styles.recommendationActions}>
                  <Link className={styles.detailsLink} to={`/foods/${recommendation.type}/${recommendation.id}`}>
                    Details
                  </Link>
                  <button
                    className={styles.markEatenButton}
                    type="button"
                    disabled={markingEatenId === recommendation.id || finding}
                    onClick={() => markSuggestionEaten(recommendation)}
                  >
                    {markingEatenId === recommendation.id ? "Rotating..." : "I've eaten this"}
                  </button>
                </div>
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
                <h3>Sub suggestions</h3>
                <span>{otherSuggestions.length} options</span>
              </div>
              <div className={styles.otherList}>
                {otherSuggestions.map((food) => {
                  const missingCost = Number(food.totalMissingCost || 0);

                  return (
                    <article key={food.id}>
                      <div className={styles.suggestionSummary}>
                        {food.image_url ? <img src={food.image_url} alt="" /> : <span>{food.name?.charAt(0) || "F"}</span>}
                        <div>
                          <strong>{food.name}</strong>
                          <small>{foodTypeLabel(food.type)} · {formatMoney(food.estimated_cost)}</small>
                          <em>{missingCost ? `Missing ${formatMoney(missingCost)}` : "Ready from storage"}</em>
                        </div>
                      </div>
                      <div className={styles.suggestionActions}>
                        <Link to={`/foods/${food.type}/${food.id}`}>Details</Link>
                        <button
                          type="button"
                          disabled={markingEatenId === food.id || finding}
                          onClick={() => markSuggestionEaten(food)}
                        >
                          Eaten
                        </button>
                      </div>
                    </article>
                  );
                })}
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
