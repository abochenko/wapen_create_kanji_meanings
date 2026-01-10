// Global variable to store kanji data
let kanjiMeanings = [];

// Global variable to store the state of the single person's inputs
// Structure: 
// { id: 'personGroup1', alphabeticalName: 'MICHEL', segments: [
//   { alphabetical: 'MI', typedKanji: '舞', kanjiMeaningEntry: { /* full kanji entry */ } },
//   { alphabetical: 'CHE', typedKanji: '家', kanjiMeaningEntry: { /* full kanji entry */ } }
// ]}
let personState = {
    id: 'personGroup1',
    alphabeticalName: '',
    segments: [{ alphabetical: '', typedKanji: '', kanjiMeaningEntry: null }]
};

// Variable to hold the reference to the results window
let resultsWindow = null;

// Function to load and parse the CSV file
async function loadKanjiMeanings() {
    try {
        const response = await fetch('kanji_meanings.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');

        kanjiMeanings = lines.slice(1).map(line => {
            const values = line.split(',');
            let obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i].trim();
            });
            return obj;
        });
        console.log('Kanji meanings loaded and parsed successfully:', kanjiMeanings.length, 'entries');
        console.log('First 5 Kanji entries:', kanjiMeanings.slice(0, 5).map(entry => entry.Kanji));
    } catch (error) {
        console.error('Error loading or parsing kanji_meanings.csv:', error);
    }
}

// Helper to get kanji meaning in selected language from a kanjiMeaningEntry object
function getMeaningFromKanjiEntry(kanjiEntryObj, langCode) {
    if (!kanjiEntryObj) return '';
    const meaningKey = `Meaning_${langCode}`;
    // Ensure the key exists, otherwise fallback to English or empty string
    return kanjiEntryObj[meaningKey] || kanjiEntryObj.Meaning_EN || '';
}

// Function to update the meaning display next to a Kanji input field
function updateKanjiMeaningDisplay(segmentIndex, typedKanji) {
    const meaningDisplayDiv = document.getElementById(`kanjiMeaningDisplay1_${segmentIndex + 1}`);
    if (!meaningDisplayDiv) return;

    console.log('Searching for Kanji:', typedKanji, '(Segment:', segmentIndex + 1, ')');

    const kanjiEntry = kanjiMeanings.find(entry => entry.Kanji === typedKanji);

    if (kanjiEntry) {
        console.log('Kanji found:', kanjiEntry.Kanji);
        personState.segments[segmentIndex].kanjiMeaningEntry = kanjiEntry;
        const selectedLanguage = document.getElementById('languageSelect').value;
        meaningDisplayDiv.textContent = `Meaning (${selectedLanguage}): ${getMeaningFromKanjiEntry(kanjiEntry, selectedLanguage)}`;
    } else {
        console.log('Kanji not found in meanings list for:', typedKanji);
        personState.segments[segmentIndex].kanjiMeaningEntry = null;
        meaningDisplayDiv.textContent = 'Meaning: Not Found';
    }
}

// Function to setup event listeners for an individual segment's input fields
function setupSegmentInputEventListeners(segmentIndex) {
    const alphabeticalSegmentInput = document.getElementById(`alphabeticalSegment1_${segmentIndex + 1}`);
    const kanjiInput = document.getElementById(`kanjiInput1_${segmentIndex + 1}`);

    if (alphabeticalSegmentInput) {
        alphabeticalSegmentInput.addEventListener('input', (e) => {
            if (personState.segments[segmentIndex]) {
                personState.segments[segmentIndex].alphabetical = e.target.value.trim();
            }
        });
    }

    if (kanjiInput) {
        kanjiInput.addEventListener('input', (e) => {
            if (personState.segments[segmentIndex]) {
                const typedKanji = e.target.value.trim();
                personState.segments[segmentIndex].typedKanji = typedKanji;
                updateKanjiMeaningDisplay(segmentIndex, typedKanji);
            }
        });
    }
}

