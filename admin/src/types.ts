// Types pour les produits
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  images?: string[];
  category?: string | Category | null;
  pourcentagePromo?: number;
  stockLimite?: boolean;
  stockTotal?: number;
  orderedQuantity?: number;
  remainingStock?: number | null;
  // Paramètres de remise et livraison (spécifiques au produit)
  quantityDiscountEnabled?: boolean | null;
  quantityDiscountMinQuantity?: number | null;
  quantityDiscountPercentage?: number | null;
  freeDeliveryEnabled?: boolean | null;
  freeDeliveryMinQuantity?: number | null;
  customDeliveryFee?: number | null;
  quantityOffers?: ProductQuantityOffer[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductQuantityOffer {
  _id?: string;
  product?: string;
  quantity: number;
  totalPrice: number;
  offerText?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DescImgProdType = 'hero' | 'lifestyle' | 'infographic' | 'spec' | 'other';

export interface DescImgProdMetadata {
  width?: number;
  height?: number;
  size?: number;
  format?: string;
}

export interface DescImgProd {
  _id: string;
  productId: string;
  url: string;
  public_id?: string;
  alt?: string | null;
  caption?: string | Record<string, string> | null;
  type?: DescImgProdType;
  position?: number;
  isMain?: boolean;
  metadata?: DescImgProdMetadata;
  variants?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les commandes
export interface Order {
  _id: string;
  clientName: string;
  email?: string;
  phone: string;
  ville: string;
  address: string;
  product: string | Product;
  quantity: number;
  status: 'Nouveau' | 'En cours' | 'Terminé' | 'Annulé';
  totalPrice?: number;
  unitPrice?: number;
  unitPriceWithPromo?: number;
  subtotal?: number;
  deliveryFee?: number;
  isFreeDelivery?: boolean;
  productPromoPercentage?: number;
  quantityDiscountPercentage?: number;
  quantityDiscountAmount?: number;
  priceAfterDiscount?: number;
  createdAt?: string;
}

// Types pour le thème
export type Theme = "light" | "dark";

// Types pour la langue
export type Language = 'fr' | 'en' | 'ar';

