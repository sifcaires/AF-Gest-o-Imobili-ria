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
  registeredBy?: string;
}

export interface Broker {
  id: string;
  ownerId?: string;
  name: string;
  email: string;
  phone: string;
  creci: string; // real estate agency/broker license in Brazil
  commissionPercent: number;
  pixKey?: string;
  registeredBy?: string;
  createdAt?: string;
  updatedAt?: string;
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
  requiresInsurance?: boolean;
  capturedByBrokerId?: string;
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
  address?: string;
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
  testemunha1?: string;
  identidade1?: string;
  signatures?: {
    tenantName?: string;
    tenantSignature?: string; // base64 PNG
    tenantSignedAt?: string;
    tenantIp?: string;
    tenantEmail?: string;
    tenantAuditHash?: string;
    
    landlordName?: string;
    landlordSignature?: string; // base64 PNG
    landlordSignedAt?: string;
    landlordIp?: string;
    landlordEmail?: string;
    landlordAuditHash?: string;
    
    brokerName?: string;
    brokerSignature?: string; // base64 PNG
    brokerSignedAt?: string;
    brokerEmail?: string;
    brokerIp?: string;
    brokerAuditHash?: string;
  };
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
  discountStartDate?: string;
  discountEndDate?: string;
  instructions?: string;
}

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'director' | 'landlord' | 'landlord_pleno' | 'broker';
  createdAt: string;
  lastLogin: string;
  ownerId?: string | null;
  active?: boolean;
}

export interface InspectionArea {
  name: string;
  status: 'excellent' | 'good' | 'regular' | 'bad';
  comments: string;
  photos: string[]; // base64 strings or storage URLs
}

export interface Inspection {
  id: string;
  ownerId: string;
  propertyId: string;
  contractId?: string;
  type: 'entrada' | 'saida'; // Move-in or Move-out inspection
  date: string;
  inspectorName: string;
  inspectorEmail?: string;
  generalObservations: string;
  areas: InspectionArea[];
  createdAt?: any;
  updatedAt?: any;
}

