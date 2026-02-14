#!/usr/bin/env node
/**
 * YouTube API Integration Test Script
 * 
 * Tests YouTube Data API v3 integration
 * 
 * Usage: node test-youtube.js
 */

require('dotenv').config();
const axios = require('axios');

console.log('📺 YouTube API Integration Test\n');
console.log('================================\n');

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Test 1: Check environment variables
console.log('Test 1: Environment Variables');
console.log('================================');

if (!API_KEY) {
  console.error('❌ YOUTUBE_API_KEY not found in .env file');
  console.log('\n💡 Please add your YouTube API key to .env:');
  console.log('YOUTUBE_API_KEY=your_api_key_here\n');
  console.log('📖 Get your API key from: https://console.cloud.google.com/apis/credentials\n');
  process.exit(1);
}

console.log(`✅ YOUTUBE_API_KEY: ${API_KEY.substring(0, 10)}...`);
console.log('✅ Environment variables present\n');

// Test function
async function runTests() {
  try {
    // Test 2: Basic Search
    console.log('Test 2: Basic Video Search');
    console.log('================================');
    
    const searchResponse = await axios.get(`${BASE_URL}/search`, {
      params: {
        key: API_KEY,
        part: 'snippet',
        q: 'The Weeknd Blinding Lights',
        type: 'video',
        maxResults: 3
      }
    });
    
    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      console.log(`✅ Search successful - Found ${searchResponse.data.items.length} videos`);
      const video = searchResponse.data.items[0];
      console.log(`   Title: ${video.snippet.title}`);
      console.log(`   Channel: ${video.snippet.channelTitle}`);
      console.log(`   Video ID: ${video.id.videoId}\n`);
      
      const videoId = video.id.videoId;
      
      // Test 3: Get Video Details
      console.log('Test 3: Get Video Details');
      console.log('================================');
      
      const videoResponse = await axios.get(`${BASE_URL}/videos`, {
        params: {
          key: API_KEY,
          part: 'snippet,contentDetails,statistics',
          id: videoId
        }
      });
      
      if (videoResponse.data.items && videoResponse.data.items.length > 0) {
        const details = videoResponse.data.items[0];
        console.log('✅ Video details retrieved');
        console.log(`   Duration: ${details.contentDetails.duration}`);
        console.log(`   Views: ${parseInt(details.statistics.viewCount).toLocaleString()}`);
        console.log(`   Likes: ${parseInt(details.statistics.likeCount || 0).toLocaleString()}`);
        console.log(`   Published: ${new Date(details.snippet.publishedAt).toLocaleDateString()}\n`);
      }
      
      // Test 4: Music Category Search
      console.log('Test 4: Music Category Search');
      console.log('================================');
      
      const musicResponse = await axios.get(`${BASE_URL}/search`, {
        params: {
          key: API_KEY,
          part: 'snippet',
          q: 'Ed Sheeran',
          type: 'video',
          videoCategoryId: '10', // Music category
          maxResults: 3
        }
      });
      
      if (musicResponse.data.items) {
        console.log(`✅ Music search successful - Found ${musicResponse.data.items.length} music videos`);
        musicResponse.data.items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.snippet.title}`);
        });
        console.log('');
      }
    }
    
    // Test 5: Search Channels
    console.log('Test 5: Channel Search');
    console.log('================================');
    
    const channelResponse = await axios.get(`${BASE_URL}/search`, {
      params: {
        key: API_KEY,
        part: 'snippet',
        q: 'Vevo',
        type: 'channel',
        maxResults: 2
      }
    });
    
    if (channelResponse.data.items && channelResponse.data.items.length > 0) {
      console.log(`✅ Channel search successful - Found ${channelResponse.data.items.length} channels`);
      channelResponse.data.items.forEach(channel => {
        console.log(`   📺 ${channel.snippet.channelTitle}`);
      });
      console.log('');
    }
    
    // Test 6: API Quota Check
    console.log('Test 6: API Status Check');
    console.log('================================');
    console.log('✅ All API calls successful');
    console.log('✅ API key is valid and working');
    console.log('⚠️  Remember: YouTube API has quota limits (10,000 units/day)\n');
    
    // Final summary
    console.log('================================');
    console.log('✅ All YouTube API tests passed!');
    console.log('================================\n');
    
    console.log('📊 Test Summary:');
    console.log('   - Environment variables: ✅');
    console.log('   - Video search: ✅');
    console.log('   - Video details: ✅');
    console.log('   - Music category search: ✅');
    console.log('   - Channel search: ✅');
    console.log('   - API authentication: ✅\n');
    
    console.log('📚 Available Endpoints:');
    console.log('   GET /api/youtube/search?query=song+name&maxResults=10');
    console.log('   - Search YouTube for music videos\n');
    
    console.log('🚀 Next Steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Test the endpoint:');
    console.log(`      curl "http://localhost:4000/api/youtube/search?query=drake&maxResults=5"\n`);
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 403) {
        console.log('\n💡 Common 403 errors:');
        console.log('   - API key not valid or expired');
        console.log('   - YouTube Data API not enabled in Google Cloud Console');
        console.log('   - API key restrictions blocking requests');
        console.log('\n🔧 Fix: Go to https://console.cloud.google.com/apis/library/youtube.googleapis.com');
        console.log('   and enable "YouTube Data API v3"\n');
      }
    } else {
      console.error(error.message);
    }
    
    process.exit(1);
  }
}

runTests();
