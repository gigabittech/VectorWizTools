// Test script for Instagram downloader
import fetch from 'node-fetch';

async function testInstagramDownloader() {
    const shortcode = 'CgwxMDk2MDg3OTU1NjI3NzQ5'; // Example shortcode
    const url = `http://localhost:5002/api/instagram-images?shortcode=${shortcode}`;
    
    console.log('Testing Instagram downloader...');
    console.log('URL:', url);
    
    try {
        const response = await fetch(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testInstagramDownloader();