export const SHARE_HOST = "https://penny.timjosh507.workers.dev";

export function shareText(title?: string): string {
  if (!title) return "I'm using Penny — pay-per-message AI on Celo. Try it →";
  return `${title} — pay-per-message AI on Celo, no subscription →`;
}

export const whatsAppLink = (text: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
export const tweetLink = (text: string, url: string) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
export const telegramLink = (text: string, url: string) =>
  `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
