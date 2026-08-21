// One-time migration: tags existing course packages that don't yet have a
// `language` value with a default, so the site can start showing language
// badges (American English / British English / Polish) immediately.
//
// All packages created before this feature existed are assumed to be
// "british_english" (the language the school taught before this change).
// You can re-tag any of them afterwards from the Admin Panel.
//
// Usage (from the little-polyglot-backend folder, with your real .env in place):
//   node scripts/backfill-package-language.js
//
// Optional: pass a different default, e.g.
//   node scripts/backfill-package-language.js american_english

import "dotenv/config.js";
import mongoose from "mongoose";
import SchoolBranch from "../models/schoolsBranches.model.js";

const VALID_LANGUAGES = ["american_english", "british_english", "polish"];
const defaultLanguage = process.argv[2] || "british_english";

if (!VALID_LANGUAGES.includes(defaultLanguage)) {
  console.error(
    `Invalid language "${defaultLanguage}". Use one of: ${VALID_LANGUAGES.join(", ")}`
  );
  process.exit(1);
}

async function run() {
  const uri = String(process.env.DB_URI) || "";
  const connectionString = `${uri}/${process.env.DB_NAME}`;
  await mongoose.connect(connectionString);
  console.log("DB connected. Backfilling package language ->", defaultLanguage);

  const branches = await SchoolBranch.find({});
  let updatedBranches = 0;
  let updatedPackages = 0;

  for (const branch of branches) {
    let touched = false;
    for (const priceItem of branch.priceList || []) {
      for (const group of priceItem.groups || []) {
        for (const pkg of group.packages || []) {
          if (!pkg.language) {
            pkg.language = defaultLanguage;
            touched = true;
            updatedPackages += 1;
          }
        }
      }
    }
    if (touched) {
      await branch.save();
      updatedBranches += 1;
    }
  }

  console.log(
    `Done. Updated ${updatedPackages} package(s) across ${updatedBranches} branch(es).`
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
