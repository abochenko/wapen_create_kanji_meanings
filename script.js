// Global variable to store kanji data
let kanjiMeanings = [];

// Global variable to store the state of the single person's inputs
let personState = {
    id: 'personGroup1',
    alphabeticalName: '',
    segments: [{ alphabetical: '', typedKanji: '', kanjiMeaningEntry: null }]
};

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
        <input type="text" id="kanjiInput1_${newSegmentIndex + 1}" placeholder="e.g., \u821e"> <!-- Fixed placeholder to 舞 -->
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

// Function to handle Generate Kanji Name button click
function displayGeneratedNames() {
    const selectedLanguage = document.getElementById('languageSelect').value;

    // Save personState and selectedLanguage to localStorage
    localStorage.setItem('kanjiGeneratorData', JSON.stringify({
        personState: personState,
        selectedLanguage: selectedLanguage
    }));

    // Redirect to result.html
    window.location.href = 'result.html';
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

    // Initial setup for the first segment
    setupSegmentInputEventListeners(0);

    // Add event listeners for add/remove segment buttons
    const addSegmentBtn = document.querySelector('.add-segment-btn');
    if (addSegmentBtn) {
        addSegmentBtn.addEventListener('click', addSegmentField);
    }

    const removeSegmentBtn = document.querySelector('.remove-segment-btn');
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
        });
    }
});

console.log("Updated script.js for single person input, localStorage data transfer, and result.html redirection.")
