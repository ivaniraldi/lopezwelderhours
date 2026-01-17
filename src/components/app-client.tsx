"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { WorkEntry, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getDay, isWithinInterval, startOfToday, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { durationInHours, formatCurrency, formatDuration } from '@/lib/utils';
import { Clock, History, BarChart2, Settings as SettingsIcon, Trash2, Edit, Plus, Share2, Download, Upload, FileDown, MoreVertical } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Polyfill for uuid if not globally available
if (typeof window !== 'undefined' && !window.crypto) {
    // A simple polyfill for crypto.randomUUID for environments that don't have it
    window.crypto = {
        ...window.crypto,
        randomUUID: () => uuidv4(),
    };
}

const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <Card ref={ref} {...props} className="bg-black/20 backdrop-blur-md border-white/10 shadow-lg" />
));
GlassCard.displayName = "GlassCard";

export default function AppClient() {
  const { toast } = useToast();
  const [entries, setEntries] = useLocalStorage<WorkEntry[]>('lopez-welder-entries', []);
  const [settings, setSettings] = useLocalStorage<Settings>('lopez-welder-settings', { hourlyRate: 100 });
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // This runs only on the client, after hydration
    setNow(new Date());
  }, []);
  
  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast({ title: "Registro eliminado", variant: "destructive" });
  };

  const handleSaveEntry = (entry: WorkEntry) => {
    setEntries(prev => {
        const exists = prev.some(e => e.id === entry.id);
        let newEntries;
        if(exists) {
            newEntries = prev.map(e => e.id === entry.id ? entry : e);
        } else {
            newEntries = [entry, ...prev];
        }
        return newEntries.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    });
    toast({ title: "Registro guardado", description: "Tus horas han sido actualizadas." });
  };

  const handleExport = () => {
    const data = { entries, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lopezwelder-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Datos exportados" });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File format incorrect");
        const data = JSON.parse(text);
        if (data.entries && data.settings) {
          setEntries(data.entries);
          setSettings(data.settings);
          toast({ title: "Datos importados correctamente" });
        } else {
          throw new Error("JSON structure invalid");
        }
      } catch (error) {
        toast({ title: "Error al importar", description: "El archivo no es válido.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };
  
  const sortedEntries = useMemo(() => entries.slice().sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()), [entries]);
  
  const TABS = [
    { name: 'Hoy', icon: Clock, content: <TodayTab onSave={handleSaveEntry} entries={sortedEntries} settings={settings} now={now} /> },
    { name: 'Historial', icon: History, content: <HistoryTab entries={sortedEntries} onDelete={handleDelete} onSave={handleSaveEntry} settings={settings} /> },
    { name: 'Reportes', icon: BarChart2, content: <ReportsTab entries={sortedEntries} settings={settings} now={now} /> },
    { name: 'Ajustes', icon: SettingsIcon, content: <SettingsTab settings={settings} setSettings={setSettings} onExport={handleExport} onImport={handleImport} /> },
  ];
  
  return (
    <div className="flex flex-col h-screen p-2 md:p-4">
      <header className="flex items-center justify-between p-2 mb-4">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-white tracking-wider">Lopez<span className="text-primary">Welder</span></h1>
        </div>
      </header>
      
      <main className="flex-grow overflow-y-auto pb-16 md:pb-0">
        <Tabs defaultValue="Hoy" className="w-full">
            <TabsList className="hidden md:grid w-full grid-cols-4 bg-black/20 backdrop-blur-md border border-white/10">
                {TABS.map(tab => <TabsTrigger key={tab.name} value={tab.name}>{tab.name}</TabsTrigger>)}
            </TabsList>
            {TABS.map(tab => (
              <TabsContent key={tab.name} value={tab.name} className="mt-4">
                {tab.content}
              </TabsContent>
            ))}
        </Tabs>
      </main>

      {/* Bottom Nav for Mobile */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-lg border-t border-white/10 p-1 z-50">
          <Tabs defaultValue="Hoy" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-16 bg-transparent p-0">
               {TABS.map(tab => (
                 <TabsTrigger key={tab.name} value={tab.name} className="flex-col h-full gap-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    <tab.icon className="w-5 h-5" />
                    {tab.name}
                 </TabsTrigger>
               ))}
            </TabsList>
        </Tabs>
      </footer>
    </div>
  );
}

const TodayTab = ({ onSave, entries, settings, now }: { onSave: (entry: WorkEntry) => void, entries: WorkEntry[], settings: Settings, now: Date | null }) => {
    const { toast } = useToast();
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    const handleSubmit = () => {
        const startDate = parseISO(start);
        const endDate = parseISO(end);
        if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
            toast({
                variant: 'destructive',
                title: 'Fechas inválidas',
                description: 'Revisa las fechas y horas ingresadas.',
            });
            return;
        }
        onSave({
            id: crypto.randomUUID(),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        });
        setStart('');
        setEnd('');
        toast({ title: 'Registro añadido', description: 'Tu jornada ha sido guardada.' });
    };

    if (!now) {
        return (
            <div className="space-y-4">
                 <GlassCard>
                    <CardHeader>
                        <CardTitle>Añadir Jornada</CardTitle>
                        <CardDescription>Ingresa la hora de inicio y fin de tu trabajo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-32 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </GlassCard>
                <GlassCard>
                    <CardHeader>
                        <CardTitle>Resumen del Día</CardTitle>
                        <CardDescription><Skeleton className="h-4 w-32" /></CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </GlassCard>
            </div>
        )
    }

    const today = now;
    const todayEntries = entries.filter(e => {
        const entryDate = parseISO(e.start);
        return isValid(entryDate) && format(entryDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    });

    const totalHoursToday = todayEntries.reduce((acc, e) => {
        const entryStart = parseISO(e.start);
        const entryEnd = parseISO(e.end);
        if (isValid(entryStart) && isValid(entryEnd)) {
            return acc + durationInHours(entryStart, entryEnd);
        }
        return acc;
    }, 0);

    return (
        <div className="space-y-4">
            <GlassCard>
                <CardHeader>
                    <CardTitle>Añadir Jornada</CardTitle>
                    <CardDescription>Ingresa la hora de inicio y fin de tu trabajo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="start-time-today">Inicio</Label>
                        <Input id="start-time-today" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="end-time-today">Fin</Label>
                        <Input id="end-time-today" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSubmit} className="w-full">
                        <Plus className="mr-2" />
                        Guardar Jornada
                    </Button>
                </CardFooter>
            </GlassCard>

            <GlassCard>
                <CardHeader>
                    <CardTitle>Resumen del Día</CardTitle>
                    <CardDescription>{format(today, "eeee, d 'de' MMMM", { locale: es })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-2xl font-bold">{totalHoursToday.toFixed(2)}h</p>
                            <p className="text-muted-foreground">Horas</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(totalHoursToday * settings.hourlyRate)}</p>
                            <p className="text-muted-foreground">Ganancia</p>
                        </div>
                    </div>
                </CardContent>
            </GlassCard>
        </div>
    );
};


const HistoryTab = ({ entries, onDelete, onSave, settings }: { entries: WorkEntry[], onDelete: (id: string) => void, onSave: (entry: WorkEntry) => void, settings: Settings }) => {
  return (
    <GlassCard>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historial de Horas</CardTitle>
        <EditEntryDialog onSave={onSave} triggerButton={<Button size="sm"><Plus className="mr-2" />Añadir</Button>} />
      </CardHeader>
      <CardContent>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-black/50 backdrop-blur-xl">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Ganancia</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => {
                const start = parseISO(entry.start);
                const end = parseISO(entry.end);
                if (!isValid(start) || !isValid(end)) return null;

                const hours = durationInHours(start, end);
                const earnings = hours * settings.hourlyRate;
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="font-medium">{format(start, 'dd/MM/yy')}</div>
                      <div className="text-sm text-muted-foreground">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</div>
                    </TableCell>
                    <TableCell>{formatDuration(start, end)}</TableCell>
                    <TableCell>{formatCurrency(earnings)}</TableCell>
                    <TableCell className="text-right">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40">
                                <div className="grid gap-1">
                                <EditEntryDialog entry={entry} onSave={onSave} triggerButton={
                                    <Button variant="ghost" className="w-full justify-start"><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                                } />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Borrar</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta acción no se puede deshacer. Se borrará el registro de forma permanente.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-destructive hover:bg-destructive/80">Borrar</AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </GlassCard>
  );
};

const EditEntryDialog = ({ entry, onSave, triggerButton }: { entry?: WorkEntry, onSave: (entry: WorkEntry) => void, triggerButton: React.ReactElement }) => {
    const [start, setStart] = useState(entry ? format(parseISO(entry.start), "yyyy-MM-dd'T'HH:mm") : '');
    const [end, setEnd] = useState(entry ? format(parseISO(entry.end), "yyyy-MM-dd'T'HH:mm") : '');
    const [notes, setNotes] = useState(entry?.notes ?? '');
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = () => {
        const startDate = parseISO(start);
        const endDate = parseISO(end);
        if(!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
            alert("Fechas inválidas");
            return;
        }
        onSave({
            id: entry?.id ?? crypto.randomUUID(),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            notes: notes
        });
        setIsOpen(false);
    }
    
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setStart(entry ? format(parseISO(entry.start), "yyyy-MM-dd'T'HH:mm") : format(now, "yyyy-MM-dd'T'HH:mm"));
            setEnd(entry ? format(parseISO(entry.end), "yyyy-MM-dd'T'HH:mm") : format(now, "yyyy-MM-dd'T'HH:mm"));
            setNotes(entry?.notes ?? '');
        }
    }, [isOpen, entry]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{entry ? 'Editar' : 'Añadir'} Registro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="start-time">Inicio</Label>
                        <Input id="start-time" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="end-time">Fin</Label>
                        <Input id="end-time" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea id="notes" placeholder="Opcional..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ReportsTab = ({ entries, settings, now }: { entries: WorkEntry[], settings: Settings, now: Date | null }) => {
  const [reportType, setReportType] = useState('semanal');

  const getReportData = (type: string) => {
    if (!now) {
        return { totalHours: 0, totalEarnings: 0, periodLabel: 'Cargando...', periodEntries: [] };
    }

    let periodEntries, periodLabel;
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
            periodLabel = `Hoy, ${format(todayStart, 'd MMMM', {locale: es})}`;
            break;
        case 'semanal':
            periodEntries = entries.filter(e => isWithinInterval(parseISO(e.start), {start: weekStart, end: weekEnd}));
            periodLabel = `Semana del ${format(weekStart, 'd')} al ${format(weekEnd, 'd MMMM', {locale: es})}`;
            break;
        case 'quincenal':
            periodEntries = entries.filter(e => isWithinInterval(parseISO(e.start), {start: quinceStart, end: quinceEnd}));
            periodLabel = `Quincena del ${format(quinceStart, 'd')} al ${format(quinceEnd, 'd MMMM', {locale: es})}`;
            break;
        case 'mensual':
            periodEntries = entries.filter(e => isWithinInterval(parseISO(e.start), {start: monthStart, end: monthEnd}));
            periodLabel = `Mes de ${format(monthStart, 'MMMM yyyy', {locale: es})}`;
            break;
        default:
            periodEntries = [];
            periodLabel = '';
    }

    const totalHours = periodEntries.reduce((acc, e) => acc + durationInHours(parseISO(e.start), parseISO(e.end)), 0);
    const totalEarnings = totalHours * settings.hourlyRate;
    
    return { totalHours, totalEarnings, periodLabel, periodEntries };
  };

  const { totalHours, totalEarnings, periodLabel, periodEntries } = getReportData(reportType);
  
  const handleShare = () => {
    const reportText = `*Resumen ${reportType} de LopezWelder*\n_${periodLabel}_\n\n*Horas Totales:* ${totalHours.toFixed(2)}h\n*Ganancias Totales:* ${formatCurrency(totalEarnings)}\n\n¡Un saludo!`;
    const whatsappUrl = `https://wa.me/5548991590325?text=${encodeURIComponent(reportText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const queryParams = new URLSearchParams({ type: reportType, rate: String(settings.hourlyRate) }).toString();


  return (
    <div className="space-y-4">
      <Tabs defaultValue="semanal" onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diario">Diario</TabsTrigger>
            <TabsTrigger value="semanal">Semanal</TabsTrigger>
            <TabsTrigger value="quincenal">Quincenal</TabsTrigger>
            <TabsTrigger value="mensual">Mensual</TabsTrigger>
        </TabsList>
      </Tabs>
      <GlassCard>
        <CardHeader>
          <CardTitle>Resumen {reportType}</CardTitle>
          <CardDescription>{periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-around text-center p-4">
                <div>
                    <p className="text-3xl font-bold text-white">{totalHours.toFixed(2)}h</p>
                    <p className="text-muted-foreground">Horas Totales</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-accent">{formatCurrency(totalEarnings)}</p>
                    <p className="text-muted-foreground">Ganancia Total</p>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Link href={`/print?${queryParams}`} target="_blank">
              <Button variant="outline"><FileDown className="mr-2"/>PDF</Button>
            </Link>
            <Button onClick={handleShare}><Share2 className="mr-2"/>WhatsApp</Button>
        </CardFooter>
      </GlassCard>
    </div>
  );
};


const SettingsTab = ({ settings, setSettings, onExport, onImport }: { settings: Settings, setSettings: (s: Settings) => void, onExport: () => void, onImport: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, hourlyRate: parseFloat(e.target.value) || 0 });
    };

    return (
        <div className="space-y-6">
            <GlassCard>
                <CardHeader>
                    <CardTitle>Tarifa por Hora</CardTitle>
                    <CardDescription>Ingresa tu tarifa para calcular las ganancias.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold">$</span>
                        <Input type="number" value={settings.hourlyRate} onChange={handleRateChange} placeholder="e.g., 100" className="text-lg" />
                        <span className="text-muted-foreground">/ hora</span>
                    </div>
                </CardContent>
            </GlassCard>
            <GlassCard>
                <CardHeader>
                    <CardTitle>Gestión de Datos</CardTitle>
                    <CardDescription>Exporta o importa tus registros. Ideal para backups o cambio de dispositivo.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={onExport} variant="secondary"><Download className="mr-2" />Exportar Datos</Button>
                    
                    <Button asChild variant="secondary">
                        <label htmlFor="import-file" className="cursor-pointer">
                            <Upload className="mr-2" />
                            Importar Datos
                            <input type="file" id="import-file" accept=".json" className="sr-only" onChange={onImport} />
                        </label>
                    </Button>
                </CardContent>
            </GlassCard>
        </div>
    );
};
