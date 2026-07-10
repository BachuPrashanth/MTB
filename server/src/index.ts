import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { crudRouter } from './crud.js';
import { query } from './db/pool.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(
  '/api/patients',
  crudRouter({
    table: 'mtbtracking.patientdata',
    idColumn: 'patientid',
    fields: {
      firstName: 'firstname',
      lastName: 'lastname',
      mrn: 'mrn',
      dob: 'birthdate',
      patientExpired: 'patientexpired',
      deathDate: 'deathdate',
      dateLastChecked: 'lastcheckdate',
      expiredPriorToMtbReview: 'expirepriormtbreview',
      gender: 'gender',
      race: 'race',
      ethnicity: 'ethnicity',
      onMulti18Study: 'multi18enrollment',
      onMulti19Study: 'multi19enrollment',
      onPrimalStudy: 'primalenrollment'
    },
    searchable: ['firstname', 'lastname', 'mrn']
  })
);

app.use(
  '/api/family-history',
  crudRouter({
    table: 'mtbtracking.familyhistorydata',
    idColumn: 'familyhistoryid',
    parentColumn: 'patientid',
    fields: {
      relation: 'familyhistoryrelation',
      otherRelation: 'otherfamilyhistory',
      familySide: 'familyhistoryfamilyside',
      site: 'familyhistorysite',
      histology: 'familyhistoryhistology'
    }
  })
);

app.use(
  '/api/genetic-counseling',
  crudRouter({
    table: 'mtbtracking.geneticcounselingdata',
    idColumn: 'geneticcounselingid',
    parentColumn: 'patientid',
    fields: {
      referralDate: 'geneticcounselingreferraldate',
      seenDate: 'geneticcounselingseendate',
      testingOrdered: 'testingordered',
      germlineResults: 'germlineresults',
      reasonNoGermlineTesting: 'nogermlinetestingreason'
    }
  })
);

