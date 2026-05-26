import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Webhook, 
  Send, 
  History, 
  Settings, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ExternalLink, 
  FileCode, 
  Trash2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Mail,
  MessageSquare,
  Lock,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { automationService, AutomationConfig, WebhookLog } from '../../services/automationService';
import { Contract, Payment, Tenant, Property, Landlord } from '../../types';

interface AutomationsViewProps {
  user: any;
  contracts: Contract[];
  payments: Payment[];
  tenants: Tenant[];
  properties: Property[];
  landlords: Landlord[];
  onAddPayment: (data: Omit<Payment, 'id'>) => Promise<any>;
}

export function AutomationsView({
  user,
  contracts,
  payments,
  tenants,
  properties,
  landlords,
  onAddPayment
}: AutomationsViewProps) {
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const cfg = await automationService.getAutomationConfig(user.uid);
      setConfig(cfg);
      const lg = await automationService.getWebhookLogs(user.uid);
      setLogs(lg);
    } catch (e) {
      console.error('Failed to load automation data:', e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !user?.uid) return;
    setIsSaving(true);
    try {
      const result = await automationService.saveAutomationConfig(user.uid, config);
      if (result.savedToCloud) {
        toast.success('Configurações de automação salvas e sincronizadas na nuvem!');
      } else {
        toast('Salvo localmente no navegador!', {
          description: 'A gravação no Firestore foi limitada pelas políticas de permissão, mas as configurações de automação estão salvas localmente e prontas para uso.',
          icon: '💾',
          duration: 7000
        });
      }
    } catch (err) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEvent = (event: string) => {
    if (!config) return;
    const events = config.events.includes(event)
      ? config.events.filter(e => e !== event)
      : [...config.events, event];
    setConfig({ ...config, events });
  };

  const handleRunScan = async () => {
    if (!config || !user?.uid) return;
    setIsScanning(true);
    setSimLogs([`[${new Date().toLocaleTimeString('pt-BR')}] 🔄 Inicializando motor de processamento local...`]);
    
    try {
      const scanLogs = await automationService.executeAutomationScan(
        config,
        contracts,
        payments,
        tenants,
        properties,
        landlords,
        user.uid,
        onAddPayment
      );
      
      // Simulate real-time stream printing for visual bliss
      let i = 0;
      const interval = setInterval(() => {
        if (i < scanLogs.length) {
          setSimLogs(prev => [...prev, scanLogs[i]]);
          i++;
        } else {
          clearInterval(interval);
          setIsScanning(false);
          loadData(); // Re-fetch logs
        }
      }, 350);
    } catch (err) {
      setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] ❌ Falha crítica no processamento da automação: ${err}`]);
      setIsScanning(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config?.webhookUrl) {
      toast.error('Configure uma URL de Webhook para testar');
      return;
    }
    
    const testId = 'pay_test_' + Math.random().toString(36).substring(2, 6);
    const testPayment = {
      id: testId,
      amount: 450.00,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      title: 'Fatura Teste de Integração Webhook'
    };

    toast.loading('Enviando evento de teste para o Webhook...', { id: 'webhook-test' });
    
    try {
      const res = await automationService.triggerWebhook(
        config.webhookUrl,
        config.secretToken,
        'payment.created',
        {
          payment: testPayment,
          tenant: tenants[0] || { name: 'João Silva', email: 'joao@email.com', phone: '11999999999', cpf: '123.456.789-00' },
          property: properties[0] || { title: 'Imóvel Teste Real Estate', address: 'Av. Paulista, 1000' },
          isTest: true
        }
      );

      toast.success(`Webhook enviado! Status: ${res.status}`, { id: 'webhook-test' });

      // Add to logs
      await automationService.addWebhookLog(user.uid, {
        event: 'payment.created (Teste)',
        timestamp: new Date().toISOString(),
        payload: JSON.stringify({ payment: testPayment, test: true }, null, 2),
        url: config.webhookUrl,
        status: res.status,
        response: res.response
      });

      loadData();
    } catch (err: any) {
      toast.error('Erro de conexão ao enviar webhook.', { id: 'webhook-test' });
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Tem certeza de que deseja apagar todos os logs de webhook?')) return;
    try {
      await automationService.clearWebhookLogs(user.uid);
      setLogs([]);
      toast.success('Logs limpos com sucesso!');
    } catch (err) {
      toast.error('Erro ao limpar logs.');
    }
  };

  const copyToken = () => {
    if (!config) return;
    navigator.clipboard.writeText(config.secretToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
    toast.success('Token copiado!');
  };

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Carregando Módulo de Automação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Cpu className="h-44 w-44" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">Automatização & Webhooks</span>
          </div>
          <h1 className="serif text-3xl md:text-4xl text-white">Fluxos de Automação de Boletos</h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl font-sans leading-relaxed">
            Configure a emissão, envio ecológico por e-mail, geração de código de barras Pix e notifique sistemas externos instantaneamente via Webhooks.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-white/10 gap-4">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all ${
            activeTab === 'settings' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações e Painel
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all ${
            activeTab === 'history' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Logs de Webhooks e Envios
            {logs.length > 0 && (
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {logs.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Column */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveConfig} className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">Status da Automação Geral</h3>
                  <p className="text-xs text-slate-400">Ative ou pause todas as varreduras de faturamento ativo.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-white/5 pt-6 space-y-6">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Gatilhos de Emissão</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-medium">Emitir antecedência (Dias antes do vencimento)</label>
                    <select
                      value={config.daysAhead}
                      onChange={(e) => setConfig({ ...config, daysAhead: parseInt(e.target.value) })}
                      className="w-full h-11 bg-slate-800/80 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="1">1 dia antes</option>
                      <option value="3">3 dias antes</option>
                      <option value="5">5 dias antes (Recomendado)</option>
                      <option value="7">7 dias antes</option>
                      <option value="10">10 dias antes</option>
                      <option value="15">15 dias antes</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-medium">Modo de Distribuição</label>
                    <div className="flex flex-col gap-2 pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={config.emailDelivery}
                          onChange={(e) => setConfig({ ...config, emailDelivery: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Envio automático por E-mail ao Inquilino
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={config.whatsappDelivery}
                          onChange={(e) => setConfig({ ...config, whatsappDelivery: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        Notificação por WhatsApp (Simulado)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Settings Section */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-indigo-400" />
                  <h4 className="text-sm font-semibold text-white">Configurações de Webhook Integrado</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Insira uma URL de destino segura para escutar eventos disparados pela nossa plataforma. Isso permite integrar instantaneamente com ERPs externos, Slack, Discord, ou seu próprio servidor.
                </p>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-medium">URL de Destino do Webhook</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Ex: https://api.seudominio.com/webhooks/alugafacil"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                      className="flex-1 h-11 bg-slate-800/80 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      className="px-4 h-11 font-medium text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition-all flex items-center gap-1 shrink-0"
                    >
                      <Send className="h-3 w-3" />
                      Testar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-medium">Assinatura de Segurança (Webhook Secret)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        readOnly
                        value={config.secretToken}
                        className="w-full h-11 bg-slate-800/40 border border-white/10 rounded-xl pl-9 pr-12 text-xs font-mono text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={copyToken}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                      >
                        {copiedToken ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Enviado no cabeçalho X-AlugaFacil-Signature como validação SHA-256 base64.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Eventos Assinados</label>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {['payment.created', 'payment.paid', 'payment.overdue', 'boleto.sent'].map((evt) => (
                        <label key={evt} className="flex items-center gap-1.5 text-slate-400 text-xs cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={config.events.includes(evt)}
                            onChange={() => toggleEvent(evt)}
                            className="rounded border-slate-755 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="font-mono text-[11px]">{evt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 min-w-32"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Salvando...
                    </>
                  ) : 'Salvar Preferências'}
                </button>
              </div>
            </form>
          </div>

          {/* Action Simulation Column */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-400 animate-pulse" />
                <h3 className="text-base font-semibold text-white">Simulador de Varreduras</h3>
              </div>
              <p className="text-xs text-slate-400">
                Execute a varredura manual de todos os contratos ativos para emitir as faturas, simular envios ecológicos e testar os webhooks em tempo real.
              </p>
              
              <button
                onClick={handleRunScan}
                disabled={isScanning}
                className="w-full bg-slate-800 border border-indigo-500/20 hover:border-indigo-500/40 hover:bg-slate-750 text-indigo-400 font-semibold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                    Processando Varredura...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Iniciar Varredura Manual
                  </>
                )}
              </button>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-slate-400 uppercase tracking-widest">Painel de execução ao vivo</span>
                  {isScanning && <span className="text-indigo-400 font-semibold animate-pulse">Scanning...</span>}
                </div>
                <div className="bg-black/80 rounded-xl p-4 font-mono text-[10px] text-slate-300 leading-normal h-48 overflow-y-auto border border-white/5 space-y-2">
                  {simLogs.length === 0 ? (
                    <div className="text-slate-600 italic h-full flex items-center justify-center">
                      Aguardando início de varredura...
                    </div>
                  ) : (
                    simLogs.map((lg, idx) => (
                      <div key={idx} className="whitespace-pre-wrap">{lg}</div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl border border-white/5 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-emerald-400 pt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-white">Como Funciona?</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A varredura analisa todos os seus <strong>contratos de aluguel ativos</strong>. Ela identifica quais faturas devem vencer nos próximos <code>{config.daysAhead} dias</code> e gera os registros financeiros correspondentes se já não existirem. Quando gerados, canais de comunicação enviam alertas automáticos ao inquilino e despacham webhooks instantâneos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History & Webhook Logs Tab */
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white font-sans">Logs de Disparos Recentes</h3>
              <p className="text-xs text-slate-400">Verifique os eventos de automação emitidos e o status de resposta do seu Webhook destino.</p>
            </div>
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar Logs
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-white/10 bg-slate-900/20">
              <Webhook className="h-12 w-12 text-slate-600 mb-2" />
              <h4 className="text-sm font-semibold text-slate-400">Nenhum log registrado</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Execute uma simulação ou configure o webhook para testar eventos da faturas emitidas e pagas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-4">Evento</th>
                    <th className="p-4">Data/Hora</th>
                    <th className="p-4">Webhook Requisitado</th>
                    <th className="p-4">Resultado / Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  <AnimatePresence initial={false}>
                    {logs.map((log) => {
                      const isSuccess = log.status.startsWith('2');
                      return (
                        <motion.tr 
                          key={log.id} 
                          layout
                          initial={{ opacity: 0, y: -15, backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
                          animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(255, 255, 255, 0)' }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ 
                            type: 'spring',
                            stiffness: 350,
                            damping: 30,
                            layout: { duration: 0.25 }
                          }}
                          className="hover:bg-white/5 transition-colors border-b border-white/5"
                        >
                          <td className="p-4 font-mono font-medium text-slate-200">
                            <span className="bg-slate-800 text-slate-300 border border-white/10 px-2 py-0.5 rounded text-[11px]">
                              {log.event}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-4 text-slate-400 max-w-xs truncate font-mono text-[11px]" title={log.url}>
                            {log.url}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              {isSuccess ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={isSuccess ? 'text-emerald-400' : 'text-red-400'}>
                                {log.status}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="bg-slate-800 border border-white/10 hover:border-indigo-400/30 hover:bg-slate-750 hover:text-indigo-400 text-slate-300 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 text-[11px]"
                            >
                              <FileCode className="h-3 w-3" />
                              Payload JSON
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* JSON Payload Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto block bg-black/60 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="bg-slate-950 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-indigo-400" />
                  <h3 className="serif text-lg font-medium text-white">Payload Webhook: {selectedLog.event}</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <div className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">URL Receptor</div>
                    <div className="text-slate-300 truncate" title={selectedLog.url}>{selectedLog.url}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Data de Emissão</div>
                    <div className="text-slate-300">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Status do Callback</div>
                    <div className={`font-semibold ${selectedLog.status.startsWith('2') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedLog.status}
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">ID do Evento</div>
                    <div className="text-slate-300 font-mono">{selectedLog.id}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Variável POST JSON do Payload</h4>
                  <pre className="bg-black/90 p-4 rounded-xl border border-white/5 text-[10px] text-slate-300 font-mono max-h-60 overflow-y-auto whitespace-pre">
                    {selectedLog.payload}
                  </pre>
                </div>

                {selectedLog.response && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Resposta do Servidor (Response Body)</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/5 text-[10px] text-indigo-300 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {selectedLog.response}
                    </pre>
                  </div>
                )}
              </div>

              <div className="bg-slate-950 p-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-5 rounded-lg transition-all"
                >
                  Fechar Visualização
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
