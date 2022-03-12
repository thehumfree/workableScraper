import mongoose from "mongoose";

const schema = mongoose.Schema({
  logo: String,
  jobTitle: String,
  jobUrl: String,
  time: Date,
  createdAt: Date,
});

const data = mongoose.model("workableJobs", schema);
export default data;
