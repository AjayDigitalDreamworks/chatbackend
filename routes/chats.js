const express = require('express')
const Chat = require('../models/Chat')
const Message = require('../models/Message')

const router = express.Router()


router.post('/:chatId/read', async (req, res) => {
  const chat = await Chat.findById(req.params.chatId)
  chat.unreadCount = 0
  await chat.save()
  res.sendStatus(200)
})


// GET chats for logged-in user
// router.get('/:userId', async (req, res) => {
//   try {
//     const chats = await Chat.find({
//       participants: req.params.userId
//     })
//       .populate('participants', 'name email')
//       .sort({ updatedAt: -1 })

//     res.json(chats)
//   } catch (err) {
//     res.status(500).json({ message: err.message })
//   }
// })

router.get('/:chatId', async (req, res) => {
  const messages = await Message.find({ chatId: req.params.chatId })
    .sort({ createdAt: 1 })

  res.json(messages)
})


module.exports = router
