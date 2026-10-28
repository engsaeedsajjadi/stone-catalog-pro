"use client";
import { useState } from "react";
import { Heart, GitCompare, ArrowUpLeft, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import {
  inventorySummary,
  selectDisplayPrice,
  priceLabel,
} from "@/lib/product-presentation";

// API records include optional, owner-managed specification fields.
export function ProductCard({ stone }: { stone: any }) {
  const {
    navigate,
    currency,
    toggleFavorite,
    favorites,
    toggleCompare,
    compareList,
  } = useAppStore();
  const [failed, setFailed] = useState(false);
  const image =
    stone.images?.find((item: any) => item.isPrimary)?.url ||
    stone.images?.[0]?.url;
  const price = selectDisplayPrice(stone.prices, currency);
  const stock = inventorySummary(stone);
  const favorite = favorites.includes(stone.id);
  const compared = compareList.includes(stone.id);
  return (
    <article className="catalog-card">
      <div className="catalog-card-media">
        <a
          href={`/?product=${encodeURIComponent(stone.id)}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("product", { id: stone.id });
          }}
          className="catalog-card-image"
          aria-label={`مشاهده ${stone.name}`}
        >
          {image && !failed ? (
            <img
              src={image}
              alt={stone.name}
              loading="lazy"
              onError={() => setFailed(true)}
            />
          ) : (
            <span className="image-placeholder">
              <ImageOff size={28} />
              <span>تصویر هنوز ثبت نشده</span>
            </span>
          )}
        </a>
        <span className={`stock-pill ${stock.tone}`}>
          <i />
          {stock.label}
        </span>
        <button
          className={`card-favorite ${favorite ? "selected" : ""}`}
          aria-pressed={favorite}
          aria-label={`${favorite ? "حذف" : "افزودن"} ${stone.name} ${favorite ? "از" : "به"} علاقه‌مندی‌ها`}
          onClick={() => toggleFavorite(stone.id)}
        >
          <Heart size={17} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="catalog-card-body">
        <div className="card-eyebrow">
          <span>{stone.category?.name || "سنگ طبیعی"}</span>
          <bdi>{stone.code}</bdi>
        </div>
        <a
          className="card-title"
          href={`/?product=${encodeURIComponent(stone.id)}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("product", { id: stone.id });
          }}
        >
          <h3>{stone.name}</h3>
          <ArrowUpLeft size={18} />
        </a>
        <p className="card-specs">
          {[
            stone.color,
            stone.thickness ? `${stone.thickness} میلی‌متر` : null,
            stone.surfaceFinish,
          ]
            .filter(Boolean)
            .join(" · ") || "جزئیات در صفحه محصول"}
        </p>
        <div className="card-price">
          <div>
            <small>
              هر متر مربع
              {price?.minQuantity ? ` · حداقل ${price.minQuantity} متر` : ""}
            </small>
            <strong>{priceLabel(price)}</strong>
          </div>
          <button
            aria-pressed={compared}
            className={compared ? "selected" : ""}
            onClick={() => {
              if (!compared && compareList.length >= 6) {
                toast.info("حداکثر ۶ محصول را مقایسه کنید.");
                return;
              }
              toggleCompare(stone.id);
            }}
          >
            <GitCompare size={16} />
            {compared ? "انتخاب شد" : "مقایسه"}
          </button>
        </div>
      </div>
    </article>
  );
}
