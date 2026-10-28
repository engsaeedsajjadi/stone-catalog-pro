"use client";
import { useState } from "react";
import {
  Search,
  Menu,
  Heart,
  GitCompare,
  Phone,
  ArrowUpLeft,
  Layers,
  User,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore, type Language, type Currency } from "@/store/app-store";
import { buildAppUrl, parseAppLocation } from "@/lib/app-url";
import { useSiteConfig } from "@/components/public/site-runtime";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const {
    t,
    lang,
    setLang,
    currency,
    setCurrency,
    navigate,
    route,
    user,
    logout,
    favorites,
    compareList,
  } = useAppStore();
  const site = useSiteConfig();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const name =
    (lang === "en" ? site.brand.nameEn : site.brand.nameFa) ||
    site.brand.nameFa ||
    site.brand.nameEn ||
    t("brand.name");
  const nav = site.nav
    ?.filter((item) => item.enabled !== false)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const links = nav?.length
    ? nav
    : ["home", "catalog", "export", "about", "contact"].map((key) => ({
        id: key,
        label: t(`nav.${key}`),
        href: buildAppUrl(key),
      }));
  function go(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const normalized = href.startsWith("?") ? `/${href}` : href;
    const known: Record<string, string> = {
      "/about": "about",
      "/contact": "contact",
      "/export": "export",
    };
    const parsed = known[normalized]
      ? { route: known[normalized], params: {} }
      : parseAppLocation(normalized);
    if (parsed) {
      event.preventDefault();
      navigate(parsed.route, parsed.params);
      setOpen(false);
    }
  }
  const safeHref = (href?: string) =>
    href && !/^(javascript|data|vbscript):/i.test(href) ? href : "/";
  const menuLinks = (
    <nav aria-label="منوی اصلی" className="site-nav-links">
      {links.map((item, i) => (
        <a
          key={item.id || i}
          href={safeHref(item.href)}
          onClick={(e) => go(e, safeHref(item.href))}
          aria-current={
            parseAppLocation(item.href || "/")?.route === route
              ? "page"
              : undefined
          }
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
  return (
    <header className="commercial-header">
      <div className="header-note">
        <div className="commercial-container">
          <span>{site.brand.taglineFa || "کاتالوگ تخصصی سنگ طبیعی"}</span>
          {site.brand.phone && (
            <a href={`tel:${site.brand.phone}`}>
              <Phone size={12} />
              <bdi>{site.brand.phone}</bdi>
            </a>
          )}
        </div>
      </div>
      <div className="commercial-container header-main">
        <a href="/" className="site-brand" onClick={(e) => go(e, "/")}>
          {site.brand.logoUrl ? (
            <img src={site.brand.logoUrl} alt="" width={44} height={44} />
          ) : (
            <span className="brand-symbol">
              <Layers size={24} />
            </span>
          )}
          <span>
            <strong>{name}</strong>
            <small>انتخابی ماندگار، از دل طبیعت</small>
          </span>
        </a>
        <div className="desktop-navigation">{menuLinks}</div>
        <div className="header-actions">
          <button
            className="icon-action"
            aria-label="جستجو در کاتالوگ"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={19} />
          </button>
          <button
            className="icon-action"
            aria-label={`علاقه‌مندی‌ها، ${favorites.length} محصول`}
            onClick={() => navigate("favorites")}
          >
            <Heart size={19} />
            {favorites.length > 0 && <span>{favorites.length}</span>}
          </button>
          <button
            className="icon-action"
            aria-label={`مقایسه، ${compareList.length} محصول`}
            onClick={() => navigate("compare")}
          >
            <GitCompare size={19} />
            {compareList.length > 0 && <span>{compareList.length}</span>}
          </button>
          <button
            className="header-contact"
            onClick={() => navigate("contact")}
          >
            مشاوره و استعلام
            <ArrowUpLeft size={16} />
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="icon-action mobile-menu"
                aria-label="باز کردن منو"
              >
                <Menu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="mobile-navigation w-[min(340px,90vw)] p-6"
            >
              <SheetHeader>
                <SheetTitle>{name}</SheetTitle>
              </SheetHeader>
              {menuLinks}
              <button
                className="commercial-button"
                onClick={() => {
                  navigate(
                    user &&
                      ["ADMIN", "SALES_MANAGER", "OPERATOR"].includes(user.role)
                      ? "admin"
                      : "login",
                  );
                  setOpen(false);
                }}
              >
                <User size={17} />
                {user ? user.name : "ورود به حساب"}
              </button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="header-preferences commercial-container">
        <div className="flex items-center gap-3">
          <select
            aria-label="زبان"
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
          >
            {[
              ["fa", "فارسی"],
              ["en", "English"],
              ["ar", "العربية"],
              ["ru", "Русский"],
              ["tr", "Türkçe"],
            ].map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <span>·</span>
          <select
            aria-label="واحد قیمت"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            {[
              ["IRR", "ریال"],
              ["IRT", "تومان"],
              ["USD", "دلار"],
              ["EUR", "یورو"],
              ["AED", "درهم"],
              ["RUB", "روبل"],
            ].map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() =>
              navigate(
                user &&
                  ["ADMIN", "SALES_MANAGER", "OPERATOR"].includes(user.role)
                  ? "admin"
                  : "login",
              )
            }
          >
            <User size={13} />
            {user ? user.name : "ورود"}
          </button>
          {user && (
            <button
              onClick={() => {
                void logout().catch((e) => toast.error(e.message));
              }}
            >
              <LogOut size={13} />
              خروج
            </button>
          )}
        </div>
      </div>
      {searchOpen && (
        <form
          className="header-search commercial-container"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("catalog", { q: search.trim() });
            setSearchOpen(false);
          }}
        >
          <input
            aria-label="جستجوی نام، کد یا معدن"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search.placeholder")}
          />
          <button type="submit" className="commercial-button">
            جستجو
            <Search size={16} />
          </button>
        </form>
      )}
    </header>
  );
}
