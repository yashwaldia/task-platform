import mongoose, { Document, Schema, Model } from 'mongoose';

export type TaskStatus   = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low'  | 'medium'       | 'high';

export interface ITask extends Document {
  _id:         mongoose.Types.ObjectId;
  title:       string;
  description: string;
  status:      TaskStatus;
  priority:    TaskPriority;
  assignedTo:  mongoose.Types.ObjectId;
  createdBy:   mongoose.Types.ObjectId;
  dueDate:     Date | null;
  deletedAt:   Date | null;
  createdAt:   Date;
  updatedAt:   Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type:      String,
      required:  [true, 'Task title is required'],
      trim:      true,
      minlength: [3,   'Title must be at least 3 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default:   '',
    },
    status: {
      type:    String,
      enum:    ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high'],
      default: 'medium',
    },
    assignedTo: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'assignedTo is required'],
    },
    createdBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'createdBy is required'],
    },
    dueDate: {
      type:    Date,
      default: null,
    },
    deletedAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ createdBy:  1 });
TaskSchema.index({ status:     1 });
TaskSchema.index({ priority:   1 });
TaskSchema.index({ deletedAt:  1 });
TaskSchema.index({ createdAt: -1 });

// ─── Soft Delete Query Filter ─────────────────────────────────────────────────
// Mongoose 9: no `next` in synchronous query middleware — just return
const applySoftDeleteFilter = function (
  this: mongoose.Query<unknown, ITask>
): void {
  const filter = this.getFilter() as Record<string, unknown>;
  if (filter['deletedAt'] === undefined) {
    this.where({ deletedAt: null });
  }
};

TaskSchema.pre('find',             applySoftDeleteFilter);
TaskSchema.pre('findOne',          applySoftDeleteFilter);
TaskSchema.pre('findOneAndUpdate', applySoftDeleteFilter);
TaskSchema.pre('countDocuments',   applySoftDeleteFilter);

const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);

export default Task;
