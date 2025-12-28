const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendOTP = require('../utils/nodemailer');
const Otp = require('../models/otp');
const Chat = require('../models/Chat');
const auth = require('../middleware/authMid');
const FriendRequest = require('../models/Requests'); 


// =================== OTP send =====================

router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpEntry = new Otp({ email, code: otpCode, createdAt: Date.now() });
    try {
        
        await otpEntry.save();
        await sendOTP(email, otpCode);

        console.log(`OTP for ${email}: ${otpCode}`);
        res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.error(err);
    }
})

// ==================== OTP Verification =====================
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const code = otp;
  console.log(`Verifying OTP for ${email} with code ${code}`);

  try {
    const otpEntry = await Otp.findOne({ email, code });
    console.log(otpEntry);
    if (!otpEntry) {
      console.log(`OTP not found for ${email} with code ${code}`);
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const otpAge = Date.now() - otpEntry.createdAt;
    if (otpAge > 10 * 60 * 1000) {
      await Otp.deleteOne({ _id: otpEntry._id });
      return res.status(400).json({ error: 'OTP expired' });
    }

    // OTP used → delete
    await Otp.deleteOne({ _id: otpEntry._id });

    // ✅ FIND OR CREATE USER
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        isProfileComplete: false
      });
    }

    // ✅ CREATE TOKEN
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ SEND TOKEN + USER
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        isProfileComplete: user.isProfileComplete
      }
    });

    console.log(`OTP verified for ${token}`);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
    console.error(err);
  }
});

// ===================== Register =====================
const JWT_SECRET = process.env.JWT_SECRET || "yadavji";

// ---------------- Update User Details ----------------
router.post("/user-details", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Received token:", token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const {
      name,
      educationType,
      schoolClass,
      collegeStream,
      collegeYear,
    } = req.body;

    const updateData = {
      name,
      educationType,
      isProfileComplete: true,
    };

    if (educationType === "school") updateData.schoolClass = schoolClass;
    else if (educationType === "college") {
      updateData.collegeStream = collegeStream;
      updateData.collegeYear = collegeYear;
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.userId,
      updateData,
      { new: true }
    );
   console.log("Updated user:", updatedUser);
    res.json({ user: updatedUser });
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid token" });
  }
});



// ===================== Login =====================

// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//     try {
//     const user = await User.findOne({ email, password });
//     if (!user) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }
//     const token = jwt.sign({ id: user._id }, 'your_jwt_secret_key', { expiresIn: '1h' });
//     res.json({ token });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });



router.get('/users-chatted', auth, async (req, res) => {
  try {
    const userId = req.user.userId

    const chats = await Chat.find({
      participants: userId
    })
      .populate('participants', 'name')
      .sort({ updatedAt: -1 })

    // 🔥 Transform chats → users
    const result = chats.map(chat => {
      const otherUser = chat.participants.find(
        u => u._id.toString() !== userId
      )

      return {
        chatId: chat._id,
        userId: otherUser?._id,
        name: otherUser?.name,
        lastMessage: chat.lastMessage,
        unreadCount: chat.unreadCount,
        updatedAt: chat.updatedAt
      }
    })

    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


router.get('/users', auth, async (req, res) => {
  const users = await User.find(
    { _id: { $ne: req.user.userId } },
    'name email educationType city'
  )
  res.json(users)
})


router.post('/chat-request/send', auth, async (req, res) => {
  const { receiverId } = req.body;
console.log('Send chat request from', req.user.userId, 'to', receiverId);
  // already request?
  const exists = await FriendRequest.findOne({
    sender: req.user.userId,
    receiver: receiverId
  })

  if (exists)
    return res.status(400).json({ message: 'Request already sent' })

  await FriendRequest.create({
    sender: req.user.userId,
    receiver: receiverId
  })

  res.json({ message: 'Chat request sent' })
})


router.get('/chat-request/incoming', auth, async (req, res) => {
  const requests = await FriendRequest.find({
    receiver: req.user.userId,
    status: 'pending'
  }).populate('sender', 'name email')

  res.json(requests)
})


router.post('/chat-request/accept', auth, async (req, res) => {
  const { requestId } = req.body

  const request = await FriendRequest.findById(requestId)
  if (!request) return res.status(404).json({ message: 'Not found' })

  request.status = 'accepted'
  await request.save()

  // Create Chat using YOUR schema
  const chat = await Chat.create({
    participants: [request.sender, request.receiver],
    lastMessage: '',
    unreadCount: 0
  })

  res.json({ message: 'Chat created', chatId: chat._id })
})


router.delete(
  '/chat-request/reject/:requestId',
  auth,
  async (req, res) => {
    const { requestId } = req.params

    const request = await FriendRequest.findOneAndDelete({
      _id: requestId,
      receiver: req.user.userId
    })

    if (!request)
      return res.status(404).json({ message: 'Request not found' })

    res.json({ message: 'Request rejected & deleted' })
  }
)



router.get('/chat-request/count', auth, async (req, res) => {
  const count = await FriendRequest.countDocuments({
    receiver: req.user.userId,
    status: 'pending'
  })

  res.json({ count })
})



module.exports = router;
