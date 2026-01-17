let kanjiMeanings = [];

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
    } catch (error) {
        console.error('CSV Load Error:', error);
    }
}

function getMeaningFromKanjiEntry(kanjiEntryObj, langCode) {
    if (!kanjiEntryObj) return 'N/A';
    const meaningKey = `Meaning_${langCode}`;
    return kanjiEntryObj[meaningKey] || kanjiEntryObj.Meaning_EN || 'N/A';
}

async function renderResults() {
    await loadKanjiMeanings();

    // script.jsの54行目付近で保存されている名前に合わせる
    const rawData = localStorage.getItem('kanjiGeneratorData');
    const resultsContainer = document.getElementById('resultsContainer');

    if (rawData) {
        const { personState, selectedLanguage } = JSON.parse(rawData);
        
        let tableRowsHtml = '';

        if (personState && personState.segments) {
            personState.segments.forEach(seg => {
                // script.jsのプロパティ名 'typedKanji' を使用
                const kanji = seg.typedKanji; 
                let kanjiEntry = kanjiMeanings.find(entry => entry.Kanji === kanji);
                const meaningText = getMeaningFromKanjiEntry(kanjiEntry, selectedLanguage);

                tableRowsHtml += `
                    <tr>
                        <td class="segment-cell">${seg.alphabetical || ''}</td>
                        <td class="kanji-cell">${kanji || '??'}</td>
                        <td class="meaning-cell">${meaningText}</td>
                    </tr>
                `;
            });

            resultsContainer.innerHTML = `
                <h2>${personState.alphabeticalName || 'Japanese Name'}</h2>
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
        }
    } else {
        resultsContainer.innerHTML = '<p style="text-align:center;">No data found. Please generate a name first.</p>';
    }
}

document.addEventListener('DOMContentLoaded', renderResults);
