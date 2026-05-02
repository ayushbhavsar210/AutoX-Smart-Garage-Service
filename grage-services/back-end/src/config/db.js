import mongoose from "mongoose";

const MONGO_URI =
  "mongodb+srv://ayushbhavsar70_db_user:Ayush2334@autox.hvhejny.mongodb.net";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;