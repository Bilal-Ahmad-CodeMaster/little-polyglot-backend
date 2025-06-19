import mongoose from "mongoose";
const PackageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  durationInMinutes: { type: String, required: true },
  totalClasses: { type: Number, required: true },
  pricePerMonth: { type: Number, required: true },
  materialsFee: { type: Number, required: true },
});

const GroupSchema = new mongoose.Schema({
  label: { type: String, required: true },
  packages: [PackageSchema],
});

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
    googleLocation: {
      type: String,
      required: true,
    },
    priceList: [
      {
        groups: [GroupSchema],
      },
    ],
    branchContactDetails: {
      branchName: { type: String, required: true },
      phone: { type: String, required: true },
      branchLocation: { type: String, required: true },
      googleLocation: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
    },
    schoolDetail: {
      title: { type: String, required: true },
      description: { type: String, required: true },
      extraDescription: { type: String, required: true },
      googleLocation: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      contactNo: { type: String, required: true },
      headquarterLocation: { type: String, required: true },
    },
    BranchEvents: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        date: { type: Date, required: true },
        extraDescription: { type: String, required: true },
      },
    ],
    franchiseDetails: {
      name: { type: String, required: true },
      Address: { type: String, required: true },
      TaxIdentificationNumber: { type: Number, required: true },
      REGONNumber: { type: Number, required: true },
      KRSNo: { type: Number, required: true },
   
    },

    videosGallery: [
      {
        title: { type: String, required: true },
        videoUrl: { type: String, required: true },
      },
    ],
    imagesGallery: [
      {
        title: { type: String, required: true },
        imageUrl: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SchoolBranch = mongoose.model("SchoolBranch", schoolBranchSchema);

export default SchoolBranch;
