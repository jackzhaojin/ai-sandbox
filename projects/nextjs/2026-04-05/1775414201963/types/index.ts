// Type definitions for B2B Postal Checkout Flow

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  organizationId: string;
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
  updatedAt: string;
}
