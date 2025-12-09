// Global variable to store kanji data
let kanjiMeanings = [];

// Global variable to store the state of all persons and their inputs
// Structure:
// {
//   '1': { id: 'personGroup1', alphabeticalName: 'MICHEL', segments: [
//     { alphabetical: 'MI', typedKanji: '舞', kanjiMeaningEntry: { /* full kanji entry */ } },
//     { alphabetical: 'CHE', typedKanji: '家', kanjiMeaningEntry: { /* full kanji entry */ } }
//   ]}
// }
let personsState = {};
let personCounter = 1; // Tracks number of persons

// Variable to hold the reference to the results window
let resultsWindow = null;

// Function to load and parse the CSV file (maintained as is)
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
        // Log first few entries to confirm data presence
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
function updateKanjiMeaningDisplay(personId, segmentIndex, typedKanji) {
    const meaningDisplayDiv = document.getElementById(`kanjiMeaningDisplay${personId}_${segmentIndex + 1}`);
    if (!meaningDisplayDiv) return;

    console.log('Searching for Kanji:', typedKanji, '(Person:', personId, 'Segment:', segmentIndex + 1, ')'); // Debug log

    const kanjiEntry = kanjiMeanings.find(entry => entry.Kanji === typedKanji);

    if (kanjiEntry) {
        console.log('Kanji found:', kanjiEntry.Kanji); // Debug log
        personsState[personId].segments[segmentIndex].kanjiMeaningEntry = kanjiEntry; // Store entire kanji entry
        const selectedLanguage = document.getElementById('languageSelect').value;
        meaningDisplayDiv.textContent = `Meaning (${selectedLanguage}): ${getMeaningFromKanjiEntry(kanjiEntry, selectedLanguage)}`;
    } else {
        console.log('Kanji not found in meanings list for:', typedKanji); // Debug log
        personsState[personId].segments[segmentIndex].kanjiMeaningEntry = null;
        meaningDisplayDiv.textContent = 'Meaning: Not Found';
    }
}

// Function to setup event listeners for an individual segment's input fields
function setupSegmentInputEventListeners(personId, segmentIndex) {
    const alphabeticalSegmentInput = document.getElementById(`alphabeticalSegment${personId}_${segmentIndex + 1}`);
    const kanjiInput = document.getElementById(`kanjiInput${personId}_${segmentIndex + 1}`);

    if (alphabeticalSegmentInput) {
        alphabeticalSegmentInput.addEventListener('input', (e) => {
            if (personsState[personId] && personsState[personId].segments[segmentIndex]) {
                personsState[personId].segments[segmentIndex].alphabetical = e.target.value.trim();
            }
        });
    }

    if (kanjiInput) {
        kanjiInput.addEventListener('input', (e) => {
            if (personsState[personId] && personsState[personId].segments[segmentIndex]) {
                const typedKanji = e.target.value.trim();
                personsState[personId].segments[segmentIndex].typedKanji = typedKanji;
                updateKanjiMeaningDisplay(personId, segmentIndex, typedKanji);
            }
        });
    }
}

// Function to add a new segment input field for a given person
function addSegmentField(personId) {
    const segments = personsState[personId].segments;
    // Limit to prevent excessive segments, e.g., 10
    if (segments.length >= 10) {
        alert('Maximum 10 segments per person allowed.');
        return;
    }

    const newSegmentIndex = segments.length;
    segments.push({ alphabetical: '', typedKanji: '', kanjiMeaningEntry: null });

    const segmentsContainer = document.getElementById(`segmentsContainer${personId}`);
    const segmentPairDiv = document.createElement('div');
    segmentPairDiv.classList.add('segment-pair');
    segmentPairDiv.id = `segmentPair${personId}_${newSegmentIndex + 1}`;
    segmentPairDiv.innerHTML = `
        <label for="alphabeticalSegment${personId}_${newSegmentIndex + 1}">Segment (B):</label>
        <input type="text" id="alphabeticalSegment${personId}_${newSegmentIndex + 1}" placeholder="e.g., MI">
        <label for="kanjiInput${personId}_${newSegmentIndex + 1}">Kanji (C):</label>
        <input type="text" id="kanjiInput${personId}_${newSegmentIndex + 1}" placeholder="e.g., \u81e3">
        <div id="kanjiMeaningDisplay${personId}_${newSegmentIndex + 1}" class="typed-kanji-meaning"></div>
    `;
    segmentsContainer.appendChild(segmentPairDiv);

    setupSegmentInputEventListeners(personId, newSegmentIndex);
    // Immediately check meaning if there's any initial value (though it's empty here)
    updateKanjiMeaningDisplay(personId, newSegmentIndex, '');
}

