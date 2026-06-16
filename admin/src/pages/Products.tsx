import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminCategoryAPI, adminProductAPI, getImageUrl } from '../services/api';
import { Category, Product, ProductQuantityOffer } from '../types';
import { formatPrice } from '../utils/formatPrice';
import { EditIcon, ViewIcon, DeleteIcon } from '../components/icons/ActionIcons';

type QuantityOfferForm = {
  quantity: string;
  totalPrice: string;
  offerText: string;
};

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  category: string;
  pourcentagePromo: string;
  stockLimite: boolean;
  stockTotal: string;
  // Paramètres de remise et livraison
  useCustomDiscount: boolean;
  quantityDiscountEnabled: string; // 'true', 'false', 'default'
  quantityDiscountMinQuantity: string;
  quantityDiscountPercentage: string;
  useCustomFreeDelivery: boolean;
  freeDeliveryEnabled: string; // 'true', 'false', 'default'
  freeDeliveryMinQuantity: string;
  useCustomDeliveryFee: boolean;
  customDeliveryFee: string;
  quantityOffers: QuantityOfferForm[];
};

const createQuantityOffer = (): QuantityOfferForm => ({
  quantity: '',
  totalPrice: '',
  offerText: '',
});

const createInitialFormData = (): ProductFormData => ({
  name: '',
  description: '',
  price: '',
  category: '',
  pourcentagePromo: '',
  stockLimite: false,
  stockTotal: '',
  useCustomDiscount: false,
  quantityDiscountEnabled: 'default',
  quantityDiscountMinQuantity: '',
  quantityDiscountPercentage: '',
  useCustomFreeDelivery: false,
  freeDeliveryEnabled: 'default',
  freeDeliveryMinQuantity: '',
  useCustomDeliveryFee: false,
  customDeliveryFee: '',
  quantityOffers: [],
});

