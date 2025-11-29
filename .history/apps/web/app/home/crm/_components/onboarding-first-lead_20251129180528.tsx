'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { ArrowRight, MessageSquare, List } from 'lucide-react';

/**
 * FASE P2: Onboarding "Primeiro Lead em 2 Minutos"
 * 
 * Exibe cards guiados quando o usuário tem 0 empresas no CRM
 */
interface OnboardingFirstLeadProps {
  hasCompanies: boolean;
}

export function OnboardingFirstLead({ hasCompanies }: OnboardingFirstLeadProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar se já foi dismissed antes
    const wasDismissed = localStorage.getItem('onboarding_first_lead_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  // Não exibir se já tem empresas ou foi dismissed
  if (hasCompanies || dismissed) {
    return null;
  }

  const handleStartChat = () => {
    // Redirecionar para Chat AI com prompt guiado
    router.push('/home/chat');
  };

  const handleDismiss = () => {
    localStorage.setItem('onboarding_first_lead_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          🎉 Bem-vindo ao spec64!
        </h2>
        <p className="text-gray-600 mt-2">
          Crie seu primeiro lead em menos de 2 minutos
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Card 1: Criar primeiro lead */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <CardTitle className="text-lg">Crie seu primeiro lead</CardTitle>
            </div>
            <CardDescription>
              Use o Chat AI para adicionar empresas rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">Como funciona:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Envie o nome da empresa</li>
                  <li>Adicione cidade e categoria</li>
                  <li>Pronto! O lead já está no CRM</li>
                </ul>
              </div>

              <Button 
                onClick={handleStartChat}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Abrir Chat AI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Visualizar no CRM */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <CardTitle className="text-lg">Veja tudo organizado</CardTitle>
            </div>
            <CardDescription>
              Seus leads aparecem automaticamente no CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">O que você terá:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Prioridade automática calculada</li>
                  <li>Leads organizados em listas</li>
                  <li>Ações rápidas de contato</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border border-green-200">
                <List className="h-4 w-4 text-green-600" />
                <span>
                  Seus leads vão para <strong>"Leads via Chat AI"</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDismiss}
          className="text-gray-500"
        >
          Já sei como funciona, dispensar
        </Button>
      </div>
    </div>
  );
}
