import { Button, MenuItem, Stack, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import type { FieldDef, RecordData } from '../types';

type Props = {
  fields: FieldDef[];
  value: RecordData;
  onChange: (value: RecordData) => void;
  onSave: () => void;
  saveLabel?: string;
};

function asInputValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value);
}

export default function RecordForm({ fields, value, onChange, onSave, saveLabel = 'Save' }: Props) {
  return (
    <Stack spacing={2}>
      <div className="form-grid">
        {fields.map((field) => {
          const disabled = field.editable === false;
          const fieldValue = asInputValue(value[field.name]);
          const common = {
            key: field.name,
            label: field.label,
            value: fieldValue,
            disabled,
            fullWidth: true,
            size: 'small' as const,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              const next = field.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value;
              onChange({ ...value, [field.name]: next });
            }
          };

          if (field.type === 'select') {
            return (
              <TextField {...common} select>
                <MenuItem value="">None</MenuItem>
                {field.options?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            );
          }

          return (
            <TextField
              {...common}
              type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
              multiline={field.type === 'multiline'}
              minRows={field.type === 'multiline' ? 3 : undefined}
              InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
            />
          );
        })}
      </div>
      <Stack direction="row" justifyContent="flex-end">
        <Button startIcon={<SaveIcon />} onClick={onSave}>
          {saveLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
