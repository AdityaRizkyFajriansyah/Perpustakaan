import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Popup from "../../components/Popup";
import { disableTwoFactorApi, enableTwoFactorApi, setupTwoFactorApi } from "../../api/auth";

export default function Security() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [setupData, setSetupData] = useState<{ otpauthUrl: string; secret: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);

  const onSetup = async () => {
    setLoading(true);
    try {
      const res = await setupTwoFactorApi();
      setSetupData(res.data);
      setPopup({ title: "Setup 2FA", message: "Scan secret ini di aplikasi authenticator.", variant: "success" });
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal setup 2FA", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const onEnable = async () => {
    if (!otp.trim()) {
      setPopup({ title: "Gagal", message: "OTP wajib diisi.", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      await enableTwoFactorApi(otp.trim());
      setPopup({ title: "Berhasil", message: "2FA aktif.", variant: "success" });
      setSetupData(null);
      setEnabled(true);
      setOtp("");
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal mengaktifkan 2FA", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const onDisable = async () => {
    if (!otp.trim()) {
      setPopup({ title: "Gagal", message: "OTP wajib diisi.", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      await disableTwoFactorApi(otp.trim());
      setPopup({ title: "Berhasil", message: "2FA dinonaktifkan.", variant: "success" });
      setEnabled(false);
      setOtp("");
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal menonaktifkan 2FA", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Keamanan</div>
        <h1 className="text-2xl font-display mt-2">2FA Admin</h1>
        <p className="text-sm muted mt-2">Aktifkan autentikasi dua langkah untuk akun admin.</p>

        <div className="mt-4 text-sm">
          Status:{" "}
          <span className="font-semibold">
            {enabled ? "Aktif" : "Nonaktif"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onSetup} disabled={loading}>
            Setup 2FA
          </Button>
        </div>

        {setupData && (
          <div className="mt-5 rounded-2xl border border-neutral-200 bg-white/70 p-4 text-sm">
            <div className="font-semibold">Secret</div>
            <div className="mt-2 break-all">{setupData.secret}</div>
            <div className="mt-3 text-xs muted">Gunakan secret ini di Google Authenticator / Authy.</div>
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr,auto,auto]">
          <Input label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <div className="flex items-end">
            <Button onClick={onEnable} disabled={loading}>Aktifkan</Button>
          </div>
          <div className="flex items-end">
            <Button variant="danger" onClick={onDisable} disabled={loading}>Nonaktifkan</Button>
          </div>
        </div>
      </div>

      <Popup
        open={!!popup}
        title={popup?.title || ""}
        message={popup?.message || ""}
        variant={popup?.variant}
        onClose={() => setPopup(null)}
      />
    </div>
  );
}
