import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../components/feedback/useToast";
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

function foodTypeLabel(value) {
  if (value === "junks") return "Others";
  if (!value) return "";
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export function UserStoragePage() {
  const toast = useToast();
  const [storage, setStorage] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [query, setQuery] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function refreshStorage() {
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
      toast.error(getApiError(err, "Unable to load your storage"), { title: "Storage unavailable" });
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
        if (alive) toast.error(getApiError(err, "Unable to load your storage"), { title: "Storage unavailable" });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [toast]);

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

    try {
      await addUserStorageItem(name);
      toast.success(`${name} added to your storage.`);
      setQuery("");
      await refreshStorage();
    } catch (err) {
      toast.error(getApiError(err, "Unable to add item"), { title: "Item not added" });
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item) {
    setSaving(true);

    try {
      await removeUserStorageItem(item.id);
      toast.success(`${item.item_name} removed from storage.`);
      await refreshStorage();
    } catch (err) {
      toast.error(getApiError(err, "Unable to remove item"), { title: "Item not removed" });
    } finally {
      setSaving(false);
    }
  }

  async function clearStorage() {
    if (!storage.length) return;

    setSaving(true);

    try {
      await removeAllUserStorageItems();
      toast.success("Storage cleared.");
      await refreshStorage();
    } catch (err) {
      toast.error(getApiError(err, "Unable to clear storage"), { title: "Storage not cleared" });
    } finally {
      setSaving(false);
    }
  }

  async function shareStorage() {
    setSaving(true);

    try {
      const data = await enableUserStorageShare();
      setShareUrl(data.app_share_url || data.share_url);
      toast.success("Sharing enabled.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to share storage"), { title: "Sharing failed" });
    } finally {
      setSaving(false);
    }
  }

  async function disableShare() {
    setSaving(true);

    try {
      await disableUserStorageShare();
      setShareUrl("");
      toast.success("Sharing disabled.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to disable sharing"), { title: "Sharing update failed" });
    } finally {
      setSaving(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard?.writeText(shareUrl);
    toast.success("Share link copied.");
  }

  async function removeFriendSuggestion(suggestion) {
    setSaving(true);

    try {
      await removeUserStorageFriendSuggestion(suggestion.id);
      setFriendSuggestions((items) => items.filter((item) => item.id !== suggestion.id));
      toast.success("Suggestion removed.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to remove suggestion"), { title: "Suggestion not removed" });
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
                <em>{foodTypeLabel(suggestion.food_type)}{formatDate(suggestion.created_at) ? ` · ${formatDate(suggestion.created_at)}` : ""}</em>
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
