import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiError } from "../../../lib/api";
import { getFoodSuggestion } from "../../../lib/api/usersFoodApi";
import styles from "./UserFoodDetailPage.module.css";

function formatMoney(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function buildAiPreparation(food) {
  const intro = `Here is a simple way to prepare ${food?.name || "this meal"} with your current plan.`;
  const prepared = food?.prepared || "Start with your ingredients, cook them carefully, and adjust seasoning to taste.";
  const missing = food?.missingIngredients?.length
    ? `You are still missing ${food.missingIngredients.map((item) => item.name).join(", ")}. Get those first for the best result.`
    : "Your storage looks ready for this meal.";

  return `${intro}\n\n${missing}\n\n${prepared}`;
}

export function UserFoodDetailPage() {
  const { type, id } = useParams();
  const [food, setFood] = useState(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [prepText, setPrepText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadFood() {
      setLoading(true);
      setError("");

      try {
        const data = await getFoodSuggestion(type, id);
        if (alive) {
          setFood(data);
        }
      } catch (err) {
        if (alive) setError(getApiError(err, "Unable to load food details"));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadFood();

    return () => {
      alive = false;
    };
  }, [id, type]);

  useEffect(() => {
    if (!prepOpen || !food) return undefined;

    const text = buildAiPreparation(food);
    let index = 0;

    const interval = window.setInterval(() => {
      index += 1;
      setPrepText(text.slice(0, index));
      if (index >= text.length) window.clearInterval(interval);
    }, 18);

    return () => window.clearInterval(interval);
  }, [food, prepOpen]);

  function downloadShoppingList() {
    const items = food?.missingIngredients || [];
    const lines = [
      "fitme.io shopping checklist",
      `Meal: ${food?.name || "Food"}`,
      `Estimated missing cost: ${formatMoney(food?.totalMissingCost)}`,
      "",
      ...items.map((item) => `[ ] ${item.name} - ${formatMoney(item.cost)}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitme-shopping-${food?.name || "list"}.txt`.replace(/\s+/g, "-").toLowerCase();
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={styles.page}>
      <div className={styles.topbar}>
        <Link to="/dashboard">Back</Link>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <div className={styles.skeleton}>
          <span />
          <span />
          <div />
        </div>
      ) : food ? (
        <>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>{food.type}</p>
              <h1>{food.name}</h1>
              <p>{food.package}</p>
              <div className={styles.priceRow}>
                <strong>{formatMoney(food.estimated_cost)}</strong>
                {food.original_estimated_cost ? (
                  <span>Original {formatMoney(food.original_estimated_cost)}</span>
                ) : null}
              </div>
            </div>
            <div className={styles.heroMedia}>
              {food.image_url ? <img src={food.image_url} alt="" /> : <div className={styles.imageFallback}>F</div>}
            </div>
          </section>

          <section className={styles.costGrid}>
            <article>
              <span>Missing cost</span>
              <strong>{formatMoney(food.totalMissingCost)}</strong>
            </article>
          </section>

          <div className={styles.grid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Ingredients</h2>
              </div>
              <ul className={styles.list}>
                {(food.ingredients || []).map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <strong>{formatMoney(item.cost)}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Missing ingredients</h2>
                <div className={styles.panelActions}>
                  <span>{formatMoney(food.totalMissingCost)}</span>
                  <button
                    type="button"
                    disabled={!food.missingIngredients?.length}
                    onClick={() => setShoppingOpen(true)}
                  >
                    Generate list
                  </button>
                </div>
              </div>
              <ul className={styles.list}>
                {(food.missingIngredients || []).map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <strong>{formatMoney(item.cost)}</strong>
                  </li>
                ))}
                {!food.missingIngredients?.length ? <li>You have everything needed.</li> : null}
              </ul>
            </section>

            <section className={styles.panelFull}>
              <div className={styles.panelHeader}>
                <h2>Preparation</h2>
              </div>
              <div className={styles.prepBox}>
                <p>{food.prepared || "No preparation note has been added yet."}</p>
                <button
                  type="button"
                  onClick={() => {
                    setPrepText("");
                    setPrepOpen(true);
                  }}
                >
                  Ask fitme AI how to cook this
                </button>
              </div>
            </section>
          </div>

          {prepOpen ? (
            <div className={styles.modalBackdrop} role="presentation">
              <div className={styles.aiModal} role="dialog" aria-modal="true" aria-label="fitme AI preparation">
                <div className={styles.modalHeader}>
                  <div className={styles.aiTitle}>
                    <span>AI</span>
                    <div>
                      <p className={styles.kicker}>fitme AI</p>
                      <h2>How to cook this</h2>
                    </div>
                  </div>
                  <button type="button" onClick={() => setPrepOpen(false)}>
                    Close
                  </button>
                </div>
                <div className={styles.typingDots} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <pre className={styles.aiText}>{prepText}</pre>
              </div>
            </div>
          ) : null}

          {shoppingOpen ? (
            <div className={styles.modalBackdrop} role="presentation">
              <div className={styles.shoppingModal} role="dialog" aria-modal="true" aria-label="Shopping checklist">
                <div className={styles.modalHeader}>
                  <div>
                    <p className={styles.kicker}>Shopping checklist</p>
                    <h2>{food.name}</h2>
                  </div>
                  <button type="button" onClick={() => setShoppingOpen(false)}>
                    Close
                  </button>
                </div>

                <div className={styles.shoppingSummary}>
                  <span>Need to buy</span>
                  <strong>{formatMoney(food.totalMissingCost)}</strong>
                </div>

                <div className={styles.shoppingList}>
                  {(food.missingIngredients || []).map((item) => (
                    <label key={item.name}>
                      <input type="checkbox" />
                      <span>{item.name}</span>
                      <strong>{formatMoney(item.cost)}</strong>
                    </label>
                  ))}
                </div>

                <p className={styles.screenshotHint}>Screenshot this checklist or download it for market runs.</p>

                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShoppingOpen(false)}>
                    Done
                  </button>
                  <button type="button" onClick={downloadShoppingList}>
                    Download list
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
