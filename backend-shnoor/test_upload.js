
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function testUpload() {
    try {
        const formData = new FormData();
        // Create a dummy file
        fs.writeFileSync('test.txt', 'test content');
        formData.append('file', fs.createReadStream('test.txt'));

        console.log('Attempting upload to http://localhost:5000/api/users/upload-profile-picture');

        // Note: This endpoint is protected by firebaseAuth. 
        // Testing it without a token will strictly fail with 401, which confirms the route exists.
        // If it returns 404, the route is missing.
        // If it returns 500, the server crashed.

        const response = await axios.post('http://localhost:5000/api/users/upload-profile-picture', formData, {
            headers: {
                ...formData.getHeaders()
            },
            validateStatus: () => true // Resolve promise for all status codes
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);

        fs.unlinkSync('test.txt');

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testUpload();
