ChatWithGoku - Secure Chat Application

**ChatWithGoku** is a secure chat application designed for privacy-first communication. It offers encrypted messaging and self-destructing messages to ensure your chats stay private and temporary.

---

## 🔐 Features

- **End-to-End Encryption**: Messages are encrypted using strong cryptographic algorithms, protecting your data from third parties.
- **Self-Destructing Messages**: Messages can be configured to auto-delete after a set time or once read.
- **Minimal UI**: Clean, intuitive interface built with Tailwind CSS.
- **No Data Retention**: Messages are not stored on the server—everything is ephemeral.
- **Secure User Sessions**: All user sessions are encrypted and securely managed.

---

## 🛠️ Tech Stack

- **Frontend**: Vite + React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Encryption**: Python `cryptography` library
- **Database (optional)**: SQLite or PostgreSQL for user sessions and temporary storage

---

## 📦 Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ChatWithGoku.git
cd ChatWithGoku
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate (Windows) OR source venv/bin/activate (Linux/Mac)
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup (Vite + Tailwind)
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:3000` for the frontend and `http://localhost:8000/docs` for the FastAPI backend docs.

---

## 🔐 How It Works

1. Users exchange messages through a frontend React app.
2. Messages are encrypted before sending using symmetric or asymmetric encryption.
3. The backend only relays encrypted data; no message content is stored.
4. Messages can self-destruct on read or after a timer.

---

## 🧪 Example

> **Alice** sends a message to **Bob** with a 10-second timer.
> Bob opens the message.
> The message decrypts on Bob's screen and deletes automatically after 10 seconds.

> ---

## 🤝 Contributing
Contributions are welcome! Please open issues or PRs for improvements.

---

## 📄 License
MIT License. See `LICENSE` file for details.

---

## 📫 Contact
**Developer**: Varun Pingale
For any queries or feedback, reach out via [email](varun.edu10@gmail.com).

---

Happy Chatting with Goku! 💬🛡️

