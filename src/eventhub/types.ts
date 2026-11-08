export type Category = 'Conference' | 'Concert' | 'Sports' | 'Workshop' | 'Festival';

export interface EventDetails {
  title: string;
  description?: string;
  category: Category;
  city: string;
  venue: string;
  /** datetime-local format: YYYY-MM-DDTHH:mm */
  dateTime: string;
  price: number;
  totalSeats: number;
  imageUrl?: string;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
}
