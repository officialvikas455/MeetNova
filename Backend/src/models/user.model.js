import mongoose, { Schema } from "mongoose";

const userScheme = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  email: { type: String },
  googleId: { type: String },
  picture: { type: String },
  token: { type: String },
});

const User = mongoose.model("User", userScheme);

export { User };
