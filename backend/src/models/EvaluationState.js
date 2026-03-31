const mongoose = require('mongoose');

const evaluationStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    sessions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    activeSessionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('EvaluationState', evaluationStateSchema);
