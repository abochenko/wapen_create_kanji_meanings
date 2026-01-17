// Global variable to store kanji data
let kanjiMeanings = [];

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
                obj[header.trim()] = values[i] ? values[i].trim() : '';
            });
            return obj;
        });
        console.log('Kanji meanings loaded:', kanjiMeanings.length);
    } catch (error) {
        console.error('Error loading kanji_meanings.csv:', error);
    }
}

// Helper to get kanji meaning
function getMeaningFromKanjiEntry(kanjiEntryObj, langCode) {
    if (!kanjiEntryObj) return 'N/A';
    const meaningKey = `Meaning_${langCode}`;
    return kanjiEntryObj[meaningKey] || kanjiEntryObj.Meaning_EN || 'N/A';
}

// Function to render the results
async function renderResults() {
    await loadKanjiMeanings();

    const storedData = localStorage.getItem('kanjiPersonalizationState');
    const resultsContainer = document.getElementById('resultsContainer');

    if (storedData) {
        const personState = JSON.parse(storedData);
        const selectedLanguage = localStorage.getItem('selectedLanguage') || 'EN';
        
        let tableRowsHtml = '';

        personState.segments.forEach(seg => {
            const typedKanji = seg.kanji;
            let kanjiEntry = kanjiMeanings.find(entry => entry.Kanji === typedKanji);
            const meaningText = getMeaningFromKanjiEntry(kanjiEntry, selectedLanguage);

            // シンプルな行構造（CSSで幅を制御）
            tableRowsHtml += `
                <tr>
                    <td class="segment-cell">${seg.alphabetical || ''}</td>
                    <td class="kanji-cell">${typedKanji || '??'}</td>
                    <td class="meaning-cell">${meaningText}</td>
                </tr>
            `;
        });

        resultsContainer.innerHTML = `
            <h2>${personState.alphabeticalName}</h2>
            <table class="kanji-segments-table">
                <thead>
                    <tr>
                        <th>Alpha</th>
                        <th>Kanji</th>
                        <th>Meaning</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>
        `;
    } else {
        resultsContainer.innerHTML = '<p>No data found.</p>';
    }
}

document.addEventListener('DOMContentLoaded', renderResults);
