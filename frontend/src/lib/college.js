export const COLLEGE_STORAGE_KEY = "selectedCollege";
export const DEFAULT_COLLEGE = "manit";

// Add a college here and in backend/config/colleges.js to make it selectable.
export const COLLEGES = Object.freeze({
  manit: { id: "manit", name: "MANIT", marketplaceName: "MANIT Mart", emailDomain: "manit.ac.in", location: "Bhopal" },
  bhu: { id: "bhu", name: "BHU", marketplaceName: "BHU Mart", emailDomain: "bhu.ac.in", location: "Varanasi" },
});

export const getSelectedCollege = () => {
  const id = localStorage.getItem(COLLEGE_STORAGE_KEY);
  return COLLEGES[id] ? id : DEFAULT_COLLEGE;
};

export const getCollege = () => COLLEGES[getSelectedCollege()];
export const collegeOptions = Object.values(COLLEGES);
