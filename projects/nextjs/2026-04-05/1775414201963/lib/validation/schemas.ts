import { z } from 'zod';

// Address validation schema
export const addressSchema = z.object({
  name: z.string().min(1, 'Address name is required'),
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

// Organization validation schema
export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
});

// User validation schema
export const userSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'manager', 'user']),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type UserInput = z.infer<typeof userSchema>;
