export const MESSAGE_STATUS = ["Pending", "Settled", "Disputed", "Resolved"] as const;
export type MessageStatus = (typeof MESSAGE_STATUS)[number];

export function messageStatusLabel(status: number): MessageStatus {
  return MESSAGE_STATUS[status] ?? "Pending";
}

export function messageStatusTone(status: number): "info" | "success" | "warning" | "neutral" {
  switch (status) {
    case 0:
      return "info";
    case 1:
      return "success";
    case 2:
      return "warning";
    case 3:
      return "neutral";
    default:
      return "neutral";
  }
}
