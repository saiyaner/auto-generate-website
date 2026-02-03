const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #e0f7fa; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    </style>
    <div class="card">
        <h1>Hello from Node.js!</h1>
        <p>This app is running on port ${port}</p>
    </div>
  `);
});

app.listen(port, () => {
    console.log(`Auto-gen app listening on port ${port}`);
});
