const mongoose = require('mongoose');

const mentorMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'mentor'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    readByUser: {
      type: Boolean,
      default: false,
    },
    readByMentor: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

mentorMessageSchema.index({ mentor: 1, user: 1, createdAt: -1 });
mentorMessageSchema.index({ user: 1, mentor: 1, createdAt: -1 });

module.exports = mongoose.model('MentorMessage', mentorMessageSchema);