// Function to add a new segment input field for the person
function addSegmentField() {
    const segments = personState.segments;
    // Limit to prevent excessive segments, e.g., 10
    if (segments.length >= 10) {
        alert('Maximum 10 segments allowed.');
        return;
    }

    const newSegmentIndex = segments.length;
    segments.push({ alphabetical: '', typedKanji: '', kanjiMeaningEntry: null });

    const segmentsContainer = document.getElementById(`segmentsContainer1`);
    const segmentPairDiv = document.createElement('div');
    segmentPairDiv.classList.add('segment-pair');
    segmentPairDiv.id = `segmentPair1_${newSegmentIndex + 1}`;
    segmentPairDiv.innerHTML = `
        <label for="alphabeticalSegment1_${newSegmentIndex + 1}">Segment (B):</label>
        <input type="text" id="alphabeticalSegment1_${newSegmentIndex + 1}" placeholder="e.g., MI">
        <label for="kanjiInput1_${newSegmentIndex + 1}">Kanji (C):</label>
        <input type="text" id="kanjiInput1_${newSegmentIndex + 1}" placeholder="e.g., \u81e3">
        <div id="kanjiMeaningDisplay1_${newSegmentIndex + 1}" class="typed-kanji-meaning"></div>
    `;
    segmentsContainer.appendChild(segmentPairDiv);

    setupSegmentInputEventListeners(newSegmentIndex);
    updateKanjiMeaningDisplay(newSegmentIndex, '');
}

// Function to remove the last segment input field for the person
function removeSegmentField() {
    const segments = personState.segments;
    if (segments.length <= 1) {
        alert('At least one segment must remain.');
        return;
    }

    const lastSegmentIndex = segments.length - 1;
    const lastSegmentPair = document.getElementById(`segmentPair1_${lastSegmentIndex + 1}`);
    if (lastSegmentPair) {
        lastSegmentPair.remove();
        segments.pop(); // Remove from state
    }
}

