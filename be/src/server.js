const app = require('./app');
const { startScheduledJobs } = require('./jobs/scheduler');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startScheduledJobs();
});
