import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useToast } from "../../components/feedback/useToast";
import { getApiError } from "../../lib/api";
import { getSharedStorage, getSharedStorageSuggestions, submitSharedStorageSuggestion } from "../../lib/api/userApi";
import styles from "./SharedStoragePage.module.css";

const foodTypes = [
  { value: "", label: "All" },
  { value: "rice", label: "Rice" },
  { value: "swallow", label: "Swallow" },
  { value: "junks", label: "Junks" },
];

export function SharedStoragePage() {
  const { shareId } = useParams();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [storage, setStorage] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [suggestedByName, setSuggestedByName] = useState("");
  const [suggestionNote, setSuggestionNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [pickingId, setPickingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadSharedStorage() {
      setLoading(true);
      setError("");

      try {
        const data = await getSharedStorage(shareId);
        if (!alive) return;
        setUsername(data.username || "This user");
        setStorage(data.storage || []);
      } catch (err) {
        if (alive) {
          const message = getApiError(err, "Unable to load shared storage");
          setError(message);
          toast.error(message, { title: "Shared storage unavailable" });
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadSharedStorage();

    return () => {
      alive = false;
    };
  }, [shareId, toast]);

  async function loadSuggestions(type = selectedType) {
    setSuggesting(true);

    try {
      const data = await getSharedStorageSuggestions(shareId, type);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      toast.error(getApiError(err, "Unable to load meal suggestions"), { title: "Meal suggestions unavailable" });
    } finally {
      setSuggesting(false);
    }
  }

  async function pickSuggestion(food) {
    const friendName = suggestedByName.trim();
    if (!friendName) {
      toast.info("Enter your name so they know who suggested the meal.", { title: "Your name is needed" });
      return;
    }

    setPickingId(`${food.type}-${food.id}`);

    try {
      await submitSharedStorageSuggestion(shareId, food.id, {
        suggested_by_name: friendName,
        note: suggestionNote,
      });
      toast.success(`${food.name} sent to ${username || "this user"}.`, { title: "Suggestion sent" });
      setSuggestionNote("");
    } catch (err) {
      toast.error(getApiError(err, "Unable to send this suggestion"), { title: "Suggestion not sent" });
    } finally {
      setPickingId("");
    }
  }

  const filteredStorage = useMemo(() => {
    const query = search.trim().toLowerCase();
    return storage.filter((item) => !query || item.item_name?.toLowerCase().includes(query));
  }, [search, storage]);

  const suggestedStorage = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    return storage
      .filter((item) => item.item_name?.toLowerCase().includes(query))
      .sort((a, b) => {
        const aName = a.item_name?.toLowerCase() || "";
        const bName = b.item_name?.toLowerCase() || "";
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return aName.localeCompare(bName);
      })
      .slice(0, 8);
  }, [search, storage]);

  return (
    <section className={styles.page}>
      <div className={styles.topbar}>
        <Link to="/">fitme.io</Link>
      </div>

      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Shared storage</p>
          <h1>{username}&apos;s pantry</h1>
          <p>Read-only view of ingredients currently available for meal planning.</p>
        </div>
        <div className={styles.countCard}>
          <span>Total items</span>
          <strong>{loading ? "..." : storage.length}</strong>
        </div>
      </div>

      {!error ? (
        <>
          <div className={styles.searchBox}>
            <input
              className={styles.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search shared storage..."
            />

            {search ? (
              <div className={styles.suggestions}>
                {suggestedStorage.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSearch(item.item_name)}>
                    {item.image_url ? <img src={item.image_url} alt="" /> : <span>{item.item_name?.charAt(0) || "I"}</span>}
                    <strong>{item.item_name}</strong>
                  </button>
                ))}
                {!suggestedStorage.length ? <p>No matching shared item.</p> : null}
              </div>
            ) : null}
          </div>

          <div className={styles.storageGrid}>
            {filteredStorage.map((item) => (
              <article className={styles.storageCard} key={item.id}>
                {item.image_url ? <img src={item.image_url} alt="" /> : <span>{item.item_name?.charAt(0) || "I"}</span>}
                <div>
                  <strong>{item.item_name}</strong>
                  <p>Available in storage</p>
                </div>
              </article>
            ))}

            {!loading && !filteredStorage.length ? (
              <div className={styles.emptyState}>
                <strong>{storage.length ? "No matching items." : "This storage is empty."}</strong>
                <p>Try another search or ask the owner to update their storage.</p>
              </div>
            ) : null}
          </div>

          <section className={styles.suggestionPanel}>
            <div className={styles.suggestionHeader}>
              <div>
                <p className={styles.kicker}>Meal ideas</p>
                <h2>Suggest what {username || "this user"} can cook</h2>
              </div>
              <button type="button" disabled={suggesting || !storage.length} onClick={() => loadSuggestions()}>
                {suggesting ? "Checking..." : "Suggest meals"}
              </button>
            </div>

            <div className={styles.typeChips} aria-label="Food type">
              {foodTypes.map((type) => (
                <button
                  className={selectedType === type.value ? styles.typeActive : ""}
                  key={type.value || "all"}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.value);
                    if (suggestions.length) loadSuggestions(type.value);
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {suggestions.length ? (
              <div className={styles.friendForm}>
                <label>
                  <span>Your name</span>
                  <input
                    value={suggestedByName}
                    onChange={(event) => setSuggestedByName(event.target.value)}
                    placeholder="Who is suggesting?"
                    maxLength={80}
                  />
                </label>
                <label>
                  <span>Message</span>
                  <textarea
                    value={suggestionNote}
                    onChange={(event) => setSuggestionNote(event.target.value)}
                    placeholder="Optional note"
                    rows={2}
                    maxLength={500}
                  />
                </label>
              </div>
            ) : null}

            {suggestions.length ? (
              <div className={styles.mealSlider}>
                {suggestions.slice(0, 12).map((food) => (
                  <article className={styles.mealCard} key={`${food.type}-${food.id}`}>
                    {food.image_url ? <img src={food.image_url} alt="" /> : <span>{food.name?.charAt(0) || "F"}</span>}
                    <div>
                      <strong>{food.name}</strong>
                      <p>{food.canCook ? "Can cook now" : `Missing ₦${Number(food.totalMissingCost || 0).toLocaleString()}`}</p>
                      <small>{food.availableIngredients?.length || 0} available ingredient{food.availableIngredients?.length === 1 ? "" : "s"}</small>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(pickingId)}
                      onClick={() => pickSuggestion(food)}
                    >
                      {pickingId === `${food.type}-${food.id}` ? "Sending..." : "Suggest this"}
                    </button>
                  </article>
                ))}
              </div>
            ) : !suggesting ? (
              <p className={styles.suggestionEmpty}>Tap Suggest meals to rank foods against this shared storage.</p>
            ) : null}
          </section>
        </>
      ) : (
        <div className={styles.emptyState}>
          <strong>Shared storage is unavailable.</strong>
          <p>{error}</p>
        </div>
      )}
    </section>
  );
}
