"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { WorkEntry } from '@/lib/types';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfToday, formatISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { durationInHours, formatCurrency, formatDuration } from '@/lib/utils';
import { Logo } from '@/components/icons/logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default function PrintPage() {
    const searchParams = useSearchParams();
    const [entries, setEntries] = useState<WorkEntry[]>([]);
    const [reportData, setReportData] = useState<{ totalHours: number, totalEarnings: number, periodLabel: string, periodEntries: WorkEntry[] } | null>(null);

    const type = searchParams.get('type') || 'semanal';
    const rate = parseFloat(searchParams.get('rate') || '0');

    useEffect(() => {
        const storedEntries = localStorage.getItem('lopez-welder-entries');
        if (storedEntries) {
            setEntries(JSON.parse(storedEntries));
        }
    }, []);

    useEffect(() => {
        if (entries.length === 0) return;

        let periodEntries, periodLabel;
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const isFirstHalf = now.getDate() <= 15;
        const quinceStart = isFirstHalf ? startOfMonth(now) : new Date(now.getFullYear(), now.getMonth(), 16);
        const quinceEnd = isFirstHalf ? new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59) : endOfMonth(now);
        const todayStart = startOfToday();
        
        switch(type) {
             case 'diario':
                periodEntries = entries.filter(e => formatISO(parseISO(e.start), { representation: 'date'}) === formatISO(todayStart, { representation: 'date'}));
                periodLabel = `Hoje, ${format(todayStart, 'd MMMM yyyy', {locale: ptBR})}`;
                break;
            case 'semanal':
                periodEntries = entries.filter(e => isWithinInterval(parseISO(e.start), {start: weekStart, end: weekEnd}));
                periodLabel = `Semana de ${format(weekStart, 'd MMM')} a ${format(weekEnd, 'd MMM, yyyy', {locale: ptBR})}`;
                break;
            case 'quincenal':
                periodEntries = entries.filter(e => isWithinInterval(parseISO(e.start), {start: quinceStart, end: quinceEnd}));
                periodLabel = `Quinzena de ${format(quinceStart, 'd MMM')} a ${format(quinceEnd, 'd MMM, yyyy', {locale: ptBR})}`;
                break;
            case 'mensual':
                periodEntries = entries.filter(e => isWithinInterval(parseISO(e.start), {start: monthStart, end: monthEnd}));
                periodLabel = `Mês de ${format(monthStart, 'MMMM yyyy', {locale: ptBR})}`;
                break;
            default:
                periodEntries = [];
                periodLabel = '';
        }

        const totalHours = periodEntries.reduce((acc, e) => acc + durationInHours(parseISO(e.start), parseISO(e.end)), 0);
        const totalEarnings = totalHours * rate;

        setReportData({ totalHours, totalEarnings, periodLabel, periodEntries });

    }, [entries, type, rate]);
    
    useEffect(() => {
        if(reportData) {
            setTimeout(() => window.print(), 500);
        }
    }, [reportData]);

    if (!reportData) {
        return <div className="p-8">Generando reporte...</div>;
    }
    
    const { totalHours, totalEarnings, periodLabel, periodEntries } = reportData;

    return (
        <div className="bg-white text-black p-8 font-sans">
             <style jsx global>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none; }
                }
             `}</style>
            <header className="flex justify-between items-center border-b pb-4 mb-8">
                <div className="flex items-center gap-3">
                    <Logo className="w-10 h-10 text-gray-800" />
                    <div>
                        <h1 className="text-2xl font-bold">LopezWelder</h1>
                        <p className="text-gray-600">Reporte de Horas</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{periodLabel}</p>
                    <p className="text-sm text-gray-600">Generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                </div>
            </header>

            <main>
                <h2 className="text-xl font-semibold mb-4">Detalle de Registros</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Inicio</TableHead>
                            <TableHead>Fin</TableHead>
                            <TableHead>Duración</TableHead>
                            <TableHead className="text-right">Ganancia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {periodEntries.map(entry => {
                            const start = parseISO(entry.start);
                            const end = parseISO(entry.end);
                            const hours = durationInHours(start, end);
                            return (
                                <TableRow key={entry.id}>
                                    <TableCell>{format(start, 'EEE dd/MM', { locale: ptBR })}</TableCell>
                                    <TableCell>{format(start, 'HH:mm')}</TableCell>
                                    <TableCell>{format(end, 'HH:mm')}</TableCell>
                                    <TableCell>{formatDuration(start, end)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(hours * rate)}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="font-bold text-base bg-gray-100">
                           <TableCell colSpan={3}>Total</TableCell>
                           <TableCell>{totalHours.toFixed(2)}h</TableCell>
                           <TableCell className="text-right">{formatCurrency(totalEarnings)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </main>
            
            <footer className="mt-12 text-center text-xs text-gray-500 no-print">
                <p>Este reporte se generó automáticamente. Cierra esta pestaña después de imprimir.</p>
            </footer>
        </div>
    );
}
