
import mongoose from "mongoose";

function dbConnection() {
    const uri = String(process.env.DB_URI) || "";
    const connectionString = `${uri}/${process.env.DB_NAME}`
    if (!connectionString){
          throw new Error("Connection string required "); 
    }
      mongoose
        .connect(connectionString)
        .then(() => {
          console.log("DB connected successfully");
        })
        .catch((error) => {
          console.error("❌ Error in DB Connection:", error.message);
          process.exit(1); 
        });
}

export default dbConnection;