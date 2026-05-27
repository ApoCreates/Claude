import { hasLiveAI } from "@/lib/ai/client";
import ProductStudio from "@/components/product/ProductStudio";

export default function StudioPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Product image → listing</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Drop in a product photo and Product Studio generates everything you need to publish: a
          product name, listing title, short and long descriptions, search tags, attribute metadata,
          full SEO block, and a recommended image gallery.
        </p>
      </div>
      <ProductStudio live={hasLiveAI()} />
    </div>
  );
}
