const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const path = require('path'); 

const app = express();
const PORT = 3000;

// ============================================
// 1. MIDDLEWARE & SECURITY SETUP
// ============================================
// (Upgraded: Ab body-parser ki jagah express ka apna fast parser use hoga)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SECURITY: Frontend folder ko safe tarike se public banana
app.use(express.static(path.join(__dirname, 'frontend')));

// Session setup (Social login ke liye zaruri)
app.use(session({
    secret: 'star_emitra_secret_key',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());



// ============================================
// 📨 CONTACT MESSAGE SCHEMA & API
// ============================================

// ============================================
// 📨 CONTACT MESSAGE SCHEMA & API
// ============================================
const messageSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    service: String,
    message: String,
    date: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

app.post('/api/contact', async (req, res) => {
    // 🕵️‍♂️ YEH LINE VS CODE KE TERMINAL ME BATAEGI KI KYA AAYA HAI
    console.log("📨 [ALERT] Naya Message Aaya Frontend Se:", req.body); 

    try {
        const { name, mobile, service, message } = req.body;
        const newMessage = new Message({ name, mobile, service, message });
        await newMessage.save();
        
        console.log("✅ [SUCCESS] Message MongoDB me save ho gaya!");
        res.status(200).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("❌ [ERROR] Message Save hone me dikkat:", error);
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

// 3. Admin Panel ke liye Messages nikalne ka raasta
app.get('/api/admin/messages', async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_SECRET) return res.status(403).json({ message: "Chor pakda gaya!" });
    try {
        // Sabse naye messages sabse upar aayenge (sort -1)
        const messages = await Message.find().sort({ date: -1 });
        res.json(messages);
    } catch (err) { res.status(500).json({ message: "Data error." }); }
});

// 4. Admin Panel se Message delete karne ka raasta
app.delete('/api/admin/messages/:id', async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_SECRET) return res.status(403).json({ message: "Unauthorized" });
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ message: "Message deleted." });
    } catch (err) { res.status(500).json({ message: "Error." }); }
});


// ============================================
// 2. CLEAN URL ROUTING (Smart Static Pages)
// ============================================
// Yeh ensure karega ki bina .html ke bhi aapke pages mast khulein
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'admin.html')));
app.get('/emitra-services', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'emitra-services.html')));
app.get('/banking', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'banking.html')));
app.get('/studio', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'studio.html')));
app.get('/online-forms', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'online-forms.html')));
app.get('/business', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'business-services.html')));

// ============================================
// 3. DATABASE CONNECTION (MongoDB Atlas)
// ============================================
const dbURI = "mongodb+srv://codingboss786_db_user:6Z8mjEpGnW1tg45c@shekh.al9nrxh.mongodb.net/star_emitra?retryWrites=true&w=majority&appName=SHEKH";

mongoose.connect(dbURI)
    .then(() => console.log("✅ STAR EMITRA: MongoDB Atlas Connected Successfully!"))
    .catch(err => console.error("❌ Database Connection Error:", err));

// ============================================
// 4. EMAIL CONFIGURATION (Nodemailer)
// ============================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'coding.boss786@gmail.com', 
        pass: 'pjej tfqq vvof dymn' 
    }
});

// ============================================
// 5. GOOGLE AUTHENTICATION SYSTEM
// ============================================
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GoogleStrategy({
    clientID: 'HIDDEN_FOR_SECURITY',
    clientSecret: 'HIDDEN_FOR_SECURITY',
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let email = profile.emails[0].value.toLowerCase();
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                name: profile.displayName,
                email: email,
                password: await bcrypt.hash(crypto.randomBytes(10).toString('hex'), 10), 
                customerId: 'STAR-' + Math.floor(1000 + Math.random() * 9000),
                isVerified: true 
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
  }
));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/index2.html' }),
    (req, res) => {
        // 🚀 SMART REDIRECT LOGIC
        res.send(`
            <script>
                localStorage.setItem('userName', "${req.user.name}");
                localStorage.setItem('customerId', "${req.user.customerId}");
                localStorage.setItem('isVerified', "true");
                localStorage.setItem('userMobile', "${req.user.mobile || ''}");
                localStorage.setItem('userAddress', "${req.user.address || ''}");
                
                let returnUrl = localStorage.getItem('returnUrl') || '/';
                localStorage.removeItem('returnUrl'); 
                window.location.href = returnUrl; 
            </script>
        `);
    }
);

// ============================================
// 6. REGULAR USER AUTH API (Signup, Signin, Reset)
// ============================================

