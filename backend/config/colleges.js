const COLLEGES = Object.freeze({
  manit: "college_notes",
  bhu: "bhu",
});

const getDatabaseName = (college) => COLLEGES[college];

module.exports = { COLLEGES, getDatabaseName };
