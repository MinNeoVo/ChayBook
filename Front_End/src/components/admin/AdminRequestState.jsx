export default function AdminRequestState({ loading, error, onRetry }) {
  if (loading) return <p role="status" className="my-4 rounded-xl bg-white p-5 text-slate-600">Đang tải…</p>;
  if (!error) return null;
  return (
    <div role="alert" className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      <p>{error}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">Thử lại</button>}
    </div>
  );
}
