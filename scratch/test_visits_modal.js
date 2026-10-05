const fs = require('fs');
const html = fs.readFileSync('./visits.html', 'utf8');

const ids = [
  'filterRep',
  'visitProducts',
  'visitManagersGroup',
  'visitModalTitle',
  'btnSaveVisit',
  'btnCheckMyGps',
  'visitDate',
  'visitTime',
  'visitInsertionMetaContainer',
  'visitInsertionDateDisplay',
  'visitInsertionTimeDisplay',
  'visitComment',
  'visitGiveawaySamples',
  'radioPharmacyLabel',
  'modalTargetFilterSelect',
  'modalTargetFilterLabel',
  'modalTargetFilterContainer',
  'visitTarget',
  'visitTargetLabel',
  'visitModal',
  'visitGpsSection',
  'doubleManagerSection',
  'dayNameDisplay',
  'filterLine'
];

ids.forEach(id => {
  const found = html.includes('id="' + id + '"');
  console.log(id + ':', found ? 'OK' : 'MISSING');
});
