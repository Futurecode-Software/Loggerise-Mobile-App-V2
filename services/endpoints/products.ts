/**
 * Products API Endpoints
 *
 * Handles product management operations including brands, categories, and models.
 */

import api, { getErrorMessage } from '../api';

/**
 * Product brand entity
 */
export interface ProductBrand {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Product category entity
 */
export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  parent?: { id: number; name: string } | null;
  children_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Product model entity
 */
export interface ProductModel {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Product type enum
 */
export type ProductType = 'goods' | 'service';

/**
 * Product unit enum (UN/ECE Recommendation 20 codes)
 */
export type ProductUnit =
  | 'NIU'
  | 'DAY'
  | 'MON'
  | 'ANN'
  | 'HUR'
  | 'D61'
  | 'D62'
  | 'PA'
  | 'BX'
  | 'MGM'
  | 'GRM'
  | 'KGM'
  | 'LTR'
  | 'TNE'
  | 'NT'
  | 'GT'
  | 'MMT'
  | 'CMT'
  | 'MTR'
  | 'KTM'
  | 'MLT'
  | 'MMQ'
  | 'CMK'
  | 'CMQ'
  | 'MTK'
  | 'MTQ'
  | 'KJO'
  | 'CLT'
  | 'CT'
  | 'KWH'
  | 'MWH'
  | 'CCT'
  | 'D30'
  | 'D40'
  | 'LPA'
  | 'B32'
  | 'NCL'
  | 'PR'
  | 'R9'
  | 'SET'
  | 'T3'
  | 'Q37'
  | 'Q39'
  | 'J39'
  | 'G52'
  | 'DZN'
  | 'DMK'
  | 'DMT'
  | 'HAR'
  | 'LM';

/**
 * Product entity
 */
export interface Product {
  id: number;
  name: string;
  code?: string;
  description?: string;
  product_type: ProductType;
  unit: ProductUnit;
  product_brand_id?: number;
  product_model_id?: number;
  product_category_id?: number;
  brand?: { id: number; name: string } | null;
  model?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  purchase_price?: number;
  sale_price?: number;
  vat_rate?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  barcode?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Product list filters
 */
export interface ProductFilters {
  search?: string;
  product_brand_id?: number;
  product_model_id?: number;
  product_category_id?: number;
  product_type?: ProductType;
  unit?: ProductUnit;
  is_active?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Pagination info
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Products list response
 */
interface ProductsListResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: Pagination;
  };
}

/**
 * Single product response
 */
interface ProductResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

/**
 * Brands list response
 */
interface BrandsListResponse {
  success: boolean;
  data: {
    brands: ProductBrand[];
    pagination: Pagination;
  };
}

/**
 * Categories list response
 */
interface CategoriesListResponse {
  success: boolean;
  data: {
    categories: ProductCategory[];
    pagination: Pagination;
  };
}

/**
 * Models list response
 */
interface ModelsListResponse {
  success: boolean;
  data: {
    models: ProductModel[];
    pagination: Pagination;
  };
}

/**
 * Create/Update product data
 */
export interface ProductFormData {
  name: string;
  code?: string;
  description?: string;
  product_type: ProductType;
  unit: ProductUnit;
  product_brand_id?: number;
  product_model_id?: number;
  product_category_id?: number;
  purchase_price?: number;
  sale_price?: number;
  vat_rate?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  barcode?: string;
  is_active?: boolean;
}

/**
 * Get products list with optional filters
 */
export async function getProducts(
  filters?: ProductFilters
): Promise<{ products: Product[]; pagination: Pagination }> {
  try {
    const response = await api.get<ProductsListResponse>('/products', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single product by ID
 */
export async function getProduct(id: number): Promise<Product> {
  try {
    const response = await api.get<ProductResponse>(`/products/${id}`);
    return response.data.data.product;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new product
 */
export async function createProduct(data: ProductFormData): Promise<Product> {
  try {
    const response = await api.post<ProductResponse>('/products', data);
    return response.data.data.product;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing product
 */
export async function updateProduct(
  id: number,
  data: Partial<ProductFormData>
): Promise<Product> {
  try {
    const response = await api.put<ProductResponse>(`/products/${id}`, data);
    return response.data.data.product;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete product
 */
export async function deleteProduct(id: number): Promise<void> {
  try {
    await api.delete(`/products/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get product brands list
 */
export async function getProductBrands(
  filters?: { search?: string; is_active?: boolean; page?: number; per_page?: number }
): Promise<{ brands: ProductBrand[]; pagination: Pagination }> {
  try {
    const response = await api.get<BrandsListResponse>('/product-brands', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get product categories list
 */
export async function getProductCategories(
  filters?: { search?: string; parent_id?: number; is_active?: boolean; page?: number; per_page?: number }
): Promise<{ categories: ProductCategory[]; pagination: Pagination }> {
  try {
    const response = await api.get<CategoriesListResponse>('/product-categories', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get product models list
 */
export async function getProductModels(
  filters?: { search?: string; is_active?: boolean; page?: number; per_page?: number }
): Promise<{ models: ProductModel[]; pagination: Pagination }> {
  try {
    const response = await api.get<ModelsListResponse>('/product-models', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

// ============================================
// BRAND CRUD Operations
// ============================================

/**
 * Brand form data for create/update
 */
export interface BrandFormData {
  name: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Single brand response
 */
interface BrandResponse {
  success: boolean;
  data: {
    brand: ProductBrand;
  };
}

/**
 * Get single brand by ID
 */
export async function getProductBrand(id: number): Promise<ProductBrand> {
  try {
    const response = await api.get<BrandResponse>(`/product-brands/${id}`);
    return response.data.data.brand;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new brand
 */
export async function createProductBrand(data: BrandFormData): Promise<ProductBrand> {
  try {
    const response = await api.post<BrandResponse>('/product-brands', data);
    return response.data.data.brand;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing brand
 */
export async function updateProductBrand(
  id: number,
  data: Partial<BrandFormData>
): Promise<ProductBrand> {
  try {
    const response = await api.put<BrandResponse>(`/product-brands/${id}`, data);
    return response.data.data.brand;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete brand
 */
export async function deleteProductBrand(id: number): Promise<void> {
  try {
    await api.delete(`/product-brands/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

// ============================================
// MODEL CRUD Operations
// ============================================

/**
 * Model form data for create/update
 */
export interface ModelFormData {
  name: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Single model response
 */
interface ModelResponse {
  success: boolean;
  data: {
    model: ProductModel;
  };
}

/**
 * Get single model by ID
 */
export async function getProductModel(id: number): Promise<ProductModel> {
  try {
    const response = await api.get<ModelResponse>(`/product-models/${id}`);
    return response.data.data.model;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new model
 */
export async function createProductModel(data: ModelFormData): Promise<ProductModel> {
  try {
    const response = await api.post<ModelResponse>('/product-models', data);
    return response.data.data.model;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing model
 */
export async function updateProductModel(
  id: number,
  data: Partial<ModelFormData>
): Promise<ProductModel> {
  try {
    const response = await api.put<ModelResponse>(`/product-models/${id}`, data);
    return response.data.data.model;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete model
 */
export async function deleteProductModel(id: number): Promise<void> {
  try {
    await api.delete(`/product-models/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

// ============================================
// CATEGORY CRUD Operations
// ============================================

/**
 * Category form data for create/update
 */
export interface CategoryFormData {
  name: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean;
}

/**
 * Single category response
 */
interface CategoryResponse {
  success: boolean;
  data: {
    category: ProductCategory;
  };
}

/**
 * Get single category by ID
 */
export async function getProductCategory(id: number): Promise<ProductCategory> {
  try {
    const response = await api.get<CategoryResponse>(`/product-categories/${id}`);
    return response.data.data.category;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new category
 */
export async function createProductCategory(data: CategoryFormData): Promise<ProductCategory> {
  try {
    const response = await api.post<CategoryResponse>('/product-categories', data);
    return response.data.data.category;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing category
 */
export async function updateProductCategory(
  id: number,
  data: Partial<CategoryFormData>
): Promise<ProductCategory> {
  try {
    const response = await api.put<CategoryResponse>(`/product-categories/${id}`, data);
    return response.data.data.category;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete category
 */
export async function deleteProductCategory(id: number): Promise<void> {
  try {
    await api.delete(`/product-categories/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get product type label in Turkish
 */
export function getProductTypeLabel(type: ProductType): string {
  const labels: Record<ProductType, string> = {
    goods: 'Mal',
    service: 'Hizmet',
  };
  return labels[type] || type;
}

/**
 * Get product unit label in Turkish
 */
export function getProductUnitLabel(unit: ProductUnit): string {
  const labels: Partial<Record<ProductUnit, string>> = {
    NIU: 'Adet',
    KGM: 'Kilogram',
    TNE: 'Ton',
    LTR: 'Litre',
    MTR: 'Metre',
    MTK: 'Metrekare',
    MTQ: 'Metreküp',
    BX: 'Kutu',
    SET: 'Takım',
    DAY: 'Gün',
    MON: 'Ay',
    ANN: 'Yıl',
    HUR: 'Saat',
  };
  return labels[unit] || unit;
}

/**
 * Format price with currency (safe for undefined/null values)
 */
export function formatPrice(amount: number | undefined | null, currency: string = 'TRY'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '-';
  }
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency;
  const formatted = amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}
