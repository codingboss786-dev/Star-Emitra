const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. MIDDLEWARE & SECURITY SETUP
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend folder ko safe tarike se public banana
app.use(express.static(path.join(__dirname, 'frontend')));

// ============================================
// 2. CLEAN URL ROUTING (Smart Static Pages)
// ============================================
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
// 4. CONTACT MESSAGE SCHEMA & API
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

// ============================================
// 5. ADMIN PANEL API (Messages dekhne aur delete karne ke liye)
// ============================================
const ADMIN_SECRET = "STAR@786"; 

app.post('/api/admin/verify', (req, res) => {
    if (req.body.key === ADMIN_SECRET) {
        res.json({ success: true, message: "Welcome Admin!" });
    } else {
        res.status(401).json({ success: false, message: "Galat Key!" });
    }
});

app.get('/api/admin/messages', async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_SECRET) return res.status(403).json({ message: "Chor pakda gaya!" });
    try {
        const messages = await Message.find().sort({ date: -1 });
        res.json(messages);
    } catch (err) { res.status(500).json({ message: "Data error." }); }
});

app.delete('/api/admin/messages/:id', async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_SECRET) return res.status(403).json({ message: "Unauthorized" });
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ message: "Message deleted." });
    } catch (err) { res.status(500).json({ message: "Error." }); }
});

// ============================================
// 6. START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 STAR EMITRA SYSTEM IS ONLINE!`);
    console.log(`🌐 Live URL: Port ${PORT}`);
    console.log(`=================================================\n`);
});