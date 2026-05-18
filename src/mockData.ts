import { Property, Tenant, Contract, Payment } from './types';

export const mockProperties: Property[] = [
  {
    id: '1',
    ownerId: 'mock-owner',
    landlordId: 'mock-landlord',
    title: 'Apartamento Centro',
    description: 'Belo apartamento no centro da cidade, 2 quartos.',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    rentAmount: 2500,
    status: 'rented',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2',
    ownerId: 'mock-owner',
    landlordId: 'mock-landlord',
    title: 'Casa Bosque',
    description: 'Casa aconchegante com quintal e churrasqueira.',
    address: 'Rua das Flores, 123 - Curitiba, PR',
    rentAmount: 3800,
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '3',
    ownerId: 'mock-owner',
    landlordId: 'mock-landlord',
    title: 'Studio Moderno',
    description: 'Studio mobiliado próximo ao metrô.',
    address: 'Rua Augusta, 500 - São Paulo, SP',
    rentAmount: 1800,
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1536376074432-ca0245416744?auto=format&fit=crop&q=80&w=400',
  }
];

export const mockTenants: Tenant[] = [
  {
    id: '101',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 98888-8888',
    cpf: '123.456.789-00',
  }
];

export const mockContracts: Contract[] = [
  {
    id: 'c1',
    propertyId: '1',
    tenantId: '101',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    rentAmount: 2500,
    dayOfPayment: 10,
  }
];

export const mockPayments: Payment[] = [
  {
    id: 'p1',
    contractId: 'c1',
    dueDate: '2025-05-10',
    amount: 2500,
    status: 'paid',
    paymentDate: '2025-05-09',
    boletoLink: '#',
  },
  {
    id: 'p2',
    contractId: 'c1',
    dueDate: '2025-06-10',
    amount: 2500,
    status: 'pending',
    boletoLink: '#',
  }
];
