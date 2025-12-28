const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file'],
      default: 'text'
    },

    text: {
      type: String
    },

    media: {
      url: String,
      fileName: String,
      fileSize: Number,
      duration: Number // audio/video
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },

    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date }
      }
    ],

    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
)

// export default mongoose.model('Message', messageSchema)

module.exports = mongoose.model('Message', messageSchema)