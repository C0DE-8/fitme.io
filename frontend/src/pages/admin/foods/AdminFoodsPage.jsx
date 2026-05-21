import { useEffect, useMemo, useState } from "react";
import { getApiError, imageUrl } from "../../../lib/api";
import {
  createAdminFood,
  deleteAdminFood,
  getAdminFoods,
  updateAdminFood,
} from "../../../lib/api/adminFoodApi";
import {
  createAdminIngredient,
  deleteAdminIngredient,
  getAdminIngredients,
  updateAdminIngredient,
} from "../../../lib/api/adminIngredientsApi";
import styles from "./AdminFoodsPage.module.css";

const emptyForm = {
  name: "",
  package: "",
  type: "rice",
  prepared: "",
  ingredients: [{ name: "", cost: 0 }],
  image: null,
};

export function AdminFoodsPage() {
  const [foods, setFoods] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [ingredientName, setIngredientName] = useState("");
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [ingredientsModalOpen, setIngredientsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadInitialFoods() {
      setLoading(true);
      setError("");

      try {
        const [foodsData, ingredientsData] = await Promise.all([
          getAdminFoods(),
          getAdminIngredients(),
        ]);
        if (alive) setFoods(foodsData);
        if (alive) setIngredients(ingredientsData);
      } catch (err) {
        if (alive) setError(getApiError(err, "Unable to load foods"));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadInitialFoods();

    return () => {
      alive = false;
    };
  }, []);

  async function refreshFoods() {
    setFoods(await getAdminFoods());
  }

  async function refreshIngredients() {
    setIngredients(await getAdminIngredients());
  }

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase();

    return foods.filter((food) => {
      const matchesSearch = !query || food.name?.toLowerCase().includes(query);
      const matchesType = !typeFilter || food.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [foods, search, typeFilter]);

  const totalCost = form.ingredients.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const filteredIngredients = useMemo(() => {
    const query = ingredientSearch.trim().toLowerCase();
    return ingredients.filter((item) => !query || item.name?.toLowerCase().includes(query));
  }, [ingredients, ingredientSearch]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openCreateFood() {
    resetForm();
    setFoodModalOpen(true);
    setStatus("");
    setError("");
  }

  function editFood(food) {
    setEditingId(food.id);
    setForm({
      name: food.name || "",
      package: food.package || "",
      type: food.type || "rice",
      prepared: food.prepared || "",
      ingredients: parseIngredients(food.ingredients),
      image: null,
    });
    setStatus("");
    setError("");
    setFoodModalOpen(true);
  }

  function parseIngredients(value) {
    if (Array.isArray(value)) return value.length ? value : [{ name: "", cost: 0 }];

    const parsed = String(value || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, cost] = part.split("-");
        return { name: name?.trim() || "", cost: Number(cost || 0) };
      })
      .filter((item) => item.name);

    return parsed.length ? parsed : [{ name: "", cost: 0 }];
  }

  function updateIngredient(index, key, value) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: key === "cost" ? Number(value) : value } : item
      ),
    }));
  }

  function addIngredient() {
    setForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, { name: "", cost: 0 }],
    }));
  }

  function removeIngredient(index) {
    setForm((current) => ({
      ...current,
      ingredients:
        current.ingredients.length === 1
          ? current.ingredients
          : current.ingredients.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    const payload = {
      ...form,
      ingredients: form.ingredients
        .map((item) => ({ name: item.name.trim(), cost: Number(item.cost) }))
        .filter((item) => item.name && Number.isFinite(item.cost)),
    };

    try {
      if (editingId) {
        await updateAdminFood(editingId, payload);
        setStatus("Food item updated.");
      } else {
        await createAdminFood(payload);
        setStatus("Food item created.");
      }

      resetForm();
      setFoodModalOpen(false);
      await refreshFoods();
    } catch (err) {
      setError(getApiError(err, "Unable to save food"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    setStatus("");

    try {
      await deleteAdminFood(id);
      setStatus("Food item deleted.");
      await refreshFoods();
    } catch (err) {
      setError(getApiError(err, "Unable to delete food"));
    }
  }

  async function handleIngredientSubmit(event) {
    event.preventDefault();
    const name = ingredientName.trim();
    if (!name) return;

    setError("");
    setStatus("");

    try {
      if (editingIngredient) {
        await updateAdminIngredient(editingIngredient.id, name);
        setStatus("Ingredient updated.");
      } else {
        await createAdminIngredient(name);
        setStatus("Ingredient added.");
      }

      setIngredientName("");
      setEditingIngredient(null);
      await refreshIngredients();
    } catch (err) {
      setError(getApiError(err, "Unable to save ingredient"));
    }
  }

  async function handleIngredientDelete(id) {
    setError("");
    setStatus("");

    try {
      await deleteAdminIngredient(id);
      setStatus("Ingredient deleted.");
      await refreshIngredients();
    } catch (err) {
      setError(getApiError(err, "Unable to delete ingredient"));
    }
  }

  function startIngredientEdit(item) {
    setEditingIngredient(item);
    setIngredientName(item.name);
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1>Food Database</h1>
          <p>Manage food items, ingredients, costs, preparation notes, and images.</p>
        </div>
        <div className={styles.headingActions}>
          <button type="button" onClick={() => setIngredientsModalOpen(true)}>
            Ingredients
          </button>
          <button type="button" onClick={openCreateFood}>
            Add Food
          </button>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {status ? <p className={styles.status}>{status}</p> : null}

      <div className={styles.tools}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search foods..." />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">All types</option>
          <option value="rice">Rice</option>
          <option value="swallow">Swallow</option>
          <option value="junks">Junks</option>
        </select>
      </div>

      <div className={styles.stats}>
        <article>
          <span>Total foods</span>
          <strong>{foods.length}</strong>
        </article>
        <article>
          <span>Ingredients</span>
          <strong>{ingredients.length}</strong>
        </article>
        <article>
          <span>Visible foods</span>
          <strong>{filteredFoods.length}</strong>
        </article>
      </div>

      <section className={styles.listPanel}>
          <div className={styles.listHeader}>
            <h2>Foods</h2>
            <span>{loading ? "Loading..." : `${filteredFoods.length} items`}</span>
          </div>

          <div className={styles.foodList}>
            {filteredFoods.map((food) => (
              <article className={styles.foodCard} key={food.id}>
                {food.image ? <img src={imageUrl(`/uploads/${food.image}`)} alt="" /> : <div className={styles.foodImageFallback}>F</div>}
                <div>
                  <strong>{food.name}</strong>
                  <span>{food.type} • ₦{Number(food.estimated_cost || 0).toLocaleString()}</span>
                  <p>{food.prepared}</p>
                </div>
                <div className={styles.actions}>
                  <button type="button" onClick={() => editFood(food)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(food.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {!loading && !filteredFoods.length ? <p className={styles.empty}>No foods found.</p> : null}
          </div>
      </section>

      <datalist id="admin-ingredients">
        {ingredients.map((item) => (
          <option key={item.id} value={item.name} />
        ))}
      </datalist>

      {foodModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editingId ? "Edit food item" : "Add food item"}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Food item</p>
                <h2>{editingId ? "Edit food item" : "Add food item"}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setFoodModalOpen(false);
                }}
              >
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <label>
                  Food name
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                </label>

                <label>
                  Package
                  <input
                    value={form.package}
                    onChange={(event) => setForm({ ...form, package: event.target.value })}
                    required
                  />
                </label>

                <label>
                  Type
                  <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required>
                    <option value="rice">Rice</option>
                    <option value="swallow">Swallow</option>
                    <option value="junks">Junks</option>
                  </select>
                </label>

                <label>
                  Image
                  <input type="file" accept="image/*" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })} />
                </label>
              </div>

              <label>
                Preparation method
                <textarea
                  value={form.prepared}
                  onChange={(event) => setForm({ ...form, prepared: event.target.value })}
                  rows={3}
                  required
                />
              </label>

              <div className={styles.ingredientsHeader}>
                <h3>Ingredients</h3>
                <button type="button" onClick={addIngredient}>
                  Add ingredient
                </button>
              </div>

              <div className={styles.ingredients}>
                {form.ingredients.map((ingredient, index) => (
                  <div className={styles.ingredientRow} key={`${index}-${ingredient.name}`}>
                    <input
                      list="admin-ingredients"
                      value={ingredient.name}
                      onChange={(event) => updateIngredient(index, "name", event.target.value)}
                      placeholder="Ingredient"
                      required
                    />
                    <input
                      min="0"
                      type="number"
                      value={ingredient.cost}
                      onChange={(event) => updateIngredient(index, "cost", event.target.value)}
                      placeholder="Cost"
                      required
                    />
                    <button type="button" onClick={() => removeIngredient(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.total}>Total estimated cost: ₦{totalCost.toLocaleString()}</div>

              <button className={styles.primary} type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update food" : "Create food"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {ingredientsModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Ingredient library">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Ingredients</p>
                <h2>Ingredient Library</h2>
              </div>
              <button type="button" onClick={() => setIngredientsModalOpen(false)}>
                Close
              </button>
            </div>

            <form className={styles.ingredientForm} onSubmit={handleIngredientSubmit}>
              <input
                value={ingredientName}
                onChange={(event) => setIngredientName(event.target.value)}
                placeholder="Ingredient name"
              />
              <button type="submit">{editingIngredient ? "Update" : "Add"}</button>
              {editingIngredient ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingIngredient(null);
                    setIngredientName("");
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </form>

            <input
              className={styles.ingredientSearch}
              value={ingredientSearch}
              onChange={(event) => setIngredientSearch(event.target.value)}
              placeholder="Search ingredients..."
            />

            <div className={styles.ingredientList}>
              {filteredIngredients.map((item) => (
                <article key={item.id}>
                  <span>{item.name}</span>
                  <div>
                    <button type="button" onClick={() => startIngredientEdit(item)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleIngredientDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!filteredIngredients.length ? <p className={styles.empty}>No ingredients found.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
