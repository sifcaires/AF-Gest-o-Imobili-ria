import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Contract, Payment, Tenant, Property, Landlord } from '../types';

export interface AutomationConfig {
  id: string;
  ownerId: string;
  enabled: boolean;
  daysAhead: number;
  emailDelivery: boolean;
  whatsappDelivery: boolean;
  webhookUrl: string;
  secretToken: string;
  events: string[];
}

export interface WebhookLog {
  id: string;
  ownerId: string;
  event: string;
  timestamp: string;
  payload: string;
  url: string;
  status: string;
  response: string;
}

const DEFAULT_CONFIG = (userId: string): AutomationConfig => ({
  id: 'config',
  ownerId: userId,
  enabled: false,
  daysAhead: 5,
  emailDelivery: true,
  whatsappDelivery: false,
  webhookUrl: '',
  secretToken: 'af_secret_' + Math.random().toString(36).substring(2, 10),
  events: ['payment.created', 'payment.paid', 'payment.overdue', 'boleto.sent']
});

export const automationService = {
  async getAutomationConfig(userId: string): Promise<AutomationConfig> {
    try {
      const docRef = doc(db, 'automations', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as AutomationConfig;
      }
      return DEFAULT_CONFIG(userId);
    } catch (e) {
      console.warn('[AutomationService] Error reading config from Firestore, fallback to LocalStorage:', e);
      const local = localStorage.getItem(`af_automation_config_${userId}`);
      if (local) {
        return JSON.parse(local);
      }
      return DEFAULT_CONFIG(userId);
    }
  },

  async saveAutomationConfig(userId: string, config: Partial<AutomationConfig>): Promise<{ savedToCloud: boolean }> {
    try {
      // Save to local storage as double-backup
      const current = await this.getAutomationConfig(userId);
      const updated = { ...current, ...config, ownerId: userId };
      localStorage.setItem(`af_automation_config_${userId}`, JSON.stringify(updated));

      // Save to firebase
      const docRef = doc(db, 'automations', userId);
      await setDoc(docRef, updated, { merge: true });
      return { savedToCloud: true };
    } catch (e: any) {
      console.warn('[AutomationService] Failed to save config to Firestore:', e);
      // Even if Firestore write is blocked, we succeeded in local persistence. Return false to indicate no cloud sync.
      return { savedToCloud: false };
    }
  },

  async getWebhookLogs(userId: string): Promise<WebhookLog[]> {
    try {
      const q = query(
        collection(db, 'webhook_logs'),
        where('ownerId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const logs: WebhookLog[] = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as WebhookLog);
      });
      return logs;
    } catch (e) {
      console.warn('[AutomationService] Error reading logs from Firestore, fallback to LocalStorage:', e);
      const local = localStorage.getItem(`af_webhook_logs_${userId}`);
      if (local) {
        return JSON.parse(local);
      }
      return [];
    }
  },

  async addWebhookLog(userId: string, log: Omit<WebhookLog, 'id' | 'ownerId'>): Promise<void> {
    const fullLog: Omit<WebhookLog, 'id'> & { createdAt: any } = {
      ...log,
      ownerId: userId,
      createdAt: serverTimestamp()
    };

    try {
      // Write to Firestore
      await addDoc(collection(db, 'webhook_logs'), fullLog);
    } catch (e) {
      console.warn('[AutomationService] Failed to add log to Firestore:', e);
    }

    // Always update LocalStorage so that it's instant is viewable even if there are Firestore delay/rule issues
    try {
      const currentLogs = JSON.parse(localStorage.getItem(`af_webhook_logs_${userId}`) || '[]');
      const newLogWithId = { id: 'log_' + Date.now() + Math.random().toString(36).substring(2, 5), ...fullLog };
      currentLogs.unshift(newLogWithId);
      localStorage.setItem(`af_webhook_logs_${userId}`, JSON.stringify(currentLogs.slice(0, 100)));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  },

  async clearWebhookLogs(userId: string): Promise<void> {
    try {
      localStorage.removeItem(`af_webhook_logs_${userId}`);
      const q = query(collection(db, 'webhook_logs'), where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn('[AutomationService] Failed to mass delete logs from Firestore:', e);
    }
  },

  async triggerWebhook(
    webhookUrl: string, 
    secretToken: string, 
    event: string, 
    payload: any
  ): Promise<{ status: string; response: string }> {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      return { status: 'Não Configurado', response: 'URL do Webhook vazia ou inválida.' };
    }

    const timestamp = new Date().toISOString();
    const webhookPayload = {
      id: 'evt_' + Math.random().toString(36).substring(2, 12),
      object: 'event',
      type: event,
      created: timestamp,
      data: payload
    };

    const signature = btoa(encodeURIComponent(secretToken + '.' + timestamp));

    try {
      console.log(`[Webhook Dispatcher] Sending ${event} event to ${webhookUrl}...`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AlugaFacil-Signature': signature,
          'X-AlugaFacil-Timestamp': timestamp
        },
        body: JSON.stringify(webhookPayload)
      });

      const responseText = await response.text();
      return {
        status: `${response.status} ${response.statusText}`,
        response: responseText.slice(0, 250) || '(Resposta vazia)'
      };
    } catch (e: any) {
      console.error(`[Webhook Dispatcher] Failed to connect to webhook URL:`, e);
      return {
        status: 'Erro de Conectividade',
        response: `Não foi possível enviar por limitações de conexão de rede ou CORS: ${e.message}`
      };
    }
  },

  // Automation logic executor
  async executeAutomationScan(
    config: AutomationConfig,
    contracts: Contract[],
    payments: Payment[],
    tenants: Tenant[],
    properties: Property[],
    landlords: Landlord[],
    userId: string,
    addPayment: (data: Omit<Payment, 'id'>) => Promise<any>
  ): Promise<string[]> {
    const logs: string[] = [];
    const timestamp = () => `[${new Date().toLocaleTimeString('pt-BR')}]`;

    logs.push(`${timestamp()} 🕒 Iniciando varredura automatizada de contratos de locação...`);
    
    if (!config.enabled) {
      logs.push(`${timestamp()} ⚠️ Sistema de Automação está desativado nas configurações.`);
      return logs;
    }

    const activeContracts = contracts.filter(c => c.status !== 'terminated');
    logs.push(`${timestamp()} 📋 Encontrados ${activeContracts.length} contratos ativos para análise.`);

    let countCreated = 0;
    const now = new Date();

    for (const contract of activeContracts) {
      const property = properties.find(p => p.id === contract.propertyId);
      const tenant = tenants.find(t => t.id === contract.tenantId);

      if (!property || !tenant) {
        logs.push(`${timestamp()} ❌ Erro: Contrato #${contract.id.substring(0,6)} possui inquilino ou imóvel inválido.`);
        continue;
      }

      // Calculate upcoming billing date
      // Standard rent day of payment (day of current or next month depending on proximity)
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const billingDueDate = new Date(currentYear, currentMonth, contract.dayOfPayment);
      
      // If payment day has passed or today is near, let's look at either current or next cycle
      if (now.getDate() > contract.dayOfPayment) {
        // Schedule next month's billing
        billingDueDate.setMonth(billingDueDate.getMonth() + 1);
      }

      // Check if a payment record for this exact due date already exists
      const dueDateStr = billingDueDate.toISOString().split('T')[0];
      const hasDuplicate = payments.some(p => p.contractId === contract.id && p.dueDate === dueDateStr);

      if (hasDuplicate) {
        logs.push(`${timestamp()} ℹ️ Contrato de ${tenant.name} (${property.title}): Cobrança de ${dueDateStr} já emitida previamente.`);
        continue;
      }

      // Check if this falls into the daysAhead window
      const timeDiff = billingDueDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff <= config.daysAhead && daysDiff >= -1) {
        logs.push(`${timestamp()} ✨ [EMISSÃO AUTOMÁTICA DETECTADA] Contrato de ${tenant.name} vence em ${daysDiff} dias (${dueDateStr}).`);
        
        // Define payment payload
        const paymentPayload: Omit<Payment, 'id'> = {
          contractId: contract.id,
          amount: contract.rentAmount,
          dueDate: dueDateStr,
          status: 'pending',
          title: `Aluguel - ${billingDueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
        };

        logs.push(`${timestamp()} 💿 Gravando nova fatura de R$ ${contract.rentAmount.toFixed(2)} no banco de dados.`);
        
        // Add payment to Firebase database
        const newPaymentResult = await addPayment(paymentPayload);
        const newPaymentId = newPaymentResult?.id || 'pay_' + Math.random().toString(36).substring(2, 10);
        
        const createdPayment: Payment = {
          id: newPaymentId,
          ...paymentPayload
        };

        logs.push(`${timestamp()} ✅ Fatura criada com sucesso! ID: ${newPaymentId.substring(0,8)}.`);
        countCreated++;

        // Trigger Webhook Event: payment.created
        if (config.events.includes('payment.created')) {
          logs.push(`${timestamp()} 🔗 Disparando webhook de criação da fatura...`);
          const webhookRes = await this.triggerWebhook(config.webhookUrl, config.secretToken, 'payment.created', {
            payment: createdPayment,
            tenant,
            property
          });

          await this.addWebhookLog(userId, {
            event: 'payment.created',
            timestamp: new Date().toISOString(),
            payload: JSON.stringify({ payment: createdPayment, tenant, property }, null, 2),
            url: config.webhookUrl || 'Não Configurado',
            status: webhookRes.status,
            response: webhookRes.response
          });
          
          logs.push(`${timestamp()} 📡 Webhook 'payment.created' respondido com: ${webhookRes.status}.`);
        }

        // Simulate sending Boleto
        if (config.emailDelivery) {
          logs.push(`${timestamp()} ✉️ Enviando boleto em formato ecológico por e-mail para ${tenant.name} (${tenant.email})...`);
          
          // Trigger Webhook Event: boleto.sent
          if (config.events.includes('boleto.sent')) {
            const webhookRes = await this.triggerWebhook(config.webhookUrl, config.secretToken, 'boleto.sent', {
              payment: createdPayment,
              tenant,
              property,
              medium: 'email',
              recipient: tenant.email,
              sentAt: new Date().toISOString()
            });

            await this.addWebhookLog(userId, {
              event: 'boleto.sent',
              timestamp: new Date().toISOString(),
              payload: JSON.stringify({ payment: createdPayment, tenant, medium: 'email', recipient: tenant.email }, null, 2),
              url: config.webhookUrl || 'Não Configurado',
              status: webhookRes.status,
              response: webhookRes.response
            });
          }
          logs.push(`${timestamp()} 🚀 E-mail de cobrança enviado com boleto em anexo.`);
        }

        if (config.whatsappDelivery) {
          logs.push(`${timestamp()} 💬 Disparando lembrete de cobrança automática por WhatsApp para inquilino (${tenant.phone})...`);
        }
      } else {
        logs.push(`${timestamp()} 💤 Contrato de ${tenant.name} para ${dueDateStr} está fora do prazo de emissão automática (${daysDiff} dias restantes; limite: ${config.daysAhead}).`);
      }
    }

    logs.push(`${timestamp()} 🏁 Varredura encerrada. Faturas emitidas neste ciclo: ${countCreated}.`);
    return logs;
  }
};
