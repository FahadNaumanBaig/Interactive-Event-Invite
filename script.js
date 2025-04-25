// Firebase V9+ ES Modules Import
// Using a specific recent version (e.g., 9.15.0) is generally good practice
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// --- Firebase Configuration ---
// Use the Database URL you provided
const appSettings = {
    databaseURL: "https://rsvp-gif-gala-default-rtdb.asia-southeast1.firebasedatabase.app/"
    // If you have a full config object from Firebase console, you can paste it here:
    // apiKey: "YOUR_API_KEY",
    // authDomain: "YOUR_AUTH_DOMAIN",
    // projectId: "YOUR_PROJECT_ID",
    // storageBucket: "YOUR_STORAGE_BUCKET",
    // messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    // appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(appSettings);
const database = getDatabase(app);
// Database path for storing RSVP data
const rsvpsInDB = ref(database, "rsvps");

// --- Wait for DOM to Load ---
document.addEventListener('DOMContentLoaded', function() {

    // --- Get DOM Elements ---
    const rsvpForm = document.getElementById('rsvpForm');
    const confirmationMessageDiv = document.getElementById('confirmation-message');
    const bodyElement = document.body;
    const emailInput = document.getElementById('email');
    const attendanceRadios = document.querySelectorAll('input[name="attendance_status"]');
    const messageFieldDiv = document.getElementById('message-field'); // The div containing the message input
    const messageInput = document.getElementById('message'); // The actual message text input
    const showMessagesButton = document.getElementById('show-messages-button');
    const messagesListUl = document.getElementById('messages-list'); // The UL for messages

    // --- Input Validation & Error Styling ---
    function displayError(element, message) {
        element.style.borderColor = 'red'; // Visual indication
        console.error(message); // Log error
        // Consider adding a dedicated error message span near the element
    }
    function clearError(element) {
        element.style.borderColor = ''; // Reset border
    }

    // --- Event Listener for Attendance Radio Buttons ---
    // Show/Hide the optional message field based on attendance selection
    attendanceRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Check if the 'yes' radio is the one that changed and is now checked
            if (this.id === 'attend-yes' && this.checked) {
                messageFieldDiv.classList.remove('hidden'); // Show message field
            } else if (this.id === 'attend-no' && this.checked) {
                 messageFieldDiv.classList.add('hidden'); // Hide message field
                 messageInput.value = ''; // Clear message if they switch to 'no'
            }
        });
    });

    // --- Event Listener for Form Submission ---
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default browser submission

            // --- Reset UI state ---
            confirmationMessageDiv.innerHTML = '';
            confirmationMessageDiv.classList.remove('success', 'error', 'info');
            confirmationMessageDiv.style.display = 'none';
            bodyElement.classList.remove('body-gif-background', 'body-sad-gif-background');
            clearError(emailInput); // Clear potential previous errors

            // --- Get form data ---
            const email = emailInput.value.trim();
            const attendanceChoice = document.querySelector('input[name="attendance_status"]:checked')?.value;
            let message = messageInput.value.trim();

            // --- Basic Validation ---
            let isValid = true;
            if (!email || !email.includes('@')) {
                 displayError(emailInput, 'Please enter a valid email address.');
                 isValid = false;
            }
            if (!attendanceChoice) {
                 // This shouldn't happen if 'required' is on radios, but good check
                 console.error('Attendance choice missing');
                 isValid = false;
            }

             // If validation fails, show generic error and stop
            if (!isValid) {
                 confirmationMessageDiv.innerHTML = 'Please check the form for errors.';
                 confirmationMessageDiv.classList.add('error');
                 confirmationMessageDiv.style.display = 'block';
                 confirmationMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 return;
            }

            // Ensure message is empty if not attending
            if (attendanceChoice === 'no') {
                message = "";
            }

            // --- Prepare data for Firebase ---
            const rsvpData = {
                email: email,
                attendance: attendanceChoice,
                message: message, // Will be empty string if not attending or left blank
                timestamp: serverTimestamp() // Use Firebase server time for consistency
            };

            // --- Save data to Firebase ---
            push(rsvpsInDB, rsvpData)
                .then(() => {
                    // --- SUCCESS ---
                    console.log("RSVP saved successfully!");

                    // Display confirmation message and set background (Your existing logic)
                    if (attendanceChoice === 'yes') {
                        confirmationMessageDiv.innerHTML = 'Woohoo! Can\'t wait to see your meme-tastic costume! 🎉 See you there!';
                        confirmationMessageDiv.classList.add('success');
                        bodyElement.classList.add('body-gif-background');
                    } else { // attendanceChoice === 'no'
                        confirmationMessageDiv.innerHTML = 'Aww, sorry you can\'t make it! Thanks for letting us know.';
                        confirmationMessageDiv.classList.add('success'); // Re-using success style for confirmation
                        bodyElement.classList.add('body-sad-gif-background');
                    }
                    confirmationMessageDiv.style.display = 'block';
                    confirmationMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Reset the form and UI state
                    rsvpForm.reset();
                    messageFieldDiv.classList.add('hidden'); // Re-hide message field
                    clearError(emailInput); // Clear any lingering error styles

                })
                .catch((error) => {
                    // --- ERROR ---
                    console.error("Error saving RSVP to Firebase:", error);
                    confirmationMessageDiv.innerHTML = `Oh no! There was an error saving your RSVP. Please try again. (Check console for details)`;
                    confirmationMessageDiv.classList.add('error');
                    confirmationMessageDiv.style.display = 'block';
                    confirmationMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });

        }); // End of form submission event listener

    } else {
        console.error('Error: RSVP Form element with ID "rsvpForm" was not found.');
    }


    // --- Event Listener for Show/Hide Messages Button ---
    if (showMessagesButton && messagesListUl) {
        let messagesVisible = false; // Track visibility state
        let firebaseListenerAttached = false; // Track if onValue listener is active

        showMessagesButton.addEventListener('click', function() {
            messagesVisible = !messagesVisible; // Toggle state

            if (messagesVisible) {
                messagesListUl.classList.remove('hidden');
                showMessagesButton.textContent = 'Hide Messages';

                // Attach listener ONLY if it's not already attached
                if (!firebaseListenerAttached) {
                    messagesListUl.innerHTML = '<li>Loading messages...</li>'; // Show loading state

                    onValue(rsvpsInDB, function(snapshot) {
                        messagesListUl.innerHTML = ''; // Clear list before adding new items

                        if (snapshot.exists()) {
                            const rsvps = snapshot.val();
                            let messagesFound = false; // Track if any qualifying messages are found

                            // Process newest first (optional - requires sorting)
                            // const sortedKeys = Object.keys(rsvps).sort((a,b) => rsvps[b].timestamp - rsvps[a].timestamp);
                            // sortedKeys.forEach(key => { const rsvp = rsvps[key]; ... });

                            // Process in default Firebase order
                             Object.values(rsvps).forEach(rsvp => {
                                // Only display messages from attendees who said yes AND left a message
                                if (rsvp.attendance === 'yes' && rsvp.message && rsvp.message.trim() !== '') {
                                    appendMessageToList(rsvp);
                                    messagesFound = true;
                                }
                            });

                            // If no qualifying messages were found after checking all RSVPs
                             if (!messagesFound) {
                                 messagesListUl.innerHTML = '<li>No messages left by attendees yet!</li>';
                             }

                        } else {
                            messagesListUl.innerHTML = '<li>No RSVPs submitted yet!</li>';
                        }
                    }, (error) => { // Handle errors during Firebase read
                        console.error("Error fetching RSVPs from Firebase:", error);
                        messagesListUl.innerHTML = '<li>Error loading messages. Please try again later.</li>';
                         // Optionally detach listener on persistent error? For now, keep trying.
                    });
                    firebaseListenerAttached = true; // Mark listener as active
                }

            } else { // Hiding messages
                messagesListUl.classList.add('hidden');
                showMessagesButton.textContent = 'Show Messages';
                // Note: onValue listener remains attached by default.
                // For a simple app, this is usually fine. To detach:
                // import { off } from "...firebase-database.js";
                // off(rsvpsInDB); // Detach all listeners on this ref
                // firebaseListenerAttached = false;
            }
        });
    } else {
         if (!showMessagesButton) console.error("Show Messages button not found.");
         if (!messagesListUl) console.error("Messages list UL not found.");
    }

    // --- Helper Function to Add Formatted Message to List ---
    function appendMessageToList(rsvp) {
        const li = document.createElement('li');

        // Format timestamp
        let dateString = 'Timestamp unavailable';
        if (rsvp.timestamp) {
            try {
                const date = new Date(rsvp.timestamp);
                dateString = date.toLocaleString(); // Use locale-sensitive formatting
            } catch (e) { console.warn("Could not parse timestamp:", rsvp.timestamp); }
        }

        // Create spans for styling (using textContent for safety)
        const attendeeInfoSpan = document.createElement('span');
        attendeeInfoSpan.className = 'attendee-info';
        // Sanitize email display slightly (optional)
        attendeeInfoSpan.textContent = `From: ${String(rsvp.email || 'Unknown Email').replace(/</g, "&lt;")}`;

        const messageTextSpan = document.createElement('span');
        messageTextSpan.className = 'message-text'; // Added class for potential styling
        messageTextSpan.textContent = `: ${String(rsvp.message || '').replace(/</g, "&lt;")}`; // Sanitize

        const timeStampSpan = document.createElement('span');
        timeStampSpan.className = 'timestamp';
        timeStampSpan.textContent = dateString;

        // Append spans to the list item
        li.appendChild(attendeeInfoSpan);
        li.appendChild(messageTextSpan);
        li.appendChild(timeStampSpan);

        messagesListUl.appendChild(li);
    }

}); // End of DOMContentLoaded
