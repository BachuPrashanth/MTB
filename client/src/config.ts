import type { ResourceConfig } from './types';

export const yesNo = ['Yes', 'No'];
export const gender = ['Male', 'Female', 'Transgendered female to male', 'Transgendered male to female'];
export const race = ['White', 'Black or African American', 'American Indian or Alaska Native', 'Asian', 'Native Hawaiian or Other Pacific Islander', 'Spanish American', 'Middle Eastern', 'Biracial', 'Unknown', 'NA', 'Refuse'];
export const ethnicity = ['Unknown', 'Hispanic or Latino', 'Non-Hispanic'];

export const patientConfig: ResourceConfig = {
  key: 'patients',
  title: 'Patient Information',
  endpoint: 'patients',
  columns: [
    { name: 'id', label: 'Patient ID', type: 'number', editable: false },
    { name: 'lastName', label: 'Last Name' },
    { name: 'firstName', label: 'First Name' },
    { name: 'mrn', label: 'MRN', type: 'number' },
    { name: 'dob', label: 'DOB', type: 'date' },
    { name: 'gender', label: 'Gender', type: 'select', options: gender }
  ],
  fields: [
    { name: 'id', label: 'Patient ID', type: 'number', editable: false },
    { name: 'firstName', label: 'First Name' },
    { name: 'lastName', label: 'Last Name' },
    { name: 'mrn', label: 'MRN', type: 'number' },
    { name: 'dob', label: 'DOB', type: 'date' },
    { name: 'patientExpired', label: 'Patient Expired', type: 'select', options: yesNo },
    { name: 'deathDate', label: 'Death Date', type: 'date' },
    { name: 'dateLastChecked', label: 'Date Last Checked', type: 'date' },
    { name: 'expiredPriorToMtbReview', label: 'Expired Prior to MTB Review', type: 'select', options: yesNo },
    { name: 'gender', label: 'Gender', type: 'select', options: gender },
    { name: 'race', label: 'Race', type: 'select', options: race },
    { name: 'ethnicity', label: 'Ethnicity', type: 'select', options: ethnicity },
    { name: 'onMulti18Study', label: 'On Multi-18 Study', type: 'select', options: yesNo },
    { name: 'onMulti19Study', label: 'On Multi-19 Study', type: 'select', options: yesNo },
    { name: 'onPrimalStudy', label: 'On PriMal Study', type: 'select', options: yesNo }
  ]
};

export const familyHistoryConfig: ResourceConfig = {
  key: 'familyHistory',
  title: 'Family History',
  endpoint: 'family-history',
  columns: [
    { name: 'relation', label: 'Relation' },
    { name: 'otherRelation', label: 'Other Relation' },
    { name: 'familySide', label: 'Family Side' },
    { name: 'site', label: 'Site' },
    { name: 'histology', label: 'Histology' }
  ],
  fields: [
    { name: 'relation', label: 'Relation', type: 'select', options: ['Mother', 'Father', 'Son', 'Daughter', 'Sister', 'Brother', 'Grandmother', 'Grandfather', 'Aunt', 'Uncle', 'Cousin', 'Niece', 'Nephew', 'Half-Sibling', 'Unspecified', 'Other'] },
    { name: 'otherRelation', label: 'Specify Other' },
    { name: 'familySide', label: 'Family Side', type: 'select', options: ['Maternal', 'Paternal'] },
    { name: 'site', label: 'Site' },
    { name: 'histology', label: 'Histology' }
  ]
};

export const geneticCounselingConfig: ResourceConfig = {
  key: 'geneticCounseling',
  title: 'Genetic Counseling',
  endpoint: 'genetic-counseling',
  columns: [
    { name: 'referralDate', label: 'Referral Date', type: 'date' },
    { name: 'seenDate', label: 'Seen Date', type: 'date' },
    { name: 'testingOrdered', label: 'Testing Ordered' },
    { name: 'germlineResults', label: 'Germline Results' },
    { name: 'reasonNoGermlineTesting', label: 'Reason No Germline Testing' }
  ],
  fields: [
    { name: 'referralDate', label: 'Referral Date', type: 'date' },
    { name: 'seenDate', label: 'Seen Date', type: 'date' },
    { name: 'testingOrdered', label: 'Testing Ordered' },
    { name: 'germlineResults', label: 'Germline Results', type: 'select', options: ['Positive', 'Negative', 'VUS'] },
    { name: 'reasonNoGermlineTesting', label: 'Reason for No Germline Testing' }
  ]
};

export const geneticCounselingGenesConfig: ResourceConfig = {
  key: 'geneticCounselingGenes',
  title: 'Genetic Counseling Genes',
  endpoint: 'genetic-counseling-genes',
  columns: [
    { name: 'gene', label: 'Gene' },
    { name: 'mutation', label: 'Mutation' }
  ],
  fields: [
    { name: 'gene', label: 'Gene' },
    { name: 'mutation', label: 'Mutation' }
  ]
};

export const diagnosisConfig: ResourceConfig = {
  key: 'diagnoses',
  title: 'Diagnosis Records',
  endpoint: 'diagnoses',
  columns: [
    { name: 'site', label: 'Site' },
    { name: 'histology', label: 'Histology' },
    { name: 'stage', label: 'Stage' },
    { name: 'recurrenceDate', label: 'Recurrence Date', type: 'date' },
    { name: 'diagnosisDate', label: 'Diagnosis Date', type: 'date' },
    { name: 'ageAtDiagnosis', label: 'Age at Diagnosis', type: 'number' }
  ],
  fields: [
    { name: 'site', label: 'Site' },
    { name: 'histology', label: 'Histology' },
    { name: 'stage', label: 'Stage' },
    { name: 'recurrenceDate', label: 'Recurrence Date', type: 'date' },
    { name: 'diagnosisDate', label: 'Diagnosis Date', type: 'date' },
    { name: 'yearOnly', label: 'Year Only', type: 'select', options: yesNo },
    { name: 'diagnosisYear', label: 'Diagnosis Year', type: 'number' },
    { name: 'ageAtDiagnosis', label: 'Age at Diagnosis', type: 'number' }
  ]
};

