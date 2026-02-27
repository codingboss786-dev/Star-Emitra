const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); 

// ============================================
// STATIC PAGES
// ============================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/emitra-services', (req, res) => res.sendFile(path.join(__dirname, 'emitra-services.html')));

// ============================================
// TODO: ADD YOUR NEW API ENDPOINTS HERE
// ============================================
// Example:
// app.post('/add-update', (req, res) => { ... });
// app.get('/api/updates', (req, res) => { ... });
// app.post('/add-emitra-service', (req, res) => { ... });
// app.get('/api/emitra-services', (req, res) => { ... });

// ============================================
// SERVER START
// ============================================
app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`STAR EMITRA Server Running!`);
    console.log(`Check here: http://localhost:${port}`);
    console.log(`========================================\n`);
});
