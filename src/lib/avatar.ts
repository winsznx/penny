/**
 * Deterministic identicon-ish hue from an address. Use to colour-code
 * avatars without shipping a 30kb identicon library.
 */
export function avatarHue(address: string | null | undefined): number {
  if (!address) return 0;
  const slice = address.slice(-4);
  return (parseInt(slice, 16) * 37) % 360;
}

export function avatarBg(address: string): string {
  const hue = avatarHue(address);
  return `hsl(${hue}deg 64% 88%)`;
}

export function avatarFg(address: string): string {
  const hue = avatarHue(address);
  return `hsl(${hue}deg 64% 22%)`;
}
