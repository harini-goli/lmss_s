
import express from 'express';
import { uploadFile, handleUpload } from './controllers/upload.controller.js';
import FormData from 'form-data';
import fs from 'fs';
import http from 'http';
import path from 'path';

// 1. Setup minimal server
const app = express();
app.post('/test-upload', (req, res, next) => {
    uploadFile(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
}, handleUpload);

const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Test server running on port ${port}`);

    // 2. Create dummy HTML file
    const filePath = path.join(process.cwd(), 'test_upload.html');
    fs.writeFileSync(filePath, '<html><body>test</body></html>');

    // 3. Send request
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const request = http.request({
        host: 'localhost',
        port: port,
        path: '/test-upload',
        method: 'POST',
        headers: form.getHeaders(),
    }, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
            console.log(`Response Status: ${response.statusCode}`);
            console.log(`Response Body: ${data}`);

            // Cleanup
            server.close();
            fs.unlinkSync(filePath);
            // also clean up uploads/test_upload.html if it was created
            // the controller saves it to uploads/
            // we will check output to see filename
        });
    });

    form.pipe(request);
});
