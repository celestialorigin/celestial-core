# CELESTIAL_PACHISLOT_UNIT

This is a standalone, mass-producible slot machine template designed for the CELESTIAL PROJECT.
It runs entirely on client-side technology (HTML5/Canvas/WebAudio) and requires no build tools or external libraries.

## 🚀 Quick Start (Local)

1.  Open a terminal in this folder:
    `E:\Lukia_Luciaアーカイブ\CELESTIAL\GAMES\CELESTIAL_GAMES\CELESTIAL_SLOT\CELESTIAL_PACHISLOT_UNIT`
2.  Run the Python HTTP server:
    ```bash
    python -m http.server 8000
    ```
3.  Open your browser and navigate to:
    [http://localhost:8000/public/index.html](http://localhost:8000/public/index.html)

## 🎨 Customization (Mass Production)

To create a new slot machine from this template:

1.  **Copy the Folder**: Duplicate the `CELESTIAL_PACHISLOT_UNIT` folder and rename it (e.g., `MY_NEW_SLOT`).
2.  **Add Images**:
    -   Place your symbol images (PNG/JPG) in `public/assets/slotimages/`.
    -   *(Optional)* Add a background image at `public/assets/cabinet.png`.
3.  **Update Config**:
    -   Edit `public/config.json` to change the Machine Title, Owner Name, Theme Colors, etc.
4.  **Update Symbols**:
    -   Edit `public/symbols.json` to list your image filenames.

## ⚠️ Troubleshooting

-   **Infinite Loading?**: If `config.json` or `symbols.json` cannot be loaded, or if images are missing, the game will **NOT** hang.
-   **Force Start**: An error screen will appear with a "FORCE START (DUMMY MODE)" button. Click this to play the game with placeholder graphics to verify the logic works.

## 📁 File Structure

-   `public/index.html`: Main game logic and UI.
-   `public/config.json`: Project settings (Title, Colors, Links).
-   `public/symbols.json`: List of reel symbol filenames.
-   `public/assets/`: Directory for images.
