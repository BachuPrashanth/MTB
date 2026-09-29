import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { api } from '../api';
import type { RecordData, ResourceConfig } from '../types';
import RecordForm from './RecordForm';

type Props = {
  config: ResourceConfig;
  parentId?: number;
  selected?: RecordData | null;
  onSelect?: (record: RecordData | null) => void;
  onSaved?: (record: RecordData) => void;
  showInlineEditor?: boolean;
};

function singularTitle(title: string) {
  if (title.endsWith('ies')) return title.slice(0, -3) + 'y';
  if (title.endsWith('s')) return title.slice(0, -1);
  return title;
}

export default function ResourcePanel({ config, parentId, selected, onSelect, onSaved, showInlineEditor = true }: Props) {
  const [rows, setRows] = useState<RecordData[]>([]);
  const [editing, setEditing] = useState<RecordData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<GridColDef[]>(
    () =>
      config.columns.map((column) => ({
        field: column.name,
        headerName: column.label,
        flex: 1,
        minWidth: 140,
        type: column.type === 'number' ? 'number' : undefined,
        valueGetter: (_value, row) => {
          const value = row[column.name];
          return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) ? value.slice(0, 10) : value;
        }
      })),
    [config.columns]
  );

  async function load() {
    if (config.parentParam && !parentId) return;
    setError(null);
    try {
      setRows(await api.list(config.endpoint, parentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records.');
    }
  }

  useEffect(() => {
    setRows([]);
    setEditing(null);
    void load();
  }, [config.endpoint, parentId]);

  useEffect(() => {
    setEditing(selected ?? null);
  }, [selected]);

  async function save(record: RecordData) {
    setError(null);
    try {
      const saved = record.id ? await api.update(config.endpoint, Number(record.id), record) : await api.create(config.endpoint, record, parentId);
      await load();
      setEditing(saved);
      onSaved?.(saved);
      onSelect?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    }
  }

  async function remove() {
    if (!editing?.id) return;
    setError(null);
    try {
      await api.remove(config.endpoint, Number(editing.id));
      setEditing(null);
      onSelect?.(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  const selectionModel: GridRowSelectionModel = editing?.id ? { type: 'include', ids: new Set([editing.id]) } : { type: 'include', ids: new Set() };
  const singleTitle = singularTitle(config.title);
  const gridHeight = Math.min(300, Math.max(124, 56 + rows.length * 38));

  return (
    <Stack spacing={1.5} className="resource-panel">
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Typography variant="h6">{config.title}</Typography>
          <Chip size="small" label={`${rows.length} record${rows.length === 1 ? '' : 's'}`} />
          {editing?.id && <Chip color="primary" size="small" label={`Selected #${editing.id}`} />}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<AddIcon />} onClick={() => { setEditing({}); onSelect?.(null); }}>
            New {singleTitle}
          </Button>
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} disabled={!editing?.id} onClick={remove}>
            Delete
          </Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Box className="data-grid-shell" sx={{ height: gridHeight }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          rowSelectionModel={selectionModel}
          onRowClick={(params) => {
            setEditing(params.row);
            onSelect?.(params.row);
          }}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          disableRowSelectionOnClick={false}
          density="compact"
        />
      </Box>
      {showInlineEditor && editing && (
        <Box className="inline-editor">
          <Typography variant="subtitle2" className="editor-kicker">
            {editing.id ? `Edit ${singleTitle}` : `New ${singleTitle}`}
          </Typography>
          <RecordForm fields={config.fields} value={editing} onChange={setEditing} onSave={() => save(editing)} saveLabel={editing.id ? 'Save' : 'Create'} />
        </Box>
      )}
    </Stack>
  );
}
