import dotenv from "dotenv";
import connectDB from "./db/db.js";
import app from "./app.js";

dotenv.config(
    {
        path: "./env"
    }
);

const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        });
    })
    .catch((err) => {
        console.log("mongodb connection failed", err)
    });