export const mtbReviewConfig: ResourceConfig = {
  key: 'mtbReviews',
  title: 'MTB Reviews',
  endpoint: 'mtb-reviews',
  columns: [
    { name: 'batch', label: 'Batch' },
    { name: 'submittingPhysician', label: 'Submitting Physician' },
    { name: 'submittingFacility', label: 'Submitting Facility' },
    { name: 'caseType', label: 'Case Type' },
    { name: 'submissionDate', label: 'Submission Date', type: 'date' },
    { name: 'reviewedByMtb', label: 'Reviewed by MTB' },
    { name: 'reviewType', label: 'Review Type' },
    { name: 'reviewDate', label: 'Review Date', type: 'date' },
    { name: 'caseNumber', label: 'Case Number', type: 'number' },
    { name: 'currentTherapy', label: 'Current Therapy' }
  ],
  fields: [
    { name: 'batch', label: 'Batch' },
    { name: 'submittingPhysician', label: 'Submitting Physician' },
    { name: 'submittingFacility', label: 'Submitting Facility' },
    { name: 'caseType', label: 'Case Type', type: 'select', options: ['Adult', 'Pediatric'] },
    { name: 'submissionDate', label: 'Submission Date', type: 'date' },
    { name: 'reviewedByMtb', label: 'Reviewed by MTB', type: 'select', options: yesNo },
    { name: 'reviewType', label: 'Review Type', type: 'select', options: ['MTB Meeting', 'Administrative'] },
    { name: 'reviewDate', label: 'Review Date', type: 'date' },
    { name: 'caseNumber', label: 'Case Number', type: 'number' },
    { name: 'currentTherapy', label: 'Current Therapy' },
    { name: 'ageAtMtbReview', label: 'Age at MTB Review', type: 'number' },
    { name: 'therapyOutcomes', label: 'Therapy Outcomes' }
  ]
};

export const testTypeConfig: ResourceConfig = {
  key: 'testTypes',
  title: 'MTB Review Test Types',
  endpoint: 'test-types',
  columns: [
    { name: 'genomicTestType', label: 'Test Type' },
    { name: 'reportDate', label: 'Report Date', type: 'date' },
    { name: 'collectionDate', label: 'Collection Date', type: 'date' },
    { name: 'specimenType', label: 'Specimen Type' }
  ],
  fields: [
    { name: 'genomicTestType', label: 'Genomic Test Type' },
    { name: 'otherGenomicTestType', label: 'Other Genomic Test Type' },
    { name: 'reportDate', label: 'Report Date', type: 'date' },
    { name: 'collectionDate', label: 'Collection Date', type: 'date' },
    { name: 'specimenType', label: 'Specimen Type', type: 'select', options: ['Blood', 'Tissue'] }
  ]
};

export const recommendationConfig: ResourceConfig = {
  key: 'recommendations',
  title: 'Recommendations',
  endpoint: 'recommendations',
  columns: [
    { name: 'recommendationType', label: 'Recommendation Type' },
    { name: 'testForGene', label: 'Test for Gene' },
    { name: 'evidenceLevel', label: 'Evidence Level' },
    { name: 'targetedTrial', label: 'Targeted Trial' },
    { name: 'nct', label: 'NCT' },
    { name: 'ukTrial', label: 'UK Trial' },
    { name: 'recommendation', label: 'Recommendation' },
    { name: 'function', label: 'Function' },
    { name: 'otherRecommendation', label: 'Other Recommendation' },
    { name: 'recommendationNotes', label: 'Recommendation Notes' }
  ],
  fields: [
    { name: 'recommendationType', label: 'Recommendation Type' },
    { name: 'evidenceLevel', label: 'Evidence Level' },
    { name: 'recommendationTimepoint', label: 'Recommendation Timepoint' },
    { name: 'germlineRecommendationReason', label: 'Germline Recommendation Reason' },
    { name: 'testForGene', label: 'Test for Gene', type: 'select', options: yesNo },
    { name: 'targetedTrial', label: 'Targeted Trial', type: 'select', options: yesNo },
    { name: 'nct', label: 'NCT' },
    { name: 'ukTrial', label: 'UK Trial', type: 'select', options: yesNo },
    { name: 'recommendation', label: 'Recommendation' },
    { name: 'function', label: 'Function' },
    { name: 'otherRecommendation', label: 'Other Recommendation' },
    { name: 'recommendationNotes', label: 'Recommendation Notes', type: 'multiline' }
  ]
};

export const recommendationGeneConfig: ResourceConfig = {
  key: 'recommendationGenes',
  title: 'Recommendation Genes',
  endpoint: 'recommendation-genes',
  columns: [
    { name: 'gene', label: 'Gene' },
    { name: 'mutationName', label: 'Mutation' },
    { name: 'biomarkerScore', label: 'Biomarker Score' }
  ],
  fields: [
    { name: 'gene', label: 'Gene' },
    { name: 'mutationName', label: 'Mutation Name' },
    { name: 'biomarkerScore', label: 'Biomarker Score' }
  ]
};
