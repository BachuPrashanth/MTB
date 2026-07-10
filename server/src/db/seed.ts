import 'dotenv/config';
import { pool } from './pool.js';

const { rows } = await pool.query<{ count: string }>('select count(*) from mtbtracking.patientdata');

if (Number(rows[0].count) === 0) {
  const patients = await pool.query<{ patientid: number }>(
    `insert into mtbtracking.patientdata
      (firstname, lastname, mrn, birthdate, patientexpired, deathdate, lastcheckdate, expirepriormtbreview, gender, race, ethnicity, multi18enrollment, multi19enrollment, primalenrollment)
     values
      ('Avery', 'Nguyen', '100319', '1978-04-12', 'No', null, '2026-06-12', 'No', 'Female', 'Asian', 'Non-Hispanic', 'Yes', 'No', 'No'),
      ('Jordan', 'Patel', '100420', '1969-09-24', 'No', null, '2026-06-15', 'No', 'Male', 'Asian', 'Unknown', 'No', 'Yes', 'No'),
      ('Maria', 'Garcia', '100521', '1985-02-03', 'Yes', '2025-11-19', '2025-11-20', 'No', 'Female', 'White', 'Hispanic or Latino', 'No', 'No', 'Yes')
     returning patientid`
  );

  const [avery, jordan, maria] = patients.rows;

  await pool.query(
    `insert into mtbtracking.familyhistorydata
      (patientid, familyhistoryrelation, otherfamilyhistory, familyhistoryfamilyside, familyhistorysite, familyhistoryhistology)
     values
      ($1, 'Mother', null, 'Maternal', 'Breast', 'Invasive ductal carcinoma'),
      ($1, 'Grandfather', null, 'Paternal', 'Colon', 'Adenocarcinoma'),
      ($2, 'Sister', null, 'Maternal', 'Ovary', 'High-grade serous carcinoma'),
      ($3, 'Other', 'Great aunt', 'Maternal', 'Pancreas', 'Ductal adenocarcinoma')`,
    [avery.patientid, jordan.patientid, maria.patientid]
  );

  const gc = await pool.query<{ geneticcounselingid: number }>(
    `insert into mtbtracking.geneticcounselingdata
      (patientid, geneticcounselingreferraldate, geneticcounselingseendate, testingordered, germlineresults, nogermlinetestingreason)
     values
      ($1, '2024-02-01', '2024-02-20', 'Invitae hereditary cancer panel', 'Negative', null),
      ($2, '2024-04-12', '2024-05-03', 'BRCA1/2 panel', 'VUS', null),
      ($3, '2025-01-10', null, 'Not ordered', null, 'Patient declined testing')
     returning geneticcounselingid`,
    [avery.patientid, jordan.patientid, maria.patientid]
  );

  await pool.query(
    `insert into mtbtracking.geneticcounselinggenedata
      (geneticcounselingid, genename, genemutation)
     values
      ($1, 'BRCA1', 'No pathogenic variant detected'),
      ($1, 'TP53', 'No pathogenic variant detected'),
      ($2, 'CHEK2', 'c.470T>C VUS'),
      ($3, 'PALB2', 'Testing not completed')`,
    [gc.rows[0].geneticcounselingid, gc.rows[1].geneticcounselingid, gc.rows[2].geneticcounselingid]
  );

  const diagnoses = await pool.query<{ diagnosisid: number; patientid: number }>(
    `insert into mtbtracking.diagnosisdata
      (patientid, diagnosissite, diagnosishistology, diagnosisstage, recurrencedate, diagnosisdate, diagnosisyearonly, diagnosisyear, diagnosisage)
     values
      ($1, 'Lung', 'Adenocarcinoma', 'IV', null, '2024-01-15', false, 2024, 45),
      ($1, 'Breast', 'Invasive ductal carcinoma', 'II', null, '2021-07-09', false, 2021, 43),
      ($2, 'Colon', 'Adenocarcinoma', 'III', '2025-02-11', '2023-03-22', false, 2023, 53),
      ($3, 'Ovary', 'High-grade serous carcinoma', 'IV', null, '2025-01-05', false, 2025, 39)
     returning diagnosisid, patientid`,
    [avery.patientid, jordan.patientid, maria.patientid]
  );

  const [averyLung, averyBreast, jordanColon, mariaOvary] = diagnoses.rows;

  const reviews = await pool.query<{ mtbreviewid: number }>(
    `insert into mtbtracking.mtbreviewdata
      (patientid, diagnosisid, batch, submittingphysician, submittingfacility, casetype, submissiondate, reviewedbymtb, reviewtype, reviewdate, casenumber, currenttherapy, mtbreviewage, therapyoutcomes)
     values
      ($1, $2, '2026-Q2', 'Dr. Chen', 'UK Markey Cancer Center', 'Adult', '2026-04-02', 'Yes', 'MTB Meeting', '2026-04-15', 2401, 'Carboplatin / pemetrexed', 47, 'Stable disease'),
      ($3, $4, '2026-Q2', 'Dr. Rivera', 'Community Oncology North', 'Adult', '2026-04-10', 'Yes', 'Administrative', '2026-04-18', 2402, 'FOLFOX', 56, 'Partial response'),
      ($5, $6, '2026-Q3', 'Dr. Miles', 'UK Markey Cancer Center', 'Adult', '2026-06-21', 'No', 'Administrative', null, 2501, 'Observation', 40, null)
     returning mtbreviewid`,
    [averyLung.patientid, averyLung.diagnosisid, jordanColon.patientid, jordanColon.diagnosisid, mariaOvary.patientid, mariaOvary.diagnosisid]
  );

  const [averyReview, jordanReview, mariaReview] = reviews.rows;

  await pool.query(
    `insert into mtbtracking.mtbreviewtesttypes
      (patientid, diagnosisid, mtbreviewid, genomictesttype, reportdate, collectiondate, specimentype, othergenomictesttype)
     values
      ($1, $2, $3, 'FoundationOne CDx', '2026-03-20', '2026-03-01', 'Tissue', null),
      ($4, $5, $6, 'Guardant360', '2026-04-01', '2026-03-25', 'Blood', null),
      ($7, $8, $9, 'Other', '2026-06-15', '2026-06-02', 'Tissue', 'Institutional NGS panel')`,
    [
      averyLung.patientid,
      averyLung.diagnosisid,
      averyReview.mtbreviewid,
      jordanColon.patientid,
      jordanColon.diagnosisid,
      jordanReview.mtbreviewid,
      mariaOvary.patientid,
      mariaOvary.diagnosisid,
      mariaReview.mtbreviewid
    ]
  );

  const recommendations = await pool.query<{ recommendationid: number }>(
    `insert into mtbtracking.recommendationdata
      (mtbreviewid, patientid, diagnosisid, recommendationtype, evidencelevel, recommendationtimepoint, testforgene, targetedtrial, nctnum, uktrial, recommendation, genefunction, othertypedescription, recommendationnotes)
     values
      ($1, $2, $3, 'Therapy', '2', 'At progression', 'No', 'Yes', 'NCT01234567', 'No', 'Osimertinib', 'Activating alteration', null, 'Consider targeted therapy if EGFR alteration confirmed.'),
      ($4, $5, $6, 'Trial', '3', 'Now', 'No', 'Yes', 'NCT07654321', 'Yes', 'KRAS inhibitor study', 'Oncogenic signaling', null, 'Screen for trial eligibility.'),
      ($7, $8, $9, 'Germline', '2', 'Now', 'Yes', 'No', null, 'No', 'Genetic counseling follow-up', 'DNA repair', null, 'Recommend germline evaluation based on tumor profile.')
     returning recommendationid`,
    [
      averyReview.mtbreviewid,
      averyLung.patientid,
      averyLung.diagnosisid,
      jordanReview.mtbreviewid,
      jordanColon.patientid,
      jordanColon.diagnosisid,
      mariaReview.mtbreviewid,
      mariaOvary.patientid,
      mariaOvary.diagnosisid
    ]
  );

  await pool.query(
    `insert into mtbtracking.recommendationgenedata
      (recommendationid, genename, genemutation, biomarkerscore)
     values
      ($1, 'EGFR', 'L858R', 18.2),
      ($2, 'KRAS', 'G12C', 22.4),
      ($3, 'BRCA2', 'p.K3326*', 12.8)`,
    [recommendations.rows[0].recommendationid, recommendations.rows[1].recommendationid, recommendations.rows[2].recommendationid]
  );
}