// Function to remove the last segment input field for a given person
function removeSegmentField(personId) {
    const segments = personsState[personId].segments;
    if (segments.length <= 1) {
        alert('At least one segment must remain.');
        return;
    } // Always keep at least one segment

    const lastSegmentIndex = segments.length - 1;
    const lastSegmentPair = document.getElementById(`segmentPair${personId}_${lastSegmentIndex + 1}`);
    if (lastSegmentPair) {
        lastSegmentPair.remove();
        segments.pop(); // Remove from state
    }
}

function setupPersonInputEventListeners(personId) {
    const alphabeticalNameInput = document.getElementById(`alphabeticalName${personId}`);
    const addSegmentBtn = document.querySelector(`#personGroup${personId} .add-segment-btn`);
    const removeSegmentBtn = document.querySelector(`#personGroup${personId} .remove-segment-btn`);

    if (alphabeticalNameInput) {
        alphabeticalNameInput.addEventListener('input', (event) => {
            if (!personsState[personId]) {
                personsState[personId] = { id: `personGroup${personId}`, alphabeticalName: '', segments: [{ alphabetical: '', typedKanji: '', kanjiMeaningEntry: null }] };
            }
            personsState[personId].alphabeticalName = event.target.value.trim();
        });
    }

    // Implement Add Segment button logic
    if (addSegmentBtn) {
        addSegmentBtn.addEventListener('click', () => addSegmentField(personId));
    }

    // Implement Remove Segment button logic
    if (removeSegmentBtn) {
        removeSegmentBtn.addEventListener('click', () => removeSegmentField(personId));
    }

    // Setup listeners for initially present segments
    personsState[personId].segments.forEach((_, idx) => {
        setupSegmentInputEventListeners(personId, idx);
    });
}

// Function to add a new person input field
function addPersonField() {
    // Limit to 5 persons
    if (Object.keys(personsState).length >= 5) {
        alert('Maximum 5 persons allowed.');
        return;
    }
    personCounter++;
    const newPersonId = personCounter;
    const newPersonGroupId = `personGroup${newPersonId}`;

    const personsContainer = document.getElementById('personsContainer');
    const newDiv = document.createElement('div');
    newDiv.classList.add('person-group');
    newDiv.id = newPersonGroupId;
    newDiv.innerHTML = `
        <h2>Person ${newPersonId}</h2>
        <label for="alphabeticalName${newPersonId}">Alphabetical Name (A):</label>
        <input type="text" id="alphabeticalName${newPersonId}" placeholder="e.g., MICHEL">
        <div class="segments-container" id="segmentsContainer${newPersonId}">
            <div class="segment-pair" id="segmentPair${newPersonId}_1">
                <label for="alphabeticalSegment${newPersonId}_1">Segment (B):</label>
                <input type="text" id="alphabeticalSegment${newPersonId}_1" placeholder="e.g., MI">
                <label for="kanjiInput${newPersonId}_1">Kanji (C):</label>
                <input type="text" id="kanjiInput${newPersonId}_1" placeholder="e.g., \u81e3">
                <div id="kanjiMeaningDisplay${newPersonId}_1" class="typed-kanji-meaning"></div>
            </div>
        </div>
        <button class="add-segment-btn" data-person-id="${newPersonId}">Add Segment</button>
        <button class="remove-segment-btn" data-person-id="${newPersonId}">Remove Segment</button>
    `;
    personsContainer.appendChild(newDiv);

    // Initialize state for new person with one empty segment
    personsState[newPersonId] = {
        id: newPersonGroupId,
        alphabeticalName: '',
        segments: [{ alphabetical: '', typedKanji: '', kanjiMeaningEntry: null }]
    };
    // Setup event listeners for the new person's input fields
    setupPersonInputEventListeners(newPersonId);
    setupSegmentInputEventListeners(newPersonId, 0); // Setup for the initial segment
    updateKanjiMeaningDisplay(newPersonId, 0, ''); // Update meaning display for the initial segment
}

// Function to remove the last person input field
function removePersonField() {
    if (Object.keys(personsState).length <= 1) {
        alert('At least one person must remain.');
        return;
    } // Always keep at least one person
    const lastPersonId = personCounter;
    const lastPersonGroup = document.getElementById(`personGroup${lastPersonId}`);
    if (lastPersonGroup) {
        lastPersonGroup.remove();
        delete personsState[lastPersonId]; // Clean up state
        personCounter--;
    }
}