// Function to generate the HTML content for the results page
function generateResultsPageHtml() {
    const selectedLanguage = document.getElementById('languageSelect').value;
    
    // Start of the HTML structure for the results page
    let resultsHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Generated Japanese Name</title>
            <link rel="stylesheet" href="style.css">
            <style>
                /* Basic styles for the results page */
                body { 
                    font-family: sans-serif; 
                    margin: 0; 
                    background-color: #f4f4f4; 
                    color: #333; 
                    min-height: 100vh; 
                    display: flex; 
                    flex-direction: column;
                }
                header { 
                    background-image: url('header_bg.jpg'); /* Placeholder for header image */
                    background-size: cover; 
                    background-position: center; 
                    min-height: 100px; /* Adjust as needed */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                header h1 {
                    color: white;
                    margin: 0;
                    padding: 20px;
                }
                main {
                    flex: 1;
                    padding: 20px;
                    max-width: 960px;
                    margin: 20px auto;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                footer { 
                    background-image: url('footer_bg.jpg'); /* Placeholder for footer image */
                    background-size: cover; 
                    background-position: center; 
                    min-height: 80px; /* Adjust as needed */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    margin-top: auto;
                }
                .generated-name-result { 
                    border-bottom: 1px solid #eee; 
                    padding-bottom: 15px; 
                    margin-bottom: 15px; 
                    text-align: center; /* Center the content */
                }
                .generated-name-result:last-child { border-bottom: none; margin-bottom: 0; }
                .generated-name-result h2 { color: #007bff; margin-top: 0; margin-bottom: 20px; font-size: 2em; }
                .kanji-segments-area {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center; /* Center segment pairs */
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .segment-kanji-pair {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: #f9f9f9;
                    min-width: 120px; /* Minimum width for each segment */
                }
                .display-segment { font-size: 1em; color: #888; margin-bottom: 5px; }
                .display-kanji { font-size: 2.5em; font-weight: bold; color: #0056b3; margin-bottom: 5px; }
                .display-meaning { font-size: 1em; color: #666; }
                .close-button-container { text-align: center; margin-top: 30px; }
                .close-button { background-color: #dc3545; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
                .close-button:hover { background-color: #c82333; }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    main { margin: 10px; padding: 15px; }
                    .kanji-segments-area { flex-direction: column; align-items: center; }
                    .segment-kanji-pair { width: 90%; }
                }
                @media (max-width: 480px) {
                    header h1 { font-size: 1.5em; }
                    .generated-name-result h2 { font-size: 1.5em; }
                    .display-kanji { font-size: 2em; }
                }

                /* Print specific styles */
                @media print {
                    body { background-color: white; margin: 0; padding: 0; font-size: 12pt; color: black; }
                    header, footer, .close-button-container { display: none !important; }
                    main { box-shadow: none; border: none; padding: 0; margin: 0; max-width: none; }
                    h1, .generated-name-result h2 { color: black; text-align: center; padding: 10px 0; margin: 0; border-bottom: 1px solid #ccc; page-break-after: avoid; }
                    .generated-name-result { border: 1px solid #eee; page-break-inside: avoid; margin-bottom: 15px; padding: 10px; }
                    .kanji-segments-area { justify-content: flex-start; gap: 10px; }
                    .segment-kanji-pair { min-width: unset; border: none; background-color: transparent; padding: 0; }
                    .display-segment, .display-meaning { font-size: 0.9em; }
                    .display-kanji { font-size: 1.8em; color: #000; }
                }
            </style>
        </head>
        <body>
            <header>
                <h1>Your Japanese Name</h1>
            </header>
            <main>
    `;

    const person = personState;
    if (person && person.alphabeticalName) {
        let kanjiSegmentsHtml = '';

        person.segments.forEach(seg => {
            const typedKanji = seg.typedKanji;
            const meaningText = seg.kanjiMeaningEntry ? getMeaningFromKanjiEntry(seg.kanjiMeaningEntry, selectedLanguage) : 'N/A';

            kanjiSegmentsHtml += `
                <div class="segment-kanji-pair">
                    <div class="display-segment">${seg.alphabetical || ''}</div>
                    <div class="display-kanji">${typedKanji || '??'}</div>
                    <div class="display-meaning">${meaningText}</div>
                </div>
            `;
        });

        resultsHtml += `
            <div class="generated-name-result">
                <h2>Original Name: ${person.alphabeticalName}</h2>
                <div class="kanji-segments-area">
                    ${kanjiSegmentsHtml}
                </div>
            </div>
        `;
    }

    resultsHtml += `
            </main>
            <footer>
                <div class="close-button-container">
                    <button class="close-button" onclick="window.close()">Close Page</button>
                </div>
            </footer>
        </body>
        </html>
    `;
    return resultsHtml;
}

// Function to display the generated names and meanings on a new page
function displayGeneratedNames() {
    const generatedHtml = generateResultsPageHtml();

    if (resultsWindow && !resultsWindow.closed) {
        // If results window is already open, update its content
        resultsWindow.document.open();
        resultsWindow.document.write(generatedHtml);
        resultsWindow.document.close();
        resultsWindow.focus();
    } else {
        // Otherwise, open a new window
        resultsWindow = window.open('', '_blank', 'noopener,noreferrer'); // Added security features
        if (resultsWindow) {
            resultsWindow.document.write(generatedHtml);
            resultsWindow.document.close();
        } else {
            alert('Popup blocked! Please allow popups for this site to view results.');
        }
    }
    console.log('Generated name displayed in a new window.');
}

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    loadKanjiMeanings(); // Ensure kanji data is loaded on page load

    // Setup for the single person input field
    const alphabeticalNameInput = document.getElementById('alphabeticalName1');
    if (alphabeticalNameInput) {
        alphabeticalNameInput.addEventListener('input', (event) => {
            personState.alphabeticalName = event.target.value.trim();
        });
    }

    setupSegmentInputEventListeners(0); // Setup for the initial segment
    updateKanjiMeaningDisplay(0, ''); // Update meaning display for the initial segment

    // Add event listeners for add/remove segment buttons
    const addSegmentBtn = document.querySelector('#personGroup1 .add-segment-btn');
    if (addSegmentBtn) {
        addSegmentBtn.addEventListener('click', addSegmentField);
    }

    const removeSegmentBtn = document.querySelector('#personGroup1 .remove-segment-btn');
    if (removeSegmentBtn) {
        removeSegmentBtn.addEventListener('click', removeSegmentField);
    }

    // Event listener for Generate Name Button
    const generateNameBtn = document.getElementById('generateNameBtn');
    if (generateNameBtn) {
        generateNameBtn.addEventListener('click', displayGeneratedNames);
    }

    // Event listener for Language Select
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        // When language changes, update meaning display for all current segments on the input page
        languageSelect.addEventListener('change', () => {
            personState.segments.forEach((seg, index) => {
                if (seg.typedKanji) {
                    updateKanjiMeaningDisplay(index, seg.typedKanji);
                }
            });
            // Also, if the results window is open, refresh it with new language meanings
            if (resultsWindow && !resultsWindow.closed) {
                displayGeneratedNames();
            }
        });
    }
});
