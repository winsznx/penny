import { Pill } from "./Pill";

type Status = "idle" | "signing" | "pending" | "confirmed" | "failed";

const LABEL: Record<Status, string> = {
  idle: "Ready",
  signing: "Sign in wallet",
  pending: "On chain · pending",
  confirmed: "Confirmed",
  failed: "Failed",
};

const TONE: Record<Status, "neutral" | "info" | "warning" | "success" | "danger"> = {
  idle: "neutral",
  signing: "info",
  pending: "warning",
  confirmed: "success",
  failed: "danger",
};

export function TxStatusBadge({ status }: { status: Status }) {
  return <Pill tone={TONE[status]}>{LABEL[status]}</Pill>;
}
