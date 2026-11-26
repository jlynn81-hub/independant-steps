# independant-steps

Independent Steps is a life-skills app concept focused on helping autistic teenagers complete everyday chores with greater independence.

## Why this app

Many autistic teens learn best with visual support and clear, short instructions. Verbal-only directions or long written lists can make multi-step chores harder to complete independently.

## Core objectives

- Break chores into small, manageable steps
- Show one step at a time to reduce overload
- Support visual learning with pictures and short videos
- Add reminders for chores at specific times
- Let parents/caregivers customize instructions to match each teen's needs

## Example chores

- Laundry (sort, wash, dry, put away)
- Washing and putting away dishes
- Making the bed
- Feeding pets

## Target experience

The app should provide supportive, predictable guidance that helps autistic teens remember and complete tasks with less repeated prompting from parents or caregivers.

## Running the app

The first version is a dependency-free web app that can be installed on a phone (a PWA). There's no build step.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. To put it on a phone, host the folder anywhere that serves static files over HTTPS (GitHub Pages works). Then open it in the phone's browser and choose **Add to Home Screen**.

### What's included

- **One step at a time.** The teen sees one large step with a picture, a progress bar and a big **Done** button, plus **Back** and **Read to me** (speech).
- **Starter chores.** Laundry, washing dishes, making the bed and feeding a pet come pre-loaded, with real photos for 27 of the 29 steps. Grown-ups can swap any of them for a photo of their own home.
- **Grown-up settings.** Press and hold the ⚙️ button for 1 second; an optional PIN adds a second lock. Grown-ups can add, edit, reorder and delete chores and steps, attach a photo or video link to any step, and try a chore before saving it.
- **Reminders.** Each chore can have times and days. While the app is open, a banner and a notification appear. To get reminders when it's closed, **Add reminders to calendar** exports an `.ics` file for the phone's calendar.
- **Private by default.** All data stays on the device. **Save backup file** / **Load backup file** move it between devices.

### Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `app.js` | All app logic (views, editor, reminders, storage) |
| `styles.css` | Calm, high-contrast, large-target styling with dark mode |
| `sw.js` | Offline caching (including photos) and notification taps |
| `images/`, `credits.js`, `CREDITS.md` | Starter chore photos and their credits |
| `manifest.webmanifest`, `icon.svg` | Install-to-home-screen metadata |
