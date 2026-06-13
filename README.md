# FindSeries 🎬

A clean and minimalist web application that allows users to search for their favorite movies and TV shows in real-time, fetching dynamic data directly from the TVmaze API.

## 🚀 Live Demo

🔗 [View Live Project](https://jvdass.github.io/FindSeries/)

## ✨ Features
- **Series & Movies Search:** Quickly find detailed information about your favorite shows using the TVmaze API.
- **Genre Filtering:** Easily filter through categories like Action, Comedy, Drama, and Sci-Fi.
- **Favorites System:** Users can save their favorite series to a personal list, which persists even after refreshing the page.
- **Dynamic Content:** Fetches accurate and updated show details (titles, release years, and cover images).
- **✨ Where to Watch (France):** Integrated with the TMDB API to display the real-time availability of streaming platforms (Netflix, Disney+, Prime Video, Crunchyroll, etc.) specifically for the French audience.
- **Responsive & Modern Design:** A clean, minimalist interface with a dark layout designed for an optimal user experience across all devices.


## 🛠️ Technologies Used

- **Frontend:** HTML5, CSS3 (Flexbox & Responsive Design)
- **Scripting:** Vanilla JavaScript (ES6+)
- **API Integration:** Fetch API (Async/Await)
- **Data Source:** [TVmaze API](https://www.tvmaze.com/api)

## 📸 Preview

<img width="1890" height="882" alt="image" src="https://github.com/user-attachments/assets/f6f17977-08fe-4e7c-87b5-b518929c794f" />



<img width="1888" height="868" alt="image" src="https://github.com/user-attachments/assets/5ff4641a-0cf9-4a51-8490-4ac1205a403f" />



<img width="1893" height="889" alt="image" src="https://github.com/user-attachments/assets/11182f4d-294e-494d-b16d-3dc202743716" />

## 🛠️ Installation & Local Setup

This project can be run entirely in your local environment. 

### 💡 Note on Features & API Keys
* **Standard Mode (No setup required):** You can search for any series, use genre filters, and manage your favorites right away using the built-in TVmaze API.
* **Streaming Providers Feature (Optional):** To see the list of streaming platforms available in France (Netflix, Disney+, Prime Video, etc.) for a specific show, you will need to add a private TMDB API token by following the steps below.

---

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jvdass/FindSeries.git
2. **Create the local configuration file :**
   At the root of your project folder, create a nexw file named config.js
3. **Add your private TMDB token :**
    Open config. js and add your TMDB Read Access Token inside :
   ``` bash
   const MY_SECRET_TOKEN = "YOUR_TMDB_TOKEN_HERE";
   
   (Note: The config.js file is already listed in .gitignore, so your private token will never be pushed to GitHub).

4. **Launch the application**    
