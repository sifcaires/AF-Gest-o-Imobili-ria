import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { ref } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType, uploadFileWithFallback } from '../lib/firebase';
import { Property, Tenant, Contract, Payment, Landlord } from '../types';
import { toast } from 'sonner';

export function useRealEstateData(user: any) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);

  useEffect(() => {
    if (!user) {
      setProperties([]);
      setTenants([]);
      setContracts([]);
      setPayments([]);
      setLandlords([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const isAdmin = user.email === 'admin@email.com' || user.email === 'sifcaires@gmail.com';

    const usersUnsubscribe = isAdmin ? onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'users')) : () => {};

    const getQuery = (collectionName: string) => {
      return isAdmin 
        ? collection(db, collectionName) 
        : query(collection(db, collectionName), where('ownerId', '==', user.uid));
    };

    const unsubProperties = onSnapshot(getQuery('properties'), (snapshot) => {
      setProperties(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Property)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'properties'));

    const unsubTenants = onSnapshot(getQuery('tenants'), (snapshot) => {
      setTenants(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tenant)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'tenants'));

    const unsubContracts = onSnapshot(getQuery('contracts'), (snapshot) => {
      setContracts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contract)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'contracts'));

    const unsubPayments = onSnapshot(getQuery('payments'), (snapshot) => {
      setPayments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'payments'));

    const unsubLandlords = onSnapshot(getQuery('landlords'), (snapshot) => {
      setLandlords(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Landlord)));
      setLoading(false);
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, 'landlords');
      setLoading(false);
    });

    return () => {
      unsubProperties();
      unsubTenants();
      unsubContracts();
      unsubPayments();
      unsubLandlords();
      usersUnsubscribe();
    };
  }, [user]);

  const addProperty = async (data: Omit<Property, 'id' | 'ownerId'>) => {
    if (!user) return;
    setIsOperating(true);
    try {
      await addDoc(collection(db, 'properties'), {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Imóvel cadastrado!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'properties');
    } finally {
      setIsOperating(false);
    }
  };

  const updateProperty = async (id: string, data: Partial<Property>) => {
    setIsOperating(true);
    try {
      await updateDoc(doc(db, 'properties', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Imóvel atualizado!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `properties/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const deleteProperty = async (id: string) => {
    setIsOperating(true);
    try {
      await deleteDoc(doc(db, 'properties', id));
      toast.success('Imóvel excluído!');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `properties/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const addTenant = async (data: Omit<Tenant, 'id'>) => {
    if (!user) return;
    setIsOperating(true);
    try {
      await addDoc(collection(db, 'tenants'), {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Inquilino cadastrado!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'tenants');
    } finally {
      setIsOperating(false);
    }
  };

  const updateTenant = async (id: string, data: Partial<Tenant>) => {
    setIsOperating(true);
    try {
      await updateDoc(doc(db, 'tenants', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Inquilino atualizado!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tenants/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const deleteTenant = async (id: string) => {
    setIsOperating(true);
    try {
      await deleteDoc(doc(db, 'tenants', id));
      toast.success('Inquilino removido!');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `tenants/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const addContract = async (data: Omit<Contract, 'id'>) => {
    if (!user) return;
    setIsOperating(true);
    try {
      const batch = writeBatch(db);
      const contractRef = doc(collection(db, 'contracts'));
      batch.set(contractRef, {
        ...data,
        ownerId: user.uid,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const propertyRef = doc(db, 'properties', data.propertyId);
      batch.update(propertyRef, {
        status: 'rented',
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      toast.success('Contrato gerado!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'contracts');
    } finally {
      setIsOperating(false);
    }
  };

  const updateContract = async (id: string, data: Partial<Contract>) => {
    setIsOperating(true);
    try {
      await updateDoc(doc(db, 'contracts', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Contrato atualizado!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `contracts/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const deleteContract = async (id: string) => {
    setIsOperating(true);
    try {
      await deleteDoc(doc(db, 'contracts', id));
      toast.success('Contrato removido!');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `contracts/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const addPayment = async (data: Omit<Payment, 'id'>) => {
    if (!user) return;
    setIsOperating(true);
    try {
      await addDoc(collection(db, 'payments'), {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Pagamento registrado!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'payments');
    } finally {
      setIsOperating(false);
    }
  };

  const updatePayment = async (id: string, data: Partial<Payment>) => {
    setIsOperating(true);
    try {
      await updateDoc(doc(db, 'payments', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Pagamento atualizado!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `payments/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const deletePayment = async (id: string) => {
    setIsOperating(true);
    try {
      await deleteDoc(doc(db, 'payments', id));
      toast.success('Pagamento removido!');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `payments/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const addLandlord = async (data: any) => {
    if (!user) return;
    setIsOperating(true);
    try {
      const landlordRef = doc(collection(db, 'landlords'));
      const { file, files, ...formFields } = data;
      let finalData = { ...formFields };
      let urls: string[] = [];
      
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const storageRef = ref(storage, `landlords/${landlordRef.id}/${Date.now()}_${f.name}`);
          const metadata = { contentType: f.type };
          const downloadURL = await uploadFileWithFallback(storageRef, f, metadata);
          urls.push(downloadURL);
        }
      } else if (file) {
        const storageRef = ref(storage, `landlords/${landlordRef.id}/${file.name}`);
        const metadata = { contentType: file.type };
        const downloadURL = await uploadFileWithFallback(storageRef, file, metadata);
        urls.push(downloadURL);
      }
      
      finalData.documentUrls = [...(finalData.documentUrls || []), ...urls];
      if (finalData.documentUrls.length > 0) {
        finalData.documentUrl = finalData.documentUrls[0];
      }

      await setDoc(landlordRef, {
        ...finalData,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Locador cadastrado com sucesso!');
    } catch (e) {
      console.error('[AddLandlord Error]', e);
      handleFirestoreError(e, OperationType.CREATE, 'landlords');
    } finally {
      setIsOperating(false);
    }
  };

  const updateLandlord = async (id: string, data: any) => {
    if (!id || id === 'undefined') {
      console.error('[UpdateLandlord] Attempted to update landlord with invalid ID:', id);
      toast.error('Erro interno: ID do locador inválido.');
      return;
    }
    setIsOperating(true);
    try {
      const { file, files, ...formFields } = data;
      let finalData = { ...formFields };
      let urls: string[] = [];
      
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const storageRef = ref(storage, `landlords/${id}/${Date.now()}_${f.name}`);
          const metadata = { contentType: f.type };
          const downloadURL = await uploadFileWithFallback(storageRef, f, metadata);
          urls.push(downloadURL);
        }
      } else if (file) {
        const storageRef = ref(storage, `landlords/${id}/${file.name}`);
        const metadata = { contentType: file.type };
        const downloadURL = await uploadFileWithFallback(storageRef, file, metadata);
        urls.push(downloadURL);
      }
      
      finalData.documentUrls = [...(finalData.documentUrls || []), ...urls];
      if (finalData.documentUrls.length > 0) {
        finalData.documentUrl = finalData.documentUrls[0];
      }

      await updateDoc(doc(db, 'landlords', id), {
        ...finalData,
        updatedAt: serverTimestamp()
      });
      toast.success('Cadastro de locador atualizado!');
    } catch (e) {
      console.error('[UpdateLandlord Error]', e);
      handleFirestoreError(e, OperationType.UPDATE, `landlords/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const deleteLandlord = async (id: string) => {
    if (!id || id === 'undefined') {
      toast.error('ID inválido para remoção.');
      return;
    }
    setIsOperating(true);
    try {
      await deleteDoc(doc(db, 'landlords', id));
      toast.success('Locador removido!');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `landlords/${id}`);
    } finally {
      setIsOperating(false);
    }
  };

  const resetDatabase = async () => {
    const isAdmin = user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com';
    if (!isAdmin) return;
    
    if (!window.confirm('CUIDADO: Limpar todo o banco de dados?')) return;
    
    try {
      const collections = ['properties', 'tenants', 'contracts', 'payments', 'landlords', 'users'];
      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col));
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      toast.success('Banco limpo!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao limpar banco');
    }
  };

  return {
    properties, tenants, contracts, payments, landlords, users, loading, isOperating,
    addProperty, updateProperty, deleteProperty,
    addTenant, updateTenant, deleteTenant,
    addContract, updateContract, deleteContract,
    addPayment, updatePayment, deletePayment,
    addLandlord, updateLandlord, deleteLandlord,
    resetDatabase
  };
}
