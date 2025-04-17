// script.js - Updated for Both Attending & Not Attending Backgrounds

// Wait until the entire HTML page is loaded and ready
document.addEventListener('DOMContentLoaded', function() {

    // Find the RSVP form element using its ID
    const rsvpForm = document.getElementById('rsvpForm');
    // Find the div where we will show the confirmation message
    const confirmationMessageDiv = document.getElementById('confirmation-message');
    // Get a reference to the body element to change its class
    const bodyElement = document.body;

    // Make sure the form element was actually found before trying to use it
    if (rsvpForm) {
        // Add an event listener that waits for the form to be submitted
        rsvpForm.addEventListener('submit', function(event) {

            // IMPORTANT: Prevent the browser's default form submission behavior
            event.preventDefault();

            // --- Prepare the confirmation area ---
            confirmationMessageDiv.innerHTML = '';
            confirmationMessageDiv.classList.remove('success', 'error', 'info');
            confirmationMessageDiv.style.display = 'none';

            // --- Prepare the background ---
            // **MODIFIED**: Remove BOTH potential background classes on every submission.
            // This ensures we always start from the default gradient background.
            bodyElement.classList.remove('body-gif-background', 'body-sad-gif-background');

            // --- Get the user's attendance choice ---
            const formData = new FormData(rsvpForm);
            const attendanceChoice = formData.get('attendance_status');

            // --- Display the appropriate message AND set background ---
            if (attendanceChoice === 'yes') {
                // User is attending! Display message...
                confirmationMessageDiv.innerHTML = 'Woohoo! Can\'t wait to see your meme-tastic costume! 🎉 See you there!';
                confirmationMessageDiv.classList.add('success');
                confirmationMessageDiv.style.display = 'block';

                // Add the 'attending' GIF background class
                bodyElement.classList.add('body-gif-background');

            } else if (attendanceChoice === 'no') {
                // User is not attending. Display message.
                confirmationMessageDiv.innerHTML = 'Aww, sorry you can\'t make it! Thanks for letting us know.';
                // confirmationMessageDiv.classList.add('info'); // Optional styling class
                confirmationMessageDiv.style.display = 'block';

                // **NEW**: Add the 'not attending' (sad) GIF background class
                bodyElement.classList.add('body-sad-gif-background');

            } else {
                // Error handling. Display message.
                confirmationMessageDiv.innerHTML = 'Hmm, something went wrong. Please ensure you select an attendance option.';
                confirmationMessageDiv.classList.add('error');
                confirmationMessageDiv.style.display = 'block';
                // No background class added in case of error (default gradient remains).
            }

            // Scroll the page smoothly to the confirmation message
            confirmationMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Optional: Clear the form fields
            // rsvpForm.reset();

        }); // End of the form submission event listener

    } else {
        // Log an error if the form element wasn't found
        console.error('Error: RSVP Form element with ID "rsvpForm" was not found.');
    }

}); // End of the DOMContentLoaded event listener