"use client";
import { useEffect, useId, useState } from "react";
import { Search, SlidersHorizontal, X, Grid3x3, List } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { useAppStore } from "@/store/app-store";
import { ProductCard } from "@/components/stone/product-card";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

type Params = Record<string, string>;
function CatalogFilters({
  params,
  categories,
  update,
  clear,
}: {
  params: Params;
  categories: any[];
  update: (key: string, value: string) => void;
  clear: () => void;
}) {
  const id = useId();
  const field = (
    key: string,
    label: string,
    options: Array<[string, string]>,
  ) => (
    <div className="catalog-filter-field">
      <label htmlFor={`${id}-${key}`}>{label}</label>
      <select
        id={`${id}-${key}`}
        value={params[key] || ""}
        onChange={(e) => update(key, e.target.value)}
      >
        <option value="">همه موارد</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <div className="catalog-filters">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold flex gap-2">
          <SlidersHorizontal size={17} />
          فیلتر سنگ‌ها
        </h2>
        <button className="text-xs text-muted-foreground" onClick={clear}>
          پاک کردن
        </button>
      </div>
      {field(
        "category",
        "دسته‌بندی",
        categories.flatMap((c) => [
          [c.slug, c.name],
          ...(c.children || []).map((ch: any) => [ch.slug, `— ${ch.name}`]),
        ]),
      )}
      {field(
        "color",
        "رنگ",
        [
          "سفید",
          "کرم",
          "کرم روشن",
          "کرم تیره",
          "قهوه‌ای",
          "قرمز",
          "مشکی",
          "خاکستری",
          "طلایی",
          "سبز",
          "عسلی",
          "بژ",
        ].map((c) => [c, c]),
      )}
      {field("finish", "سطح پرداخت", [
        ["Polished", "صیقلی"],
        ["Honed", "مات"],
        ["Brushed", "برس خورده"],
        ["Leather", "چرمی"],
        ["Flamed", "فلیم"],
        ["Sandblasted", "سندبلاست"],
      ])}
      {field(
        "thickness",
        "ضخامت",
        ["10", "15", "18", "20", "30"].map((n) => [n, `${n} میلی‌متر`]),
      )}
      <div className="catalog-filter-checks">
        {[
          ["instock", "فقط سنگ‌های موجود"],
          ["export", "مناسب صادرات"],
          ["featured", "محصولات ویژه"],
          ["newest", "تازه‌های مجموعه"],
          ["bestseller", "پرفروش‌ترین‌ها"],
        ].map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={params[key] === "true"}
              onChange={(e) => update(key, e.target.checked ? "true" : "")}
            />
            {label}
          </label>
        ))}
      </div>
      <p className="catalog-filter-hint">
        موجودی و قیمت نهایی پیش از خرید با تیم فروش تأیید می‌شود.
      </p>
    </div>
  );
}
export function CatalogPage() {
  const { params, navigate, route } = useAppStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [result, setResult] = useState<{
    stones: any[];
    total: number;
    pages: number;
    key: string;
    error: string;
  }>({ stones: [], total: 0, pages: 1, key: "", error: "" });
  const [query, setQuery] = useState(params.q || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState("grid");
  const [retry, setRetry] = useState(0);
  const effective: Params = {
    ...params,
    ...(route === "export" ? { export: "true" } : {}),
  };
  const page = Math.max(1, Number(params.page) || 1);
  const request = new URLSearchParams(effective);
  request.set("page", String(page));
  request.set("pageSize", "24");
  const requestKey = request.toString();
  const loading = result.key !== requestKey;
  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/api/categories", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const [querySource, setQuerySource] = useState(params.q || "");
  if (querySource !== (params.q || "")) {
    setQuerySource(params.q || "");
    setQuery(params.q || "");
  }
  useEffect(() => {
    const controller = new AbortController();
    apiFetch(`/api/products?${requestKey}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error || "دریافت محصولات انجام نشد.");
        return data;
      })
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({
            stones: data.data || [],
            total: data.pagination?.total || 0,
            pages: data.pagination?.totalPages || 1,
            key: requestKey,
            error: "",
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            stones: [],
            total: 0,
            pages: 1,
            key: requestKey,
            error: error.message || "اتصال برقرار نشد.",
          });
      });
    return () => controller.abort();
  }, [requestKey, retry]);
  const update = (key: string, value: string) => {
    const next = { ...effective };
    delete next.page;
    if (value) next[key] = value;
    else delete next[key];
    navigate("catalog", next);
  };
  const clear = () => {
    setQuery("");
    navigate("catalog");
  };
  const active = Object.entries(effective).filter(
    ([key, value]) => value && !["page", "sort", "q"].includes(key),
  );
  const filters = (
    <CatalogFilters
      params={effective}
      categories={categories}
      update={update}
      clear={clear}
    />
  );
  return (
    <section className="catalog-page">
      <div className="catalog-page-header">
        <div className="commercial-container">
          <div className="eyebrow">
            <span />
            کشف مجموعه
          </div>
          <h1 className="font-bold">سنگی برای هر ایده</h1>
          <p>
            از جزئیات فنی تا رنگ و بافت؛ انتخاب مناسب پروژه‌تان را پیدا کنید.
          </p>
        </div>
      </div>
      <div className="commercial-container catalog-layout">
        <aside className="catalog-sidebar">{filters}</aside>
        <div className="catalog-results">
          <form
            className="catalog-search"
            onSubmit={(e) => {
              e.preventDefault();
              update("q", query.trim());
            }}
          >
            <Search size={18} />
            <input
              aria-label="جستجوی محصولات"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام سنگ، کد، رنگ یا معدن..."
            />
            <button type="submit">جستجو</button>
          </form>
          <div className="catalog-toolbar">
            <div className="flex items-center gap-3">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <button className="catalog-mobile-filters">
                    <SlidersHorizontal size={16} />
                    فیلترها{active.length > 0 && ` (${active.length})`}
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[min(350px,92vw)] overflow-y-auto p-5"
                >
                  <SheetHeader>
                    <SheetTitle>فیلتر مجموعه</SheetTitle>
                  </SheetHeader>
                  <div className="mt-7">{filters}</div>
                </SheetContent>
              </Sheet>
              <p aria-live="polite">
                {loading
                  ? "در حال دریافت..."
                  : `${result.total.toLocaleString("fa-IR")} محصول`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                aria-label="مرتب‌سازی محصولات"
                value={params.sort || "newest"}
                onChange={(e) => update("sort", e.target.value)}
              >
                {[
                  ["newest", "جدیدترین"],
                  ["popular", "پربازدیدترین"],
                  ["price-asc", "قیمت: کم به زیاد"],
                  ["price-desc", "قیمت: زیاد به کم"],
                  ["rating", "بالاترین امتیاز"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="catalog-view-buttons">
                <button
                  aria-label="نمایش شبکه‌ای"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <Grid3x3 size={17} />
                </button>
                <button
                  aria-label="نمایش فهرستی"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={19} />
                </button>
              </div>
            </div>
          </div>
          {(active.length > 0 || params.q) && (
            <div className="catalog-active-filters">
              {params.q && (
                <button onClick={() => update("q", "")}>
                  {params.q}
                  <X size={12} />
                </button>
              )}
              {active.map(([key, value]) => (
                <button key={key} onClick={() => update(key, "")}>
                  {(
                    {
                      category:
                        categories.find((c) => c.slug === value)?.name ||
                        "دسته‌بندی",
                      color: value,
                      finish: value,
                      thickness: `${value} میلی‌متر`,
                      instock: "موجود",
                      export: "صادراتی",
                      featured: "ویژه",
                      newest: "تازه‌ها",
                      bestseller: "پرفروش",
                    } as Record<string, string>
                  )[key] || value}
                  <X size={12} />
                </button>
              ))}
            </div>
          )}
          {loading ? (
            <div
              className="catalog-grid"
              aria-busy="true"
              aria-label="بارگذاری محصولات"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : result.error ? (
            <div className="catalog-no-results" role="alert">
              <h2>دریافت محصولات انجام نشد</h2>
              <p>{result.error}</p>
              <button
                className="commercial-button"
                onClick={() => setRetry((n) => n + 1)}
              >
                تلاش دوباره
              </button>
            </div>
          ) : result.stones.length ? (
            <div
              className={`catalog-grid ${view === "list" ? "catalog-list-view" : ""}`}
            >
              {result.stones.map((stone) => (
                <ProductCard key={stone.id} stone={stone} />
              ))}
            </div>
          ) : (
            <div className="catalog-no-results">
              <Search size={30} />
              <h2>سنگی با این مشخصات پیدا نشد</h2>
              <p>یک فیلتر را حذف کنید یا عبارت کوتاه‌تری جستجو کنید.</p>
              <button className="commercial-button" onClick={clear}>
                پاک کردن فیلترها
              </button>
            </div>
          )}
          {!loading && result.pages > 1 && (
            <nav className="catalog-pagination" aria-label="صفحه‌بندی کاتالوگ">
              <button
                disabled={page <= 1}
                onClick={() =>
                  navigate("catalog", { ...effective, page: String(page - 1) })
                }
              >
                صفحه قبل
              </button>
              <span>
                {page.toLocaleString("fa-IR")} از{" "}
                {result.pages.toLocaleString("fa-IR")}
              </span>
              <button
                disabled={page >= result.pages}
                onClick={() =>
                  navigate("catalog", { ...effective, page: String(page + 1) })
                }
              >
                صفحه بعد
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
