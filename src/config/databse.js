import mongoose from "mongoose";
import config from "./config.js";

async function connectToDb(){
    try{

        await mongoose.connect(config.MONGO_URI)
        console.log("connected to database")

    }catch(err){

        console.log(err)
    }
}

export default connectToDb;