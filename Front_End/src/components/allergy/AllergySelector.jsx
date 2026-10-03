import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import Button from "../common/Button";
import { getAllergies, getMyAllergies, updateMyAllergies } from "../../services/allergyServices";

function normalizeIds(ids) {
  return [...new Set(ids)].sort((first, second) => first - second);
}

function sameIds(first, second) {
  return first.length === second.length && first.every((id, index) => id === second[index]);
}

const AllergySelector = forwardRef(function AllergySelector(
  { disabled = false, onStatusChange },
  ref,
) {
  const [allergies, setAllergies] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDirty = !sameIds(selectedIds, savedIds);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getAllergies({ signal: controller.signal }),
      getMyAllergies({ signal: controller.signal }),
    ])
      .then(([availableAllergies, userAllergies]) => {
        if (!Array.isArray(availableAllergies) || !Array.isArray(userAllergies)) {
          throw new Error("The allergy service returned an invalid response.");
        }

        const loadedIds = normalizeIds(userAllergies.map((allergy) => allergy.allergyId));
        setAllergies(availableAllergies);
        setSelectedIds(loadedIds);
        setSavedIds(loadedIds);
        setReady(true);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load allergy preferences:", loadError);
          setError(loadError.message || "Could not load your allergy preferences.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    onStatusChange?.({ ready, loading, saving, isDirty, selectedIds, savedIds, error });
  }, [ready, loading, saving, isDirty, selectedIds, savedIds, error, onStatusChange]);

  const saveSelection = useCallback(async () => {
    if (!ready) {
      throw new Error("Allergy preferences are not ready yet.");
    }
    if (!isDirty) {
      return savedIds;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const savedAllergies = await updateMyAllergies(selectedIds);
      if (!Array.isArray(savedAllergies)) {
        throw new Error("The allergy service returned an invalid save response.");
      }

      const persistedIds = normalizeIds(savedAllergies.map((allergy) => allergy.allergyId));
      setSelectedIds(persistedIds);
      setSavedIds(persistedIds);
      setSuccess("Allergy preferences saved.");
      return persistedIds;
    } catch (saveError) {
      console.error("Failed to save allergy preferences:", saveError);
      setError(saveError.message || "Could not save your allergy preferences.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  }, [isDirty, ready, savedIds, selectedIds]);

  useImperativeHandle(ref, () => ({ save: saveSelection }), [saveSelection]);

  function toggleAllergy(allergyId) {
    setError("");
    setSuccess("");
    setSelectedIds((currentIds) => normalizeIds(
      currentIds.includes(allergyId)
        ? currentIds.filter((id) => id !== allergyId)
        : [...currentIds, allergyId],
    ));
  }

  async function handleSave() {
    try {
      await saveSelection();
    } catch (saveError) {
      setError(saveError.message || "Could not save your allergy preferences.");
    }
  }

  const controlsDisabled = disabled || loading || !ready || saving;

  return (
    <section className="rounded-xl border border-gray-200 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Food allergies</h2>
        <p className="mt-1 text-sm text-gray-600">
          Select the ingredients you need to avoid. Meal plans use your saved selections.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading allergy options...</p>}

      {!loading && ready && allergies.length === 0 && (
        <p className="text-sm text-gray-600">There are no allergy options available.</p>
      )}

      {!loading && ready && allergies.length > 0 && (
        <fieldset disabled={controlsDisabled} className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Choose food allergies</legend>
          {allergies.map((allergy) => (
            <label
              key={allergy.allergyId}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm text-gray-800 hover:border-chaybook-primary"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(allergy.allergyId)}
                onChange={() => toggleAllergy(allergy.allergyId)}
                className="h-4 w-4 accent-chaybook-primary"
              />
              <span>{allergy.name}</span>
            </label>
          ))}
        </fieldset>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && !isDirty && (
        <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {success}
        </p>
      )}
      {isDirty && ready && (
        <p className="mt-4 text-sm text-amber-800">You have unsaved allergy changes.</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={controlsDisabled || !isDirty}
          className="min-w-36"
        >
          {saving ? "Saving..." : "Save allergies"}
        </Button>
        {ready && selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedIds([]);
              setError("");
              setSuccess("");
            }}
            disabled={controlsDisabled}
            className="text-sm font-semibold text-chaybook-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear all
          </button>
        )}
      </div>
    </section>
  );
});

export default AllergySelector;
