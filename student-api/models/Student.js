// models/Student.js
const { Schema, model } = require('mongoose');

const studentSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, trim: true, lowercase: true, unique: true },
    cohort:    { type: String, trim: true, default: null },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false
  }
);

// Helpful index for fast lookups by email
studentSchema.index({ email: 1 }, { unique: true });

module.exports = model('Student', studentSchema);
