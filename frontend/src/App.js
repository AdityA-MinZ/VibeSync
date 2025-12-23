import './App.css';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

function App() {
  return (
    <div className="app">
      <header>
        <h1>VibeSync</h1>
        <nav>
          <button>Home</button>
          <button>Login</button>
          <button>Register</button>
        </nav>
      </header>

      <main>
        <div className="card">
          <h2>Home</h2>
          <p>Welcome to VibeSync. Connect, share, and discover music vibes.</p>
        </div>

        <LoginForm />
        <RegisterForm />
      </main>
    </div>
  );
}

export default App;
