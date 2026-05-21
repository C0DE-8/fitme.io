import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiError } from "../../../lib/api";
import {
  customizeFoodSuggestion,
  getFoodSuggestion,
} from "../../../lib/api/usersFoodApi";
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
  const [excluded, setExcluded] = useState([]);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [prepText, setPrepText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          setExcluded([]);
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

  function toggleExcluded(name) {
    setExcluded((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    );
  }

  async function applyCustomize() {
    setSaving(true);
    setError("");

    try {
      const data = await customizeFoodSuggestion(type, id, { exclude: excluded });
      setFood(data);
      setCustomizeOpen(false);
    } catch (err) {
      setError(getApiError(err, "Unable to customize this meal"));
    } finally {
      setSaving(false);
    }
  }

  async function resetCustomize() {
    setSaving(true);
    setError("");

    try {
      const data = await getFoodSuggestion(type, id);
      setFood(data);
      setExcluded([]);
    } catch (err) {
      setError(getApiError(err, "Unable to reset ingredients"));
    } finally {
      setSaving(false);
    }
  }

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
                <div className={styles.panelActions}>
                  <button type="button" onClick={() => setCustomizeOpen(true)}>
                    Customize
                  </button>
                </div>
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

            {food.excludedIngredients?.length ? (
              <section className={styles.panelFull}>
                <div className={styles.panelHeader}>
                  <h2>Excluded ingredients</h2>
                  <span>-{formatMoney(food.excluded_ingredients_cost)}</span>
                </div>
                <ul className={styles.excludedList}>
                  {food.excludedIngredients.map((item) => (
                    <li key={item.name}>
                      <span>{item.name}</span>
                      <strong>-{formatMoney(item.cost)}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

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

          {customizeOpen ? (
            <div className={styles.modalBackdrop} role="presentation">
              <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Customize ingredients">
                <div className={styles.modalHeader}>
                  <div>
                    <p className={styles.kicker}>Customize</p>
                    <h2>Remove ingredients</h2>
                  </div>
                  <button type="button" onClick={() => setCustomizeOpen(false)}>
                    Close
                  </button>
                </div>
                <p className={styles.modalText}>Uncheck anything you do not want included. fitme will update the total and missing cost.</p>
                <div className={styles.checkList}>
                  {(food.ingredients || []).map((item) => (
                    <label className={excluded.includes(item.name) ? styles.excludedChoice : ""} key={item.name}>
                      <input
                        checked={!excluded.includes(item.name)}
                        type="checkbox"
                        onChange={() => toggleExcluded(item.name)}
                      />
                      <div>
                        <span>{item.name}</span>
                        <small>{excluded.includes(item.name) ? "Excluded from meal" : "Included in meal"}</small>
                      </div>
                      <strong>{formatMoney(item.cost)}</strong>
                    </label>
                  ))}
                </div>
                <div className={styles.modalActions}>
                  <button type="button" disabled={saving} onClick={resetCustomize}>
                    {saving ? "Resetting..." : "Reset"}
                  </button>
                  <button type="button" disabled={saving} onClick={applyCustomize}>
                    {saving ? "Applying..." : "Apply changes"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

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
