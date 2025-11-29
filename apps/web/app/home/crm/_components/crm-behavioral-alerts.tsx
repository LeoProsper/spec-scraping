'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AlertStats {
  leadsParados: number;
  leadsQuentes: number;
  followupsVencidos: number;
}

/**
 * FASE 7: UX COMPORTAMENTAL
 * Mostra alertas automáticos ao entrar no CRM
 * Cria pressão operacional imediata
 */
export function CrmBehavioralAlerts() {
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    if (alerted) return;

    // Buscar stats de pressão
    fetch('/api/companies/pressure-stats')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const stats: AlertStats = {
            leadsParados: result.data.leadsParados,
            leadsQuentes: result.data.leadsQuentes,
            followupsVencidos: result.data.followupsVencidos,
          };

          // Construir mensagem de alerta
          const alerts: string[] = [];

          if (stats.followupsVencidos > 0) {
            alerts.push(`⚠️ ${stats.followupsVencidos} follow-ups já estão atrasados`);
          }

          if (stats.leadsQuentes > 0) {
            alerts.push(`🔥 ${stats.leadsQuentes} leads estão quentes AGORA`);
          }

          if (stats.leadsParados > 0) {
            alerts.push(`🧊 ${stats.leadsParados} leads parados precisam de atenção`);
          }

          // Mostrar toast de pressão (sempre, não é opcional)
          if (alerts.length > 0) {
            // Toast urgente (follow-ups vencidos)
            if (stats.followupsVencidos > 0) {
              toast.error(
                `⚠️ ${stats.followupsVencidos} follow-up${stats.followupsVencidos > 1 ? 's' : ''} atrasado${stats.followupsVencidos > 1 ? 's' : ''}!`,
                {
                  duration: 8000,
                  description: 'Ações vencidas exigem atenção imediata',
                }
              );
            }

            // Toast de oportunidade (leads quentes)
            if (stats.leadsQuentes > 0) {
              setTimeout(() => {
                toast.success(
                  `🔥 ${stats.leadsQuentes} lead${stats.leadsQuentes > 1 ? 's' : ''} quente${stats.leadsQuentes > 1 ? 's' : ''}!`,
                  {
                    duration: 6000,
                    description: 'Momento ideal para contato/proposta',
                  }
                );
              }, 500);
            }

            // Toast informativo (leads parados)
            if (stats.leadsParados > 0) {
              setTimeout(() => {
                toast.info(
                  `🧊 ${stats.leadsParados} lead${stats.leadsParados > 1 ? 's' : ''} parado${stats.leadsParados > 1 ? 's' : ''}`,
                  {
                    duration: 5000,
                    description: 'Sem interação há mais de 14 dias',
                  }
                );
              }, 1000);
            }
          }

          setAlerted(true);
        }
      })
      .catch(error => {
        console.error('Erro ao buscar alertas comportamentais:', error);
      });
  }, [alerted]);

  return null; // Componente invisible, apenas exibe toasts
}
