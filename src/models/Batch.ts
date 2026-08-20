import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const batchSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    maxCapacity: { type: Number, default: 50 },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type BatchDoc = InferSchemaType<typeof batchSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Batch: Model<BatchDoc> =
  models.Batch || mongoose.model<BatchDoc>("Batch", batchSchema);

export default Batch;