// Function to generate the HTML content for the results page
function generateResultsPageHtml() {
    const selectedLanguage = document.getElementById('languageSelect').value;
    let resultsHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Generated Japanese Names</title>
            <link rel="stylesheet" href="style.css">
            <style>
                /* Basic styles for the results page */
                body { font-family: sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
                h1 { color: #0056b3; text-align: center; margin-bottom: 30px; }
                .results-container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); margin-bottom: 20px; }
                .generated-name-result { border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }
                .generated-name-result:last-child { border-bottom: none; margin-bottom: 0; }
                .generated-name-result h2 { color: #333; margin-top: 0; margin-bottom: 10px; }
                .kanji-display { font-size: 2em; margin-bottom: 5px; color: #0056b3; }
                .meaning-display { font-size: 1.1em; color: #666; }
                .segment-kanji-pair { display: inline-block; margin-right: 15px; text-align: center; }
                .display-segment { font-size: 0.9em; color: #888; }
                .display-kanji { font-size: 1.5em; font-weight: bold; }
                .display-meaning { font-size: 0.9em; color: #666; }
                .close-button-container { text-align: center; margin-top: 30px; }
                .close-button { background-color: #dc3545; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
                .close-button:hover { background-color: #c82333; }

                /* Print specific styles, similar to main style.css */
                @media print {
                    body { background-color: white; margin: 0; padding: 0; font-size: 12pt; color: black; }
                    h1 { color: black; text-align: center; padding: 10px 0; margin: 0; border-bottom: 1px solid #ccc; }
                    .close-button-container { display: none !important; }
                    .results-container { box-shadow: none; border: none; padding: 20px; margin-top: 0; }
                    .generated-name-result { border: 1px solid #eee; page-break-inside: avoid; margin-bottom: 20px; padding: 15px; }
                    .generated-name-result h2 { font-size: 1.5em; color: #333; margin-bottom: 10px; }
                    .kanji-display { font-size: 1.8em; color: #000; margin-bottom: 5px; }
                    .meaning-display { font-size: 1em; color: #555; }
                    .display-kanji, .display-meaning { display: inline-block; margin-right: 5px; }
                }
            </style>
        </head>
        <body>
            <h1>Generated Japanese Names</h1>
            <div class="results-container">
    `;

    for (const personId in personsState) {
        const person = personsState[personId];
        if (person && person.alphabeticalName) {
            let kanjiSegmentsHtml = '';

            person.segments.forEach(seg => {
                const typedKanji = seg.typedKanji;
                // Use the updated getMeaningFromKanjiEntry function
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
                    <h2>Original Name (A): ${person.alphabeticalName}</h2>
                    <div class="kanji-segments-area">
                        ${kanjiSegmentsHtml}
                    </div>
                </div>
            `;
        }
    }

    resultsHtml += `
            </div>
            <div class="close-button-container">
                <button class="close-button" onclick="window.close()">Close Page</button>
            </div>
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
        resultsWindow = window.open('', '_blank');
        if (resultsWindow) {
            resultsWindow.document.write(generatedHtml);
            resultsWindow.document.close();
        } else {
            alert('Popup blocked! Please allow popups for this site to view results.');
        }
    }
    console.log('Generated names displayed in a new window.');
}

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    loadKanjiMeanings(); // Ensure kanji data is loaded on page load

    // Setup initial person input field
    const initialPersonId = 1;
    personsState[initialPersonId] = {
        id: `personGroup${initialPersonId}`,
        alphabeticalName: '',
        segments: [{ alphabetical: '', typedKanji: '', kanjiMeaningEntry: null }]
    };
    setupPersonInputEventListeners(initialPersonId);
    setupSegmentInputEventListeners(initialPersonId, 0); // Setup for the initial segment
    updateKanjiMeaningDisplay(initialPersonId, 0, ''); // Update meaning display for the initial segment

    // Add event listeners for add/remove person buttons
    const addPersonBtn = document.getElementById('addPersonBtn');
    if (addPersonBtn) {
        addPersonBtn.addEventListener('click', addPersonField);
    }

    const removePersonBtn = document.getElementById('removePersonBtn');
    if (removePersonBtn) {
        removePersonBtn.addEventListener('click', removePersonField);
    }

    // Event listener for Generate Name Button
    const generateNameBtn = document.getElementById('generateNameBtn');
    if (generateNameBtn) {
        generateNameBtn.addEventListener('click', displayGeneratedNames);
    }

    // Event listener for Language Select
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', displayGeneratedNames); // Re-display names with new language
    }
});

print("Updated script.js to store entire kanji object and handle new language options.")
