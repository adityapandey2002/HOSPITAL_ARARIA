/*
 * Blood availability — Araria, Bihar
 * Vanilla JS reference implementation. No dependencies, no build step.
 *
 * Data source order: /api/blood/araria → ./sample-data.json.
 * Browsers block fetch() for file:// URLs, so a copy of the snapshot is
 * embedded below as a final fallback for direct-file previews.
 */
(() => {
  "use strict";

  const API_URL = "/api/blood/araria";
  const SAMPLE_URL = "./sample-data.json";
  const FETCH_TIMEOUT_MS = 8000;

  // Keep in sync with sample-data.json. Used only when the file is opened
  // directly and fetch() cannot read local files.
  const EMBEDDED_SAMPLE = {"district":{"name":"Araria","state":"Bihar"},"asOf":"2026-10-30T14:20:51.833Z","sourceAsOf":"2026-10-30T04:55:21.000Z","freshness":"fresh","refreshIntervalMinutes":240,"counts":{"centersListed":3,"centersReporting":2,"centersNoReport":1,"totalUnits":75,"groupsWithStock":8},"centers":[{"id":"284908","name":"Ms Lions Blood Centre Forbesganj Araria","category":"Charitable/Vol","address":"Lee Academy Road, Near Panchmukhi Hanuman Mandir Forbesganj,, Forbesganj, Araria, Bihar","phone":"9031838109","dataMode":"snapshot","sourceEntryAt":"2026-10-30T03:12:20.000Z","fetchedAt":"2026-10-30T14:20:51.833Z","reportStatus":"reporting","totalUnits":51,"groupsWithStock":["A+","B+","O+","AB+"],"groups":[{"code":"A+","label":"A+","totalUnits":13,"hasStock":true,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":13,"status":"in_stock"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"A-","label":"A−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"B+","label":"B+","totalUnits":14,"hasStock":true,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":14,"status":"in_stock"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"B-","label":"B−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"O+","label":"O+","totalUnits":18,"hasStock":true,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":18,"status":"in_stock"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"O-","label":"O−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"AB+","label":"AB+","totalUnits":6,"hasStock":true,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":6,"status":"in_stock"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"AB-","label":"AB−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"Oh+","label":"Oh+","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"Oh-","label":"Oh−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]}]},{"id":"10140","name":"Sadar Hospital Araria","category":"Govt.","address":"gachi tola sadar hospital campus sadar hospital araria, Araria, Araria, Bihar","phone":"9470209932","dataMode":"snapshot","sourceEntryAt":"2026-10-30T04:55:21.000Z","fetchedAt":"2026-10-30T14:20:51.833Z","reportStatus":"reporting","totalUnits":24,"groupsWithStock":["A+","B+","O+","AB+"],"groups":[{"code":"A+","label":"A+","totalUnits":2,"hasStock":true,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":2,"status":"in_stock"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"A-","label":"A−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"B+","label":"B+","totalUnits":7,"hasStock":true,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":7,"status":"in_stock"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"B-","label":"B−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"O+","label":"O+","totalUnits":14,"hasStock":true,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":14,"status":"in_stock"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"O-","label":"O−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"AB+","label":"AB+","totalUnits":1,"hasStock":true,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":1,"status":"in_stock"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"AB-","label":"AB−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"Oh+","label":"Oh+","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]},{"code":"Oh-","label":"Oh−","totalUnits":0,"hasStock":false,"components":[{"code":"whole_blood","name":"Whole Blood","shortName":"WB","units":0,"status":"nil"},{"code":"packed_red_blood_cells","name":"Packed Red Blood Cells","shortName":"PRBC","units":0,"status":"nil"},{"code":"fresh_frozen_plasma","name":"Fresh Frozen Plasma","shortName":"FFP","units":0,"status":"nil"},{"code":"random_donor_platelets","name":"Random Donor Platelets","shortName":"RPLA","units":0,"status":"nil"},{"code":"single_donor_platelet","name":"Single Donor Platelet","shortName":"PLA","units":0,"status":"nil"},{"code":"platelet_concentrate","name":"Platelet Concentrate","shortName":"PC","units":0,"status":"nil"},{"code":"platelet_rich_plasma","name":"Platelet Rich Plasma","shortName":"PRP","units":null,"status":"not_reported"},{"code":"cryoprecipitate","name":"Cryoprecipitate","shortName":"CRYO","units":0,"status":"nil"},{"code":"cryo_poor_plasma","name":"Cryo Poor Plasma","shortName":"CPP","units":0,"status":"nil"},{"code":"plasma","name":"Plasma","shortName":"PLS","units":0,"status":"nil"},{"code":"single_donor_plasma","name":"Single Donor Plasma","shortName":"SDP","units":null,"status":"not_reported"},{"code":"irradiated_rbc","name":"Irradiated RBC","shortName":"IRBC","units":null,"status":"not_reported"},{"code":"leukoreduced_rbc","name":"Leukoreduced RBC","shortName":"LRBC","units":null,"status":"not_reported"},{"code":"sagm_packed_red_blood_cells","name":"SAGM Packed Red Blood Cells","shortName":"SPRBC","units":null,"status":"not_reported"}]}]},{"id":"284905","name":"Ms Lions Blood Centre","category":null,"address":null,"phone":null,"dataMode":null,"sourceEntryAt":null,"fetchedAt":"2026-10-30T14:20:51.833Z","reportStatus":"no_report","totalUnits":null,"groupsWithStock":[],"groups":[]}]};

  const numberFormatter = new Intl.NumberFormat("en-IN");
  const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short"
  });

  const el = {
    app: document.getElementById("app"),
    refresh: document.getElementById("refresh-btn"),
    note: document.getElementById("refresh-note"),
    title: document.getElementById("district-title"),
    headerMeta: document.getElementById("header-meta"),
    freshness: document.getElementById("freshness-slot"),
    footerSync: document.getElementById("footer-sync")
  };

  const state = {
    phase: "loading", // loading | ready | error
    data: null,
    source: null, // api | sample | embedded
    selectedByCentre: new Map(),
    preferredGroup: normalizeGroupCode(readQueryGroup()),
    checkedAt: null,
    note: "",
    error: null
  };

  init();

  function init() {
    if (!el.app || !el.refresh) return;

    el.refresh.addEventListener("click", () => {
      loadData({ refresh: true });
    });
    el.app.addEventListener("click", handleClick);
    el.app.addEventListener("keydown", handleKeydown);

    loadData({ refresh: false });
  }

  /* ---- Loading ---------------------------------------------------------- */

  async function loadData({ refresh }) {
    const hasData = Boolean(state.data && state.phase === "ready");

    if (!hasData) {
      state.note = "";
      showLoading();
    } else if (refresh) {
      state.note = "Refreshing the latest centre report…";
      syncNote();
    }

    setBusy(true);

    try {
      const result = await fetchPayload();
      const wasRefresh = refresh && hasData;

      state.data = result.data;
      state.source = result.source;
      state.phase = "ready";
      state.error = null;
      state.checkedAt = new Date().toISOString();

      seedSelections(result.data, { preserve: wasRefresh });
      state.note = buildNote(result.source, wasRefresh);
      render();
    } catch (error) {
      console.error("Blood availability: unable to load data.", error);
      state.error = error;

      if (hasData) {
        state.phase = "ready";
        state.note = "Couldn’t refresh. Showing the last loaded data.";
        syncNote();
      } else {
        state.phase = "error";
        state.note = "";
        renderError();
      }
    } finally {
      setBusy(false);
    }
  }

  async function fetchPayload() {
    const failures = [];

    if (window.location.protocol !== "file:") {
      try {
        const data = await fetchJSON(API_URL);
        if (isPayload(data)) return { data, source: "api" };
        failures.push("API payload did not match the expected contract.");
      } catch (error) {
        failures.push(`API: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    try {
      const data = await fetchJSON(SAMPLE_URL);
      if (isPayload(data)) return { data, source: "sample" };
      failures.push("Snapshot payload did not match the expected contract.");
    } catch (error) {
      failures.push(
        `Snapshot: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (window.location.protocol === "file:" && isPayload(EMBEDDED_SAMPLE)) {
      return { data: EMBEDDED_SAMPLE, source: "embedded" };
    }

    throw new Error(
      failures.join(" ") || "Blood availability data could not be loaded."
    );
  }

  async function fetchJSON(url) {
    const controller =
      typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller
      ? window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      : null;

    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller ? controller.signal : undefined
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }

      return await response.json();
    } finally {
      if (timer !== null) window.clearTimeout(timer);
    }
  }

  function isPayload(data) {
    return Boolean(
      data &&
        typeof data === "object" &&
        data.district &&
        typeof data.district.name === "string" &&
        Array.isArray(data.centers)
    );
  }

  function showLoading() {
    state.phase = "loading";

    el.freshness.replaceChildren();
    el.headerMeta.innerHTML = `<span class="meta-item"><span class="meta-label">Checked by us:</span> <span class="muted">loading…</span></span>`;
    el.footerSync.innerHTML = `Last synced <span class="muted" aria-label="Not available">—</span>`;
    el.title.textContent = "Araria, Bihar";

    if (!el.app.querySelector(".skeleton-stats")) {
      el.app.innerHTML = skeletonMarkup();
    }

    el.app.setAttribute("aria-busy", "true");
    syncNote();
  }

  function skeletonMarkup() {
    return `
      <div class="skeleton-stats" aria-hidden="true">
        <div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div>
      </div>
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--line"></div>
        <div class="skeleton skeleton--line skeleton--short"></div>
        <div class="skeleton skeleton--tabs"></div>
        <div class="skeleton skeleton--table"></div>
      </div>
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--line skeleton--short"></div>
        <div class="skeleton skeleton--table"></div>
      </div>
      <p class="sr-only" role="status">Loading blood availability…</p>
    `;
  }

  function setBusy(busy) {
    el.refresh.disabled = busy;
    el.refresh.classList.toggle("is-loading", busy);
    el.refresh.setAttribute("aria-busy", String(busy));

    if (state.phase === "loading") {
      el.app.setAttribute("aria-busy", String(busy));
    }
  }

  /* ---- Main render ------------------------------------------------------ */

  function render() {
    const data = state.data;
    if (!data) return;

    const reporting = [];
    const noReport = [];

    data.centers.forEach((centre, index) => {
      const item = { centre, index };
      if (centre.reportStatus === "reporting") reporting.push(item);
      else if (centre.reportStatus === "no_report") noReport.push(item);
    });

    const summary = getSummary(data, reporting);
    const district = districtLabel(data.district);

    el.title.textContent = district;
    document.title = `Blood availability in ${district} · e-RaktKosh`;
    el.freshness.innerHTML = freshnessPill(freshnessOf(data));
    el.headerMeta.innerHTML = `
      <span class="meta-item"><span class="meta-label">Checked by us:</span> ${timeTag(data.asOf)}</span>
      <span class="meta-sep" aria-hidden="true">·</span>
      <span class="meta-item"><span class="meta-label">Centre data as of:</span> ${timeTag(data.sourceAsOf)}</span>
    `;
    el.footerSync.innerHTML = `Last synced ${timeTag(data.asOf)}`;
    el.app.setAttribute("aria-busy", "false");

    el.app.innerHTML = [
      statsMarkup(summary),
      reportingSection(reporting, data.centers.length),
      noReport.length ? noReportSection(noReport) : "",
      coverageSection(data.centers),
      disclaimerMarkup()
    ].join("");

    syncNote();
  }

  function statsMarkup(summary) {
    const stats = [
      {
        value: summary.centresListed,
        singular: "Centre",
        plural: "Centres",
        suffix: "listed"
      },
      {
        value: summary.centresReporting,
        singular: "Centre",
        plural: "Centres",
        suffix: "reporting"
      },
      {
        value: summary.totalUnits,
        singular: "Unit",
        plural: "Units",
        suffix: "available"
      },
      {
        value: summary.groupsWithStock,
        singular: "Group",
        plural: "Groups",
        suffix: "with stock"
      }
    ];

    return `
      <ul class="stats" aria-label="Blood availability at a glance">
        ${stats
          .map(
            (stat) => `
              <li class="stat">
                <span class="stat__value">${formatNumber(stat.value)}</span>
                <span class="stat__label">${esc(
                  statLabel(stat.value, stat.singular, stat.plural, stat.suffix)
                )}</span>
              </li>`
          )
          .join("")}
      </ul>
    `;
  }

  function reportingSection(reporting, centreCount) {
    const body = reporting.length
      ? `<div class="centre-list">${reporting
          .map((item) => centreCard(item.centre, item.index))
          .join("")}</div>`
      : `
        <div class="state-panel state-panel--empty">
          <p class="state-kicker">No reports yet</p>
          <h2>No centre is reporting stock</h2>
          <p>No blood centre in this district has submitted a current stock update. Call a centre in the coverage list below to confirm availability.</p>
        </div>`;

    return `
      <section class="section" aria-labelledby="reporting-heading">
        <div class="section-head">
          <div>
            <h2 id="reporting-heading">Reporting centres</h2>
            <p class="section-sub">Stock by blood group and component, as submitted to e-RaktKosh.</p>
          </div>
          <p class="section-count">${formatNumber(reporting.length)} of ${countLabel(centreCount, "centre")} reporting</p>
        </div>
        ${body}
      </section>
    `;
  }

  function centreCard(centre, index) {
    const groups = groupList(centre);
    const key = centreKey(centre, index);
    const selected =
      matchGroup(groups, state.selectedByCentre.get(key)) ||
      defaultGroup(centre, groups);
    const name = centreName(centre);
    const totalUnits =
      centre.totalUnits === null || centre.totalUnits === undefined
        ? "—"
        : formatNumber(centre.totalUnits);
    const dataMode = centre.dataMode
      ? `<span class="centre-total__meta">${esc(centre.dataMode)}</span>`
      : "";
    const category = centre.category
      ? `<span class="tag">${esc(centre.category)}</span>`
      : "";

    const groupsBlock = groups.length
      ? `
        <div class="group-strip">
          <p class="group-label">
            <span>Blood group</span>
            <span class="group-label__hint">Select a group to see components</span>
          </p>
          <div class="tablist" role="tablist" aria-label="Blood groups at ${esc(name)}" aria-orientation="horizontal">
            ${groups
              .map((group, groupIndex) =>
                tabMarkup(centre, group, index, groupIndex, selected)
              )
              .join("")}
          </div>
        </div>
        <div class="group-panels">
          ${groups
            .map((group, groupIndex) =>
              panelMarkup(centre, group, index, groupIndex, selected)
            )
            .join("")}
        </div>
      `
      : `
        <div class="group-panels">
          <p class="table-legend">No blood-group detail was included in this report.</p>
        </div>
      `;

    return `
      <article class="centre-card" data-centre-card data-centre-key="${esc(key)}" aria-labelledby="centre-name-${index}">
        <header class="centre-header">
          <div class="centre-copy">
            <div class="centre-title-row">
              <h3 class="centre-name" id="centre-name-${index}">${esc(name)}</h3>
              ${category}
            </div>
            ${centre.address ? `<p class="centre-address">${esc(centre.address)}</p>` : ""}
            <p class="centre-contact">
              <span class="contact-label">Phone</span>
              ${phoneLink(centre.phone, name)}
            </p>
            <p class="centre-stamp">
              Centre updated ${timeTag(centre.sourceEntryAt)}
              <span class="stamp-sep" aria-hidden="true">·</span>
              Checked ${timeTag(centre.fetchedAt)}
            </p>
          </div>
          <div class="centre-total">
            <span class="centre-total__value">${totalUnits}</span>
            <span class="centre-total__label">units</span>
            ${dataMode}
          </div>
        </header>
        ${groupsBlock}
      </article>
    `;
  }

  function tabMarkup(centre, group, centreIndex, groupIndex, selected) {
    const groupCode = codeOf(group);
    const isSelected = selected && codeOf(selected) === groupCode;
    const stock = groupHasStock(centre, group);
    const tabId = `tab-${centreIndex}-${groupIndex}`;
    const panelId = `panel-${centreIndex}-${groupIndex}`;

    return `
      <button
        class="tab${stock ? " tab--stock" : ""}"
        type="button"
        role="tab"
        id="${tabId}"
        aria-selected="${isSelected ? "true" : "false"}"
        aria-controls="${panelId}"
        tabindex="${isSelected ? "0" : "-1"}"
        data-group="${esc(groupCode)}"
      >
        <span class="tab__label">${esc(groupLabel(group))}</span>
        <span class="tab__count">${formatNumberOrDash(group.totalUnits)}<span class="sr-only"> units</span></span>
      </button>
    `;
  }

  function panelMarkup(centre, group, centreIndex, groupIndex, selected) {
    const groupCode = codeOf(group);
    const isSelected = selected && codeOf(selected) === groupCode;
    const tabId = `tab-${centreIndex}-${groupIndex}`;
    const panelId = `panel-${centreIndex}-${groupIndex}`;

    return `
      <div
        class="group-panel"
        id="${panelId}"
        role="tabpanel"
        aria-labelledby="${tabId}"
        tabindex="0"
        ${isSelected ? "" : "hidden"}
      >
        <div class="panel-head">
          <h4 class="panel-title"><span class="panel-title__group">${esc(groupLabel(group))}</span> components</h4>
          <p class="panel-summary">${groupSummary(group)}</p>
        </div>
        ${componentTable(centre, group)}
        <p class="table-legend">Nil = the centre reported zero. Not reported = no figure supplied.</p>
      </div>
    `;
  }

  function componentTable(centre, group) {
    const components = Array.isArray(group.components)
      ? group.components
      : [];

    const rows = components.length
      ? components.map(componentRow).join("")
      : `
        <tr class="is-empty" role="row">
          <td colspan="3" role="cell">No component detail supplied for this group.</td>
        </tr>`;

    return `
      <table class="component-table" role="table">
        <caption class="sr-only">${esc(groupLabel(group))} components at ${esc(centreName(centre))}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Component</th>
            <th scope="col" role="columnheader">Units</th>
            <th scope="col" role="columnheader">Status</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          ${rows}
        </tbody>
      </table>
    `;
  }

  function componentRow(component) {
    const status = componentStatus(component);
    const stock = status === "in_stock";
    const name = String(component.name || component.code || "Component");
    const shortName =
      component.shortName && component.shortName !== name
        ? `<span class="component-short" aria-hidden="true">${esc(component.shortName)}</span>`
        : "";

    let unitsCell;
    let statusCell;

    if (status === "not_reported") {
      unitsCell = `<td class="units units--none" role="cell" aria-label="Units not reported"><span aria-hidden="true">—</span></td>`;
      statusCell = `
        <td class="status" role="cell">
          <span class="status-label">
            <span class="status-dot status-dot--missing" aria-hidden="true"></span>
            Not reported
          </span>
        </td>`;
    } else if (stock) {
      unitsCell = `<td class="units" role="cell">${formatNumber(component.units)}</td>`;
      statusCell = `
        <td class="status" role="cell">
          <span class="status-label">
            <span class="status-dot status-dot--stock" aria-hidden="true"></span>
            In stock
          </span>
        </td>`;
    } else {
      unitsCell = `<td class="units" role="cell">${formatNumber(component.units ?? 0)}</td>`;
      statusCell = `
        <td class="status" role="cell">
          <span class="status-label">
            <span class="status-dot status-dot--nil" aria-hidden="true"></span>
            Nil
          </span>
        </td>`;
    }

    return `
      <tr class="${stock ? "is-stock" : ""}" role="row">
        <th scope="row" role="rowheader">${esc(name)}${shortName}</th>
        ${unitsCell}
        ${statusCell}
      </tr>
    `;
  }

  function noReportSection(noReport) {
    return `
      <section class="section" aria-labelledby="no-report-heading">
        <div class="section-head">
          <div>
            <h2 id="no-report-heading">No current stock report</h2>
            <p class="section-sub">Registered centres that have not supplied a current update.</p>
          </div>
          <p class="section-count">${countLabel(noReport.length, "centre")}</p>
        </div>
        <div class="no-report-grid">
          ${noReport
            .map((item) => noReportCard(item.centre))
            .join("")}
        </div>
      </section>
    `;
  }

  function noReportCard(centre) {
    const name = centreName(centre);
    const checked =
      centre.fetchedAt || centre.sourceEntryAt
        ? `<p class="no-report-checked muted">Checked by us: <time datetime="${esc(centre.fetchedAt || centre.sourceEntryAt)}">${esc(formatDate(centre.fetchedAt || centre.sourceEntryAt))}</time></p>`
        : "";

    return `
      <article class="no-report-card">
        <div class="no-report-top">
          <h3 class="no-report-name">${esc(name)}</h3>
          <span class="no-report-units" aria-label="Units not reported">
            <strong>—</strong>
            <span>units</span>
          </span>
        </div>
        <p class="no-report-copy">This centre is registered but has not submitted a stock update. Call to confirm availability.</p>
        <p class="no-report-phone">
          ${
            centre.phone
              ? `<span class="contact-label">Phone</span> ${phoneLink(centre.phone, name)}`
              : `<span class="muted">No phone number listed.</span>`
          }
        </p>
        ${checked}
      </article>
    `;
  }

  function coverageSection(centres) {
    const body = centres.length
      ? `
        <div class="table-card">
          <table class="coverage-table">
            <caption class="sr-only">Coverage and reporting status for every registered centre in the district</caption>
            <thead>
              <tr>
                <th scope="col">Centre</th>
                <th scope="col">Status</th>
                <th scope="col">Groups with stock</th>
                <th scope="col" class="num">Units</th>
                <th scope="col">Phone</th>
              </tr>
            </thead>
            <tbody>
              ${centres.map(coverageRow).join("")}
            </tbody>
          </table>
        </div>
        <ul class="coverage-cards">
          ${centres.map(coverageCard).join("")}
        </ul>
      `
      : `
        <div class="state-panel state-panel--empty">
          <h2>No centres found</h2>
          <p>No blood centres are registered for this district.</p>
        </div>
      `;

    return `
      <section class="section" aria-labelledby="coverage-heading">
        <div class="section-head">
          <div>
            <h2 id="coverage-heading">Coverage across ${esc(districtLabel(state.data.district))}</h2>
            <p class="section-sub">Every registered centre and whether it supplied a current stock update.</p>
          </div>
          <p class="section-count">${countLabel(centres.length, "centre")}</p>
        </div>
        ${body}
      </section>
    `;
  }

  function coverageRow(centre) {
    const name = centreName(centre);
    return `
      <tr>
        <td>
          <span class="coverage-name">${esc(name)}</span>
          ${centre.category ? `<span class="coverage-sub">${esc(centre.category)}</span>` : ""}
        </td>
        <td>${statusPill(centre.reportStatus)}</td>
        <td>${groupsText(centre)}</td>
        <td class="num">${unitsText(centre)}</td>
        <td>${phoneLink(centre.phone, name)}</td>
      </tr>
    `;
  }

  function coverageCard(centre) {
    const name = centreName(centre);
    return `
      <li class="coverage-card">
        <div class="coverage-card__head">
          <div>
            <h3 class="coverage-card__name">${esc(name)}</h3>
            ${centre.category ? `<p class="coverage-card__category">${esc(centre.category)}</p>` : ""}
          </div>
          ${statusPill(centre.reportStatus)}
        </div>
        <dl class="coverage-card__facts">
          <div>
            <dt>Units</dt>
            <dd>${unitsText(centre)}</dd>
          </div>
          <div>
            <dt>Groups with stock</dt>
            <dd>${groupsText(centre)}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>${phoneLink(centre.phone, name)}</dd>
          </div>
        </dl>
      </li>
    `;
  }

  function statusPill(status) {
    const reporting = status === "reporting";
    return `
      <span class="status-pill status-pill--${reporting ? "reporting" : "no-report"}">
        <span class="status-dot status-dot--${reporting ? "stock" : "nil"}" aria-hidden="true"></span>
        ${reporting ? "Reporting" : "No report"}
      </span>
    `;
  }

  function groupsText(centre) {
    if (centre.reportStatus !== "reporting") return dash();
    const groups = Array.isArray(centre.groupsWithStock)
      ? centre.groupsWithStock
      : [];
    if (!groups.length) return `<span class="muted">None</span>`;
    return groups.map((group) => esc(group)).join(", ");
  }

  function unitsText(centre) {
    if (centre.reportStatus !== "reporting") return dash();
    if (centre.totalUnits === null || centre.totalUnits === undefined) {
      return dash();
    }
    return formatNumber(centre.totalUnits);
  }

  function disclaimerMarkup() {
    return `
      <aside class="disclaimer" aria-label="Data disclaimer">
        <p><strong>Call before you travel.</strong> Availability is self-reported by blood centres to e-RaktKosh and may be out of date. This page is not medical advice.</p>
      </aside>
    `;
  }

  function renderError() {
    el.freshness.replaceChildren();
    el.headerMeta.innerHTML = `<span class="meta-item"><span class="meta-label">Checked by us:</span> <span class="muted">unavailable</span></span>`;
    el.footerSync.innerHTML = `Last synced <span class="muted" aria-label="Not available">—</span>`;
    el.app.setAttribute("aria-busy", "false");
    el.app.innerHTML = `
      <section class="state-panel" role="alert" aria-labelledby="load-error-heading">
        <p class="state-kicker">Connection problem</p>
        <h2 id="load-error-heading">We couldn’t load blood availability</h2>
        <p>Neither the live service nor the bundled snapshot could be read. Check your connection and try again.</p>
        <div class="state-actions">
          <button class="button" type="button" data-action="retry">Retry</button>
        </div>
      </section>
    `;
    syncNote();
  }

  /* ---- Tabs & query state ----------------------------------------------- */

  function handleClick(event) {
    if (!(event.target instanceof Element)) return;

    const retry = event.target.closest('[data-action="retry"]');
    if (retry) {
      loadData({ refresh: false });
      return;
    }

    const tab = event.target.closest('[role="tab"][data-group]');
    if (!tab) return;

    const card = tab.closest("[data-centre-card]");
    if (!card) return;

    activateTab(card, tab.dataset.group, false);
  }

  function handleKeydown(event) {
    if (!(event.target instanceof Element)) return;

    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;

    const tablist = tab.closest('[role="tablist"]');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(tab);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();

    const nextTab = tabs[nextIndex];
    if (!nextTab) return;

    const card = nextTab.closest("[data-centre-card]");
    if (!card) return;

    activateTab(card, nextTab.dataset.group, true);
  }

  function activateTab(card, groupCode, moveFocus) {
    const tabs = Array.from(card.querySelectorAll('[role="tab"][data-group]'));
    const target = tabs.find((tab) => tab.dataset.group === groupCode);
    if (!target) return;

    tabs.forEach((tab) => {
      const selected = tab === target;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;

      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = !selected;
    });

    const key = card.getAttribute("data-centre-key");
    if (key) state.selectedByCentre.set(key, groupCode);

    state.preferredGroup = normalizeGroupCode(groupCode);
    updateGroupParam(groupCode);

    if (moveFocus) target.focus();
  }

  function updateGroupParam(groupCode) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("group", groupCode);
      window.history.replaceState(null, "", url.href);
    } catch (error) {
      // file:// and sandboxed frames can refuse history updates.
    }
  }

  function readQueryGroup() {
    try {
      return new URLSearchParams(window.location.search).get("group");
    } catch (error) {
      return null;
    }
  }

  function seedSelections(data, { preserve }) {
    const next = new Map();

    data.centers.forEach((centre, index) => {
      if (centre.reportStatus !== "reporting") return;

      const groups = groupList(centre);
      if (!groups.length) return;

      const key = centreKey(centre, index);
      const prior = preserve ? state.selectedByCentre.get(key) : null;
      const choice =
        matchGroup(groups, prior) ||
        matchGroup(groups, state.preferredGroup) ||
        defaultGroup(centre, groups);

      if (choice) next.set(key, codeOf(choice));
    });

    state.selectedByCentre = next;
  }

  function matchGroup(groups, value) {
    if (!value) return null;
    const normalized = normalizeGroupCode(value);

    return (
      groups.find(
        (group) =>
          normalizeGroupCode(codeOf(group)) === normalized ||
          normalizeGroupCode(groupLabel(group)) === normalized
      ) || null
    );
  }

  function defaultGroup(centre, groups) {
    if (!groups.length) return null;
    return groups.find((group) => groupHasStock(centre, group)) || groups[0];
  }

  function groupHasStock(centre, group) {
    if (group.hasStock === true) return true;

    const listed = Array.isArray(centre.groupsWithStock)
      ? centre.groupsWithStock
      : [];
    const normalized = normalizeGroupCode(codeOf(group));
    if (
      listed.some((value) => normalizeGroupCode(value) === normalized)
    ) {
      return true;
    }

    const units = Number(group.totalUnits);
    return Number.isFinite(units) && units > 0;
  }

  function normalizeGroupCode(value) {
    if (value === null || value === undefined) return null;

    let code = String(value).trim().toUpperCase().replace(/\s+/g, "");
    code = code
      .replace(/\+VE$/, "+")
      .replace(/-VE$/, "-")
      .replace(/POS$/, "+")
      .replace(/NEG$/, "-");

    return code || null;
  }

  /* ---- Small helpers ---------------------------------------------------- */

  function getSummary(data, reporting) {
    const counts = data.counts || {};
    const centres = Array.isArray(data.centers) ? data.centers : [];
    const derivedGroups = new Set();
    let derivedUnits = 0;

    reporting.forEach(({ centre }) => {
      const units = Number(centre.totalUnits);
      if (Number.isFinite(units)) derivedUnits += units;

      if (Array.isArray(centre.groupsWithStock)) {
        centre.groupsWithStock.forEach((group) => {
          derivedGroups.add(normalizeGroupCode(group) || String(group));
        });
      }
    });

    const derivedNoReport = centres.filter(
      (centre) => centre.reportStatus === "no_report"
    ).length;

    return {
      centresListed: numberOr(counts.centersListed, centres.length),
      centresReporting: numberOr(counts.centersReporting, reporting.length),
      centresNoReport: numberOr(counts.centersNoReport, derivedNoReport),
      totalUnits: numberOr(counts.totalUnits, derivedUnits),
      groupsWithStock: numberOr(counts.groupsWithStock, derivedGroups.size)
    };
  }

  function numberOr(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function groupList(centre) {
    if (!Array.isArray(centre.groups)) return [];
    return centre.groups.filter(
      (group) =>
        group &&
        typeof group === "object" &&
        (group.code !== undefined || group.label !== undefined)
    );
  }

  function codeOf(group) {
    return String(group.code ?? group.label ?? "");
  }

  function groupLabel(group) {
    return String(group.label || group.code || "—");
  }

  function groupSummary(group) {
    const components = Array.isArray(group.components)
      ? group.components
      : [];
    const inStock = components.filter(
      (component) => componentStatus(component) === "in_stock"
    ).length;

    if (group.totalUnits === null || group.totalUnits === undefined) {
      return "Units not reported";
    }

    const total = Number(group.totalUnits);
    const unitLabel = total === 1 ? "unit" : "units";
    const stockLabel = inStock
      ? `${formatNumber(inStock)} of ${formatNumber(components.length)} in stock`
      : "none in stock";

    return `${formatNumber(total)} ${unitLabel} · ${stockLabel}`;
  }

  function componentStatus(component) {
    const raw = String(component.status || "").toLowerCase();
    const units =
      component.units === null || component.units === undefined
        ? null
        : Number(component.units);

    if (raw === "not_reported" || raw === "not reported") {
      return "not_reported";
    }

    if (raw === "in_stock" || raw === "in stock") {
      return units !== null && Number.isFinite(units) && units > 0
        ? "in_stock"
        : "nil";
    }

    if (raw === "nil") return "nil";

    if (units === null || !Number.isFinite(units)) return "not_reported";
    return units > 0 ? "in_stock" : "nil";
  }

  function freshnessOf(data) {
    const raw = String(data.freshness || "").toLowerCase();
    if (raw === "fresh" || raw === "aging" || raw === "stale") return raw;

    const checked = Date.parse(data.asOf) || Date.now();
    const source = Date.parse(data.sourceAsOf);
    if (!Number.isFinite(source)) return "stale";

    const hours = Math.max(0, (checked - source) / 3600000);
    if (hours <= 6) return "fresh";
    if (hours <= 24) return "aging";
    return "stale";
  }

  function freshnessPill(freshness) {
    const label = freshness.charAt(0).toUpperCase() + freshness.slice(1);
    return `
      <span class="pill pill--${freshness}" aria-label="Data freshness: ${label}" title="Freshness of the newest centre update">
        <span class="pill__dot" aria-hidden="true"></span>
        ${label}
      </span>
    `;
  }

  function buildNote(source, refreshed) {
    const updated = timeTag(state.checkedAt);

    if (source === "api") {
      return refreshed ? `Updated ${updated}` : "";
    }

    if (source === "sample") {
      return refreshed
        ? `Live API unavailable — showing the bundled sample snapshot. Updated ${updated}`
        : "Live API unavailable — showing the bundled sample snapshot.";
    }

    return refreshed
      ? `Local preview — showing the bundled sample snapshot. Updated ${updated}`
      : "Local preview — showing the bundled sample snapshot.";
  }

  function syncNote() {
    el.note.innerHTML = state.note;
  }

  function centreName(centre) {
    return String(centre.name || "Unnamed centre");
  }

  function centreKey(centre, index) {
    if (centre.id !== null && centre.id !== undefined && centre.id !== "") {
      return `id:${centre.id}`;
    }
    return `index:${index}`;
  }

  function districtLabel(district) {
    if (!district) return "Araria, Bihar";
    const name = district.name ? String(district.name) : "";
    const stateName = district.state ? String(district.state) : "";
    if (name && stateName) return `${name}, ${stateName}`;
    return name || stateName || "Araria, Bihar";
  }

  function countLabel(count, noun) {
    return `${formatNumber(count)} ${noun}${Number(count) === 1 ? "" : "s"}`;
  }

  function statLabel(count, singular, plural, suffix) {
    const noun = Number(count) === 1 ? singular : plural;
    return `${noun} ${suffix}`;
  }

  function phoneLink(phone, label) {
    const href = telHref(phone);
    if (!href) return `<span class="muted">Not listed</span>`;

    return `<a class="phone-link" href="${esc(href)}" aria-label="Call ${esc(label)} on ${esc(phone)}">${esc(phone)}</a>`;
  }

  function telHref(phone) {
    if (!phone) return null;
    const cleaned = String(phone).replace(/[^\d+]/g, "");
    return cleaned.length >= 3 ? `tel:${cleaned}` : null;
  }

  function dash() {
    return `<span class="muted" aria-label="Not reported">—</span>`;
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return numberFormatter.format(number);
  }

  function formatNumberOrDash(value) {
    if (value === null || value === undefined || value === "") return "—";
    return formatNumber(value);
  }

  function formatTimestamp(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `${dateFormatter.format(date)} IST`;
  }

  function timeTag(value) {
    const label = formatTimestamp(value);
    if (!label) {
      return `<span class="muted" aria-label="Not available">—</span>`;
    }
    return `<time datetime="${esc(value)}">${esc(label)}</time>`;
  }

  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[character]
    );
  }
})();
