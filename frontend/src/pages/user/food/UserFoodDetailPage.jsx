import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiError } from "../../../lib/api";
import { getFoodSuggestion } from "../../../lib/api/usersFoodApi";
import styles from "./UserFoodDetailPage.module.css";

function formatMoney(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatNames(items, fallback) {
  if (!items?.length) return fallback;
  return items.map((item) => item.name).join(", ");
}

function buildCookingSteps(prepared) {
  const text = prepared || "Start with your ingredients, cook them carefully, and adjust seasoning to taste.";
  const steps = text
    .split(/(?:\n+|(?<=[.!?])\s+)/)
    .map((step) => step.trim())
    .filter(Boolean);

  return steps.length ? steps : [text];
}

export function UserFoodDetailPage() {
  const { type, id } = useParams();
  const [food, setFood] = useState(null);
  const [chatAsked, setChatAsked] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showAiResponse, setShowAiResponse] = useState(false);
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
          setChatAsked(false);
          setTyping(false);
          setShowAiResponse(false);
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

  function askFitmeAi() {
    setChatAsked(true);
    setTyping(true);
    setShowAiResponse(false);

    window.setTimeout(() => {
      setTyping(false);
      setShowAiResponse(true);
    }, 1200);
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

          <section className={styles.aiChat} aria-label="fitme.io AI meal chat">
            <div className={styles.aiChatHeader}>
              <div className={styles.aiTitle}>
                <span>AI</span>
                <div>
                  <p className={styles.kicker}>fitme.io AI</p>
                  <h2>Meal assistant</h2>
                </div>
              </div>
            </div>

            <div className={styles.chatStream}>
              <div className={styles.aiBubble}>
                <p className={styles.chatText}>
                  I can check your ingredients, show what is missing, and organize the cooking steps for {food.name}.
                </p>
                {!chatAsked ? (
                  <button className={styles.askAiButton} type="button" onClick={askFitmeAi}>
                    Ask fitme.io AI
                  </button>
                ) : null}
              </div>

              {chatAsked ? (
                <div className={styles.userBubble}>
                  <p>Tell me what I have, what is missing, and how to cook this meal.</p>
                </div>
              ) : null}

              {typing ? (
                <div className={styles.aiBubble}>
                  <p className={styles.chatText}>fitme.io AI is checking your meal plan...</p>
                  <div className={styles.typingDots} aria-label="fitme.io AI is typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}

              {showAiResponse ? (
                <div className={styles.aiBubble}>
                  <div className={styles.aiAnswer}>
                    <p>
                      For <strong>{food.name}</strong>, you have{" "}
                      <strong>{formatNames(food.ingredients, "no saved ingredients yet")}</strong>.
                      {food.missingIngredients?.length
                        ? ` You are missing ${formatNames(food.missingIngredients, "")}.`
                        : " Nothing is missing from your storage."}
                    </p>

                    <div className={styles.aiTableWrap}>
                      <table className={styles.aiTable}>
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Item</th>
                            <th>Status</th>
                            <th>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(food.ingredients || []).map((item) => {
                            const isMissing = food.missingIngredients?.some((missing) => missing.name === item.name);
                            return (
                              <tr key={item.name}>
                                <td>
                                  {item.image_url ? (
                                    <img className={styles.ingredientThumb} src={item.image_url} alt="" />
                                  ) : (
                                    <span className={styles.ingredientThumbFallback}>{item.name?.charAt(0) || "I"}</span>
                                  )}
                                </td>
                                <td>{item.name}</td>
                                <td>{isMissing ? "Missing" : "Available"}</td>
                                <td>{formatMoney(item.cost)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {food.missingIngredients?.length ? (
                      <div className={styles.aiSection}>
                        <h3>Missing ingredients</h3>
                        <ul>
                          {food.missingIngredients.map((item) => (
                            <li key={item.name}>
                              <span>
                                {item.image_url ? (
                                  <img className={styles.ingredientMiniThumb} src={item.image_url} alt="" />
                                ) : null}
                                {item.name}
                              </span>
                              <strong>{formatMoney(item.cost)}</strong>
                            </li>
                          ))}
                        </ul>
                        <p>Estimated missing cost: {formatMoney(food.totalMissingCost)}</p>
                      </div>
                    ) : (
                      <div className={styles.aiSection}>
                        <h3>Missing ingredients</h3>
                        <p>Your storage has everything currently needed for this meal.</p>
                      </div>
                    )}

                    <div className={styles.aiSection}>
                      <h3>Cooking flow</h3>
                      <ol>
                        {buildCookingSteps(food.prepared).map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
