import Content from '../models/Content.js';

const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

export const getAllContent = async () => {
  const rows = await Content.find().sort({ key: 1 }).lean();
  return rows;
};

// Convenience map { key: value } for the admin editor's initial state.
export const getContentMap = async () => {
  const rows = await getAllContent();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
};

// Public read used by marketing pages. Returns null when the admin has
// never customized this block — the client then renders its code defaults.
export const getContent = async (key) => {
  const row = await Content.findOne({ key }).lean();
  return row ? row.value : null;
};

// Upsert one content block. value === null clears the block (back to defaults).
export const setContent = async (key, value) => {
  const cleanKey = String(key ?? '').trim();
  if (!cleanKey) throw fail('Content key is required', 400);
  if (value === null || value === undefined || value === '') {
    await Content.deleteOne({ key: cleanKey });
    return null;
  }
  await Content.updateOne({ key: cleanKey }, { $set: { value } }, { upsert: true });
  return value;
};