import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { getBudgetFoodSuggestions } from "../../../lib/api/usersFoodApi";
import styles from "../dashboard/UserDashboardPage.module.css";

const foodTypes = [
  { value: "rice", label: "Rice" },
  { value: "swallow", label: "Swallow" },
  { value: "junks", label: "Others" },
];

function foodTypeLabel(value) {
  return foodTypes.find((type) => type.value === value)?.label || value;
}

export function UserBudgetPage() {
  const toast = useToast();
  const [budget, setBudget] = useState("");
  const [budgetMeta, setBudgetMeta] = useState(null);
  const [selectedType, setSelectedType] = useState("rice");
  const [recommendation, setRecommendation] = useState(null);
  const [finding, setFinding] = useState(false);

  async function runBudgetMeals(event) {
    event.preventDefault();

    const amount = Number(budget);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid budget amount.", { title: "Budget required" });
      return;
    }

    setFinding(true);
    setRecommendation(null);

    try {
      const data = await getBudgetFoodSuggestions(selectedType, amount);
      const foods = (data?.tiers || []).flatMap((tier) => tier.foods || []);
      const topPick = data?.topPick || foods[0] || null;

      setRecommendation(
        topPick
          ? {
              ...topPick,
              message: data?.message || "This meal fits your budget.",
            }
          : null
      );
      setBudgetMeta(data || null);
    } catch (err) {
      toast.error(getApiError(err, "Could not find meals within this budget"), { title: "Budget search failed" });
    } finally {
      setFinding(false);
    }
  }

  function resetResults() {
    setRecommendation(null);
    setBudgetMeta(null);
  }

  const budgetTierCount = budgetMeta?.tiers?.length || 0;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1>Plan with a budget</h1>
          <p>Pick a food style, enter your amount, and find meals that fit what you want to spend.</p>
        </div>
      </div>

      <div className={styles.plannerGrid}>
        <section className={styles.askPanel}>
          <div className={styles.panelTitle}>
            <span className={styles.aiBadge}>₦</span>
            <div>
              <h2>Budget planner</h2>
              <p>Find food by budget</p>
            </div>
          </div>

          <div className={styles.chips} aria-label="Food type">
            {foodTypes.map((type) => (
              <button
                className={selectedType === type.value ? styles.chipActive : styles.chip}
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value);
                  resetResults();
                }}
                type="button"
              >
                {type.label}
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={runBudgetMeals}>
            <label className={styles.budgetField}>
              Budget amount
              <input
                min="1"
                type="number"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="e.g. 5000"
              />
            </label>
            <button className={styles.primary} type="submit" disabled={finding}>
              {finding ? "Finding meal..." : "Find by budget"}
            </button>
            <button className={styles.secondary} type="button" onClick={resetResults}>
              Clear response
            </button>
          </form>

        </section>

        <section className={styles.responsePanel}>
          <div className={styles.responseHeader}>
            <h2>Best budget match</h2>
            <span>{finding ? "Checking" : foodTypeLabel(selectedType)}</span>
          </div>

          {finding ? (
            <div className={styles.skeleton} aria-label="Finding budget suggestion">
              <span />
              <span />
              <span />
              <div />
            </div>
          ) : recommendation ? (
            <>
              {budgetMeta ? (
                <div className={styles.budgetBanner}>
                  <span />
                  <p>
                    Found {budgetTierCount} price tier{budgetTierCount === 1 ? "" : "s"} within your budget of ₦
                    {Number(budgetMeta.budget || 0).toLocaleString()}.
                  </p>
                </div>
              ) : null}

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
              <strong>No budget suggestion yet.</strong>
              <p>Enter a budget amount and tap Find by budget to get matching meals.</p>
            </div>
          )}

          {!finding && budgetMeta?.tiers?.length ? (
            <div className={styles.budgetTiers}>
              <div className={styles.otherHeader}>
                <h3>All options</h3>
                <span>{budgetMeta.tiers.length} tiers</span>
              </div>
              <div className={styles.tierList}>
                {budgetMeta.tiers.map((tier) => (
                  <section key={tier.price}>
                    <div className={styles.tierHeader}>
                      <strong>₦{Number(tier.price || 0).toLocaleString()} options</strong>
                      <span>
                        {tier.count} item{tier.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className={styles.tierFoods}>
                      {(tier.foods || []).slice(0, 4).map((food) => (
                        <article key={food.id}>
                          <div className={styles.suggestionSummary}>
                            {food.image_url ? (
                              <img src={food.image_url} alt="" />
                            ) : (
                              <span>{food.name?.charAt(0) || "F"}</span>
                            )}
                            <div>
                              <strong>{food.name}</strong>
                            </div>
                          </div>
                          <Link to={`/foods/${food.type}/${food.id}`}>Details</Link>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
