// src/lib/supabase-service.ts
// Supabase data service - replaces firebase.ts

import { supabase, STORAGE_BUCKET } from './supabase';
import type {
  Machine, Part, PipeSize, Tool,
  ChangeoverTemplate, Step,
  ConsumableItem, ConsumableLog
} from '../types';

// Helper to convert snake_case to camelCase for frontend compatibility
const toCamelCase = <T>(obj: Record<string, any>): T => {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result as T;
};

// Helper to convert camelCase to snake_case for database
const toSnakeCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
};

// --- File Upload ---
export const uploadFile = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

// --- Real-time Subscriptions ---
export const subscribeToTable = <T>(
  tableName: string,
  callback: (data: T[]) => void
) => {
  // Initial fetch
  supabase
    .from(tableName)
    .select('*')
    .then(({ data, error }) => {
      if (!error && data) {
        callback(data.map(row => toCamelCase<T>(row)));
      }
    });

  // Subscribe to changes
  const subscription = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      async () => {
        // Refetch on any change
        const { data } = await supabase.from(tableName).select('*');
        if (data) {
          callback(data.map(row => toCamelCase<T>(row)));
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// --- CRUD Functions for Machines ---
export const getMachines = async (): Promise<Machine[]> => {
  const { data, error } = await supabase.from('machines').select('*');
  if (error) throw error;
  return data.map(row => toCamelCase<Machine>(row));
};

export const addMachine = async (machineData: Partial<Machine>) => {
  const { data, error } = await supabase
    .from('machines')
    .insert(toSnakeCase(machineData))
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateMachine = async (id: string, machineData: Partial<Machine>) => {
  const { error } = await supabase
    .from('machines')
    .update(toSnakeCase(machineData))
    .eq('id', id);
  if (error) throw error;
};

export const deleteMachine = async (id: string) => {
  const { error } = await supabase.from('machines').delete().eq('id', id);
  if (error) throw error;
};

// --- CRUD Functions for Parts ---
export const getParts = async (): Promise<Part[]> => {
  const { data, error } = await supabase.from('parts').select('*');
  if (error) throw error;
  return data.map(row => toCamelCase<Part>(row));
};

export const getPartsForMachineAndSize = async (machineId: string, pipeSize: string): Promise<Part[]> => {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('machine_id', machineId)
    .eq('pipe_size', pipeSize);
  if (error) throw error;
  return data.map(row => toCamelCase<Part>(row));
};

export const getPartsForMachine = async (machineId: string): Promise<Part[]> => {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('machine_id', machineId);
  if (error) throw error;
  return data.map(row => toCamelCase<Part>(row));
};

export const getPartForMachinePipeAndFamily = async (
  machineId: string,
  pipeSize: string,
  partFamily: string
): Promise<Part | null> => {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('machine_id', machineId)
    .eq('pipe_size', pipeSize)
    .eq('part_family', partFamily)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? toCamelCase<Part>(data) : null;
};

export const getPartForMachinePipeAndName = async (
  machineId: string,
  pipeSize: string,
  partName: string
): Promise<Part | null> => {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('machine_id', machineId)
    .eq('pipe_size', pipeSize)
    .eq('name', partName)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? toCamelCase<Part>(data) : null;
};

export const addPart = async (partData: Partial<Part>) => {
  const { data, error } = await supabase
    .from('parts')
    .insert(toSnakeCase(partData))
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePart = async (id: string, partData: Partial<Part>) => {
  const { error } = await supabase
    .from('parts')
    .update(toSnakeCase(partData))
    .eq('id', id);
  if (error) throw error;
};

export const deletePart = async (id: string) => {
  const { error } = await supabase.from('parts').delete().eq('id', id);
  if (error) throw error;
};

// --- CRUD Functions for Tools ---
export const getTools = async (): Promise<Tool[]> => {
  const { data, error } = await supabase.from('tools').select('*');
  if (error) throw error;
  return data.map(row => toCamelCase<Tool>(row));
};

export const addTool = async (toolData: Partial<Tool>) => {
  const { data, error } = await supabase
    .from('tools')
    .insert(toSnakeCase(toolData))
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateTool = async (id: string, toolData: Partial<Tool>) => {
  const { error } = await supabase
    .from('tools')
    .update(toSnakeCase(toolData))
    .eq('id', id);
  if (error) throw error;
};

export const deleteTool = async (id: string) => {
  const { error } = await supabase.from('tools').delete().eq('id', id);
  if (error) throw error;
};

// --- CRUD Functions for Pipe Sizes ---
export const getPipeSizes = async (): Promise<PipeSize[]> => {
  const { data, error } = await supabase.from('pipe_sizes').select('*');
  if (error) throw error;
  return data.map(row => toCamelCase<PipeSize>(row));
};

export const addPipeSize = async (pipeSizeData: Partial<PipeSize>) => {
  const { data, error } = await supabase
    .from('pipe_sizes')
    .insert(toSnakeCase(pipeSizeData))
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePipeSize = async (id: string, pipeSizeData: Partial<PipeSize>) => {
  const { error } = await supabase
    .from('pipe_sizes')
    .update(toSnakeCase(pipeSizeData))
    .eq('id', id);
  if (error) throw error;
};

export const deletePipeSize = async (id: string) => {
  const { error } = await supabase.from('pipe_sizes').delete().eq('id', id);
  if (error) throw error;
};

// --- CRUD Functions for Changeover Templates ---
export const getChangeoverTemplates = async (): Promise<ChangeoverTemplate[]> => {
  const { data, error } = await supabase.from('changeover_templates').select('*');
  if (error) throw error;
  return data.map((row: any) => ({ ...toCamelCase<ChangeoverTemplate>(row), steps: [] }));
};

export const getChangeoverTemplate = async (machineId: string): Promise<ChangeoverTemplate | null> => {
  // Get template
  const { data: templateData, error: templateError } = await supabase
    .from('changeover_templates')
    .select('*')
    .eq('machine_id', machineId)
    .single();

  if (templateError && templateError.code !== 'PGRST116') throw templateError;
  if (!templateData) return null;

  // Get steps
  const { data: stepsData, error: stepsError } = await supabase
    .from('changeover_steps')
    .select('*')
    .eq('template_id', templateData.id)
    .order('order_num');

  if (stepsError) throw stepsError;

  const template = toCamelCase<ChangeoverTemplate>(templateData);
  const steps = (stepsData || []).map(row => {
    const step = toCamelCase<Step>(row);
    // Map order_num to order for frontend compatibility
    return { ...step, order: row.order_num };
  });

  return { ...template, steps };
};

export const addChangeoverTemplate = async (templateData: Partial<ChangeoverTemplate>) => {
  const { steps, ...rest } = templateData;
  const { data, error } = await supabase
    .from('changeover_templates')
    .insert(toSnakeCase(rest))
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateChangeoverTemplate = async (templateId: string, data: Partial<ChangeoverTemplate>) => {
  const { steps, ...rest } = data;
  const { error } = await supabase
    .from('changeover_templates')
    .update(toSnakeCase(rest))
    .eq('id', templateId);
  if (error) throw error;
};

export const deleteChangeoverTemplate = async (templateId: string) => {
  // Steps are deleted via CASCADE
  const { error } = await supabase
    .from('changeover_templates')
    .delete()
    .eq('id', templateId);
  if (error) throw error;
};

// Subscribe to steps for a specific template
export const subscribeToSteps = (
  templateId: string,
  callback: (steps: Step[]) => void
) => {
  // Initial fetch
  supabase
    .from('changeover_steps')
    .select('*')
    .eq('template_id', templateId)
    .order('order_num')
    .then(({ data, error }) => {
      if (!error && data) {
        const steps = data.map((row: any) => ({
          ...toCamelCase<Step>(row),
          order: row.order_num
        }));
        callback(steps);
      }
    });

  // Subscribe to changes
  const subscription = supabase
    .channel(`steps_${templateId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'changeover_steps',
        filter: `template_id=eq.${templateId}`
      },
      async () => {
        const { data } = await supabase
          .from('changeover_steps')
          .select('*')
          .eq('template_id', templateId)
          .order('order_num');
        if (data) {
          const steps = data.map((row: any) => ({
            ...toCamelCase<Step>(row),
            order: row.order_num
          }));
          callback(steps);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// --- CRUD Functions for Steps ---
export const addStep = async (templateId: string, stepData: Partial<Step>) => {
  const snakeData = toSnakeCase(stepData);
  const dbData: Record<string, any> = {
    ...snakeData,
    template_id: templateId,
    order_num: stepData.order
  };
  delete dbData.order; // Remove frontend field name

  const { data, error } = await supabase
    .from('changeover_steps')
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateStep = async (_templateId: string, stepId: string, stepData: Partial<Step>) => {
  const dbData = toSnakeCase(stepData);
  if (stepData.order !== undefined) {
    dbData.order_num = stepData.order;
    delete dbData.order;
  }

  const { error } = await supabase
    .from('changeover_steps')
    .update(dbData)
    .eq('id', stepId);
  if (error) throw error;
};

export const deleteStep = async (_templateId: string, stepId: string) => {
  const { error } = await supabase
    .from('changeover_steps')
    .delete()
    .eq('id', stepId);
  if (error) throw error;
};

// --- CRUD Functions for Changeover Logs ---
export const deleteChangeoverLog = async (logId: string) => {
  const { error } = await supabase
    .from('changeover_logs')
    .delete()
    .eq('id', logId);
  if (error) throw error;
};

export const deleteAllChangeoverLogs = async () => {
  const { error } = await supabase
    .from('changeover_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  if (error) throw error;
};

// --- CRUD Functions for Consumable Items ---
export const getConsumables = async (machineId?: string): Promise<ConsumableItem[]> => {
  let query = supabase.from('consumable_items').select('*');
  if (machineId) {
    query = query.eq('machine_id', machineId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data.map(row => toCamelCase<ConsumableItem>(row));
};

export const addConsumable = async (data: Partial<ConsumableItem>) => {
  const { data: result, error } = await supabase
    .from('consumable_items')
    .insert(toSnakeCase(data))
    .select()
    .single();
  if (error) throw error;
  return result;
};

export const updateConsumable = async (id: string, data: Partial<ConsumableItem>) => {
  const { error } = await supabase
    .from('consumable_items')
    .update(toSnakeCase(data))
    .eq('id', id);
  if (error) throw error;
};

export const deleteConsumable = async (id: string) => {
  const { error } = await supabase
    .from('consumable_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// --- Functions for Consumable Usage Logs ---
export const getConsumableLogs = async (machineId?: string): Promise<ConsumableLog[]> => {
  let query = supabase.from('consumable_logs').select('*');
  if (machineId) {
    query = query.eq('machine_id', machineId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data.map(row => toCamelCase<ConsumableLog>(row));
};

export const consumeItem = async (
  itemId: string,
  quantity: number,
  logData: Partial<ConsumableLog>
) => {
  // Get current stock
  const { data: item, error: fetchError } = await supabase
    .from('consumable_items')
    .select('stock')
    .eq('id', itemId)
    .single();

  if (fetchError) throw fetchError;
  if (!item) throw new Error('Item not found');

  const newStock = (item.stock || 0) - quantity;

  // Update stock
  const { error: updateError } = await supabase
    .from('consumable_items')
    .update({ stock: newStock })
    .eq('id', itemId);

  if (updateError) throw updateError;

  // Create log entry
  const { error: logError } = await supabase
    .from('consumable_logs')
    .insert({
      item_id: itemId,
      machine_id: logData.machineId,
      quantity_used: quantity,
      operator_name: logData.operatorName,
      note: logData.note
    });

  if (logError) throw logError;
};

// --- CRUD Functions for Changeover Logs ---
export const addChangeoverLog = async (logData: {
  machineId: string;
  fromSize: string;
  toSize: string;
  duration: number;
  machineName?: string;
  operatorName?: string;
  stepNotes?: any[];
  finalNote?: string;
}) => {
  const { data, error } = await supabase
    .from('changeover_logs')
    .insert({
      machine_id: logData.machineId,
      from_size: logData.fromSize,
      to_size: logData.toSize,
      duration: logData.duration,
      machine_name: logData.machineName,
      operator_name: logData.operatorName,
      step_notes: logData.stepNotes,
      final_note: logData.finalNote
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getChangeoverLogs = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('changeover_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Convert created_at to Firebase-like date format for compatibility
  return data.map((row: any) => ({
    ...toCamelCase<Record<string, any>>(row),
    date: {
      seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
      nanoseconds: 0
    }
  }));
};

// --- Alias for Firebase compatibility ---
export const getCollectionSnapshot = <T>(
  collectionName: string,
  callback: (data: T[]) => void
) => {
  // Map collection names to table names
  const tableMap: Record<string, string> = {
    'machines': 'machines',
    'parts': 'parts',
    'tools': 'tools',
    'pipe_sizes': 'pipe_sizes',
    'changeover_templates': 'changeover_templates',
    'changeover_logs': 'changeover_logs',
    'consumable_items': 'consumable_items',
    'consumable_logs': 'consumable_logs'
  };

  const tableName = tableMap[collectionName] || collectionName;

  // Special handling for changeover_logs to convert date format
  if (tableName === 'changeover_logs') {
    // Initial fetch
    supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const converted = data.map((row: any) => ({
            ...toCamelCase<Record<string, any>>(row),
            date: {
              seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
              nanoseconds: 0
            }
          }));
          callback(converted as T[]);
        }
      });

    // Subscribe to changes
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        async () => {
          const { data } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });
          if (data) {
            const converted = data.map((row: any) => ({
              ...toCamelCase<Record<string, any>>(row),
              date: {
                seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
                nanoseconds: 0
              }
            }));
            callback(converted as T[]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  return subscribeToTable<T>(tableName, callback);
};

// --- Authentication ---
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session?.user || null);
  });

  // Subscribe to auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user || null);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Export supabase client for direct access if needed
export { supabase };
