// Global variable to store kanji data (will be loaded for meaning lookup)
let kanjiMeanings = [];

// Function to load and parse the CSV file (similar to main script)
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
        console.log('Kanji meanings loaded and parsed successfully for result_script:', kanjiMeanings.length, 'entries');
    } catch (error) {
        console.error('Error loading or parsing kanji_meanings.csv in result_script:', error);
    }
}

// Helper to get kanji meaning in selected language from a kanjiMeaningEntry object
function getMeaningFromKanjiEntry(kanjiEntryObj, langCode) {
    if (!kanjiEntryObj) return '';
    const meaningKey = `Meaning_${langCode}`;
    return kanjiEntryObj[meaningKey] || kanjiEntryObj.Meaning_EN || ''; // Fallback to English or empty string
}

// Function to render the results on the result.html page
async function renderResults() {
    await loadKanjiMeanings(); // Ensure kanji data is available for meaning lookup

    const storedData = localStorage.getItem('kanjiGeneratorData');
    const resultsContainer = document.getElementById('resultsContainer');

    if (!storedData) {
        resultsContainer.innerHTML = '<p>No data found. Please go back and generate a name.</p>';
        return;
    }

    const { personState, selectedLanguage } = JSON.parse(storedData);

    if (personState && personState.alphabeticalName) {
        let tableRowsHtml = '';

        personState.segments.forEach(seg => {
            const typedKanji = seg.typedKanji;
            // Use the stored kanjiMeaningEntry, if available, otherwise try to find it again
            let kanjiEntry = seg.kanjiMeaningEntry;
            if (!kanjiEntry && typedKanji) {
                kanjiEntry = kanjiMeanings.find(entry => entry.Kanji === typedKanji);
            }

            const meaningText = kanjiEntry ? getMeaningFromKanjiEntry(kanjiEntry, selectedLanguage) : 'N/A';

            tableRowsHtml += `
                <tr>
                    <td class="segment-cell" data-label="Alphabet">${seg.alphabetical || ''}</td>
                    <td class="kanji-cell" data-label="Kanji">${typedKanji || '??'}</td>
                    <td class="meaning-cell" data-label="Meaning">${meaningText}</td>
                </tr>
            `;
        });

        resultsContainer.innerHTML = `
            <div class="generated-name-result">
                <h2>Original Name: ${personState.alphabeticalName}</h2>
                <table class="kanji-segments-table">
                    <thead>
                        <tr>
                            <th>Alphabet</th>
                            <th>Kanji</th>
                            <th>Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = '<p>No name data to display.</p>';
    }
}

document.addEventListener('DOMContentLoaded', renderResults);

console.log("Updated result_script.js to display generated names in a table format.");
