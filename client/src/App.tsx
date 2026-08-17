import { useEffect, useState } from 'react';
import { Alert, AppBar, Box, Button, Chip, Container, Divider, Paper, Stack, Tab, Tabs, TextField, Toolbar, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { api } from './api';
import {
  diagnosisConfig,
  familyHistoryConfig,
  geneticCounselingConfig,
  geneticCounselingGenesConfig,
  mtbReviewConfig,
  patientConfig,
  recommendationConfig,
  recommendationGeneConfig,
  testTypeConfig
} from './config';
import RecordForm from './components/RecordForm';
import ResourcePanel from './components/ResourcePanel';
import type { RecordData } from './types';

const patientColumns: GridColDef[] = patientConfig.columns.map((column) => ({
  field: column.name,
  headerName: column.label,
  flex: 1,
  minWidth: 130
}));

function patientLabel(patient: RecordData) {
  const dob = typeof patient.dob === 'string' ? patient.dob.slice(0, 10) : '';
  return `${patient.lastName ?? ''}, ${patient.firstName ?? ''} - MRN ${patient.mrn ?? ''} - DOB ${dob}`;
}

function fieldLabel(record: RecordData | null, keys: string[], fallback: string) {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== '') return String(value);
  }
  return record.id ? `${fallback} #${record.id}` : fallback;
}

