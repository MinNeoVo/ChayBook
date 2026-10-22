import { useEffect, useState } from "react";
import { getCategories } from "../../services/categoryServices";
import { updatePost } from "../../services/postServices";
import Input from "../common/Input";

export default function PostEditModal({ post, onClose, onSaved }) {
  const [values, setValues] = useState({ title: post.title, content: post.content || "", imageUrl: post.imageUrl || "", categoryId: post.categoryId ?? "" });
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    getCategories("POST", { signal: controller.signal }).then(setCategories).catch((e) => {
      if (!controller.signal.aborted) setError(e.message);
    });
    return () => controller.abort();
  }, []);
  const change = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!values.title.trim() || !values.content.trim()) { setError("Title and content are required."); return; }
    setBusy(true); setError("");
    try {
      await updatePost(post.postId ?? post.id, { ...values, title: values.title.trim(), content: values.content.trim(), categoryId: values.categoryId ? Number(values.categoryId) : null });
      await onSaved();
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="edit-post-title" className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-6">
      <h2 id="edit-post-title" className="mb-4 text-xl font-bold">Edit Post</h2>
      <p className="mb-4 text-sm">Changes will return this post to Pending Review.</p>
      <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
        <Input label="Post title" required maxLength={255} value={values.title} onChange={(e) => change("title", e.target.value)} />
        <label className="block">Content<textarea required className="mt-1 w-full rounded-lg border p-2" rows={5} value={values.content} onChange={(e) => change("content",e.target.value)} /></label>
        <Input label="Post image URL" maxLength={255} value={values.imageUrl} onChange={(e) => change("imageUrl",e.target.value)} />
        <label className="block">Post category<select className="ml-3 rounded border p-2" value={values.categoryId} onChange={(e) => change("categoryId",e.target.value)}>
          <option value="">Keep current category</option>
          {post.categoryId && !categories.some((c) => c.categoryId === post.categoryId) && <option value={post.categoryId}>{post.categoryName || "Current category"}</option>}
          {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
        </select></label>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <div className="flex justify-end gap-3"><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-white">{busy ? "Saving…" : "Save Post"}</button></div>
      </fieldset></form>
    </section>
  </div>;
}
