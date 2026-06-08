/**
 * In-memory settings cache.
 * Loaded on server start, invalidated on every settings write.
 * Avoids hitting the DB on every request that needs a business number.
 */

let cache = {};

const Setting = require('../../models/Setting');

/**
 * Load all settings from DB into memory.
 */
async function load() {
  const rows = await Setting.find({});
  cache = {};
  rows.forEach((row) => {
    cache[row.setting_key] = {
      value: row.setting_value,
      group: row.setting_group,
    };
  });
}

/**
 * Get a single setting value by key.
 * Returns null if key doesn't exist or value is NULL.
 */
function get(key) {
  return cache[key] ? cache[key].value : null;
}

/**
 * Get all settings as a flat { key: value } map.
 */
function getAll() {
  const result = {};
  Object.entries(cache).forEach(([key, data]) => {
    result[key] = data.value;
  });
  return result;
}

/**
 * Get settings for a specific group as a flat { key: value } map.
 */
function getByGroup(group) {
  const result = {};
  Object.entries(cache).forEach(([key, data]) => {
    if (data.group === group) {
      result[key] = data.value;
    }
  });
  return result;
}

/**
 * Check which groups have incomplete (NULL) settings.
 * Returns an array of group names with at least one NULL value.
 */
function getIncompleteGroups() {
  const groupStatus = {};
  Object.entries(cache).forEach(([key, data]) => {
    if (!groupStatus[data.group]) {
      groupStatus[data.group] = { total: 0, filled: 0 };
    }
    groupStatus[data.group].total++;
    if (data.value !== null && data.value !== '') {
      groupStatus[data.group].filled++;
    }
  });

  return Object.entries(groupStatus)
    .filter(([, status]) => status.filled < status.total)
    .map(([group, status]) => ({
      group,
      filled: status.filled,
      total: status.total,
    }));
}

/**
 * Invalidate cache by reloading from DB.
 * Call this after any settings write.
 */
async function invalidate() {
  await load();
}

module.exports = { load, get, getAll, getByGroup, getIncompleteGroups, invalidate };