const reviewCount = await pool.query<{ count: string }>('select count(*) from mtbtracking.mtbreviewdata');

if (Number(reviewCount.rows[0].count) === 0) {
  const diagnoses = await pool.query<{ diagnosisid: number; patientid: number }>(
    `select diagnosisid, patientid
     from mtbtracking.diagnosisdata
     order by diagnosisid
     limit 3`
  );

  if (diagnoses.rows.length) {
    const [firstDiagnosis, secondDiagnosis = firstDiagnosis, thirdDiagnosis = firstDiagnosis] = diagnoses.rows;
    const reviews = await pool.query<{ mtbreviewid: number }>(
      `insert into mtbtracking.mtbreviewdata
        (patientid, diagnosisid, batch, submittingphysician, submittingfacility, casetype, submissiondate, reviewedbymtb, reviewtype, reviewdate, casenumber, currenttherapy, mtbreviewage, therapyoutcomes)
       values
        ($1, $2, '2026-Q2', 'Dr. Chen', 'UK Markey Cancer Center', 'Adult', '2026-04-02', 'Yes', 'MTB Meeting', '2026-04-15', 2401, 'Carboplatin / pemetrexed', 47, 'Stable disease'),
        ($3, $4, '2026-Q2', 'Dr. Rivera', 'Community Oncology North', 'Adult', '2026-04-10', 'Yes', 'Administrative', '2026-04-18', 2402, 'FOLFOX', 56, 'Partial response'),
        ($5, $6, '2026-Q3', 'Dr. Miles', 'UK Markey Cancer Center', 'Adult', '2026-06-21', 'No', 'Administrative', null, 2501, 'Observation', 40, null)
       returning mtbreviewid`,
      [
        firstDiagnosis.patientid,
        firstDiagnosis.diagnosisid,
        secondDiagnosis.patientid,
        secondDiagnosis.diagnosisid,
        thirdDiagnosis.patientid,
        thirdDiagnosis.diagnosisid
      ]
    );

    await pool.query(
      `insert into mtbtracking.mtbreviewtesttypes
        (patientid, diagnosisid, mtbreviewid, genomictesttype, reportdate, collectiondate, specimentype, othergenomictesttype)
       values
        ($1, $2, $3, 'FoundationOne CDx', '2026-03-20', '2026-03-01', 'Tissue', null),
        ($4, $5, $6, 'Guardant360', '2026-04-01', '2026-03-25', 'Blood', null),
        ($7, $8, $9, 'Other', '2026-06-15', '2026-06-02', 'Tissue', 'Institutional NGS panel')`,
      [
        firstDiagnosis.patientid,
        firstDiagnosis.diagnosisid,
        reviews.rows[0].mtbreviewid,
        secondDiagnosis.patientid,
        secondDiagnosis.diagnosisid,
        reviews.rows[1].mtbreviewid,
        thirdDiagnosis.patientid,
        thirdDiagnosis.diagnosisid,
        reviews.rows[2].mtbreviewid
      ]
    );

    const recommendations = await pool.query<{ recommendationid: number }>(
      `insert into mtbtracking.recommendationdata
        (mtbreviewid, patientid, diagnosisid, recommendationtype, evidencelevel, recommendationtimepoint, testforgene, targetedtrial, nctnum, uktrial, recommendation, genefunction, othertypedescription, recommendationnotes)
       values
        ($1, $2, $3, 'Therapy', '2', 'At progression', 'No', 'Yes', 'NCT01234567', 'No', 'Osimertinib', 'Activating alteration', null, 'Consider targeted therapy if EGFR alteration confirmed.'),
        ($4, $5, $6, 'Trial', '3', 'Now', 'No', 'Yes', 'NCT07654321', 'Yes', 'KRAS inhibitor study', 'Oncogenic signaling', null, 'Screen for trial eligibility.'),
        ($7, $8, $9, 'Germline', '2', 'Now', 'Yes', 'No', null, 'No', 'Genetic counseling follow-up', 'DNA repair', null, 'Recommend germline evaluation based on tumor profile.')
       returning recommendationid`,
      [
        reviews.rows[0].mtbreviewid,
        firstDiagnosis.patientid,
        firstDiagnosis.diagnosisid,
        reviews.rows[1].mtbreviewid,
        secondDiagnosis.patientid,
        secondDiagnosis.diagnosisid,
        reviews.rows[2].mtbreviewid,
        thirdDiagnosis.patientid,
        thirdDiagnosis.diagnosisid
      ]
    );

    await pool.query(
      `insert into mtbtracking.recommendationgenedata
        (recommendationid, genename, genemutation, biomarkerscore)
       values
        ($1, 'EGFR', 'L858R', 18.2),
        ($2, 'KRAS', 'G12C', 22.4),
        ($3, 'BRCA2', 'p.K3326*', 12.8)`,
      [recommendations.rows[0].recommendationid, recommendations.rows[1].recommendationid, recommendations.rows[2].recommendationid]
    );
  }
}

await pool.end();
console.log('Phase 2 dummy data seed complete.');
