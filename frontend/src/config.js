const isLocalhost = window.location.hostname === 'localhost';
const API_URL = process.env.REACT_APP_API_URL || 
  (isLocalhost ? 'http://localhost:4000/api' : 'https://vibesync-n1fk.onrender.com/api');
const SEARCH_API_URL = API_URL;
const SOCIAL_API_URL = API_URL;

export default API_URL;
export { SEARCH_API_URL, SOCIAL_API_URL };
