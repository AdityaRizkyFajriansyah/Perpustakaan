import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuth } from "../auth/AuthContext";

const schema = z.object({
  identifier: z.string().min(1, "NISN atau email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  otp: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await login(data.identifier, data.password, data.otp?.trim() || undefined);
      nav("/", { replace: true });
    } catch (e: any) {
      setServerError(e?.message || "Login gagal");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-6 md:grid-cols-[1.1fr,1fr]">
        <div className="card p-6 md:p-8">
          <div className="text-xs uppercase tracking-[0.2em] muted">Library Access</div>
          <h1 className="text-2xl md:text-3xl font-display mt-2">Masuk ke sistem</h1>
          <p className="text-sm muted mt-2">
            Kelola koleksi, peminjaman, dan audit log perpustakaan dengan tampilan yang rapi.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="NISN / Email"
              type="text"
              placeholder="Masukkan NISN atau email"
              {...register("identifier")}
              error={errors.identifier?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password"
              {...register("password")}
              error={errors.password?.message}
            />
            <Input
              label="OTP (jika 2FA aktif)"
              type="text"
              placeholder="Masukkan OTP"
              {...register("otp")}
              error={errors.otp?.message}
            />

            {serverError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Loading..." : "Login"}
            </Button>
          </form>
        </div>

        <div className="card-soft p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] muted">Seed Accounts</div>
            <h2 className="text-2xl font-display mt-3">Masuk sebagai admin atau siswa</h2>
            <p className="text-sm muted mt-3">Gunakan akun berikut untuk uji coba awal.</p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-xl border border-neutral-200 bg-white/70 px-4 py-3">
                <div className="text-xs muted">Admin</div>
                <div className="font-semibold">admin@library.com</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white/70 px-4 py-3">
                <div className="text-xs muted">Student</div>
                <div className="font-semibold">NISN siswa (hasil import)</div>
                <div className="text-xs muted mt-1">Password: nama orang tua</div>
              </div>
            </div>
          </div>
          <div className="text-xs muted mt-6">Pastikan backend berjalan di http://localhost:3000</div>
        </div>
      </div>
    </div>
  );
}
