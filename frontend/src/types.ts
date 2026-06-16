// Types pour les produits
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];      // vient du backend
  category?: {
    _id: string;
    name: string;
  } | string;            // si non populé
  pourcentagePromo?: number;
  stockLimite?: boolean;
  // Paramètres de remise et livraison (spécifiques au produit)
  quantityDiscountEnabled?: boolean | null;
  quantityDiscountMinQuantity?: number | null;
  quantityDiscountPercentage?: number | null;
  freeDeliveryEnabled?: boolean | null;
  freeDeliveryMinQuantity?: number | null;
  customDeliveryFee?: number | null;
  quantityOffers?: ProductQuantityOffer[];
  createdAt?: string;
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

// Types pour les images descriptives de produits
export type DescImgProdType = 'hero' | 'lifestyle' | 'infographic' | 'spec' | 'other';

export interface DescImgProd {
  _id: string;
  productId: string;
  url: string;
  public_id: string;
  alt?: string;
  caption?: string | Record<string, string>;
  type: DescImgProdType;
  position: number;
  isMain: boolean;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    format?: string;
  };
  variants?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// Types pour les commandes
export interface Order {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  products: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

// Types pour le thème
export type Theme = 'light' | 'dark';

// Types pour la langue
export type Language = 'fr' | 'ar';

