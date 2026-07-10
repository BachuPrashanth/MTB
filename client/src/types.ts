export type FieldOption = string;

export type FieldDef = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'multiline';
  options?: FieldOption[];
  editable?: boolean;
};

export type RecordData = {
  id?: number;
  [key: string]: unknown;
};

export type ResourceConfig = {
  key: string;
  title: string;
  endpoint: string;
  parentParam?: string;
  fields: FieldDef[];
  columns: FieldDef[];
};
