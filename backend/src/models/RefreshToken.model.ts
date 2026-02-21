import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRefreshToken extends Document {
  _id:       mongoose.Types.ObjectId;
  userId:    mongoose.Types.ObjectId;
  token:     string; // SHA-256 hash of the raw token
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    token: {
      type:     String,
      required: true,
      unique:   true,
    },
    isRevoked: {
      type:    Boolean,
      default: false,
    },
    expiresAt: {
      type:     Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — MongoDB auto-deletes expired documents
RefreshTokenSchema.index({ expiresAt:           1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId:    1, isRevoked: 1 });

const RefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema
);

export default RefreshToken;
