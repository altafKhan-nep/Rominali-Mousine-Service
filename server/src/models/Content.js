import mongoose from 'mongoose';

// CMS content blocks (home hero, services, fleet cards, etc.).
// key = stable document name, value = arbitrary JSON the marketing site
// merges over its code-defaults so the site never breaks on empty data.
const contentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const Content = mongoose.model('Content', contentSchema);
export default Content;