# Instructor notes

## Time and fit

- About 1.5 hours of student work for most freshmen. Quick students finish in about an hour, and students who need a lot of hints can take 2 hours or more.
- Built for a laptop: the panel and the instructions sit side by side and fit on the screen, so there is no scrolling up and down between them. A tablet works too. A phone works but is cramped for steps 2, 4 and 5.
- Every click-to-measure step also has a type-in box (arrival times, epicenter latitude and longitude, amplitudes), so the whole lab can be done with a keyboard. Reading the seismograms is still a visual task, so a student who uses a screen reader would need an accommodation, such as a table of the arrival times and amplitudes from the verify page.
- Each step has a "Stuck, or something not working?" box covering lost progress, pop-up blockers, and sending you a Canvas message with their scenario number.
- No login and no data leaves the student's browser. Progress is saved in that browser, so students should finish on the same device.

## Course learning outcomes it supports

- **Understanding geological processes** - plate tectonics at Cascadia, seismic waves, where and why earthquakes happen (steps 1, 6).
- **Seismic risk assessment** - depth and type of earthquake, shaking, tsunami potential (steps 6, 8).
- **Techniques for locating earthquakes** - S-P times, travel-time curves, triangulation, magnitude (steps 2 to 5), then again on their own with a second earthquake (step 9).
- **Prediction of earthquakes** - prediction vs. forecasting, recurrence from the Cascadia turbidite record, USGS 50-year probabilities (step 10).
- **Interdisciplinary connections** - physics of wave speeds, logarithms, geography (steps 3, 5, 8).
- **Society intersections** - earthquake early warning and induced seismicity in Oklahoma (steps 7, 8).

## Grading

Students can only reach the certificate after every step is correct, so a valid certificate means the lab is complete. Grading can be complete/incomplete.

To check a certificate:

1. Open `verify.html` (linked at the bottom of the lab).
2. Type the student's name exactly as on the certificate and the five-digit scenario number.
3. The page shows the code the certificate should have, plus the correct answers for both earthquakes and step 10.

The code ties the certificate to the student's name and scenario, so a classmate's screenshot with the name edited won't match. It is a light check, not a secure signature - someone determined could read the page source.

Each student's name gets a new random scenario, so classmates have different stations, distances, depths and magnitudes, and can't share answers.

## Suggested Canvas assignment text

> **Lab: Find the Earthquake**
>
> Open the lab at https://hbedle-subsurface.github.io/earthquake-lab/ and enter your name exactly as it appears in Canvas. Work through all ten steps. Each step checks your answers, and there are hints if you get stuck. When you finish, take a screenshot of your full certificate (or save it as a PDF) and upload it here.
>
> Plan on about an hour and a half. Your progress is saved in your browser, so you can stop and come back, but use the same computer and browser to finish.

## Publishing on GitHub Pages (web interface)

1. On github.com, create a new public repository named `earthquake-lab` under hbedle-subsurface.
2. Click **Add file > Upload files**, drag in everything from this folder (keep the `css` and `js` folders), and commit.
3. Go to **Settings > Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**, and save.
4. After a minute or two the lab is live at https://hbedle-subsurface.github.io/earthquake-lab/

The GoatCounter page-view counter (`hbedle`) is already in `index.html`.
