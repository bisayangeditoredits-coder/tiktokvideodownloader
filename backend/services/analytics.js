/**
 * In-memory Analytics Service
 * Resets on server restart — no database, no user data stored.
 */

const stats = {
  total: 0,
  success: 0,
  errors: 0,
  today: 0,
  startTime: Date.now(),
  _dayStart: _startOfDay(),
};

function _startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function _checkDayRollover() {
  if (Date.now() >= stats._dayStart + 86_400_000) {
    stats.today = 0;
    stats._dayStart = _startOfDay();
  }
}

function increment(type = 'success') {
  _checkDayRollover();
  stats.total++;
  if (type === 'success') { stats.success++; stats.today++; }
  else stats.errors++;
}

function getStats() {
  _checkDayRollover();
  return {
    total: stats.total,
    success: stats.success,
    errors: stats.errors,
    today: stats.today,
    uptime: Math.floor((Date.now() - stats.startTime) / 1000),
    successRate: stats.total > 0
      ? `${((stats.success / stats.total) * 100).toFixed(1)}%`
      : '0%',
  };
}

module.exports = { increment, getStats };
