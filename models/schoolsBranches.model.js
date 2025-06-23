import mongoose from "mongoose";
const PackageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  durationInMinutes: { type: String, required: true },
  totalClasses: { type: String, required: true },
  pricePerMonth: { type: String, required: true },
  materialsFee: { type: String, required: true },
});

const GroupSchema = new mongoose.Schema({
  label: { type: String, required: true },
  packages: [PackageSchema],
});

const schoolBranchSchema = mongoose.Schema(
  {
    region: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    annotation: {
      type: String,
      required: false,
    },
    schoolName: {
      type: String,
      required: true,
    },

    contactInfo: {
      headmaster: {
        email: { type: String, required: true },
        location: { type: String, required: true },
        phone: { type: String, required: true },
      },
      headquarter: {
        email: { type: String, required: true },
        location: { type: String, required: true },
        phone: { type: String, required: true },
      },
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
    imageGalleryAboutUsDescription: { type: String, required: true },

    extraInfoModal: [
      {
        type: String,
        required: false,
      },
    ],

    schoolDetail: {
      titleToShowBranchFor: { type: String, required: true },
      branchName: { type: String, required: true },
      description: { type: String, required: true },
      extraDescription: { type: String, required: true },
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
      TaxIdentificationString: { type: String, required: true },
      REGONString: { type: String, required: true },
      KRSNo: { type: String, required: true },
    },
    SEOBaseAdditionalInfo: [
      {
        title: { type: String, required: true },
        subTittle: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SchoolBranch = mongoose.model("SchoolBranch", schoolBranchSchema);

export default SchoolBranch;
