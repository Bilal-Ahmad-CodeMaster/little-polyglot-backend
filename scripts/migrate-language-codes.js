// One-time migration: remaps legacy package language codes to the new
// English / Spanish / German set.
//
// Mapping:
//   american_english -> english
//   british_english  -> english
//   polish           -> spanish
//
// Usage (from the little-polyglot-backend folder, with your real .env in place):
//   node scripts/migrate-language-codes.js

import "dotenv/config.js";
import mongoose from "mongoose";
import SchoolBranch from "../models/schoolsBranches.model.js";

const LEGACY_TO_NEW = {
  american_english: "english",
  british_english: "english",
  polish: "spanish",
};

async function run() {
  const uri = String(process.env.DB_URI) || "";
  const connectionString = `${uri}/${process.env.DB_NAME}`;
  await mongoose.connect(connectionString);
  console.log("DB connected. Migrating legacy language codes...");

  const branches = await SchoolBranch.find({});
  let updatedBranches = 0;
  let updatedPackages = 0;

  for (const branch of branches) {
    let touched = false;
    for (const priceItem of branch.priceList || []) {
      for (const group of priceItem.groups || []) {
        for (const pkg of group.packages || []) {
          const mapped = LEGACY_TO_NEW[pkg.language];
          if (mapped) {
            pkg.language = mapped;
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
    `Done. Remapped ${updatedPackages} package(s) across ${updatedBranches} branch(es).`
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