// SIGN UP
app.post('/api/signup', async (req, res) => {
    try {
        const { name, password } = req.body;
        const email = req.body.email.toLowerCase().trim();
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "Aap pehle se registered hain." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const customerId = 'STAR-' + Math.floor(1000 + Math.random() * 9000);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        user = new User({ 
            name, email, password: hashedPassword, customerId,
            resetPasswordToken: verificationToken 
        });

        await user.save();
        const verifyUrl = `http://localhost:3000/api/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Account Verification - STAR EMITRA',
            html: `<h3>Welcome ${name}!</h3><p>Apna account chalu karne ke liye yahan click karein:</p><a href="${verifyUrl}" style="background: #00f2ff; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify My Account</a>`
        });
        res.status(201).json({ message: "Registration Successful! Email check karein.", customerId });
    } catch (error) {
        res.status(500).json({ message: "Server Error: " + error.message });
    }
});

// VERIFY EMAIL
app.get('/api/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ resetPasswordToken: token });
        if (!user) return res.status(400).send("<h1 style='text-align:center; color:red; margin-top:50px;'>Invalid ya Expired Link!</h1>");
        
        user.isVerified = true;
        user.resetPasswordToken = undefined; 
        await user.save();
        res.send(`<div style="text-align:center; margin-top:50px; font-family: sans-serif;">
                    <h1 style="color: #28a745;">✅ Email Verified Successfully!</h1>
                    <p>Aapka account active ho gaya hai.</p>
                    <a href="/" style="display:inline-block; margin-top:20px; background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Karein</a>
                  </div>`);
    } catch (error) { res.status(500).send("Server Error"); }
});

// SIGN IN
app.post('/api/signin', async (req, res) => {
    try {
        const email = req.body.email.toLowerCase().trim();
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Account nahi mila." });
        if (!user.isVerified) return res.status(401).json({ message: "Pehle apni Email verify karein!" });
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Galat password." });

        res.status(200).json({ 
            name: user.name, customerId: user.customerId, isVerified: user.isVerified,
            mobile: user.mobile, address: user.address 
        });
    } catch (error) { res.status(500).json({ message: "Server error." }); }
});

// FORGOT PASSWORD
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: "Is email se koi account nahi mila." });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetUrl = `http://localhost:3000/reset-password.html?token=${token}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset - STAR EMITRA',
            html: `<p>Password reset ke liye niche link par click karein:</p><a href="${resetUrl}">${resetUrl}</a>`
        });
        res.status(200).json({ message: "Reset link aapke email par bhej di gayi hai." });
    } catch (err) { res.status(500).json({ message: "Email error." }); }
});

// RESET PASSWORD
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ 
            resetPasswordToken: token, 
            resetPasswordExpires: { $gt: Date.now() } 
        });
        if (!user) return res.status(400).json({ message: "Link invalid ya expire ho gayi hai." });

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ message: "Password kamyabi se badal gaya!" });
    } catch (err) { res.status(500).json({ message: "Server Error" }); }
});

// ============================================
// 7. ADMIN & PROFILE SYSTEM
// ============================================
const ADMIN_SECRET = "STAR@786"; 

app.post('/api/admin/verify', (req, res) => {
    if (req.body.key === ADMIN_SECRET) {
        res.json({ success: true, message: "Welcome Admin!" });
    } else {
        res.status(401).json({ success: false, message: "Galat Key!" });
    }
});

app.put('/api/update-profile', async (req, res) => {
    try {
        const { customerId, mobile, address } = req.body;
        const user = await User.findOneAndUpdate({ customerId: customerId.trim() }, { mobile, address }, { new: true });
        if (!user) return res.status(404).json({ message: "User nahi mila." });
        res.json({ message: "Profile update ho gayi!", user });
    } catch (error) { res.status(500).json({ message: "Update fail." }); }
});

app.get('/api/admin/users', async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_SECRET) return res.status(403).json({ message: "Chor pakda gaya!" });
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (err) { res.status(500).json({ message: "Data error." }); }
});

app.delete('/api/admin/delete-user/:id', async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_SECRET) return res.status(403).json({ message: "Unauthorized" });
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted." });
    } catch (err) { res.status(500).json({ message: "Error." }); }
});

app.put('/api/admin/edit-user/:id', async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_SECRET) return res.status(403).json({ message: "Unauthorized" });
    try {
        const { name, mobile, address } = req.body;
        await User.findByIdAndUpdate(req.params.id, { name, mobile, address });
        res.json({ message: "Update success." });
    } catch (err) { res.status(500).json({ message: "Error." }); }
});

// ============================================
// 8. START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 STAR EMITRA SYSTEM IS ONLINE!`);
    console.log(`🌐 Live URL: http://localhost:${PORT}`);
    console.log(`=================================================\n`);
});