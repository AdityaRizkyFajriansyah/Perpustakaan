import Button from "./Button";

type Props = {
  open: boolean;
  title: string;
  message: string;
  variant?: "success" | "error";
  onClose: () => void;
};

export default function Popup({ open, title, message, variant = "success", onClose }: Props) {
  if (!open) return null;

  return (
    <div className="popup-backdrop" role="dialog" aria-modal="true">
      <div className="popup-card card p-6">
        <div className={["popup-pill", variant === "error" ? "popup-pill-error" : "popup-pill-success"].join(" ")}>
          {variant === "error" ? "Gagal" : "Berhasil"}
        </div>
        <div className="popup-title">{title}</div>
        <p className="popup-message">{message}</p>
        <div className="mt-5 flex justify-end">
          <Button variant={variant === "error" ? "danger" : "primary"} onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
