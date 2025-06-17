import mongoose from "mongoose";
const schoolBranchSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SchoolBranch = mongoose.model("SchoolBranch", schoolBranchSchema);

export default SchoolBranch;
