export interface WorkEntry {
  id: string;
  start: string; // ISO string
  end: string; // ISO string
  notes?: string;
}

export interface Settings {
  hourlyRate: number;
}