app.get('/api/genetic-counseling-genes', async (req, res, next) => {
  try {
    const result = await query<Record<string, unknown>>(
      `select gcg.geneticcounselinggeneid as id, gcg.genename as gene, gcg.genemutation as mutation
       from mtbtracking.geneticcounselinggenedata gcg
       where gcg.geneticcounselingid = $1
       order by gcg.geneticcounselinggeneid desc`,
      [Number(req.query.parentId)]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/genetic-counseling-genes', async (req, res, next) => {
  try {
    const counselingId = Number(req.query.parentId);
    const counseling = await query<{ geneticcounselingid: number }>(
      'select geneticcounselingid from mtbtracking.geneticcounselingdata where geneticcounselingid = $1',
      [counselingId]
    );
    if (!counseling.rowCount) {
      res.status(404).json({ message: 'Genetic counseling record not found.' });
      return;
    }
    const result = await query<Record<string, unknown>>(
      `insert into mtbtracking.geneticcounselinggenedata (geneticcounselingid, genename, genemutation)
       values ($1, $2, $3)
       returning geneticcounselinggeneid as id, genename as gene, genemutation as mutation`,
      [counselingId, req.body.gene ?? null, req.body.mutation ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/genetic-counseling-genes/:id', async (req, res, next) => {
  try {
    const result = await query<Record<string, unknown>>(
      `update mtbtracking.geneticcounselinggenedata
       set genename = $1, genemutation = $2
       where geneticcounselinggeneid = $3
       returning geneticcounselinggeneid as id, genename as gene, genemutation as mutation`,
      [req.body.gene ?? null, req.body.mutation ?? null, Number(req.params.id)]
    );
    if (!result.rowCount) {
      res.status(404).json({ message: 'Record not found.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/genetic-counseling-genes/:id', async (req, res, next) => {
  try {
    const result = await query('delete from mtbtracking.geneticcounselinggenedata where geneticcounselinggeneid = $1', [Number(req.params.id)]);
    if (!result.rowCount) {
      res.status(404).json({ message: 'Record not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use(
  '/api/diagnoses',
  crudRouter({
    table: 'mtbtracking.diagnosisdata',
    idColumn: 'diagnosisid',
    parentColumn: 'patientid',
    fields: {
      site: 'diagnosissite',
      histology: 'diagnosishistology',
      stage: 'diagnosisstage',
      recurrenceDate: 'recurrencedate',
      diagnosisDate: 'diagnosisdate',
      yearOnly: 'diagnosisyearonly',
      diagnosisYear: 'diagnosisyear',
      ageAtDiagnosis: 'diagnosisage'
    },
    booleanColumns: ['diagnosisyearonly']
  })
);

const mtbReviewFields = {
  batch: 'batch',
  submittingPhysician: 'submittingphysician',
  submittingFacility: 'submittingfacility',
  caseType: 'casetype',
  submissionDate: 'submissiondate',
  reviewedByMtb: 'reviewedbymtb',
  reviewType: 'reviewtype',
  reviewDate: 'reviewdate',
  caseNumber: 'casenumber',
  currentTherapy: 'currenttherapy',
  ageAtMtbReview: 'mtbreviewage',
  therapyOutcomes: 'therapyoutcomes'
};

const testTypeFields = {
  genomicTestType: 'genomictesttype',
  otherGenomicTestType: 'othergenomictesttype',
  reportDate: 'reportdate',
  collectionDate: 'collectiondate',
  specimenType: 'specimentype'
};

function rowFromFields(row: Record<string, unknown>, idColumn: string, fields: Record<string, string>) {
  return {
    ...Object.fromEntries(Object.entries(fields).map(([apiName, dbName]) => [apiName, row[dbName]])),
    id: row[idColumn]
  };
}

function bodyEntries(body: Record<string, unknown>, fields: Record<string, string>) {
  return Object.entries(fields)
    .filter(([apiName]) => apiName in body)
    .map(([apiName, dbName]) => ({ dbName, value: cleanValue(body[apiName]) }));
}

app.post('/api/mtb-reviews', async (req, res, next) => {
  try {
    const diagnosisId = Number(req.query.parentId);
    const diagnosis = await query<{ patientid: number }>(
      'select patientid from mtbtracking.diagnosisdata where diagnosisid = $1',
      [diagnosisId]
    );

    if (!diagnosis.rowCount) {
      res.status(404).json({ message: 'Diagnosis not found.' });
      return;
    }

    const entries = bodyEntries(req.body, mtbReviewFields);
    const columns = ['diagnosisid', 'patientid', ...entries.map((entry) => entry.dbName)];
    const values = [diagnosisId, diagnosis.rows[0].patientid, ...entries.map((entry) => entry.value)];
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const result = await query<Record<string, unknown>>(
      `insert into mtbtracking.mtbreviewdata (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`,
      values
    );
    res.status(201).json(rowFromFields(result.rows[0], 'mtbreviewid', mtbReviewFields));
  } catch (error) {
    next(error);
  }
});

app.use(
  '/api/mtb-reviews',
  crudRouter({
    table: 'mtbtracking.mtbreviewdata',
    idColumn: 'mtbreviewid',
    parentColumn: 'diagnosisid',
    fields: mtbReviewFields
  })
);

app.post('/api/test-types', async (req, res, next) => {
  try {
    const mtbReviewId = Number(req.query.parentId);
    const review = await query<{ patientid: number; diagnosisid: number }>(
      `select coalesce(m.patientid, d.patientid) as patientid, m.diagnosisid
       from mtbtracking.mtbreviewdata m
       join mtbtracking.diagnosisdata d on d.diagnosisid = m.diagnosisid
       where m.mtbreviewid = $1`,
      [mtbReviewId]
    );

    if (!review.rowCount) {
      res.status(404).json({ message: 'MTB review not found.' });
      return;
    }

    const entries = bodyEntries(req.body, testTypeFields);
    const columns = ['mtbreviewid', 'patientid', 'diagnosisid', ...entries.map((entry) => entry.dbName)];
    const values = [mtbReviewId, review.rows[0].patientid, review.rows[0].diagnosisid, ...entries.map((entry) => entry.value)];
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const result = await query<Record<string, unknown>>(
      `insert into mtbtracking.mtbreviewtesttypes (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`,
      values
    );
    res.status(201).json(rowFromFields(result.rows[0], 'id', testTypeFields));
  } catch (error) {
    next(error);
  }
});

app.use(
  '/api/test-types',
  crudRouter({
    table: 'mtbtracking.mtbreviewtesttypes',
    idColumn: 'id',
    parentColumn: 'mtbreviewid',
    fields: testTypeFields
  })
);

const recommendationFields = {
  recommendationType: 'recommendationtype',
  evidenceLevel: 'evidencelevel',
  recommendationTimepoint: 'recommendationtimepoint',
  germlineRecommendationReason: 'germlinerecommendationreason',
  testForGene: 'testforgene',
  targetedTrial: 'targetedtrial',
  nct: 'nctnum',
  ukTrial: 'uktrial',
  recommendation: 'recommendation',
  function: 'genefunction',
  otherRecommendation: 'othertypedescription',
  recommendationNotes: 'recommendationnotes'
};

function cleanValue(value: unknown) {
  return value === '' || value === undefined ? null : value;
}

function recommendationRow(row: Record<string, unknown>) {
  return {
    id: row.recommendationid,
    recommendationType: row.recommendationtype,
    evidenceLevel: row.evidencelevel,
    recommendationTimepoint: row.recommendationtimepoint,
    germlineRecommendationReason: row.germlinerecommendationreason,
    testForGene: row.testforgene,
    targetedTrial: row.targetedtrial,
    nct: row.nctnum,
    ukTrial: row.uktrial,
    recommendation: row.recommendation,
    function: row.genefunction,
    otherRecommendation: row.othertypedescription,
    recommendationNotes: row.recommendationnotes
  };
}

app.get('/api/recommendations', async (req, res, next) => {
  try {
    const result = await query<Record<string, unknown>>(
      'select * from mtbtracking.recommendationdata where mtbreviewid = $1 order by recommendationid desc',
      [Number(req.query.parentId)]
    );
    res.json(result.rows.map(recommendationRow));
  } catch (error) {
    next(error);
  }
});

app.post('/api/recommendations', async (req, res, next) => {
  try {
    const mtbReviewId = Number(req.query.parentId);
    const parent = await query<{ patientid: number; diagnosisid: number }>(
      `select coalesce(m.patientid, d.patientid) as patientid, m.diagnosisid
       from mtbtracking.mtbreviewdata m
       join mtbtracking.diagnosisdata d on d.diagnosisid = m.diagnosisid
       where m.mtbreviewid = $1`,
      [mtbReviewId]
    );

    if (!parent.rowCount) {
      res.status(404).json({ message: 'MTB review not found.' });
      return;
    }

    const entries = Object.entries(recommendationFields)
      .filter(([apiName]) => apiName in req.body)
      .map(([apiName, dbName]) => ({ dbName, value: cleanValue(req.body[apiName]) }));
    const columns = ['mtbreviewid', 'patientid', 'diagnosisid', ...entries.map((entry) => entry.dbName)];
    const values = [mtbReviewId, parent.rows[0].patientid, parent.rows[0].diagnosisid, ...entries.map((entry) => entry.value)];
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const result = await query<Record<string, unknown>>(
      `insert into mtbtracking.recommendationdata (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`,
      values
    );
    res.status(201).json(recommendationRow(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put('/api/recommendations/:id', async (req, res, next) => {
  try {
    const entries = Object.entries(recommendationFields)
      .filter(([apiName]) => apiName in req.body)
      .map(([apiName, dbName]) => ({ dbName, value: cleanValue(req.body[apiName]) }));

    if (!entries.length) {
      res.status(400).json({ message: 'No valid fields supplied.' });
      return;
    }

    const assignments = entries.map((entry, index) => `${entry.dbName} = $${index + 1}`);
    const values = entries.map((entry) => entry.value);
    values.push(Number(req.params.id));
    const result = await query<Record<string, unknown>>(
      `update mtbtracking.recommendationdata set ${assignments.join(', ')} where recommendationid = $${values.length} returning *`,
      values
    );

    if (!result.rowCount) {
      res.status(404).json({ message: 'Record not found.' });
      return;
    }

    res.json(recommendationRow(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/recommendations/:id', async (req, res, next) => {
  try {
    const result = await query('delete from mtbtracking.recommendationdata where recommendationid = $1', [Number(req.params.id)]);
    if (!result.rowCount) {
      res.status(404).json({ message: 'Record not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use(
  '/api/recommendation-genes',
  crudRouter({
    table: 'mtbtracking.recommendationgenedata',
    idColumn: 'recommendationgeneid',
    parentColumn: 'recommendationid',
    fields: {
      gene: 'genename',
      mutationName: 'genemutation',
      biomarkerScore: 'biomarkerscore'
    }
  })
);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: error.message || 'Unexpected server error.' });
});

app.listen(port, () => {
  console.log(`MTB API listening on http://localhost:${port}`);
});
