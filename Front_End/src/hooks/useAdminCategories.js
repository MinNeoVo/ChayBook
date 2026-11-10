import { useEffect, useRef, useState } from "react";
import { adminCategoryService } from "../services/adminCategoryServices";

export function useAdminCategories(filters, service = adminCategoryService) {
  const { type, q, status } = filters;

  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({
    key: null,
    data: [],
    error: null,
  });
  const [isMutating, setIsMutating] = useState(false);

  const mutationLock = useRef(false);
  const requestKey = JSON.stringify([type, q, status, revision]);

  useEffect(() => {
    const controller = new AbortController();

    service
      .list({ type, q, status }, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            data,
            error: null,
          });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            data: [],
            error,
          });
        }
      });

    return () => controller.abort();
  }, [type, q, status, requestKey, service]);

  function reload() {
    setRevision((value) => value + 1);
  }

  async function mutate(operation) {
    if (mutationLock.current) {
      throw new Error("Đang xử lý thao tác trước.");
    }

    mutationLock.current = true;
    setIsMutating(true);

    try {
      const data = await operation();
      reload();
      return data;
    } finally {
      mutationLock.current = false;
      setIsMutating(false);
    }
  }

  const isLoading = result.key !== requestKey;

  return {
    categories: isLoading ? [] : result.data,
    error: isLoading ? null : result.error,
    isLoading,
    isMutating,
    reload,

    saveCategory: (categoryId, payload) =>
      mutate(() =>
        categoryId == null
          ? service.create(payload)
          : service.update(categoryId, payload),
      ),

    deleteCategory: (categoryId) => mutate(() => service.remove(categoryId)),
  };
}
