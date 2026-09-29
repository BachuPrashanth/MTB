import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { api } from '../api';
import type { RecordData } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  onUseSelected: (selection: { gene: string; mutation: string }) => Promise<void> | void;
};

const geneColumns: GridColDef[] = [
  { field: 'gene', headerName: 'Gene', flex: 1, minWidth: 160 },
  { field: 'biomarker', headerName: 'Biomarker?', width: 130 }
];

const mutationColumns: GridColDef[] = [{ field: 'mutation', headerName: 'Mutation', flex: 1, minWidth: 220 }];

function textValue(record: RecordData | null, field: string) {
  const value = record?.[field];
  return value === null || value === undefined ? '' : String(value);
}

export default function GeneLookupDialog({ open, onClose, onUseSelected }: Props) {
  const [genes, setGenes] = useState<RecordData[]>([]);
  const [mutations, setMutations] = useState<RecordData[]>([]);
  const [selectedGene, setSelectedGene] = useState<RecordData | null>(null);
  const [selectedMutation, setSelectedMutation] = useState<RecordData | null>(null);
  const [search, setSearch] = useState('');
  const [showNewMutation, setShowNewMutation] = useState(false);
  const [newMutation, setNewMutation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedGeneName = textValue(selectedGene, 'gene');
  const selectedMutationName = textValue(selectedMutation, 'mutation');

  const geneSelectionLabel = useMemo(() => {
    if (!selectedGeneName) return 'Select a gene to view related mutations.';
    return `Selected gene: ${selectedGeneName}`;
  }, [selectedGeneName]);

  async function loadGenes(query = search) {
    setError(null);
    try {
      const rows = await api.lookupGenes(query);
      setGenes(rows);
      setSelectedGene(null);
      setSelectedMutation(null);
      setMutations([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load genes.');
    }
  }

  async function loadMutations(gene: RecordData | null) {
    setSelectedMutation(null);
    setMutations([]);
    if (!gene) return;
    setError(null);
    try {
      setMutations(await api.lookupMutations(Number(gene.id), textValue(gene, 'gene')));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mutations.');
    }
  }

  useEffect(() => {
    if (open) void loadGenes('');
  }, [open]);

  async function useSelected() {
    if (!selectedGeneName || !selectedMutationName) return;
    await onUseSelected({ gene: selectedGeneName, mutation: selectedMutationName });
    onClose();
  }

  async function saveMutation() {
    if (!selectedGene || !newMutation.trim()) return;
    setError(null);
    try {
      await api.createLookupMutation({
        geneId: selectedGene.id,
        gene: selectedGeneName,
        mutation: newMutation.trim()
      });
      setNewMutation('');
      setShowNewMutation(false);
      await loadMutations(selectedGene);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mutation.');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogContent className="lookup-dialog">
        <Stack spacing={1.5}>
          <Box className="lookup-titlebar">
            <Typography variant="h6">Look Up Gene</Typography>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }} className="lookup-toolbar">
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
            <Button onClick={useSelected} disabled={!selectedGeneName || !selectedMutationName}>
              Use Selected
            </Button>
            <Button variant="outlined" onClick={() => setShowNewMutation((value) => !value)} disabled={!selectedGene}>
              New Mutation
            </Button>
            <TextField
              size="small"
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void loadGenes();
              }}
            />
            <Button variant="outlined" onClick={() => loadGenes()}>
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('');
                void loadGenes('');
              }}
            >
              Clear
            </Button>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          <div className="lookup-grid-pair">
            <Box className="lookup-grid-panel">
              <Typography className="lookup-grid-title">Genes</Typography>
              <Box className="lookup-grid-shell">
                <DataGrid
                  rows={genes}
                  columns={geneColumns}
                  getRowId={(row) => row.id}
                  density="compact"
                  hideFooter
                  onRowClick={(params) => {
                    setSelectedGene(params.row);
                    setShowNewMutation(false);
                    void loadMutations(params.row);
                  }}
                />
              </Box>
            </Box>

            <Box className="lookup-grid-panel">
              <Typography className="lookup-grid-title">Mutations</Typography>
              <Box className="lookup-grid-shell">
                <DataGrid
                  rows={mutations}
                  columns={mutationColumns}
                  getRowId={(row) => row.id}
                  density="compact"
                  hideFooter
                  onRowClick={(params) => setSelectedMutation(params.row)}
                />
              </Box>
            </Box>
          </div>

          <Typography variant="body2" color="text.secondary">
            {geneSelectionLabel}
          </Typography>

          {showNewMutation && selectedGene && (
            <Box className="lookup-new-mutation">
              <TextField size="small" label="Gene" value={selectedGeneName} disabled />
              <TextField size="small" label="Mutation Name" value={newMutation} onChange={(event) => setNewMutation(event.target.value)} />
              <Button onClick={saveMutation} disabled={!newMutation.trim()}>
                Save
              </Button>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
