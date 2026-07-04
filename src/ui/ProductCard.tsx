import type { ProductCardSnapshot } from '@/types/product.ts'
import './ProductCard.css'

interface ProductCardProps {
  product: ProductCardSnapshot
  onPurchase: (productId: string) => void
}

function formatAvailability(product: ProductCardSnapshot): string {
  switch (product.availability) {
    case 'available':
      return 'Available'
    case 'unaffordable':
      return 'Insufficient funds'
    case 'limit_reached':
      return 'Purchase limit reached'
    default:
      return 'Coming soon'
  }
}

export function ProductCard({ product, onPurchase }: ProductCardProps) {
  return (
    <article className="product-card">
      <div
        className={`product-card__image product-card__image--${product.imageKey}`}
        aria-hidden="true"
      />
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__description">{product.description}</p>
        <ul className="product-card__specs">
          {product.specifications.map((spec) => (
            <li key={spec}>{spec}</li>
          ))}
        </ul>
        <dl className="product-card__meta">
          <div>
            <dt>Price</dt>
            <dd>₡{product.price.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Owned</dt>
            <dd>
              {product.ownedCount}
              {product.maxOwned !== null ? ` / ${product.maxOwned}` : ''}
            </dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{formatAvailability(product)}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="product-card__buy"
          disabled={!product.canPurchase}
          onClick={() => onPurchase(product.id)}
        >
          Buy
        </button>
      </div>
    </article>
  )
}
