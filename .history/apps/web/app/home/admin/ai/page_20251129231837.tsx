'use client';

/**
 * Painel Admin de Controle da IA
 * 
 * 4 abas:
 * 1. Conexão OpenAI - Configurar API key, models, limites
 * 2. Módulos IA - Ativar/desativar features
 * 3. Analytics - Consumo, custo, usuários top
 * 4. Limites - Controle de rate limit e bloqueios
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Card } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { Loader2, Save, Check, X, DollarSign, Activity, Settings, Shield } from 'lucide-react';

export default function AIAdminPanel() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadConfig();
    loadFlags();
    loadStats();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch('/api/admin/ai/settings');
      const data = await res.json();
      if (data.config) setConfig(data.config);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async function loadFlags() {
    try {
      const res = await fetch('/api/admin/ai/flags');
      const data = await res.json();
      if (data.flags) setFlags(data.flags);
    } catch (error) {
      console.error('Failed to load flags:', error);
    }
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/ai/usage?period=month');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function saveConfig(formData: any) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert('✅ Configuração salva com sucesso!');
        loadConfig();
      } else {
        const error = await res.json();
        alert('❌ Erro: ' + error.error);
      }
    } catch (error) {
      alert('❌ Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(feature: string, is_enabled: boolean) {
    try {
      const res = await fetch('/api/admin/ai/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, is_enabled }),
      });
      if (res.ok) {
        loadFlags();
      }
    } catch (error) {
      alert('❌ Erro ao atualizar flag');
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧠 Central de Controle da IA</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie OpenAI, módulos, consumo e limites do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection">
            <Settings className="w-4 h-4 mr-2" />
            Conexão OpenAI
          </TabsTrigger>
          <TabsTrigger value="modules">
            <Activity className="w-4 h-4 mr-2" />
            Módulos IA
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <DollarSign className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="limits">
            <Shield className="w-4 h-4 mr-2" />
            Limites
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: Conexão OpenAI */}
        <TabsContent value="connection">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">⚙️ Configuração OpenAI</h2>
            
            {config ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                saveConfig({
                  api_key: formData.get('api_key'),
                  model_default: formData.get('model_default'),
                  model_high: formData.get('model_high'),
                  max_tokens: Number(formData.get('max_tokens')),
                  timeout_ms: Number(formData.get('timeout_ms')),
                  temperature_default: Number(formData.get('temperature_default')),
                });
              }} className="space-y-4">
                <div>
                  <Label>API Key (atual: {config.api_key_masked})</Label>
                  <Input name="api_key" type="password" placeholder="sk-proj-..." required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Model Default</Label>
                    <Input name="model_default" defaultValue={config.model_default} required />
                  </div>
                  <div>
                    <Label>Model High</Label>
                    <Input name="model_high" defaultValue={config.model_high} required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Max Tokens</Label>
                    <Input name="max_tokens" type="number" defaultValue={config.max_tokens} required />
                  </div>
                  <div>
                    <Label>Timeout (ms)</Label>
                    <Input name="timeout_ms" type="number" defaultValue={config.timeout_ms} required />
                  </div>
                  <div>
                    <Label>Temperature</Label>
                    <Input name="temperature_default" type="number" step="0.1" defaultValue={config.temperature_default} required />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Configuração
                </Button>
              </form>
            ) : (
              <Alert>
                <AlertDescription>
                  ⚠️ Nenhuma configuração encontrada. Configure a OpenAI pela primeira vez.
                </AlertDescription>
              </Alert>
            )}
          </Card>
        </TabsContent>

        {/* ABA 2: Módulos IA */}
        <TabsContent value="modules">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🧩 Onde a IA Pode Atuar</h2>
            
            <div className="space-y-4">
              {flags.map((flag) => (
                <div key={flag.feature} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">{flag.feature}</p>
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  </div>
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={(checked) => toggleFlag(flag.feature, checked)}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ABA 3: Analytics */}
        <TabsContent value="analytics">
          <div className="grid gap-6">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Total de Chamadas</p>
                <p className="text-3xl font-bold">{stats?.totalRequests || 0}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Custo Total (USD)</p>
                <p className="text-3xl font-bold">${(stats?.totalCost || 0).toFixed(4)}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-3xl font-bold">{stats?.successRate || 0}%</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">📊 Por Módulo</h3>
              <div className="space-y-2">
                {stats?.byMode?.map((m: any) => (
                  <div key={m.mode} className="flex justify-between items-center p-3 border rounded">
                    <span className="font-medium">{m.mode}</span>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{m.count} calls</span>
                      <span>${m.cost.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">👥 Top Usuários</h3>
              <div className="space-y-2">
                {stats?.topUsers?.slice(0, 5).map((u: any, i: number) => (
                  <div key={u.userId} className="flex justify-between items-center p-3 border rounded">
                    <span>#{i + 1} - {u.userId.slice(0, 8)}...</span>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{u.count} calls</span>
                      <span>${u.cost.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 4: Limites */}
        <TabsContent value="limits">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🚫 Controle de Limites</h2>
            
            <Alert>
              <AlertDescription>
                🚧 Feature em desenvolvimento. Em breve: bloqueio de usuários, limites globais, emergência.
              </AlertDescription>
            </Alert>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
