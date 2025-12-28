const { Server } = require('socket.io')
const Chat = require('./models/Chat')
const Message = require('./models/Message')

module.exports = (server) => {
  const io = new Server(server, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    console.log('🔌 Connected:', socket.id)

    // user personal room
    socket.on('join', (userId) => {
      socket.join(userId)
      console.log(`User joined room ${userId}`)
    })

    // chat room
    socket.on('join_chat', (chatId) => {
      socket.join(chatId)
    })

    // send request
    socket.on('send_request', ({ senderId, receiverId }) => {
      io.to(receiverId).emit('new_request', {
        from: senderId
      })
    })

    // accept request
    socket.on('accept_request', async ({ chat }) => {
      const fullChat = await Chat.findById(chat.chatId)
        .populate('participants', 'name _id')

      console.log('Full chat with participants:', fullChat)

      fullChat.participants.forEach(user => {
        io.to(user._id.toString()).emit('chat_created', fullChat)
      })
    })


    // reject request
    socket.on('reject_request', ({ senderId }) => {
      io.to(senderId).emit('request_rejected')
    })

    // messages
    // socket.on('send_message', ({ chatId, message }) => {
    //   io.to(chatId).emit('new_message', message)
    // })



    // ===== SEND MESSAGE =====
    socket.on('send_message', async ({ chatId, senderId, text }) => {
      const message = await Message.create({
        chatId,
        sender: senderId,
        text
      })

      const payload = {
        _id: message._id,
        chatId,
        senderId,
        text,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      //Emit to chat room (open chat users)
      io.to(chatId.toString()).emit('receive_message', payload)

      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: text,
        lastMessageTime: message.createdAt
      })

      const chat = await Chat.findById(chatId)


      const homePayload = {
        chatId,
        lastMessage: text,
        lastMessageTime: message.createdAt,
        senderId
      }
    

      chat.participants.forEach(userId => {
        io.to(userId.toString()).emit('new_message_home', homePayload)
      })

      chat.participants.forEach(userId => {
        io.to(userId.toString()).emit('receive_message', payload)
      })
    })



    // ========calling ==================
    socket.on('join_call', ({ callId }) => {
      console.log(`Joining call room: ${callId}`)
    socket.join(callId)
  })

  // CALL INIT
  // socket.on('start_call', ({ callId, from, to }) => {
  //   console.log(`Starting call from ${from} to ${to} with callId ${callId}`)
  //   io.to(to).emit('incoming_call', {
  //     callId,
  //     from
  //   })
  // })

  socket.on('start_call', ({ callId, from }) => {
    console.log(`Starting call with callId ${callId} from ${from}`)
  socket.to(callId).emit('incoming_call', { callId, from })
})


  // ACCEPT
  // socket.on('accept_call', ({ callId }) => {
  //   console.log(`Call accepted for callId ${callId}`)
  //   socket.to(callId).emit('call_accepted')
  // })

  // REJECT
  socket.on('reject_call', ({ callId }) => {
    console.log(`Call rejected for callId ${callId}`)
    socket.to(callId).emit('call_rejected')
  })

  // WEBRTC SIGNALS
  // socket.on('offer', data => {
  //   console.log(`Forwarding offer for callId ${data.callId}`)
  //   socket.to(data.callId).emit('offer', data.offer)
  // })

  // socket.on('answer', data => {
  //   console.log(`Forwarding answer for callId ${data.callId}`)
  //   socket.to(data.callId).emit('answer', data.answer)
  // })

  // socket.on('ice_candidate', data => {
  //   console.log(`Forwarding ICE candidate for callId ${data.callId}`)
  //   socket.to(data.callId).emit('ice_candidate', data.candidate)
  // })

  socket.on('accept_call', ({ callId }) => {
    console.log(`Call accepted for callId ${callId}`)
  socket.to(callId).emit('call_accepted')
})

socket.on('offer', ({ callId, offer }) => {
  console.log(`Forwarding offer for callId ${callId}`)
  socket.to(callId).emit('offer', offer)
})



socket.on('answer', ({ callId, answer }) => {
  console.log(`Forwarding answer for callId ${callId}`)
  socket.to(callId).emit('answer', answer)
})

socket.on('ice_candidate', ({ callId, candidate }) => {
  console.log(`Forwarding ICE candidate for callId ${callId}`)
  socket.to(callId).emit('ice_candidate', candidate)
})


  // END CALL
  socket.on('end_call', ({ callId }) => {
    console.log(`Ending call for callId ${callId}`)
    socket.to(callId).emit('call_ended')
  })

    socket.on('disconnect', () => {
      console.log(' Disconnected:', socket.id)
    })
  })
}
