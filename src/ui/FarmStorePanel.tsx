import type { Game } from '@core/Game.ts'
import type { FarmStoreSnapshot } from '@/types/farm-store.ts'
import { ProductCategory } from '@/types/product.ts'
import { ProductCard } from './ProductCard.tsx'
import './FarmStorePanel.css'

interface FarmStorePanelProps {
  game: Game
  farmStore: FarmStoreSnapshot
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.Tractors]: 'Tractors',
  [ProductCategory.Harvesters]: 'Harvesters',
  [ProductCategory.Attachments]: 'Attachments',
  [ProductCategory.Trailers]: 'Trailers',
  [ProductCategory.Fertilizers]: 'Fertilizers',
  [ProductCategory.Chemicals]: 'Chemicals',
}

const CATEGORY_ORDER: ProductCategory[] = [
  ProductCategory.Tractors,
  ProductCategory.Harvesters,
  ProductCategory.Attachments,
  ProductCategory.Trailers,
  ProductCategory.Fertilizers,
  ProductCategory.Chemicals,
]

export function FarmStorePanel({ game, farmStore }: FarmStorePanelProps) {
  if (!farmStore.open) {
    return null
  }

  const activeProducts = farmStore.products
  const isEmptyCategory = activeProducts.length === 0

  return (
    <div className="farm-store-panel" role="dialog" aria-label={farmStore.storeName ?? 'Farm Store'}>
      <button
        type="button"
        className="farm-store-panel__backdrop"
        aria-label="Close store"
        onClick={() => game.closeFarmStore()}
      />
      <section className="farm-store-panel__sheet">
        <header className="farm-store-panel__header">
          <div>
            <p className="farm-store-panel__eyebrow">Farm Store</p>
            <h2>{farmStore.storeName ?? 'Store'}</h2>
          </div>
          <button
            type="button"
            className="farm-store-panel__close"
            onClick={() => game.closeFarmStore()}
          >
            Close
          </button>
        </header>

        <nav className="farm-store-panel__tabs" aria-label="Product categories">
          {CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              type="button"
              className={
                farmStore.activeCategory === category
                  ? 'farm-store-panel__tab farm-store-panel__tab--active'
                  : 'farm-store-panel__tab'
              }
              onClick={() => game.setFarmStoreCategory(category)}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </nav>

        <div className="farm-store-panel__content">
          {isEmptyCategory ? (
            <p className="farm-store-panel__empty">
              Products in this category are coming soon.
            </p>
          ) : (
            <div className="farm-store-panel__grid">
              {activeProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPurchase={(productId) => game.purchaseProduct(productId)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
