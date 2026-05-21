import { useEffect, useMemo, useState } from "react";
import { getApiError } from "../../../lib/api";
import {
  addUserStorageItem,
  disableUserStorageShare,
  enableUserStorageShare,
  getUserStorage,
  getUserStorageFriendSuggestions,
  getUserStorageItems,
  removeAllUserStorageItems,
  removeUserStorageFriendSuggestion,
  removeUserStorageItem,
} from "../../../lib/api/userApi";
import styles from "./UserStoragePage.module.css";

function itemKey(value) {
  return String(value || "").trim().toLowerCase();
}

export function UserStoragePage() {
  const [storage, setStorage] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [query, setQuery] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function refreshStorage() {
    setError("");

  try {
      const [storageData, availableData, friendData] = await Promise.all([
        getUserStorage(),
        getUserStorageItems(),
        getUserStorageFriendSuggestions(),
      ]);
      setStorage(storageData || []);
      setAvailableItems(availableData || []);
      setFriendSuggestions(friendData || []);
    } catch (err) {
      setError(getApiError(err, "Unable to load your storage"));
    }
  }

  useEffect(() => {
    let alive = true;

    Promise.all([getUserStorage(), getUserStorageItems(), getUserStorageFriendSuggestions()])
      .then(([storageData, availableData, friendData]) => {
        if (!alive) return;
        setStorage(storageData || []);
        setAvailableItems(availableData || []);
        setFriendSuggestions(friendData || []);
      })
      .catch((err) => {
        if (alive) setError(getApiError(err, "Unable to load your storage"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const storageNames = useMemo(() => new Set(storage.map((item) => itemKey(item.item_name))), [storage]);

  const matchingItems = useMemo(() => {
    const value = itemKey(query);
    if (!value) return [];

    return availableItems
      .filter((item) => itemKey(item.name).includes(value))
      .filter((item) => !storageNames.has(itemKey(item.name)))
      .sort((a, b) => {
        const aName = itemKey(a.name);
        const bName = itemKey(b.name);
        const aStarts = aName.startsWith(value);
        const bStarts = bName.startsWith(value);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return aName.localeCompare(bName);
      })
      .slice(0, 8);
  }, [availableItems, query, storageNames]);

  async function addItem(name) {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      await addUserStorageItem(name);
      setStatus(`${name} added to your storage.`);
      setQuery("");
      await refreshStorage();
    } catch (err) {
      setError(getApiError(err, "Unable to add item"));
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item) {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      await removeUserStorageItem(item.id);
      setStatus(`${item.item_name} removed from storage.`);
      await refreshStorage();
    } catch (err) {
      setError(getApiError(err, "Unable to remove item"));
    } finally {
      setSaving(false);
    }
  }

  async function clearStorage() {
    if (!storage.length) return;

    setSaving(true);
    setError("");
    setStatus("");

    try {
      await removeAllUserStorageItems();
      setStatus("Storage cleared.");
      await refreshStorage();
    } catch (err) {
      setError(getApiError(err, "Unable to clear storage"));
    } finally {
      setSaving(false);
    }
  }

  async function shareStorage() {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const data = await enableUserStorageShare();
      setShareUrl(data.app_share_url || data.share_url);
      setStatus("Sharing enabled.");
    } catch (err) {
      setError(getApiError(err, "Unable to share storage"));
    } finally {
      setSaving(false);
    }
  }

  async function disableShare() {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      await disableUserStorageShare();
      setShareUrl("");
      setStatus("Sharing disabled.");
    } catch (err) {
      setError(getApiError(err, "Unable to disable sharing"));
    } finally {
      setSaving(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard?.writeText(shareUrl);
    setStatus("Share link copied.");
  }

  async function removeFriendSuggestion(suggestion) {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      await removeUserStorageFriendSuggestion(suggestion.id);
      setFriendSuggestions((items) => items.filter((item) => item.id !== suggestion.id));
      setStatus("Suggestion removed.");
    } catch (err) {
      setError(getApiError(err, "Unable to remove suggestion"));
    } finally {
      setSaving(false);
    }
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>fitme.io</p>
          <h1>Your Storage</h1>
          <p>Search ingredients as you type, add them to your storage, and share a read-only pantry link.</p>
        </div>
        <div className={styles.countCard}>
          <span>Your items</span>
          <strong>{loading ? "..." : storage.length}</strong>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {status ? <p className={styles.status}>{status}</p> : null}

      <section className={styles.addPanel}>
        <div>
          <h2>Add ingredients</h2>
          <p>Start typing to find an approved storage item.</p>
        </div>
        <div className={styles.searchBox}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matchingItems[0]) {
                event.preventDefault();
                addItem(matchingItems[0].name);
              }
            }}
            placeholder="Search rice, onion, tomato..."
            aria-autocomplete="list"
            aria-controls="storage-suggestions"
          />

          {query ? (
            <div className={styles.suggestions} id="storage-suggestions" role="listbox">
              {matchingItems.map((item) => (
                <button key={item.id} type="button" disabled={saving} onClick={() => addItem(item.name)} role="option">
                  {item.image_url ? <img src={item.image_url} alt="" /> : <span>{item.name?.charAt(0) || "I"}</span>}
                  <strong>{item.name}</strong>
                  <em>Add</em>
                </button>
              ))}
              {!matchingItems.length ? <p>No available item matches this search.</p> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.sharePanel}>
        <div>
          <h2>Share storage</h2>
          <p>Create a read-only link for someone to view your available ingredients.</p>
        </div>
        <div className={styles.shareActions}>
          <button type="button" disabled={saving} onClick={shareStorage}>
            Create share link
          </button>
          <button type="button" disabled={saving || !shareUrl} onClick={disableShare}>
            Disable sharing
          </button>
        </div>
        {shareUrl ? (
          <div className={styles.shareUrl}>
            <input readOnly value={shareUrl} />
            <button type="button" onClick={copyShareUrl}>
              Copy
            </button>
          </div>
        ) : null}
      </section>

      <section className={styles.friendPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Friends</p>
            <h2>Suggestions from friends</h2>
          </div>
          <span className={styles.friendCount}>{friendSuggestions.length}</span>
        </div>

        <div className={styles.friendSlider}>
          {friendSuggestions.map((suggestion) => (
            <article className={styles.friendCard} key={suggestion.id}>
              {suggestion.image_url ? (
                <img src={suggestion.image_url} alt="" />
              ) : (
                <span>{suggestion.food_name?.charAt(0) || "F"}</span>
              )}
              <div>
                <strong>{suggestion.food_name}</strong>
                <p>Suggested by {suggestion.suggested_by_name}</p>
                {suggestion.note ? <small>{suggestion.note}</small> : null}
                <em>{suggestion.food_type}{formatDate(suggestion.created_at) ? ` · ${formatDate(suggestion.created_at)}` : ""}</em>
              </div>
              <button type="button" disabled={saving} onClick={() => removeFriendSuggestion(suggestion)}>
                Dismiss
              </button>
            </article>
          ))}

          {!loading && !friendSuggestions.length ? (
            <div className={styles.emptyState}>
              <strong>No friend suggestions yet.</strong>
              <p>Share your storage link so friends can pick meals for you by food id.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.itemsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Storage</p>
            <h2>Your items</h2>
          </div>
          <button type="button" disabled={saving || !storage.length} onClick={clearStorage}>
            Clear all
          </button>
        </div>

        <div className={styles.storageGrid}>
          {storage.map((item) => (
            <article className={styles.storageCard} key={item.id}>
              {item.image_url ? <img src={item.image_url} alt="" /> : <span>{item.item_name?.charAt(0) || "I"}</span>}
              <div>
                <strong>{item.item_name}</strong>
                <p>Available for meal planning</p>
              </div>
              <button type="button" disabled={saving} onClick={() => removeItem(item)}>
                Delete
              </button>
            </article>
          ))}

          {!loading && !storage.length ? (
            <div className={styles.emptyState}>
              <strong>No storage items yet.</strong>
              <p>Search above and add ingredients so fitme AI can plan with your pantry.</p>
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
