import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("DataBase Connected");
  } catch (error) {
    console.error("DataBase Error:", error.message);
    throw error;
  }
};

export default connectDb;