export default function App() {
  const [patients, setPatients] = useState<RecordData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<RecordData | null>(null);
  const [patientDraft, setPatientDraft] = useState<RecordData>({});
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [search, setSearch] = useState('');
  const [patientTab, setPatientTab] = useState(0);
  const [selectedGeneticCounseling, setSelectedGeneticCounseling] = useState<RecordData | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<RecordData | null>(null);
  const [selectedMtbReview, setSelectedMtbReview] = useState<RecordData | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecordData | null>(null);
  const [mtbTab, setMtbTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function loadPatients(query = search) {
    setError(null);
    try {
      setPatients(await api.list('patients', undefined, query));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients.');
    }
  }

  useEffect(() => {
    void loadPatients('');
  }, []);

  async function savePatient(record: RecordData) {
    setError(null);
    try {
      const saved = record.id ? await api.update('patients', Number(record.id), record) : await api.create('patients', record);
      await loadPatients();
      setSelectedPatient(saved);
      setPatientDraft({});
      setShowNewPatientForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Patient save failed.');
    }
  }

  function resetNestedForPatient(patient: RecordData) {
    setSelectedPatient(patient);
    setShowNewPatientForm(false);
    setSelectedGeneticCounseling(null);
    setSelectedDiagnosis(null);
    setSelectedMtbReview(null);
    setSelectedRecommendation(null);
    setPatientTab(0);
  }

  function clearToPatientTab(nextTab: number) {
    setPatientTab(nextTab);
    if (nextTab !== 2) setSelectedGeneticCounseling(null);
    if (nextTab !== 3) {
      setSelectedDiagnosis(null);
      setSelectedMtbReview(null);
      setSelectedRecommendation(null);
      setMtbTab(0);
    }
  }

  function startNewPatient() {
    setSelectedPatient(null);
    setShowNewPatientForm(true);
    setSelectedGeneticCounseling(null);
    setSelectedDiagnosis(null);
    setSelectedMtbReview(null);
    setSelectedRecommendation(null);
    setPatientDraft({});
    setPatientTab(0);
    setMtbTab(0);
  }

  return (
    <Box className="app-frame">
      <AppBar position="sticky" elevation={0}>
        <Toolbar className="topbar">
          <Box>
            <Typography variant="h6">Molecular Tumor Board</Typography>
            {/* <Typography variant="caption" className="topbar-subtitle">
              Molecular Tumor Board Tracking
            </Typography> */}
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <Paper className="workspace-panel patient-search-panel">
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
                <Box>
                  <Typography variant="h5">Patient List</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {patients.length} patient{patients.length === 1 ? '' : 's'} loaded
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Search patients"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void loadPatients();
                    }}
                  />
                  <Button startIcon={<SearchIcon />} onClick={() => loadPatients()}>
                    Search
                  </Button>
                  <Button startIcon={<AddIcon />} onClick={startNewPatient}>
                    New Patient
                  </Button>
                </Stack>
              </Stack>
              <Box className="patient-grid-shell">
                <DataGrid
                  rows={patients}
                  columns={patientColumns}
                  getRowId={(row) => row.id}
                  rowSelectionModel={selectedPatient?.id ? { type: 'include', ids: new Set([selectedPatient.id]) } : { type: 'include', ids: new Set() }}
                  onRowClick={(params) => resetNestedForPatient(params.row)}
                  pageSizeOptions={[5, 10, 25, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  density="compact"
                />
              </Box>
            </Stack>
          </Paper>

          {selectedPatient && (
            <Paper className="context-panel">
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="overline">Active Patient</Typography>
                  <Typography variant="h6">{patientLabel(selectedPatient)}</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip color="primary" label={`Patient #${selectedPatient.id}`} />
                  {selectedGeneticCounseling && <Chip label={`Counseling #${selectedGeneticCounseling.id}`} />}
                  {selectedDiagnosis && <Chip label={fieldLabel(selectedDiagnosis, ['site', 'histology'], 'Diagnosis')} />}
                  {selectedMtbReview && <Chip label={fieldLabel(selectedMtbReview, ['batch', 'caseNumber'], 'MTB Review')} />}
                  {selectedRecommendation && <Chip label={fieldLabel(selectedRecommendation, ['recommendationType', 'recommendation'], 'Recommendation')} />}
                </Stack>
              </Stack>
            </Paper>
          )}

          {showNewPatientForm && !selectedPatient && (
            <Paper className="workspace-panel">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h5">New Patient</Typography>
                  <Typography color="text.secondary" variant="body2">Create a patient record before adding diagnosis, counseling, or MTB review data.</Typography>
                </Box>
                <Divider />
                <RecordForm fields={patientConfig.fields} value={patientDraft} onChange={setPatientDraft} onSave={() => savePatient(patientDraft)} saveLabel="Create Patient" />
              </Stack>
            </Paper>
          )}

          {selectedPatient && (
            <Paper className="workspace-panel">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h5">Patient Dashboard</Typography>
                  <Typography color="text.secondary" variant="body2">{patientLabel(selectedPatient)}</Typography>
                </Box>
                <Tabs value={patientTab} onChange={(_event, value) => clearToPatientTab(value)} variant="scrollable" scrollButtons="auto" className="workflow-tabs">
                  <Tab label="Patient Information" />
                  <Tab label="Family History" />
                  <Tab label="Genetic Counseling" />
                  <Tab label="Diagnosis Records" />
                </Tabs>
                {patientTab === 0 && <RecordForm fields={patientConfig.fields} value={selectedPatient} onChange={setSelectedPatient} onSave={() => savePatient(selectedPatient)} />}
                {patientTab === 1 && <ResourcePanel config={familyHistoryConfig} parentId={Number(selectedPatient.id)} />}
                {patientTab === 2 && (
                  <Stack spacing={2}>
                    <ResourcePanel
                      config={geneticCounselingConfig}
                      parentId={Number(selectedPatient.id)}
                      selected={selectedGeneticCounseling}
                      onSelect={setSelectedGeneticCounseling}
                    />
                    {selectedGeneticCounseling && (
                      <ResourcePanel config={geneticCounselingGenesConfig} parentId={Number(selectedGeneticCounseling.id)} />
                    )}
                    {!selectedGeneticCounseling && (
                      <Box className="empty-state">
                        <Typography variant="subtitle2">No genetic counseling record selected</Typography>
                      </Box>
                    )}
                  </Stack>
                )}
                {patientTab === 3 && (
                  <ResourcePanel
                    config={diagnosisConfig}
                    parentId={Number(selectedPatient.id)}
                    selected={selectedDiagnosis}
                    onSelect={(record) => {
                      setSelectedDiagnosis(record);
                      setSelectedMtbReview(null);
                      setSelectedRecommendation(null);
                    }}
                  />
                )}
              </Stack>
            </Paper>
          )}

          {selectedPatient && patientTab === 3 && selectedDiagnosis && (
            <Paper className="workspace-panel">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h5">MTB Reviews</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {fieldLabel(selectedDiagnosis, ['site', 'histology', 'stage'], 'Selected diagnosis')}
                  </Typography>
                </Box>
                <ResourcePanel
                  config={mtbReviewConfig}
                  parentId={Number(selectedDiagnosis.id)}
                  selected={selectedMtbReview}
                  onSelect={(record) => {
                    setSelectedMtbReview(record);
                    setSelectedRecommendation(null);
                    setMtbTab(0);
                  }}
                />
              </Stack>
            </Paper>
          )}

          {selectedPatient && patientTab === 3 && selectedDiagnosis && selectedMtbReview && (
            <Paper className="workspace-panel">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h5">MTB Review Dashboard</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {fieldLabel(selectedMtbReview, ['batch', 'caseNumber', 'reviewType'], 'Selected MTB review')}
                  </Typography>
                </Box>
                <Tabs value={mtbTab} onChange={(_event, value) => setMtbTab(value)} className="workflow-tabs">
                  <Tab label="Review Details" />
                  <Tab label="Test Types" />
                  <Tab label="Recommendations" />
                </Tabs>
                {mtbTab === 0 && <RecordForm fields={mtbReviewConfig.fields} value={selectedMtbReview} onChange={setSelectedMtbReview} onSave={() => api.update('mtb-reviews', Number(selectedMtbReview.id), selectedMtbReview)} />}
                {mtbTab === 1 && <ResourcePanel config={testTypeConfig} parentId={Number(selectedMtbReview.id)} />}
                {mtbTab === 2 && (
                  <ResourcePanel
                    config={recommendationConfig}
                    parentId={Number(selectedMtbReview.id)}
                    selected={selectedRecommendation}
                    onSelect={setSelectedRecommendation}
                  />
                )}
              </Stack>
            </Paper>
          )}

          {selectedPatient && patientTab === 3 && selectedDiagnosis && selectedMtbReview && mtbTab === 2 && selectedRecommendation && (
            <Paper className="workspace-panel">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h5">Recommendation Genes</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {fieldLabel(selectedRecommendation, ['recommendationType', 'recommendation'], 'Selected recommendation')}
                  </Typography>
                </Box>
                <ResourcePanel config={recommendationGeneConfig} parentId={Number(selectedRecommendation.id)} />
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
