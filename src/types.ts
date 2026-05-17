export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  rentAmount: number;
  status: 'available' | 'rented';
  imageUrl: string;
}

export interface Tenant {
  id: string;
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
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  dayOfPayment: number;
  documentUrl?: string;
}

export interface Payment {
  id: string;
  contractId: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  boletoLink?: string;
}
