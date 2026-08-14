import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import User from "./src/models/User";

// Load environment variables from .env file
dotenv.config();

const seedAdmin = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in the environment variables.");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected successfully.");

    const email = "admin@wiseeast.edu";
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
    } else {
      console.log("Hashing password...");
      const hashedPassword = await bcrypt.hash("Admin@2026", 10);

      console.log("Creating admin user...");
      // The role defined in your schema for admins is 'super_admin'
      await User.create({
        name: "System Admin",
        firstName: "System",
        lastName: "Admin",
        email: email,
        password: hashedPassword,
        role: "super_admin",
        status: "active",
        isActivated: true
      });

      console.log("Admin user created successfully.");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
