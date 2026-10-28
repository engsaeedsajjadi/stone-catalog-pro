export function normalizeSocialLink(kind: string, raw?: string): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (/^(javascript|data|file|vbscript):/i.test(value)) return null;
  if (kind === "whatsapp" && /^[+\d\s()-]+$/.test(value)) {
    let phone = value.replace(/\D/g, "");
    if (phone.startsWith("00")) phone = phone.slice(2);
    if (phone.startsWith("0")) phone = `98${phone.slice(1)}`;
    return phone.length >= 10 && phone.length <= 15
      ? `https://wa.me/${phone}`
      : null;
  }
  const bases: Record<string, string> = {
    instagram: "https://www.instagram.com/",
    telegram: "https://t.me/",
    youtube: "https://www.youtube.com/@",
    linkedin: "https://www.linkedin.com/in/",
  };
  const candidate = /^https?:\/\//i.test(value)
    ? value
    : /^(www\.|t\.me\/|instagram\.com\/|wa\.me\/|youtube\.com\/|linkedin\.com\/)/i.test(
          value,
        )
      ? `https://${value}`
      : bases[kind]
        ? `${bases[kind]}${value.replace(/^@/, "")}`
        : "";
  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
