import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { getUserStorage } from "../../../lib/api/userApi";
import styles from "./UserPlaceholderPage.module.css";

const titles = {
  storage: "Storage",
  foods: "Foods",
  budget: "Budget",
  profile: "Profile",
};

export function UserPlaceholderPage({ type }) {
  const title = titles[type] || "Dashboard";
  const toast = useToast();
  const [storage, setStorage] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(type === "storage");

  useEffect(() => {
    if (type !== "storage") return undefined;

    let alive = true;

    async function loadStorage() {
      setLoading(true);

      try {
        const data = await getUserStorage();
        if (alive) setStorage(data || []);
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Unable to load your storage"), { title: "Storage unavailable" });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadStorage();

    return () => {
      alive = false;
    };
  }, [toast, type]);

  const filteredStorage = useMemo(() => {
    const query = search.trim().toLowerCase();
    return storage.filter((item) => !query || item.item_name?.toLowerCase().includes(query));
  }, [search, storage]);

  if (type === "storage") {
    return (
      <section className={styles.page}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>fitme.io</p>
            <h1>Your Storage</h1>
            <p>These are the ingredients fitme AI uses when planning meals for you.</p>
          </div>
          <div className={styles.countCard}>
            <span>Total items</span>
            <strong>{loading ? "..." : storage.length}</strong>
          </div>
        </div>

        <div className={styles.storageTools}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your storage..."
          />
        </div>

        <div className={styles.storageGrid}>
          {filteredStorage.map((item) => (
            <article className={styles.storageItem} key={item.id}>
              {item.image_url ? (
                <img src={item.image_url} alt="" />
              ) : (
                <span>{item.item_name?.charAt(0)?.toUpperCase() || "F"}</span>
              )}
              <div>
                <strong>{item.item_name}</strong>
                <p>Available in storage</p>
              </div>
            </article>
          ))}

          {!loading && !filteredStorage.length ? (
            <div className={styles.emptyState}>
              <strong>{storage.length ? "No matching items." : "No storage items yet."}</strong>
              <p>Add storage items to improve fitme AI meal suggestions.</p>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <p className={styles.kicker}>fitme.io</p>
      <h1>{title}</h1>
      <p>This section is ready for the next user workflow.</p>
    </section>
  );
}
