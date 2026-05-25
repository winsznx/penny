import { avatarBg, avatarFg } from "@/lib/avatar";
import { shortAddr } from "@/lib/format";

type Props = { address: string; size?: number; className?: string };

export function UserAvatar({ address, size = 28, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-mono text-[10px] uppercase tracking-widest ${className}`}
      style={{
        width: size,
        height: size,
        background: avatarBg(address),
        color: avatarFg(address),
      }}
      title={address}
    >
      {shortAddr(address, 2, 0).replace("0x", "")}
    </span>
  );
}
