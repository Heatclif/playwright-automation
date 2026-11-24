// src/eventhub/api/types.ts

export type Category = 'Conference' | 'Concert' | 'Sports' | 'Workshop' | 'Festival';

export interface AuthInput {
  email: string;
  password: string;
  name?: string;
}

export interface UserSummary {
  id?: number;
  userId?: number;
  email: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserSummary;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface MeResponse {
  success: boolean;
  user?: {
    userId: number;
    email: string;
  };
  error?: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category: Category | string;
  venue: string;
  city: string;
  eventDate: string;
  price: number;
  totalSeats: number;
  imageUrl?: string | null;
}

export interface EventItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  venue: string;
  city: string;
  eventDate: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventListResponse {
  success: boolean;
  data: EventItem[];
  pagination: PaginationMeta;
  error?: string;
}

export interface EventSingleResponse {
  success: boolean;
  data: EventItem;
  message?: string;
  error?: string;
}

export interface CreateBookingInput {
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
}

export interface BookingItem {
  id: number;
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  totalPrice: number;
  status: 'confirmed' | 'cancelled' | string;
  bookingRef: string;
  createdAt?: string;
  updatedAt?: string;
  event?: EventItem;
}

export interface BookingListResponse {
  success: boolean;
  data: BookingItem[];
  pagination?: PaginationMeta;
  error?: string;
}

export interface BookingSingleResponse {
  success: boolean;
  data: BookingItem;
  message?: string;
  error?: string;
}

export interface CancelBookingResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  dbStatus: string;
}

export interface ConfigResponse {
  showExploreLinks: boolean;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export interface ApiResponse<T = any> {
  status: number;
  ok: boolean;
  data: T;
  headers: Record<string, string>;
}
