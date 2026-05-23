export interface Landlord {
  id: string;
  ownerId?: string;
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  pixKey?: string;
  address?: string;
  documentUrl?: string;
  documentUrls?: string[];
}

export interface Property {
  id: string;
  ownerId: string; // The user who created it
  landlordId: string; // The specific owner (landlord)
  title: string;
  description: string;
  address: string;
  rentAmount: number;
  status: 'available' | 'rented';
  imageUrl: string;
  iptuAmount?: number;
  condoAmount?: number;
  requiresGuarantor?: boolean;
  requiresDeposit?: boolean;
}

export interface Tenant {
  id: string;
  ownerId?: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  profession?: string;
  monthlyIncome?: number;
}

export interface Contract {
  id: string;
  ownerId?: string;
  propertyId: string;
  tenantId: string;
  beneficiaryId?: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  dayOfPayment: number;
  status?: 'active' | 'terminated';
  documentUrl?: string;
  documentUrls?: string[];
}

export interface Payment {
  id: string;
  ownerId?: string;
  contractId: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  boletoLink?: string;
  createdAt?: string;
  // Boleto Customization fields
  title?: string;
  penaltyPercent?: number;
  interestPercent?: number;
  discountAmount?: number;
  instructions?: string;
}

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'director' | 'landlord';
  createdAt: string;
  lastLogin: string;
}
