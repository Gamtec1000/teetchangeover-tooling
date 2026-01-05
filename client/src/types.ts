// client/src/types.ts

// Represents a machine
export interface Machine {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string; // Added imageUrl
  // Add other machine properties as they exist in your data
}

// Represents a document
export interface Document {
    name: string;
    imageUrl: string;
}

// Represents a part (MODIFIED structure)
export interface Part {
  id: string;
  name: string;
  machineId: string;
  pipeSize: string;
  partFamily: string;
  partNumber?: string;
  description?: string;
  imageUrl?: string;
  stock?: number;
  location?: string;
  pdfUrl?: string;
  pdfName?: string;
}

// Represents a pipe size
export interface PipeSize {
  id: string;
  name: string;
}

// Represents a tool
export interface Tool {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  location?: string;
}

// Represents a step within a changeover template (MODIFIED structure)
export interface Step {
  id: string;
  title: string;
  description: string;
  order: number;
  requiredPartNames?: string[];
  requiredTools?: { toolId: string, quantity: number }[];
  imageUrls?: string[];
  pdfUrl?: string;
}

// Represents a changeover template (MODIFIED - now machine-specific)
export interface ChangeoverTemplate {
  id: string;
  machineId: string;
  name: string;
  steps: Step[];
  estimatedTime?: number; // Added estimatedTime
  documents?: Document[]; // Added documents
}

// Represents a Changeover Log
export interface ChangeoverLog {
  id: string;
  machineId: string;
  fromSize: string;
  toSize: string;
  duration: number;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  machineName?: string;
  operatorName?: string;
  stepNotes?: any[];
  finalNote?: string;
}

// Represents a Consumable Item
export interface ConsumableItem {
  id: string;
  name: string;
  machineId?: string;
  stock: number;
  minStock?: number;
  unit?: string; // e.g., "pieces", "meters", "liters"
}

// Represents a Consumable Usage Log
export interface ConsumableLog {
  id: string;
  itemId: string;
  machineId: string;
  quantityUsed: number;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  operatorName?: string;
  note?: string;
}
