import mongoose from "mongoose";

const schema = mongoose.Schema(
  {
    logo: String,
    jobTitle: String,
    jobUrl: String,
    jobApplicationLink: String,
    jobDescription: String,
    companyName: String,
    expire_at: {type: Date, default: Date.now, expires: 604800}
  },
  
);

const data = mongoose.model("workableJobs", schema);
export default data;
