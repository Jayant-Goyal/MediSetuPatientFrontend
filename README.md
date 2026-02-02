Medisetu Patient Portal

Hi there! 👋 This is my submission for the Medisetu frontend assignment.

My goal with this project was to build more than just a static UI—I wanted to create an experience that feels like a real, functioning patient portal. I focused heavily on accessibility, clean aesthetics, and a smooth user flow that makes managing medical records feel less like a chore.

🚀 Live Demo

https://medisetupatient.netlify.app

🔗 View the Live App: [Insert your deployed link here]

✨ What I Built (Features)

I broke the application down into three core experiences:

1. The Gatekeeper (Authentication)

Instead of a generic login screen, I built a system that feels robust.

Session Persistence: If you refresh the page, you stay logged in (using localStorage).

Feedback: The login box shakes if you try to enter without an ID—a small touch that improves UX significantly.

Security: A proper logout flow that cleans up user session data.

2. The Locker (Dashboard)

This is the heart of the app. I realized that patients might have years of history, so finding a specific file needs to be instant.

Instant Search: As you type, the grid updates immediately. No loading spinners, no waiting.

Smart Filters: You can quickly isolate "Abnormal" results or "Pending" tests with one click.

Responsive Layout: I used CSS Grid to ensure it looks great whether you're on a wide desktop monitor or checking your phone in a waiting room.

3. The Details

I wanted the individual report view to feel professional.

Print-Ready: If you hit Ctrl+P, the app transforms. I wrote a specific @media print stylesheet that strips away buttons and navbars, giving you a clean, paper-ready medical document.

Theme Awareness: The app detects if your device is in Dark Mode and adapts automatically, but I also added a manual toggle because personal preference matters.


💡 Improvements for the "Real World"

While this frontend demonstrates the core user experience, building this for actual medical use would require a few architectural shifts. Here is what I would tackle next:

Real Authentication (OAuth/JWT):
Currently, the login is simulated. In a production environment, I would implement JWT (JSON Web Tokens) with a secure backend to handle session expiry and protect patient data properly.

Backend Integration:
The reports are currently fed by a robust mock data structure. I would replace this with API calls to a secure Node.js or Python backend to fetch live records from a database.

Security Hardening:
Medical data is sensitive. I would implement strict Content Security Policies (CSP) and ensure all inputs are sanitized server-side to prevent XSS attacks.

Secure File Storage:
Instead of mock downloads, I would integrate with a secure object storage service (like AWS S3 or Firebase Storage) using signed URLs, ensuring that only the authenticated patient can download their specific PDF.

Scalability:
As the app grows, managing state with vanilla JS gets tricky. I would likely migrate this to React or Vue to better handle complex state management and component reusability.
