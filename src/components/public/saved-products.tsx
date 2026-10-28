"use client";
import { useEffect, useState } from "react";
import { Heart, GitCompare, ImageOff, X } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { ProductCard } from "@/components/stone/product-card";
import {
  inventorySummary,
  selectDisplayPrice,
  priceLabel,
  specValue,
  dimensionsLabel,
} from "@/lib/product-presentation";
import { useAppStore } from "@/store/app-store";
function useSelectedProducts(ids: string[]) {
  const key = ids.join(",");
  const [state, setState] = useState<{
    key: string;
    stones: any[];
    error: string;
  }>({ key: "", stones: [], error: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if (!key) return () => controller.abort();
    const chunks = key.split(",").reduce<string[][]>((all, id, i) => {
      if (i % 6 === 0) all.push([]);
      all[all.length - 1].push(id);
      return all;
    }, []);
    Promise.all(
      chunks.map(async (chunk) => {
        const response = await apiFetch(
          `/api/compare?ids=${encodeURIComponent(chunk.join(","))}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error || "دریافت محصولات انجام نشد.");
        return data.data || [];
      }),
    )
      .then((groups) => {
        if (!controller.signal.aborted)
          setState({ key, stones: groups.flat(), error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key,
            stones: [],
            error: error.message || "اتصال برقرار نشد.",
          });
      });
    return () => controller.abort();
  }, [key, retry]);
  return {
    stones: state.key === key ? state.stones : [],
    error: state.key === key ? state.error : "",
    loading: !!key && state.key !== key,
    retry: () => {
      setState({ key: "", stones: [], error: "" });
      setRetry((n) => n + 1);
    },
  };
}
function EmptySelection({ compare = false }: { compare?: boolean }) {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <div className="selection-empty">
      {compare ? <GitCompare size={38} /> : <Heart size={38} />}
      <h1>{compare ? "مقایسه انتخاب‌های شما" : "سنگ‌های مورد علاقه شما"}</h1>
      <p>
        {compare
          ? "از کاتالوگ، تا ۶ محصول را برای مقایسه انتخاب کنید."
          : "با لمس قلب روی هر محصول، آن را اینجا نگه دارید."}
      </p>
      <button className="commercial-button" onClick={() => navigate("catalog")}>
        کشف مجموعه سنگ‌ها
      </button>
    </div>
  );
}
export function FavoritesPage() {
  const favorites = useAppStore((s) => s.favorites);
  const { stones, loading, error, retry } = useSelectedProducts(favorites);
  if (!favorites.length) return <EmptySelection />;
  return (
    <section className="commercial-container selection-page">
      <div className="section-heading">
        <div>
          <small>انتخاب‌های شما</small>
          <h1>علاقه‌مندی‌ها</h1>
          <p>
            {favorites.length.toLocaleString("fa-IR")} محصول ذخیره شده در این
            مرورگر
          </p>
        </div>
      </div>
      {loading ? (
        <p role="status">در حال دریافت محصولات...</p>
      ) : error ? (
        <div role="alert">
          {error}
          <button onClick={retry}>تلاش دوباره</button>
        </div>
      ) : (
        <>
          <div className="commercial-product-grid">
            {stones.map((stone) => (
              <ProductCard key={stone.id} stone={stone} />
            ))}
          </div>
          {stones.length < favorites.length && (
            <p className="mt-6 text-sm text-muted-foreground">
              بعضی از محصولات ذخیره‌شده دیگر در کاتالوگ موجود نیستند.
            </p>
          )}
        </>
      )}
    </section>
  );
}
const specifications: Array<{ label: string; get: (s: any) => unknown }> = [
  { label: "دسته‌بندی", get: (s) => s.category?.name },
  { label: "رنگ", get: (s) => s.color },
  { label: "پرداخت", get: (s) => s.surfaceFinish },
  { label: "ضخامت (میلی‌متر)", get: (s) => s.thickness },
  { label: "ابعاد", get: (s) => dimensionsLabel(s.width, s.length) },
  { label: "معدن", get: (s) => s.quarry },
  { label: "وزن (کیلوگرم/متر مربع)", get: (s) => s.weight },
  { label: "جذب آب (%)", get: (s) => s.waterAbsorption },
  { label: "مقاومت فشاری (MPa)", get: (s) => s.compressiveStrength },
  { label: "مقاومت سایشی", get: (s) => s.abrasionResistance },
  { label: "چگالی", get: (s) => s.density },
  { label: "کاربرد", get: (s) => s.application },
  { label: "کشورهای صادراتی", get: (s) => s.exportCountries },
];
export function CompareSelection() {
  const { compareList, toggleCompare, clearCompare, navigate, currency } =
    useAppStore();
  const { stones, loading, error, retry } = useSelectedProducts(compareList);
  const [differences, setDifferences] = useState(false);
  if (!compareList.length) return <EmptySelection compare />;
  const rows = specifications.filter(
    (row) =>
      !differences ||
      new Set(stones.map((s) => String(row.get(s) ?? ""))).size > 1,
  );
  return (
    <section className="commercial-container selection-page">
      <div className="section-heading">
        <div>
          <small>با دقت انتخاب کنید</small>
          <h1>مقایسه سنگ‌ها</h1>
          <p>مشخصات کلیدی، کنار هم و در یک نگاه</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={differences}
              onChange={(e) => setDifferences(e.target.checked)}
            />
            فقط تفاوت‌ها
          </label>
          <button className="text-link" onClick={clearCompare}>
            پاک کردن همه
          </button>
        </div>
      </div>
      {loading ? (
        <p role="status">در حال دریافت مشخصات...</p>
      ) : error ? (
        <div role="alert">
          {error}
          <button onClick={retry}>تلاش دوباره</button>
        </div>
      ) : (
        <div
          className="comparison-scroll"
          tabIndex={0}
          aria-label="جدول مقایسه، قابل پیمایش افقی"
        >
          <table className="comparison-table">
            <caption className="sr-only">
              مقایسه مشخصات {stones.length} محصول
            </caption>
            <thead>
              <tr>
                <th scope="col">مشخصه</th>
                {stones.map((s) => (
                  <th scope="col" key={s.id}>
                    <div className="comparison-product">
                      <button
                        className="comparison-remove"
                        aria-label={`حذف ${s.name} از مقایسه`}
                        onClick={() => toggleCompare(s.id)}
                      >
                        <X size={16} />
                      </button>
                      {s.images?.[0]?.url ? (
                        <img src={s.images[0].url} alt={s.name} />
                      ) : (
                        <div className="comparison-placeholder">
                          <ImageOff size={25} />
                        </div>
                      )}
                      <button onClick={() => navigate("product", { id: s.id })}>
                        {s.name}
                      </button>
                      <small>{s.code}</small>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">قیمت هر متر مربع</th>
                {stones.map((s) => (
                  <td key={s.id}>
                    <strong>
                      {priceLabel(selectDisplayPrice(s.prices, currency))}
                    </strong>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">موجودی قابل فروش</th>
                {stones.map((s) => {
                  const stock = inventorySummary(s);
                  return (
                    <td key={s.id}>
                      {stock.available == null
                        ? stock.label
                        : `${stock.available.toLocaleString("fa-IR")} متر مربع`}
                    </td>
                  );
                })}
              </tr>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {stones.map((s) => (
                    <td key={s.id}>{specValue(row.get(s))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {stones.length < compareList.length && (
            <p className="p-4">برخی محصولات دیگر در کاتالوگ موجود نیستند.</p>
          )}
        </div>
      )}
    </section>
  );
}
