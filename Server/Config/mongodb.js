import mongoose  from "mongoose";
mongoose.connection.on('connected', ()=> console.log("Databse Connected"));

const connectDB = async ()=>{
    await mongoose.connect(`${process.env.MONGODB_URL}/MindEase`)
}
export default connectDB;