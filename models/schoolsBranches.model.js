import mongoose from "mongoose";
const PackageSchema = new mongoose.Schema({
  title: { type: String},
  description: { type: String},
  duration: { type: String},
  durationInMinutes: { type: String},
  totalClasses: { type: String},
  pricePerMonth: { type: String},
  materialsFee: { type: String},
});

const GroupSchema = new mongoose.Schema({
  label: { type: String},
  packages: [PackageSchema],
});

const schoolBranchSchema = mongoose.Schema(
  {
    region: {
      type: String,
    },
    city: {
      type: String,
    },
    annotation: {
      type: String,
      required: false,
    },
    schoolName: {
      type: String,
    },
    streetAddress: { type: String },
    contactInfo: {
      headmaster: {
        email: { type: String },
        location: { type: String },
        phone: { type: String },
      },
      headquarter: {
        email: { type: String },
        location: { type: String },
        phone: { type: String },
      },
    },

    googleLocation: {
      type: String,
    },

    priceList: [
      {
        groups: [GroupSchema],
      },
    ],
    videosGallery: [
      {
        title: { type: String },
        videoUrl: { type: String },
      },
    ],
    imagesGallery: [
      {
        title: { type: String },
        imageUrl: { type: String },
      },
    ],
    imageGalleryAboutUsDescription: { type: String },

    extraInfoModal: [
      {
        type: String,
        required: false,
      },
    ],

    schoolDetail: {
      titleToShowBranchFor: { type: String },
      branchName: { type: String },
      description: { type: String },
      extraDescription: { type: String },
    },
    BranchEvents: [
      {
        title: { type: String },
        description: { type: String },
        date: { type: Date },
        extraDescription: { type: String },
      },
    ],
    franchiseDetails: {
      name: { type: String },
      Address: { type: String },
      TaxIdentification: { type: Number },
      REGON: { type: Number },
      KRSNo: { type: Number },
    },
    SEOBaseAdditionalInfo: [
      {
        title: { type: String },
        subTittle: { type: String },
        description: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SchoolBranch = mongoose.model("SchoolBranch", schoolBranchSchema);

export default SchoolBranch;
