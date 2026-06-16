export function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function extractTitle(content: string): string {
  const first = content.trim().split("\n")[0]?.replace(/[#*`_]/g, "").trim() ?? "";
  if (!first) return "Untitled";
  return first.length > 60 ? `${first.slice(0, 60)}...` : first;
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return address.length > 14 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
