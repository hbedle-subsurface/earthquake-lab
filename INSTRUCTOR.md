# Instructor notes

## Time and fit

- About 2 hours of student work (1.5 to 3 hours depending on the student).
- Works on a laptop or a tablet. A phone works but is cramped for steps 2, 4 and 5.
- No login and no data leaves the student's browser. Progress is saved in that browser, so students should finish on the same device.

## Course learning outcomes it supports

- **Understanding geological processes** - plate tectonics at Cascadia, seismic waves, where and why earthquakes happen (steps 1, 6).
- **Seismic risk assessment** - depth and type of earthquake, shaking, tsunami potential (steps 6, 8).
- **Techniques for locating earthquakes** - S-P times, travel-time curves, triangulation, magnitude (steps 2 to 5).
- **Interdisciplinary connections** - physics of wave speeds, logarithms, geography (steps 3, 5, 8).
- **Society intersections** - earthquake early warning and induced seismicity in Oklahoma (steps 7, 8).

## Grading

Students can only reach the certificate after every step is correct, so a valid certificate means the lab is complete. Grading can be complete/incomplete.

To check a certificate:

1. Open `verify.html` (linked at the bottom of the lab).
2. Type the student's name exactly as on the certificate and the five-digit scenario number.
3. The page shows the code the certificate should have, plus the correct answers for that earthquake.

The code ties the certificate to the student's name and scenario, so a classmate's screenshot with the name edited won't match. It is a light check, not a secure signature - someone determined could read the page source.

Each student's name gets a new random scenario, so classmates have different stations, distances, depths and magnitudes, and can't share answers.

## Suggested Canvas assignment text

> **Lab: Find the Earthquake**
>
> Open the lab at https://hbedle-subsurface.github.io/earthquake-lab/ and enter your name exactly as it appears in Canvas. Work through all eight steps. Each step checks your answers, and there are hints if you get stuck. When you finish, take a screenshot of your full certificate (or save it as a PDF) and upload it here.
>
> Plan on about two hours. Your progress is saved in your browser, so you can stop and come back, but use the same computer and browser to finish.

## Publishing on GitHub Pages (web interface)

1. On github.com, create a new public repository named `earthquake-lab` under hbedle-subsurface.
2. Click **Add file > Upload files**, drag in everything from this folder (keep the `css` and `js` folders), and commit.
3. Go to **Settings > Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**, and save.
4. After a minute or two the lab is live at https://hbedle-subsurface.github.io/earthquake-lab/

The GoatCounter page-view counter (`hbedle`) is already in `index.html`.
