export type PhoneType = "mobile" | "home" | "work" | "other";
export type EmailType = "home" | "work" | "other";
export type AddressType = "home" | "work" | "other";

export interface Phone {
  id: string;
  type: PhoneType;
  number: string;
}

export interface Email {
  id: string;
  type: EmailType;
  address: string;
}

export interface Address {
  id: string;
  type: AddressType;
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  birthday?: string;
  phones: Phone[];
  emails: Email[];
  addresses: Address[];
  note?: string;
  avatarUrl?: string;
  tags: string[];
  sponsorId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContactFormData = Omit<Contact, "id" | "createdAt" | "updatedAt">;
