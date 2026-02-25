import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
    },
  },
  { timestamps: true }
);

adminUserSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

adminUserSchema.methods.matchesPassword = async function comparePassword(
  plainText
) {
  return bcrypt.compare(plainText, this.password);
};

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

export default AdminUser;