export const AdminProducts: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(() => createInitialFormData());
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await adminProductAPI.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      setCategoryError(null);
      const data = await adminCategoryAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoryError(t('common.error'));
    } finally {
      setCategoryLoading(false);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles: File[] = [];
    const errors: string[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Format non supporté`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: Taille trop grande (max 5MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(`Erreurs:\n${errors.join('\n')}`);
    }

    if (validFiles.length === 0) return;

    // Ajouter les nouvelles images aux existantes
    const newFiles = [...imageFiles, ...validFiles];
    setImageFiles(newFiles);
    
    const newPreviews = await Promise.all(validFiles.map(readFileAsDataUrl));
    setImagePreviews([...imagePreviews, ...newPreviews]);
    
    // Réinitialiser l'input pour permettre de sélectionner à nouveau
    e.target.value = '';
  };

  const resetForm = () => {
    setFormData(createInitialFormData());
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setCategorySearch('');
  };

  const updateQuantityOffer = (index: number, field: keyof QuantityOfferForm, value: string) => {
    setFormData((current) => ({
      ...current,
      quantityOffers: current.quantityOffers.map((offer, offerIndex) => (
        offerIndex === index ? { ...offer, [field]: value } : offer
      )),
    }));
  };

  const addQuantityOffer = () => {
    setFormData((current) => ({
      ...current,
      quantityOffers: [...current.quantityOffers, createQuantityOffer()],
    }));
  };

  const removeQuantityOffer = (index: number) => {
    setFormData((current) => ({
      ...current,
      quantityOffers: current.quantityOffers.filter((_, offerIndex) => offerIndex !== index),
    }));
  };

  const buildFormPayload = () => {
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('description', formData.description);
    payload.append('price', String(parseFloat(formData.price)));
    if (formData.category) {
      payload.append('category', formData.category);
    }
    payload.append(
      'pourcentagePromo',
      String(parseFloat(formData.pourcentagePromo || '0') || 0)
    );
    payload.append('stockLimite', String(formData.stockLimite));
    payload.append('stockTotal', String(parseInt(formData.stockTotal || '0') || 0));
    
    // Paramètres de remise et livraison
    if (formData.useCustomDiscount) {
      payload.append('quantityDiscountEnabled', formData.quantityDiscountEnabled === 'true' ? 'true' : formData.quantityDiscountEnabled === 'false' ? 'false' : 'null');
      if (formData.quantityDiscountMinQuantity) {
        payload.append('quantityDiscountMinQuantity', String(parseInt(formData.quantityDiscountMinQuantity) || null));
      } else {
        payload.append('quantityDiscountMinQuantity', 'null');
      }
      if (formData.quantityDiscountPercentage) {
        payload.append('quantityDiscountPercentage', String(parseFloat(formData.quantityDiscountPercentage) || null));
      } else {
        payload.append('quantityDiscountPercentage', 'null');
      }
    } else {
      payload.append('quantityDiscountEnabled', 'null');
      payload.append('quantityDiscountMinQuantity', 'null');
      payload.append('quantityDiscountPercentage', 'null');
    }
    
    if (formData.useCustomFreeDelivery) {
      payload.append('freeDeliveryEnabled', formData.freeDeliveryEnabled === 'true' ? 'true' : formData.freeDeliveryEnabled === 'false' ? 'false' : 'null');
      if (formData.freeDeliveryMinQuantity) {
        payload.append('freeDeliveryMinQuantity', String(parseInt(formData.freeDeliveryMinQuantity) || null));
      } else {
        payload.append('freeDeliveryMinQuantity', 'null');
      }
    } else {
      payload.append('freeDeliveryEnabled', 'null');
      payload.append('freeDeliveryMinQuantity', 'null');
    }
    
    if (formData.useCustomDeliveryFee && formData.customDeliveryFee) {
      payload.append('customDeliveryFee', String(parseFloat(formData.customDeliveryFee) || null));
    } else {
      payload.append('customDeliveryFee', 'null');
    }

    const normalizedQuantityOffers = formData.quantityOffers
      .map((offer) => ({
        quantity: Number.parseInt(offer.quantity, 10),
        totalPrice: Number.parseFloat(offer.totalPrice),
        offerText: offer.offerText.trim(),
      }))
      .filter((offer) => Number.isFinite(offer.quantity) && Number.isFinite(offer.totalPrice) && offer.quantity >= 2 && offer.totalPrice >= 0)
      .map((offer) => ({
        quantity: offer.quantity,
        totalPrice: offer.totalPrice,
        ...(offer.offerText ? { offerText: offer.offerText } : {}),
      }));

    payload.append('quantityOffers', JSON.stringify(normalizedQuantityOffers));
    
    imageFiles.forEach((file) => {
      payload.append('images', file);
    });
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = buildFormPayload();

      if (editingProduct) {
        await adminProductAPI.update(editingProduct._id, payload);
      } else {
        await adminProductAPI.create(payload);
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde du produit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const hasCustomDiscount = product.quantityDiscountEnabled !== null && product.quantityDiscountEnabled !== undefined;
    const hasCustomFreeDelivery = product.freeDeliveryEnabled !== null && product.freeDeliveryEnabled !== undefined;
    const hasCustomDeliveryFee = product.customDeliveryFee !== null && product.customDeliveryFee !== undefined;
    const quantityOffers = Array.isArray(product.quantityOffers)
      ? product.quantityOffers.map((offer: ProductQuantityOffer) => ({
          quantity: String(offer.quantity ?? ''),
          totalPrice: String(offer.totalPrice ?? ''),
          offerText: offer.offerText ?? '',
        }))
      : [];
    
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category:
        typeof product.category === 'object' && product.category !== null
          ? product.category._id
          : product.category || '',
      pourcentagePromo: product.pourcentagePromo?.toString() || '',
      stockLimite: Boolean(product.stockLimite),
      stockTotal: product.stockTotal?.toString() || '',
      useCustomDiscount: hasCustomDiscount,
      quantityDiscountEnabled: hasCustomDiscount 
        ? (product.quantityDiscountEnabled ? 'true' : 'false')
        : 'default',
      quantityDiscountMinQuantity: product.quantityDiscountMinQuantity?.toString() || '',
      quantityDiscountPercentage: product.quantityDiscountPercentage?.toString() || '',
      useCustomFreeDelivery: hasCustomFreeDelivery,
      freeDeliveryEnabled: hasCustomFreeDelivery
        ? (product.freeDeliveryEnabled ? 'true' : 'false')
        : 'default',
      freeDeliveryMinQuantity: product.freeDeliveryMinQuantity?.toString() || '',
      useCustomDeliveryFee: hasCustomDeliveryFee,
      customDeliveryFee: product.customDeliveryFee?.toString() || '',
      quantityOffers,
    });
    setExistingImages(product.images ?? (product.image ? [product.image] : []));
    setImageFiles([]);
    setImagePreviews([]);
    setShowForm(true);
  };


  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.products.confirmDelete'))) return;
    try {
      await adminProductAPI.delete(id);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleViewDetails = (product: Product) => {
    setViewingProduct(product);
  };

  if (loading) {
    return (
      <div className="admin-products">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t('admin.products.title')}</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            resetForm();
          }}
          className="admin-btn-primary"
        >
          {t('admin.products.add')}
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal">
          <div className="admin-form-content">
            <div className="admin-form-header">
              <h2>{editingProduct ? t('admin.products.edit') : t('admin.products.add')}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="admin-form-close-btn"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-product-form">
              <div className="admin-form-grid">
                <div className="form-group">
                  <label htmlFor="product-name">{t('admin.products.name')}</label>
                  <input
                    id="product-name"
                    type="text"
                    className="admin-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nom du produit"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="product-price">{t('admin.products.price')}</label>
                  <input
                    id="product-price"
                    type="number"
                    className="admin-form-input"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="product-category">{t('admin.products.category')}</label>
                  {categoryLoading ? (
                    <div className="category-loading">{t('common.loading')}</div>
                  ) : (
                    <div className="category-select-wrapper">
                      <select
                        id="product-category"
                        className="admin-form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={!categories.length}
                      >
                        <option value="">{t('admin.products.selectCategory') || 'Sélectionner une catégorie'}</option>
                        {categories
                          .filter((cat) => 
                            !categorySearch || 
                            cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                          )
                          .map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                      {categories.length > 5 && (
                        <input
                          type="text"
                          className="category-search-input"
                          placeholder="Rechercher une catégorie..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                        />
                      )}
                      {formData.category && (
                        <div className="selected-category-badge">
                          {(() => {
                            const selected = categories.find(c => c._id === formData.category);
                            if (!selected) return null;
                            return (
                              <>
                                <span>{selected.name}</span>
                                <span className={`category-status-indicator ${selected.isActive ? 'active' : 'inactive'}`}>
                                  {selected.isActive ? '✓' : '✗'}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                  {!categories.length && !categoryLoading && (
                    <p className="category-helper">
                      Aucune catégorie disponible. <a href="/admin/categories" target="_blank">Créer une catégorie</a>
                    </p>
                  )}
                  {categoryError && <p className="form-error">{categoryError}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="product-promo">{t('admin.products.pourcentagePromo')}</label>
                  <input
                    id="product-promo"
                    type="number"
                    className="admin-form-input"
                    min="0"
                    max="100"
                    value={formData.pourcentagePromo}
                    onChange={(e) =>
                      setFormData({ ...formData, pourcentagePromo: e.target.value })
                    }
                    placeholder="0"
                  />
                  {formData.pourcentagePromo && formData.price && (
                    <span className="promo-preview">
                      Prix final: {formatPrice(parseFloat(formData.price) * (1 - parseFloat(formData.pourcentagePromo) / 100))}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="product-stock-total">Stock total</label>
                  <input
                    id="product-stock-total"
                    type="number"
                    className="admin-form-input"
                    min="0"
                    value={formData.stockTotal}
                    onChange={(e) =>
                      setFormData({ ...formData, stockTotal: e.target.value })
                    }
                  />
                  <span className="stock-hint">
                    Quantité totale disponible en stock (0 = stock illimité)
                  </span>
                </div>

                <div className="form-group">
                  <label>Offres quantité</label>
                  <div className="quantity-offers-editor">
                    <p className="admin-form-hint">
                      Ajoutez les paliers comme 2 pièces = 25 DT ou 3 pièces = 35 DT. Le backend appliquera l'offre exacte.
                    </p>

                    {formData.quantityOffers.length === 0 && (
                      <p className="admin-form-hint">Aucune offre quantité ajoutée.</p>
                    )}

                    <div className="quantity-offers-list">
                      {formData.quantityOffers.map((offer, index) => (
                        <div key={`quantity-offer-${index}`} className="quantity-offer-row">
                          <input
                            type="number"
                            min="2"
                            className="admin-form-input"
                            value={offer.quantity}
                            onChange={(e) => updateQuantityOffer(index, 'quantity', e.target.value)}
                            placeholder="Quantité"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            className="admin-form-input"
                            value={offer.totalPrice}
                            onChange={(e) => updateQuantityOffer(index, 'totalPrice', e.target.value)}
                            placeholder="Prix total"
                          />
                          <textarea
                            className="admin-form-textarea"
                            value={offer.offerText}
                            onChange={(e) => updateQuantityOffer(index, 'offerText', e.target.value)}
                            placeholder="Texte de l'offre"
                            rows={3}
                          />
                          <button
                            type="button"
                            className="admin-btn-secondary quantity-offer-remove-btn"
                            onClick={() => removeQuantityOffer(index)}
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={addQuantityOffer}
                    >
                      Ajouter une offre
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="product-description">{t('admin.products.description')}</label>
                <textarea
                  id="product-description"
                  className="admin-form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Description du produit"
                  rows={5}
                />
              </div>
              <div className="form-group checkbox-group">
                <label htmlFor="product-stock">
                  <input
                    id="product-stock"
                    type="checkbox"
                    checked={formData.stockLimite}
                    onChange={(e) => setFormData({ ...formData, stockLimite: e.target.checked })}
                  />
                  <div className="checkbox-label-content">
                    <span className="checkbox-label-text">{t('admin.products.stockLimite')}</span>
                    <span className="checkbox-label-hint">
                      {formData.stockLimite 
                        ? '⚠️ Le stock de ce produit est limité' 
                        : '✓ Stock illimité pour ce produit'}
                    </span>
                  </div>
                </label>
              </div>
              <div className="form-group">
                <label>{t('admin.products.image')} {imageFiles.length > 0 && <span className="image-count">({imageFiles.length})</span>}</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="image-file-input"
                    id="product-image-upload"
                  />
                  <label htmlFor="product-image-upload" className="image-upload-label">
                    <span className="upload-icon">📷</span>
                    <span>
                      {imageFiles.length > 0
                        ? `Ajouter d'autres images (${imageFiles.length} déjà sélectionnée${imageFiles.length > 1 ? 's' : ''})`
                        : 'Choisir une ou plusieurs images'}
                    </span>
                  </label>
                  <p className="image-hint">
                    Formats acceptés: JPG, PNG, WEBP (max 5MB par image). 
                    Vous pouvez sélectionner plusieurs images à la fois ou ajouter des images progressivement.
                  </p>
                  
                  {/* Images existantes (en édition) */}
                  {existingImages.length > 0 && (
                    <div className="images-section">
                      <h4 className="images-section-title">Images actuelles ({existingImages.length})</h4>
                      <div className="image-preview-grid">
                        {existingImages.map((img) => (
                          <div key={img} className="image-preview-container existing">
                            <img src={getImageUrl(img)} alt="Produit" className="image-preview" />
                            <span className="image-badge">Actuelle</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Nouvelles images sélectionnées */}
                  {imagePreviews.length > 0 && (
                    <div className="images-section">
                      <h4 className="images-section-title">Nouvelles images ({imagePreviews.length})</h4>
                      <div className="image-preview-grid">
                        {imagePreviews.map((preview, idx) => (
                          <div key={`preview-${idx}`} className="image-preview-container new">
                            <img src={preview} alt="Preview" className="image-preview" />
                            <button
                              type="button"
                              className="image-remove-btn"
                              onClick={() => {
                                const newFiles = [...imageFiles];
                                const newPreviews = [...imagePreviews];
                                newFiles.splice(idx, 1);
                                newPreviews.splice(idx, 1);
                                setImageFiles(newFiles);
                                setImagePreviews(newPreviews);
                              }}
                              title="Supprimer cette image"
                            >
                              ✕
                            </button>
                            <span className="image-badge new-badge">Nouvelle</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Message si aucune image */}
                  {existingImages.length === 0 && imagePreviews.length === 0 && (
                    <div className="no-images-message">
                      <span>📷</span>
                      <p>Aucune image sélectionnée. Cliquez sur le bouton ci-dessus pour ajouter des images.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Section Paramètres de remise et livraison */}
              <div className="product-settings-section">
                <h3 className="settings-section-title">Offres et promotions</h3>
                <p className="settings-section-subtitle">
                  Configurez les règles de remise et livraison spécifiques à ce produit. 
                  Si non configuré, les paramètres globaux seront utilisés.
                </p>
                
                {/* Remise quantité */}
                <div className="settings-item">
                  <div className="settings-item-header">
                    <label className="settings-item-label">
                      <input
                        type="checkbox"
                        checked={formData.useCustomDiscount}
                        onChange={(e) => setFormData({ ...formData, useCustomDiscount: e.target.checked })}
                      />
                      <span>Remise quantité personnalisée</span>
                    </label>
                  </div>
                  {formData.useCustomDiscount && (
                    <div className="settings-item-content">
                      <div className="form-group">
                        <label>Activer la remise</label>
                        <select
                          className="admin-form-select"
                          value={formData.quantityDiscountEnabled}
                          onChange={(e) => setFormData({ ...formData, quantityDiscountEnabled: e.target.value })}
                        >
                          <option value="default">Utiliser les paramètres globaux</option>
                          <option value="true">Activée</option>
                          <option value="false">Désactivée</option>
                        </select>
                      </div>
                      {formData.quantityDiscountEnabled !== 'default' && (
                        <>
                          <div className="form-group">
                            <label>Quantité minimale</label>
                            <input
                              type="number"
                              min="1"
                              className="admin-form-input"
                              value={formData.quantityDiscountMinQuantity}
                              onChange={(e) => setFormData({ ...formData, quantityDiscountMinQuantity: e.target.value })}
                              placeholder="Ex: 2"
                            />
                          </div>
                          <div className="form-group">
                            <label>Pourcentage de remise (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              className="admin-form-input"
                              value={formData.quantityDiscountPercentage}
                              onChange={(e) => setFormData({ ...formData, quantityDiscountPercentage: e.target.value })}
                              placeholder="Ex: 5"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Livraison gratuite */}
                <div className="settings-item">
                  <div className="settings-item-header">
                    <label className="settings-item-label">
                      <input
                        type="checkbox"
                        checked={formData.useCustomFreeDelivery}
                        onChange={(e) => setFormData({ ...formData, useCustomFreeDelivery: e.target.checked })}
                      />
                      <span>Livraison gratuite personnalisée</span>
                    </label>
                  </div>
                  {formData.useCustomFreeDelivery && (
                    <div className="settings-item-content">
                      <div className="form-group">
                        <label>Activer la livraison gratuite</label>
                        <select
                          className="admin-form-select"
                          value={formData.freeDeliveryEnabled}
                          onChange={(e) => setFormData({ ...formData, freeDeliveryEnabled: e.target.value })}
                        >
                          <option value="default">Utiliser les paramètres globaux</option>
                          <option value="true">Activée</option>
                          <option value="false">Désactivée</option>
                        </select>
                      </div>
                      {formData.freeDeliveryEnabled !== 'default' && (
                        <div className="form-group">
                          <label>Quantité minimale</label>
                          <input
                            type="number"
                            min="1"
                            className="admin-form-input"
                            value={formData.freeDeliveryMinQuantity}
                            onChange={(e) => setFormData({ ...formData, freeDeliveryMinQuantity: e.target.value })}
                            placeholder="Ex: 3"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Frais de livraison personnalisé */}
                <div className="settings-item">
                  <div className="settings-item-header">
                    <label className="settings-item-label">
                      <input
                        type="checkbox"
                        checked={formData.useCustomDeliveryFee}
                        onChange={(e) => setFormData({ ...formData, useCustomDeliveryFee: e.target.checked })}
                      />
                      <span>Frais de livraison personnalisé</span>
                    </label>
                  </div>
                  {formData.useCustomDeliveryFee && (
                    <div className="settings-item-content">
                      <div className="form-group">
                        <label>Frais de livraison (د.ت)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          className="admin-form-input"
                          value={formData.customDeliveryFee}
                          onChange={(e) => setFormData({ ...formData, customDeliveryFee: e.target.value })}
                          placeholder="Ex: 7"
                        />
                        <p className="admin-form-hint">
                          Si non renseigné, les frais de livraison globaux seront utilisés
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn-primary" disabled={submitting}>
                  {submitting ? t('common.loading') : t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="admin-btn-secondary"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.products.image')}</th>
              <th>{t('admin.products.name')}</th>
              <th>{t('admin.products.category')}</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const finalPrice = product.pourcentagePromo 
                ? product.price * (1 - product.pourcentagePromo / 100)
                : product.price;
              
              return (
                <tr key={product._id}>
                  <td>
                    <div className="product-images-cell">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="product-table-image"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Afficher le placeholder si l'image ne charge pas
                              const placeholder = target.parentElement?.querySelector('.product-table-image-placeholder');
                              if (!placeholder) {
                                const placeholderDiv = document.createElement('div');
                                placeholderDiv.className = 'product-table-image-placeholder';
                                placeholderDiv.textContent = '📦';
                                target.parentElement?.appendChild(placeholderDiv);
                              }
                            }}
                          />
                          {product.images.length > 1 && (
                            <span className="image-count-badge">+{product.images.length - 1}</span>
                          )}
                        </>
                      ) : product.image ? (
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          className="product-table-image"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.parentElement?.querySelector('.product-table-image-placeholder');
                            if (!placeholder) {
                              const placeholderDiv = document.createElement('div');
                              placeholderDiv.className = 'product-table-image-placeholder';
                              placeholderDiv.textContent = '📦';
                              target.parentElement?.appendChild(placeholderDiv);
                            }
                          }}
                        />
                      ) : (
                        <div className="product-table-image-placeholder">📦</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="product-name-cell">
                      <strong>{product.name}</strong>
                      {product.pourcentagePromo && (
                        <span className="promo-badge-table">-{product.pourcentagePromo}%</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {typeof product.category === 'object' && product.category !== null ? (
                      <div className="category-name-cell">
                        <span>{product.category.name}</span>
                        {!product.category.isActive && (
                          <span className="status-badge status-muted">
                            {t('admin.categories.inactiveLabel')}
                          </span>
                        )}
                      </div>
                    ) : (
                      product.category || '-'
                    )}
                  </td>
                  <td>
                    <div className="price-cell">
                      {product.pourcentagePromo ? (
                        <>
                          <span className="price-original">{formatPrice(product.price)}</span>
                          <span className="price-final">{formatPrice(finalPrice)}</span>
                        </>
                      ) : (
                        <span className="price-final">{formatPrice(product.price)}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="stock-cell">
                      {product.stockLimite ? (
                        product.stockTotal !== undefined ? (
                          <div className="stock-info">
                            <div className="stock-total">
                              <span className="stock-label">Total:</span>
                              <span className="stock-value">{product.stockTotal}</span>
                            </div>
                            {product.remainingStock !== null && product.remainingStock !== undefined && (
                              <div className={`stock-remaining ${product.remainingStock === 0 ? 'out-of-stock' : product.remainingStock < 10 ? 'low-stock' : ''}`}>
                                <span className="stock-label">Restant:</span>
                                <span className="stock-value">{product.remainingStock}</span>
                              </div>
                            )}
                            {product.orderedQuantity !== undefined && product.orderedQuantity > 0 && (
                              <div className="stock-ordered">
                                <span className="stock-label">Commandé:</span>
                                <span className="stock-value">{product.orderedQuantity}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="stock-status-badge limited">⚠️ Stock limité</span>
                        )
                      ) : (
                        <span className="stock-status-badge unlimited">✓ Illimité</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="admin-btn-edit"
                        title="Modifier"
                      >
                        <EditIcon size={18} />
                      </button>
                      <button 
                        onClick={() => handleViewDetails(product)} 
                        className="admin-btn-view"
                        title="Voir les détails complets du produit"
                      >
                        <ViewIcon size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product._id)} 
                        className="admin-btn-delete"
                        title="Supprimer"
                      >
                        <DeleteIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de détails produit */}
      {viewingProduct && (
        <div className="admin-form-modal" onClick={() => setViewingProduct(null)}>
          <div className="product-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-details-header">
              <h2>{viewingProduct.name}</h2>
              <button
                className="admin-form-close-btn"
                onClick={() => setViewingProduct(null)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="product-details-content">
              {/* Images à gauche */}
              <div className="product-details-images">
                {viewingProduct.images && viewingProduct.images.length > 0 ? (
                  <>
                    <div className="product-main-image">
                      <img src={getImageUrl(viewingProduct.images[0])} alt={viewingProduct.name} />
                    </div>
                    {viewingProduct.images.length > 1 && (
                      <div className="product-thumbnails">
                        {viewingProduct.images.slice(1, 5).map((img, idx) => (
                          <div key={idx} className="product-thumbnail">
                            <img src={getImageUrl(img)} alt={`${viewingProduct.name} ${idx + 2}`} />
                          </div>
                        ))}
                        {viewingProduct.images.length > 5 && (
                          <div className="product-thumbnail more">
                            +{viewingProduct.images.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : viewingProduct.image ? (
                  <div className="product-main-image">
                    <img src={getImageUrl(viewingProduct.image)} alt={viewingProduct.name} />
                  </div>
                ) : (
                  <div className="product-no-image">
                    <span>📦</span>
                    <p>Aucune image</p>
                  </div>
                )}
              </div>

              {/* Informations à droite */}
              <div className="product-details-info">
                <div className="info-section">
                  <div className="info-item">
                    <span className="info-label">Description</span>
                    <p className="info-text">{viewingProduct.description}</p>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Catégorie</span>
                    <span className="info-badge">
                      {typeof viewingProduct.category === 'object' && viewingProduct.category !== null
                        ? viewingProduct.category.name
                        : viewingProduct.category || 'Aucune'}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Prix</span>
                    <div className="price-info">
                      {viewingProduct.pourcentagePromo ? (
                        <>
                          <span className="price-original">{formatPrice(viewingProduct.price)}</span>
                          <span className="price-final">{formatPrice(viewingProduct.price * (1 - viewingProduct.pourcentagePromo / 100))}</span>
                          <span className="price-discount">-{viewingProduct.pourcentagePromo}%</span>
                        </>
                      ) : (
                        <span className="price-final">{formatPrice(viewingProduct.price)}</span>
                      )}
                    </div>
                  </div>

                  {Array.isArray(viewingProduct.quantityOffers) && viewingProduct.quantityOffers.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Offres quantité</span>
                      <div className="quantity-offers-summary">
                        {viewingProduct.quantityOffers
                          .filter((offer) => offer.isActive !== false)
                          .map((offer) => (
                            <div key={`${offer.quantity}-${offer.totalPrice}`} className="quantity-offer-summary-item">
                              <strong>{offer.offerText || `${offer.quantity} pièces`}</strong>
                              <span>{formatPrice(offer.totalPrice)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="info-item">
                    <span className="info-label">Stock</span>
                    <div className="stock-info">
                      {viewingProduct.stockLimite ? (
                        viewingProduct.stockTotal !== undefined ? (
                          <div className="stock-details">
                            <div className="stock-item">
                              <span>Total:</span>
                              <strong>{viewingProduct.stockTotal}</strong>
                            </div>
                            {viewingProduct.remainingStock !== null && viewingProduct.remainingStock !== undefined && (
                              <div className={`stock-item ${viewingProduct.remainingStock === 0 ? 'out' : viewingProduct.remainingStock < 10 ? 'low' : ''}`}>
                                <span>Restant:</span>
                                <strong>{viewingProduct.remainingStock}</strong>
                              </div>
                            )}
                            {viewingProduct.orderedQuantity !== undefined && viewingProduct.orderedQuantity > 0 && (
                              <div className="stock-item">
                                <span>Commandé:</span>
                                <strong>{viewingProduct.orderedQuantity}</strong>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="stock-status">Stock limité</span>
                        )
                      ) : (
                        <span className="stock-status unlimited">Stock illimité</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="product-details-actions">
              <button
                className="admin-btn-primary"
                onClick={() => {
                  handleEdit(viewingProduct);
                  setViewingProduct(null);
                }}
              >
                Modifier
              </button>
              <button
                className="admin-btn-secondary"
                onClick={() => setViewingProduct(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

