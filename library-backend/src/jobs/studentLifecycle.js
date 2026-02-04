const {
  autoSetGraduatesReturnOnlyService,
  autoPromoteStudentsService,
  cleanupGraduatesService,
} = require("../services/student.service");

const runStudentLifecycle = async () => {
  try {
    await autoSetGraduatesReturnOnlyService(new Date());
    await autoPromoteStudentsService(new Date());
    await cleanupGraduatesService(new Date());
  } catch (err) {
    console.error("STUDENT LIFECYCLE ERROR:", err);
  }
};

const startStudentLifecycleJobs = () => {
  runStudentLifecycle();
  const oneDayMs = 24 * 60 * 60 * 1000;
  setInterval(runStudentLifecycle, oneDayMs);
};

module.exports = { startStudentLifecycleJobs };
