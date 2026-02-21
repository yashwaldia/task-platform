import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';


export type UserRole = 'admin' | 'manager' | 'user';


export interface IUser extends Document {
  _id:                  mongoose.Types.ObjectId;
  name:                 string;
  email:                string;
  password:             string;
  role:                 UserRole;
  deletedAt:            Date | null;
  passwordResetToken:   string | null;
  passwordResetExpires: Date   | null;
  createdAt:            Date;
  updatedAt:            Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}


const UserSchema = new Schema<IUser>(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [50, 'Name must not exceed 50 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // Never returned in queries by default
    },
    role: {
      type:    String,
      enum:    ['admin', 'manager', 'user'],
      default: 'user',
    },
    deletedAt: {
      type:    Date,
      default: null,
    },
    passwordResetToken: {
      type:    String,
      default: null,
      select:  false, // Never returned in queries
    },
    passwordResetExpires: {
      type:    Date,
      default: null,
      select:  false, // ← FIXED: was missing — caused leakage into task populate responses
    },
  },
  { timestamps: true }
);


// ─── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ role:               1 });
UserSchema.index({ deletedAt:          1 });
UserSchema.index({ passwordResetToken: 1 });


// ─── Pre-Save: Hash Password ──────────────────────────────────────────────────
// Mongoose 9 async middleware: no `next` parameter — return the promise
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, env.BCRYPT_ROUNDS);
});


// ─── Instance Method: Compare Password ───────────────────────────────────────
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};


// ─── Soft Delete Query Filter ─────────────────────────────────────────────────
// Mongoose 9: no `next` in synchronous query middleware
const applySoftDeleteFilter = function (
  this: mongoose.Query<unknown, IUser>
): void {
  const filter = this.getFilter() as Record<string, unknown>;
  if (filter['deletedAt'] === undefined) {
    this.where({ deletedAt: null });
  }
};


UserSchema.pre('find',             applySoftDeleteFilter);
UserSchema.pre('findOne',          applySoftDeleteFilter);
UserSchema.pre('findOneAndUpdate', applySoftDeleteFilter);
UserSchema.pre('countDocuments',   applySoftDeleteFilter);


const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);


export default User;
