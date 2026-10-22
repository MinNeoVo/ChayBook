import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { changePassword } from "../../services/userServices";
import Input from "../common/Input";

export default function ChangePasswordModal({ userId, onClose }) {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { logout } = useAuth();
  const change = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (values.newPassword !== values.confirm) { setError("Passwords do not match."); return; }
    if (new TextEncoder().encode(values.newPassword).length > 72) { setError("Password must not exceed 72 UTF-8 bytes."); return; }
    setBusy(true); setError("");
    try {
      await changePassword(userId, { currentPassword: values.currentPassword, newPassword: values.newPassword });
      await logout("Password changed. Please sign in again.");
      navigate("/login");
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="change-password-title" className="w-full max-w-lg rounded-xl bg-white p-6">
    <h2 id="change-password-title" className="mb-4 text-xl font-bold">Change Password</h2>
    <form onSubmit={submit}><fieldset disabled={busy} className="space-y-4">
      <Input label="Current password" type="password" autoComplete="current-password" required maxLength={72} value={values.currentPassword} onChange={(e) => change("currentPassword",e.target.value)} />
      <Input label="New password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={values.newPassword} onChange={(e) => change("newPassword",e.target.value)} />
      <Input label="Confirm new password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={values.confirm} onChange={(e) => change("confirm",e.target.value)} />
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <div className="mt-4 flex justify-end gap-3"><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-white">{busy ? "Saving…" : "Update Password"}</button></div>
    </fieldset></form>
  </section></div>;
}
