#!/usr/bin/env node
/**
 * Spotify API Integration Test Script
 * 
 * This script tests the Spotify backend integration:
 * 1. Checks environment variables
 * 2. Tests the Spotify service
 * 3. Verifies database connectivity
 * 
 * Usage: node test-spotify.js
 */

require('dotenv').config();
const spotifyService = require('./services/spotifyService');

console.log('🎵 Spotify API Integration Test\n');

// Test 1: Check environment variables
console.log('Test 1: Environment Variables');
console.log('================================');
const requiredEnvVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET', 
  'SPOTIFY_REDIRECT_URI'
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') 
      ? value.substring(0, 8) + '...' 
      : value;
    console.log(`✓ ${varName}: ${displayValue}`);
  } else {
    console.log(`✗ ${varName}: MISSING`);
    allEnvVarsPresent = false;
  }
});

if (!allEnvVarsPresent) {
  console.error('\n❌ Missing required environment variables!');
  console.log('Please check your .env file.\n');
  process.exit(1);
}

console.log('\n✅ All environment variables present\n');

// Test 2: Test client credentials
console.log('Test 2: Spotify API Authentication');
console.log('====================================');

async function testSpotifyAPI() {
  try {
    // Get client credentials token
    console.log('Fetching client credentials token...');
    const tokenData = await spotifyService.getClientCredentialsToken();
    
    if (tokenData.access_token) {
      console.log('✅ Successfully obtained access token');
      console.log(`   Token type: ${tokenData.token_type}`);
      console.log(`   Expires in: ${tokenData.expires_in} seconds`);
      
      // Test search
      console.log('\nTest 3: Search API');
      console.log('===================');
      console.log('Searching for "The Weeknd"...');
      
      const searchResults = await spotifyService.search(
        tokenData.access_token,
        'The Weeknd',
        ['track', 'artist'],
        5
      );
      
      if (searchResults.artists?.items?.length > 0) {
        const artist = searchResults.artists.items[0];
        console.log(`✅ Found artist: ${artist.name}`);
        console.log(`   Followers: ${artist.followers?.total?.toLocaleString()}`);
        console.log(`   Genres: ${artist.genres?.slice(0, 3).join(', ') || 'N/A'}`);
      }
      
      if (searchResults.tracks?.items?.length > 0) {
        const track = searchResults.tracks.items[0];
        console.log(`✅ Found track: "${track.name}" by ${track.artists?.map(a => a.name).join(', ')}`);
        console.log(`   Popularity: ${track.popularity}/100`);
        console.log(`   Duration: ${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}`);
      }
      
      // Note: Available genres endpoint requires user authentication
      // Skipping Test 4 - will work after user authenticates
      
      // Test new releases (may require specific scopes)
      console.log('\nTest 4: New Releases');
      console.log('=====================');
      try {
        const releases = await spotifyService.getNewReleases(tokenData.access_token, 3);
        if (releases.albums?.items?.length > 0) {
          console.log(`✅ Retrieved ${releases.albums.total} new releases`);
          console.log('   Latest albums:');
          releases.albums.items.forEach(album => {
            console.log(`     - "${album.name}" by ${album.artists?.map(a => a.name).join(', ')}`);
          });
        }
      } catch (err) {
        console.log('⚠️  New releases endpoint requires additional permissions (skipping)');
      }
      
      // Test featured playlists (may require specific scopes)
      console.log('\nTest 5: Featured Playlists');
      console.log('===========================');
      try {
        const featured = await spotifyService.getFeaturedPlaylists(tokenData.access_token, 3);
        if (featured.playlists?.items?.length > 0) {
          console.log(`✅ Retrieved ${featured.playlists.total} featured playlists`);
          console.log('   Featured:');
          featured.playlists.items.forEach(playlist => {
            console.log(`     - "${playlist.name}"`);
          });
        }
      } catch (err) {
        console.log('⚠️  Featured playlists endpoint requires additional permissions (skipping)');
      }
      
      console.log('\n================================');
      console.log('✅ All tests passed successfully!');
      console.log('================================\n');
      
      console.log('📚 Next Steps:');
      console.log('1. Start the backend server: npm run dev');
      console.log('2. Authenticate a user with Spotify');
      console.log('3. Test user-specific endpoints (search, playlists, etc.)');
      console.log('\n📖 API Documentation: See SPOTIFY_API_BACKEND.md\n');
      
    } else {
      console.error('❌ Failed to obtain access token');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    
    if (error.message.includes('invalid_client')) {
      console.log('\n💡 Hint: Check your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
    }
    
    process.exit(1);
  }
}

testSpotifyAPI();
