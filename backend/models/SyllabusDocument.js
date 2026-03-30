import mongoose from 'mongoose';

const syllabusDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  chapter: {
    type: String,
    required: true,
  },
  examType: {
    type: String,
    enum: ['jee_main', 'jee_advanced', 'neet'],
    required: true,
  },
  tags: [String],
  isProcessed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('SyllabusDocument', syllabusDocumentSchema);
