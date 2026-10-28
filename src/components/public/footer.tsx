"use client";
import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Send,
  MessageCircle,
  ArrowUpLeft,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { normalizeSocialLink } from "@/lib/social-links";
import { useSiteConfig } from "@/components/public/site-runtime";
import { useAppStore } from "@/store/app-store";
export function Footer() {
  const site = useSiteConfig();
  const { navigate, t } = useAppStore();
  const [settings, setSettings] = useState<Record<string, string>>({});
  useEffect(() => {
    apiFetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => setSettings(d.data || {}))
      .catch(() => {});
  }, []);
  const phone = site.brand.phone || settings["company.phone"];
  const email = site.brand.email || settings["company.email"];
  const address = site.brand.address || settings["company.address"];
  const socials = [
    {
      kind: "instagram",
      value: site.brand.instagram,
      Icon: Instagram,
      label: "اینستاگرام",
    },
    {
      kind: "telegram",
      value: site.brand.telegram,
      Icon: Send,
      label: "تلگرام",
    },
    {
      kind: "whatsapp",
      value: site.brand.whatsapp,
      Icon: MessageCircle,
      label: "واتساپ",
    },
  ];
  return (
    <footer className="commercial-footer">
      <div className="commercial-container">
        <div className="footer-top">
          <div>
            <small>برای انتخاب بعدی شما</small>
            <h2>سنگ مناسب پروژه‌تان را پیدا کنیم.</h2>
          </div>
          <button
            className="commercial-button light"
            onClick={() => navigate("contact")}
          >
            گفت‌وگو با تیم فروش
            <ArrowUpLeft size={18} />
          </button>
        </div>
        <div className="footer-grid">
          <div>
            <h3>{site.brand.nameFa || site.brand.nameEn}</h3>
            <p className="whitespace-pre-line">
              {(
                site.footer.text ||
                site.brand.description ||
                site.brand.taglineFa ||
                ""
              )
                .split(/(\*\*[^*]+\*\*)/g)
                .map((part, i) =>
                  part.startsWith("**") ? (
                    <strong key={i}>{part.slice(2, -2)}</strong>
                  ) : (
                    part
                  ),
                )}
            </p>
            <div className="footer-socials">
              {socials.map(({ kind, value, Icon, label }) => {
                const href = normalizeSocialLink(kind, value);
                return href ? (
                  <a
                    key={kind}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon size={18} />
                  </a>
                ) : null;
              })}
            </div>
          </div>
          <div>
            <h3>کشف و انتخاب</h3>
            {["home", "catalog", "about", "contact"].map((key) => (
              <button key={key} onClick={() => navigate(key)}>
                {t(`nav.${key}`)}
              </button>
            ))}
          </div>
          <div>
            <h3>در ارتباط باشیم</h3>
            {phone && (
              <a href={`tel:${phone}`}>
                <Phone size={15} />
                <bdi>{phone}</bdi>
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`}>
                <Mail size={15} />
                <bdi>{email}</bdi>
              </a>
            )}
            {address && (
              <p className="flex gap-2">
                <MapPin size={17} />
                {address}
              </p>
            )}
            {site.brand.workingHours && <p>{site.brand.workingHours}</p>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()}{" "}
            {site.brand.nameFa || site.brand.nameEn} ·{" "}
            {site.footer.copyright || "تمام حقوق محفوظ است."}
          </span>
          <span>از طبیعت، برای معماری ماندگار</span>
        </div>
      </div>
    </footer>
  );
}
