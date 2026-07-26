        // Suomen kaupunkien koordinaatit (yleisimmät)
        const finnishCities = {
            'kuopio': { lat: 62.8924, lng: 27.6782 },
            'helsinki': { lat: 60.1699, lng: 24.9384 },
            'espoo': { lat: 60.2055, lng: 24.6559 },
            'tampere': { lat: 61.4978, lng: 23.7610 },
            'vantaa': { lat: 60.2934, lng: 25.0378 },
            'oulu': { lat: 65.0121, lng: 25.4651 },
            'turku': { lat: 60.4518, lng: 22.2666 },
            'jyväskylä': { lat: 62.2426, lng: 25.7473 },
            'lahti': { lat: 60.9827, lng: 25.6612 },
            'pori': { lat: 61.4851, lng: 21.7974 },
            'kouvola': { lat: 60.8679, lng: 26.7042 },
            'joensuu': { lat: 62.6010, lng: 29.7636 },
            'lappeenranta': { lat: 61.0587, lng: 28.1887 },
            'hämeenlinna': { lat: 60.9959, lng: 24.4644 },
            'vaasa': { lat: 63.0960, lng: 21.6158 },
            'seinäjoki': { lat: 62.7876, lng: 22.8402 },
            'rovaniemi': { lat: 66.5039, lng: 25.7294 },
            'mikkeli': { lat: 61.6886, lng: 27.2723 },
            'kotka': { lat: 60.4664, lng: 26.9458 },
            'salo': { lat: 60.3833, lng: 23.1333 },
            'porvoo': { lat: 60.3929, lng: 25.6641 },
            'kokkola': { lat: 63.8376, lng: 23.1305 },
            'lohja': { lat: 60.2500, lng: 24.0667 },
            'hyvinkää': { lat: 60.6306, lng: 24.8597 },
            'nurmijärvi': { lat: 60.4722, lng: 24.8083 },
            'järvenpää': { lat: 60.4739, lng: 25.0892 },
            'rauma': { lat: 61.1275, lng: 21.5111 },
            'kajaani': { lat: 64.2270, lng: 27.7285 },
            'kerava': { lat: 60.4028, lng: 25.1053 },
            'savonlinna': { lat: 61.8687, lng: 28.8789 },
            'nokia': { lat: 61.4775, lng: 23.5080 },
            'ylöjärvi': { lat: 61.5548, lng: 23.5847 },
            'kaarina': { lat: 60.4067, lng: 22.3667 },
            'kangasala': { lat: 61.4639, lng: 24.0764 },
            'varkaus': { lat: 62.3150, lng: 27.8728 },
            'imatra': { lat: 61.1931, lng: 28.7764 },
            'riihimäki': { lat: 60.7386, lng: 24.7722 },
            'raasepori': { lat: 59.9728, lng: 23.4364 },
            'hollola': { lat: 60.9872, lng: 25.5128 },
            'lempäälä': { lat: 61.3139, lng: 23.7522 },
            'tornio': { lat: 65.8492, lng: 24.1467 },
            'siilinjärvi': { lat: 63.0833, lng: 27.6667 },
            'valkeakoski': { lat: 61.2639, lng: 24.0292 },
            'iisalmi': { lat: 63.5583, lng: 27.1917 },
            'pietarsaari': { lat: 63.6750, lng: 22.7028 },
            'kemi': { lat: 65.7364, lng: 24.5636 },
            'forssa': { lat: 60.8164, lng: 23.6236 },
            'heinola': { lat: 61.2067, lng: 26.0333 },
            'pieksämäki': { lat: 62.3000, lng: 27.1583 },
            'ylivieska': { lat: 64.0722, lng: 24.5375 },
            'hamina': { lat: 60.5697, lng: 27.1983 },
            'naantali': { lat: 60.4681, lng: 22.0264 },
            'raahe': { lat: 64.6847, lng: 24.4792 },
            'laukaa': { lat: 62.4139, lng: 25.9500 },
            'kuusamo': { lat: 65.9667, lng: 29.1833 },
            'jämsä': { lat: 61.8639, lng: 25.1903 },
            'äänekoski': { lat: 62.6028, lng: 25.7264 },
            'loviisa': { lat: 60.4569, lng: 26.2250 },
            'raisio': { lat: 60.4861, lng: 22.1694 },
            'uusikaupunki': { lat: 60.8000, lng: 21.4083 },
            'lapua': { lat: 62.9708, lng: 23.0056 },
            'vihti': { lat: 60.4167, lng: 24.3333 },
            'lieksa': { lat: 63.3167, lng: 30.0167 },
            'kurikka': { lat: 62.6194, lng: 22.4083 },
            'kitee': { lat: 62.1000, lng: 30.1333 },
            'nurmes': { lat: 63.5417, lng: 29.1333 },
            'kontiolahti': { lat: 62.7667, lng: 29.8500 },
            'liperi': { lat: 62.5333, lng: 29.3833 },
            'outokumpu': { lat: 62.7250, lng: 29.0167 },
            'kankaanpää': { lat: 61.8042, lng: 22.3917 },
            'paimio': { lat: 60.4569, lng: 22.6861 },
            'eurajoki': { lat: 61.2000, lng: 21.7333 },
            'huittinen': { lat: 61.1764, lng: 22.6972 },
            'harjavalta': { lat: 61.3139, lng: 22.1417 },
            'ulvila': { lat: 61.4292, lng: 21.8750 },
            'kokemäki': { lat: 61.2556, lng: 22.3528 },
            'laitila': { lat: 60.8764, lng: 21.6972 },
            'eura': { lat: 61.1292, lng: 22.1333 },
            'säkylä': { lat: 61.0500, lng: 22.3333 },
            'nakkila': { lat: 61.3667, lng: 22.0000 },
            'lieto': { lat: 60.5000, lng: 22.4500 },
            'parainen': { lat: 60.3000, lng: 22.3000 },
            'masku': { lat: 60.5708, lng: 22.1000 },
            'mynämäki': { lat: 60.6833, lng: 21.9833 },
            'nousiainen': { lat: 60.6000, lng: 22.0833 },
            'aura': { lat: 60.6500, lng: 22.5833 },
            'pöytyä': { lat: 60.7167, lng: 22.6167 },
            'somero': { lat: 60.6333, lng: 23.5167 },
        };

        let kokeet = [];
        let filteredKokeet = [];
        let userLocation = { lat: 62.8924, lng: 27.6782, name: 'Kuopio' }; // Oletus: Kuopio
        let currentSort = { column: 'distance', ascending: true };
        let activeTypes = new Set(); // Aktiiviset lajit (kaikki oletuksena)
        let activeLevels = new Set(); // Aktiiviset tasot (kaikki oletuksena)
        let hidePastEvents = true; // Piilota menneet tapahtumat oletuksena
        let onlyRegistrationOpen = false; // Näytä vain ne joiden ilmoittautuminen on auki

        // isRegistrationOpen siirretty shared/-moduuliin (filters.ts). Wrapper,
        // koska window.koetutkaShared asetetaan vasta deferred module-scriptissä
        // tämän classic-scriptin suorituksen jälkeen.
        function isRegistrationOpen(koe) {
            return window.koetutkaShared.isRegistrationOpen(koe);
        }

        // getCostValue, getOptionalCosts siirretty shared/-moduuliin.
        // Käytetään wrapper-funktioita (ei eager-viittausta), koska
        // window.koetutkaShared asetetaan vasta deferred module-scriptissä
        // tämän classic-scriptin suorituksen jälkeen.
        function getCostValue(cost) {
            return window.koetutkaShared.getCostValue(cost);
        }
        function getOptionalCosts(cost) {
            return window.koetutkaShared.getOptionalCosts(cost);
        }

        // haversineDistance siirretty shared/-moduuliin (haversine).

        // Laske etäisyydet kaikille kokeille
        function calculateDistances() {
            if (!userLocation) return;
            const enriched = window.koetutkaShared.addDistances(kokeet, userLocation);
            kokeet.forEach((koe, i) => {
                koe.distance = enriched[i].distance;
            });
        }

        // GPS-paikannus
        function useGPS() {
            const button = document.getElementById('gpsButton');
            button.disabled = true;
            button.innerHTML = '<span>⏳</span> Haetaan sijaintia...';

            if (!navigator.geolocation) {
                alert('Selaimesi ei tue paikannusta');
                button.disabled = false;
                button.innerHTML = '<span>📍</span> Käytä sijaintiani';
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        name: 'Nykyinen sijainti'
                    };
                    updateLocationDisplay();
                    calculateDistances();
                    sortAndRender();
                    button.disabled = false;
                    button.innerHTML = '<span>📍</span> Käytä sijaintiani';
                },
                (error) => {
                    let message = 'Paikannusvirhe';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Sijainnin käyttö estetty';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Sijaintitietoa ei saatavilla';
                            break;
                        case error.TIMEOUT:
                            message = 'Paikannuspyyntö aikakatkaistiin';
                            break;
                    }
                    alert(message);
                    button.disabled = false;
                    button.innerHTML = '<span>📍</span> Käytä sijaintiani';
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }

        // Päivitä sijaintinäyttö
        function updateLocationDisplay() {
            const locationDisplay = document.getElementById('currentLocation');
            const locationName = document.getElementById('locationName');
            locationDisplay.style.display = 'flex';
            locationName.textContent = userLocation.name;
        }

        // Tekstihaku paikkakunnalle
        let searchTimeout;
        document.getElementById('locationInput').addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.toLowerCase().trim();
            const suggestionsEl = document.getElementById('suggestions');

            if (query.length < 2) {
                suggestionsEl.classList.remove('active');
                return;
            }

            // Etsi ensin paikallisesta listasta
            const localMatches = Object.keys(finnishCities)
                .filter(city => city.includes(query))
                .slice(0, 5);

            if (localMatches.length > 0) {
                showSuggestions(localMatches.map(city => ({
                    name: city.charAt(0).toUpperCase() + city.slice(1),
                    lat: finnishCities[city].lat,
                    lng: finnishCities[city].lng
                })));
            } else {
                // Jos ei löydy paikallisesti, hae Nominatimista
                searchTimeout = setTimeout(() => searchNominatim(query), 500);
            }
        });

        async function searchNominatim(query) {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)},Finland&limit=5&accept-language=fi`
                );
                const results = await response.json();

                if (results.length > 0) {
                    showSuggestions(results.map(r => ({
                        name: r.display_name.split(',')[0],
                        lat: parseFloat(r.lat),
                        lng: parseFloat(r.lon)
                    })));
                } else {
                    document.getElementById('suggestions').classList.remove('active');
                }
            } catch (error) {
                console.error('Nominatim-haku epäonnistui:', error);
            }
        }

        function showSuggestions(suggestions) {
            const suggestionsEl = document.getElementById('suggestions');
            suggestionsEl.innerHTML = suggestions.map(s =>
                `<div class="suggestion-item" onclick="selectLocation('${s.name}', ${s.lat}, ${s.lng})">${s.name}</div>`
            ).join('');
            suggestionsEl.classList.add('active');
        }

        function selectLocation(name, lat, lng) {
            userLocation = { lat, lng, name };
            document.getElementById('locationInput').value = '';
            document.getElementById('suggestions').classList.remove('active');
            updateLocationDisplay();
            calculateDistances();
            sortAndRender();
        }

        // Sulje suggestions kun klikataan muualle
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.location-input-wrapper')) {
                document.getElementById('suggestions').classList.remove('active');
            }
        });

        // Hash-navigointi: scrollaa kortille ja avaa modal
        function handleHashNavigation() {
            const hash = window.location.hash.slice(1);
            if (!hash) return;

            // Odota että DOM on päivittynyt
            setTimeout(() => {
                // Etsi kortti ID:n perusteella
                const card = document.querySelector(`.event-card[data-id="${hash}"]`);
                if (!card) {
                    console.log('Tapahtumaa ei löytynyt:', hash);
                    return;
                }

                // Scrollaa kortille
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Korosta kortti
                card.classList.add('highlighted');

                // Etsi kokeen index filteredKokeet-listasta ja avaa modal
                const koeIndex = filteredKokeet.findIndex(k => k.id === hash);
                if (koeIndex !== -1) {
                    // Pieni viive scrollauksen jälkeen ennen modalin avausta
                    setTimeout(() => {
                        showInfo(koeIndex);
                    }, 500);
                }
            }, 100);
        }

        // Kuuntele hash-muutoksia
        window.addEventListener('hashchange', handleHashNavigation);

        // Lataa data
        async function loadData() {
            try {
                // Yritä ladata JSON-tiedosto
                const currentYear = new Date().getFullYear();
                const nextYear = currentYear + 1;

                // Kokeile ensin seuraavaa vuotta, sitten nykyistä
                let response;
                let dataYear;

                try {
                    response = await fetch(`koetutka_${nextYear}.json`);
                    if (response.ok) {
                        dataYear = nextYear;
                    }
                } catch (e) {}

                if (!response || !response.ok) {
                    response = await fetch(`koetutka_${currentYear}.json`);
                    dataYear = currentYear;
                }

                if (!response.ok) {
                    throw new Error('Dataa ei voitu ladata');
                }

                kokeet = await response.json();
                document.getElementById('updateDate').textContent = `Vuosi ${dataYear}`;

                calculateDistances();
                populateFilters();
                sortAndRender();

                document.getElementById('loadingIndicator').style.display = 'none';
                document.getElementById('kokeTable').style.display = 'table';

                // Aseta oletus sijainti
                updateLocationDisplay();

                // Tarkista hash-navigointi
                handleHashNavigation();

            } catch (error) {
                console.error('Virhe datan latauksessa:', error);
                document.getElementById('loadingIndicator').innerHTML =
                    'Virhe datan latauksessa. Tarkista että JSON-tiedosto on saatavilla.';
            }
        }

        // Populoi suodattimet
        function populateFilters() {
            const types = new Set();
            const levels = new Set(['ALO', 'AVO', 'VOI']); // Vain nämä tasot

            kokeet.forEach(koe => {
                types.add(koe.type);
            });

            // Luo lajipillerit
            const typePillsContainer = document.getElementById('typePills');
            const sortedTypes = Array.from(types).sort();

            sortedTypes.forEach(type => {
                const pill = document.createElement('div');
                pill.className = 'pill';
                pill.dataset.type = type;
                pill.innerHTML = `<span class="pill-label">${type}</span> <span class="pill-count"></span>`;
                pill.onclick = () => toggleTypePill(type);
                typePillsContainer.appendChild(pill);
            });

            // Luo tasopillerit (vain ALO, AVO, VOI)
            const levelPillsContainer = document.getElementById('levelPills');
            const sortedLevels = Array.from(levels).sort();

            sortedLevels.forEach(level => {
                const pill = document.createElement('div');
                pill.className = 'pill';
                pill.dataset.level = level;
                pill.innerHTML = `<span class="pill-label">${level}</span> <span class="pill-count"></span>`;
                pill.onclick = () => toggleLevelPill(level);
                levelPillsContainer.appendChild(pill);
            });
        }

        // Päivitä pillien lukumäärät
        function updatePillCounts() {
            // Laske tyyppimäärät (huomioi vain tasosuodatus)
            const typeCounts = {};
            const levelCounts = { 'ALO': 0, 'AVO': 0, 'VOI': 0 };
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();

            const today = new Date().toISOString().split('T')[0];

            kokeet.forEach(koe => {
                // Piilota menneet tapahtumat
                if (hidePastEvents && koe.date_sort) {
                    const koeDate = koe.end_date_sort || koe.date_sort;
                    if (koeDate.split('T')[0] < today) return;
                }

                // Vain ne joiden ilmoittautuminen on auki
                if (onlyRegistrationOpen && !isRegistrationOpen(koe)) return;

                const matchesSearch = !searchTerm ||
                    koe.location.toLowerCase().includes(searchTerm) ||
                    koe.type.toLowerCase().includes(searchTerm) ||
                    koe.levels.toLowerCase().includes(searchTerm) ||
                    (koe.name && koe.name.toLowerCase().includes(searchTerm)) ||
                    (koe.organizer && koe.organizer.toLowerCase().includes(searchTerm));

                if (!matchesSearch) return;

                // Tyyppimäärät (suodatettu tasoilla)
                let matchesLevel = activeLevels.size === 0;
                if (!matchesLevel) {
                    for (const level of activeLevels) {
                        if (koe.levels.includes(level)) {
                            matchesLevel = true;
                            break;
                        }
                    }
                }
                if (matchesLevel) {
                    typeCounts[koe.type] = (typeCounts[koe.type] || 0) + 1;
                }

                // Tasomäärät (suodatettu tyypeillä)
                const matchesType = activeTypes.size === 0 || activeTypes.has(koe.type);
                if (matchesType) {
                    ['ALO', 'AVO', 'VOI'].forEach(level => {
                        if (koe.levels.includes(level)) {
                            levelCounts[level]++;
                        }
                    });
                }
            });

            // Päivitä tyyppipillit
            document.querySelectorAll('#typePills .pill').forEach(pill => {
                const type = pill.dataset.type;
                const count = typeCounts[type] || 0;
                const countEl = pill.querySelector('.pill-count');
                countEl.textContent = count > 0 ? `(${count})` : '(0)';
                countEl.style.opacity = count > 0 ? '1' : '0.5';
            });

            // Päivitä tasopillit
            document.querySelectorAll('#levelPills .pill').forEach(pill => {
                const level = pill.dataset.level;
                const count = levelCounts[level] || 0;
                const countEl = pill.querySelector('.pill-count');
                countEl.textContent = count > 0 ? `(${count})` : '(0)';
                countEl.style.opacity = count > 0 ? '1' : '0.5';
            });
        }

        // Vaihda lajipillerin tilaa
        function toggleTypePill(type) {
            const pill = document.querySelector(`#typePills .pill[data-type="${type}"]`);

            if (activeTypes.has(type)) {
                activeTypes.delete(type);
                pill.classList.remove('active');
            } else {
                activeTypes.add(type);
                pill.classList.add('active');
            }

            sortAndRender();
        }

        // Vaihda tasopillerin tilaa
        function toggleLevelPill(level) {
            const pill = document.querySelector(`#levelPills .pill[data-level="${level}"]`);

            if (activeLevels.has(level)) {
                activeLevels.delete(level);
                pill.classList.remove('active');
            } else {
                activeLevels.add(level);
                pill.classList.add('active');
            }

            sortAndRender();
        }

        // Piilota/näytä menneet tapahtumat
        function toggleHidePast() {
            hidePastEvents = !hidePastEvents;
            document.getElementById('hidePastPill').classList.toggle('active', hidePastEvents);
            sortAndRender();
        }

        // Näytä vain kokeet joiden ilmoittautuminen on auki
        function toggleOnlyRegistrationOpen() {
            onlyRegistrationOpen = !onlyRegistrationOpen;
            document.getElementById('onlyRegOpenPill').classList.toggle('active', onlyRegistrationOpen);
            sortAndRender();
        }

        // Aseta max etäisyys
        function setMaxDistance(km) {
            const input = document.getElementById('maxDistanceInput');
            const pills = document.querySelectorAll('.pill[data-distance]');
            const clearPill = document.getElementById('clearDistancePill');

            if (km === null) {
                input.value = '';
                pills.forEach(p => p.classList.remove('active'));
                clearPill.style.display = 'none';
            } else {
                input.value = km;
                pills.forEach(p => {
                    p.classList.toggle('active', parseInt(p.dataset.distance) === km);
                });
                clearPill.style.display = '';
            }
            sortAndRender();
        }

        // Aseta järjestys
        function setSortOrder(column) {
            // Päivitä pillit
            document.querySelectorAll('.pill[data-sort]').forEach(p => {
                p.classList.remove('active');
            });
            document.querySelector(`.pill[data-sort="${column}"]`).classList.add('active');

            // Aseta järjestys
            currentSort = { column, ascending: true };
            sortAndRender();
        }

        // Näytä ohjeet
        function showHelp() {
            const modal = document.getElementById('infoModal');
            const modalBody = document.getElementById('modalBody');

            modalBody.innerHTML = `
                <h2>Ohjeet</h2>

                <div class="info-section">
                    <h3>📅 Lisää kalenteriin</h3>
                    <p>Klikkaa kokeen <strong style="color: #1565c0; border-bottom: 1px dashed #1565c0;">päivämäärää</strong> tai <strong style="color: #1565c0; border-bottom: 1px dashed #1565c0;">ilmoittautumispäivää</strong> lisätäksesi tapahtuman kalenteriisi.</p>
                    <p style="margin-top: 8px; color: #666; font-size: 0.9em;">Kalenteritiedosto (.ics) toimii useimmissa kalenterisovelluksissa: Apple Calendar, Google Calendar, Outlook jne.</p>
                </div>

                <div class="info-section">
                    <h3>🔍 Haku ja suodatus</h3>
                    <p><strong>Haku:</strong> Kirjoita hakukenttään paikkakunta, koelaji tai taso.</p>
                    <p><strong>Laji/Taso:</strong> Klikkaa pilleriä suodattaaksesi. Voit valita useita.</p>
                    <p><strong>Järjestys:</strong> Valitse etäisyys tai ajankohta.</p>
                </div>

                <div class="info-section">
                    <h3>📍 Sijainti</h3>
                    <p>Anna sijaintisi nähdäksesi kokeiden etäisyydet. Voit kirjoittaa paikkakunnan tai käyttää GPS-paikannusta.</p>
                </div>

                <div class="info-section">
                    <h3>ℹ️ Lisätiedot</h3>
                    <p>Klikkaa koetta nähdäksesi lisätiedot: järjestäjä, tuomarit, yhteystiedot ja hinnat.</p>
                </div>
            `;

            modal.style.display = 'block';
        }

        // Suodata ja järjestä
        function sortAndRender() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const maxDistanceVal = document.getElementById('maxDistanceInput').value;
            const maxDistance = maxDistanceVal ? parseFloat(maxDistanceVal) : null;

            // Synkronoi pill-tila kun käyttäjä kirjoittaa käsin
            if (maxDistance !== null) {
                const pills = document.querySelectorAll('.pill[data-distance]');
                pills.forEach(p => {
                    p.classList.toggle('active', parseInt(p.dataset.distance) === maxDistance);
                });
                document.getElementById('clearDistancePill').style.display = '';
            } else {
                document.querySelectorAll('.pill[data-distance]').forEach(p => p.classList.remove('active'));
                document.getElementById('clearDistancePill').style.display = 'none';
            }

            const today = new Date().toISOString().split('T')[0];

            filteredKokeet = kokeet.filter(koe => {
                // Piilota menneet tapahtumat
                if (hidePastEvents && koe.date_sort) {
                    const koeDate = koe.end_date_sort || koe.date_sort;
                    if (koeDate.split('T')[0] < today) return false;
                }

                // Vain ne joiden ilmoittautuminen on auki
                if (onlyRegistrationOpen && !isRegistrationOpen(koe)) return false;

                // Max etäisyys -suodatin
                if (maxDistance !== null && koe.distance !== null && koe.distance > maxDistance) {
                    return false;
                }

                const matchesSearch = !searchTerm ||
                    koe.location.toLowerCase().includes(searchTerm) ||
                    koe.type.toLowerCase().includes(searchTerm) ||
                    koe.levels.toLowerCase().includes(searchTerm) ||
                    (koe.name && koe.name.toLowerCase().includes(searchTerm)) ||
                    (koe.organizer && koe.organizer.toLowerCase().includes(searchTerm));

                // Tarkista onko laji aktiivinen
                const matchesType = activeTypes.size === 0 || activeTypes.has(koe.type);

                // Tarkista onko joku aktiivisista tasoista kokeessa
                let matchesLevel = activeLevels.size === 0;
                if (!matchesLevel) {
                    for (const level of activeLevels) {
                        if (koe.levels.includes(level)) {
                            matchesLevel = true;
                            break;
                        }
                    }
                }

                return matchesSearch && matchesType && matchesLevel;
            });

            // Järjestä
            filteredKokeet.sort((a, b) => {
                let valA, valB;

                switch (currentSort.column) {
                    case 'distance':
                        valA = a.distance !== null ? a.distance : 99999;
                        valB = b.distance !== null ? b.distance : 99999;
                        break;
                    case 'date':
                        valA = a.date_sort || '';
                        valB = b.date_sort || '';
                        break;
                    default:
                        valA = a[currentSort.column] || '';
                        valB = b[currentSort.column] || '';
                }

                if (valA < valB) return currentSort.ascending ? -1 : 1;
                if (valA > valB) return currentSort.ascending ? 1 : -1;
                return 0;
            });

            renderTable();
            updateStats();
            updatePillCounts();
        }

        // Päivitä tilastot
        function updateStats() {
            // Laske tyypit
            const typeCounts = {};
            filteredKokeet.forEach(koe => {
                typeCounts[koe.type] = (typeCounts[koe.type] || 0) + 1;
            });

            // Desktop-tilastot
            const statsEl = document.getElementById('stats');
            statsEl.innerHTML = `
                <div class="stat-card">
                    <h3>${filteredKokeet.length}</h3>
                    <p>Koetta yhteensä</p>
                </div>
            `;

            const sortedTypes = Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4);

            sortedTypes.forEach(([type, count]) => {
                statsEl.innerHTML += `
                    <div class="stat-card">
                        <h3>${count}</h3>
                        <p>${type}</p>
                    </div>
                `;
            });

            // Mobiili-tilastot (vain kokonaismäärä, tyyppimäärät näkyvät filtteripilleissä)
            const statsMobileInner = document.getElementById('statsMobileInner');
            statsMobileInner.innerHTML = `
                <div class="stat-pill stat-pill-total">
                    <span class="stat-pill-count">${filteredKokeet.length}</span>
                    <span class="stat-pill-label">koetta näytetään</span>
                </div>
            `;
        }

        // Renderöi taulukko ja kortit
        function renderTable() {
            const tbody = document.getElementById('kokeTableBody');
            const cardsContainer = document.getElementById('cardsContainer');
            const noResults = document.getElementById('noResults');

            if (filteredKokeet.length === 0) {
                tbody.innerHTML = '';
                cardsContainer.innerHTML = '';
                noResults.style.display = 'block';
                return;
            }

            noResults.style.display = 'none';

            // Renderöi taulukko (desktop)
            tbody.innerHTML = filteredKokeet.map((koe, index) => {
                const typeClass = 'type-' + koe.type.replace(/[^a-zA-Z0-9-]/g, '-');
                const regOpen = isRegistrationOpen(koe);
                const badge = window.koetutkaShared.stateBadge(koe);
                const badgeHtml = badge
                    ? ` <span class="state-badge state-${badge.tone}">${badge.label}</span>`
                    : '';
                const distanceStr = koe.distance !== null
                    ? `<span class="distance">${koe.distance} km</span>`
                    : `<span class="distance-unknown">-</span>`;

                return `
                    <tr>
                        <td>${distanceStr}</td>
                        <td class="date">${koe.date}</td>
                        <td>${koe.location}</td>
                        <td style="text-align: center; width: 40px;">
                            <button class="btn btn-info" onclick="showInfo(${index})" title="Näytä lisätiedot">
                                <span class="btn-icon">ℹ️</span><span class="btn-text">Info</span>
                            </button>
                        </td>
                        <td><span class="type-badge ${typeClass}">${koe.type}</span></td>
                        <td>${koe.levels}</td>
                        <td class="entry-date${regOpen ? ' registration-open' : ''}">${koe.entry_date}${regOpen ? ' <span class="reg-open-badge">Ilmo auki</span>' : ''}${badgeHtml}</td>
                        <td style="text-align: center; width: 40px;">
                            <button class="btn btn-calendar" onclick="downloadICS(${index}, 'event')" title="Lisää kalenteriin">
                                <span class="btn-icon">📅</span><span class="btn-text">Kalenteri</span>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Renderöi kortit (desktop + mobiili, eri layout CSS:llä)
            cardsContainer.innerHTML = filteredKokeet.map((koe, index) => {
                const typeClass = 'type-' + koe.type.replace(/[^a-zA-Z0-9-]/g, '-');
                const regOpen = isRegistrationOpen(koe);
                const badge = window.koetutkaShared.stateBadge(koe);
                const badgeHtml = badge
                    ? ` <span class="state-badge state-${badge.tone}">${badge.label}</span>`
                    : '';
                const distanceStr = koe.distance !== null
                    ? `${koe.distance} km`
                    : '-';
                const title = koe.name || `${koe.type} ${koe.location}`;

                return `
                    <div class="event-card" data-id="${koe.id}" onclick="showInfo(${index})">
                        <div class="card-distance">
                            ${distanceStr}
                            <div class="card-distance-label">etäisyys</div>
                        </div>
                        <div class="card-main-info">
                            <div class="card-title" title="${title}">${title}</div>
                            <div class="card-subtitle">
                                <span class="card-subtitle-item card-date" onclick="event.stopPropagation(); downloadICS(${index}, 'event')" title="Lisää koe kalenteriin">
                                    <span class="card-calendar-link">📅 ${koe.date}</span>
                                </span>
                                <span class="card-subtitle-item">📍 ${koe.location}</span>
                                <span class="card-subtitle-item${regOpen ? ' registration-open' : ''}" onclick="event.stopPropagation(); downloadICS(${index}, 'registration')" title="Lisää ilmoittautumismuistutus kalenteriin">
                                    <span class="card-calendar-link">✏️ Ilmo: ${koe.entry_date}</span>${regOpen ? '<span class="reg-open-badge">Ilmo auki</span>' : ''}${badgeHtml}
                                </span>
                                ${koe.organizer ? `<span class="card-subtitle-item card-organizer">🏢 ${koe.organizer}</span>` : ''}
                            </div>
                        </div>
                        <div class="card-badges">
                            <span class="type-badge ${typeClass}">${koe.type}</span>
                            <span class="type-badge" style="background: #f5f5f5; color: #333;">${koe.levels}</span>
                        </div>
                        <button class="card-share-btn" onclick="event.stopPropagation(); shareEvent('${koe.id}', this)" title="Jaa linkki">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                            <span class="share-tooltip">Kopioitu!</span>
                        </button>
                        <div class="card-meta-mobile">
                            <div class="card-meta-item${regOpen ? ' registration-open' : ''}" onclick="event.stopPropagation(); downloadICS(${index}, 'registration')" title="Lisää ilmoittautumismuistutus kalenteriin">
                                <span class="card-calendar-link">✏️ Ilmo: ${koe.entry_date}</span>${regOpen ? '<span class="reg-open-badge">Ilmo auki</span>' : ''}${badgeHtml}
                            </div>
                            ${koe.organizer ? `<div class="card-meta-item">🏢 ${koe.organizer}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Sarakkeen klikkaus järjestämiseen
        document.querySelectorAll('thead th.sortable').forEach(th => {
            th.addEventListener('click', function() {
                const column = this.dataset.sort;
                const isAscending = currentSort.column === column ? !currentSort.ascending : true;
                currentSort = { column, ascending: isAscending };

                // Päivitä visuaalinen merkintä
                document.querySelectorAll('thead th').forEach(h => {
                    h.classList.remove('sorted-asc', 'sorted-desc');
                });
                this.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');

                // Päivitä järjestysinfo
                const columnNames = {
                    'distance': 'etäisyys',
                    'date': 'päivämäärä',
                    'location': 'paikkakunta',
                    'type': 'tyyppi',
                    'levels': 'taso',
                    'entry_date': 'ilmoittautuminen'
                };
                document.getElementById('sortInfo').textContent =
                    `Järjestetty: ${columnNames[column]} ${isAscending ? '↑' : '↓'}`;

                sortAndRender();
            });
        });

        // Toast-ilmoitus
        function showToast(message = 'Linkki kopioitu!') {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            toastMessage.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }

        // Jaa-painikkeen toiminto
        async function shareEvent(eventId, buttonEl) {
            // Muodosta siisti URL: origin + pathname + hash
            const shareUrl = window.location.origin + window.location.pathname + '#' + eventId;

            // Etsi tapahtuman tiedot
            const koe = kokeet.find(k => k.id === eventId);
            const title = koe ? (koe.name || `${koe.type} ${koe.location}`) : 'Noutajakoe';
            const text = koe ? `${title} - ${koe.date}, ${koe.location}` : 'Katso tämä noutajakoe!';

            // Web Share API vain mobiililla (tarkista kosketusnäyttö)
            const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (isMobile && navigator.share) {
                try {
                    await navigator.share({ title, text, url: shareUrl });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            // Desktop: kopioi leikepöydälle
            try {
                await navigator.clipboard.writeText(shareUrl);

                // Vaihda ikoni checkmarkiksi
                buttonEl.classList.add('copied');
                setTimeout(() => buttonEl.classList.remove('copied'), 2000);

                // Näytä toast
                showToast('Linkki kopioitu leikepöydälle!');
            } catch (err) {
                prompt('Kopioi linkki:', shareUrl);
            }
        }

        // Näytä info-modal
        function showInfo(index) {
            const koe = filteredKokeet[index];
            const modal = document.getElementById('infoModal');
            const modalBody = document.getElementById('modalBody');
            const title = koe.name || `${koe.type} ${koe.location}`;

            // SVG ikonit
            const icons = {
                calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
                location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
                users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
                user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
                euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="10" x2="16" y2="10"></line><line x1="4" y1="14" x2="14" y2="14"></line><path d="M17 6a6 6 0 0 0-6 6c0 3.3 2.7 6 6 6"></path></svg>',
                info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
                building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path><path d="M9 9v.01"></path><path d="M9 12v.01"></path><path d="M9 15v.01"></path><path d="M9 18v.01"></path></svg>',
                list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
                share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
                close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
            };

            let html = `
                <div class="modal-header">
                    <h2>${title}</h2>
                    <div class="modal-badges">
                        <span class="modal-badge">${koe.type}</span>
                        <span class="modal-badge">${koe.levels}</span>
                        ${koe.distance !== null ? `<span class="modal-badge">${koe.distance} km</span>` : ''}
                    </div>
                    <div class="modal-header-actions">
                        <button class="modal-header-btn" onclick="shareEventFromModal('${koe.id}', this)" title="Jaa">
                            ${icons.share}
                        </button>
                        <button class="modal-header-btn" onclick="closeModal()" title="Sulje">
                            ${icons.close}
                        </button>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-card-header">
                                ${icons.calendar}
                                <span>Ajankohta</span>
                            </div>
                            <div class="info-card-content">
                                <div class="info-row">
                                    <span class="info-row-label">Päivämäärä</span>
                                    <span class="info-row-value">${koe.date}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-row-label">Paikkakunta</span>
                                    <span class="info-row-value">${koe.location}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-row-label">Ilmoittautumisaika</span>
                                    <span class="info-row-value">${koe.entry_date}</span>
                                </div>
                                <div class="info-actions">
                                    <button class="info-action-btn" onclick="downloadICS(${index}, 'event')">
                                        📅 Koe kalenteriin
                                    </button>
                                    <button class="info-action-btn" onclick="downloadICS(${index}, 'registration')">
                                        ✏️ Ilmoittautumismuistutus
                                    </button>
                                </div>
                            </div>
                        </div>`;

            // Luokat ja paikat (per päivä ja per luokka kun saatavilla, muuten
            // kokeen kokonaispaikkamäärä "Yhteensä"-rivinä)
            const classPlaces = window.koetutkaShared.listClassPlaces(koe);
            if (classPlaces.length > 0) {
                html += `
                        <div class="info-card">
                            <div class="info-card-header">
                                ${icons.list}
                                <span>Luokat ja paikat</span>
                            </div>
                            <div class="info-card-content">`;
                classPlaces.forEach(cp => {
                    const name = cp.class || 'Yhteensä';
                    const label = cp.day ? `${name} · ${cp.day}` : name;
                    html += `
                                <div class="info-row">
                                    <span class="info-row-label">${label}</span>
                                    <span class="info-row-value">${window.koetutkaShared.formatClassPlacesRow(cp)}</span>
                                </div>`;
                });
                html += `
                            </div>
                        </div>`;
            }

            if (koe.organizer) {
                html += `
                        <div class="info-card">
                            <div class="info-card-header">
                                ${icons.building}
                                <span>Järjestäjä</span>
                            </div>
                            <div class="info-card-content">
                                <p class="info-text">${koe.organizer}</p>
                            </div>
                        </div>`;
            }

            if (koe.judges && koe.judges.length > 0) {
                html += `
                        <div class="info-card">
                            <div class="info-card-header">
                                ${icons.users}
                                <span>Tuomarit</span>
                            </div>
                            <div class="info-card-content">
                                <p class="info-text">${koe.judges.join(', ')}</p>
                            </div>
                        </div>`;
            }

            // Yhteystiedot
            const hasContacts = (koe.official && koe.official.name) || (koe.secretary && koe.secretary.name);
            if (hasContacts) {
                html += `
                        <div class="info-card">
                            <div class="info-card-header">
                                ${icons.user}
                                <span>Yhteystiedot</span>
                            </div>
                            <div class="info-card-content">`;

                if (koe.official && koe.official.name) {
                    html += `
                                <div class="info-row">
                                    <span class="info-row-label">Yhteyshenkilö</span>
                                    <span class="info-row-value">${koe.official.name}</span>
                                </div>`;
                    if (koe.official.phone) {
                        html += `
                                <div class="info-row">
                                    <span class="info-row-label">Puhelin</span>
                                    <span class="info-row-value"><a href="tel:${koe.official.phone}">${koe.official.phone}</a></span>
                                </div>`;
                    }
                    if (koe.official.email) {
                        html += `
                                <div class="info-row">
                                    <span class="info-row-label">Sähköposti</span>
                                    <span class="info-row-value"><a href="mailto:${koe.official.email}">${koe.official.email}</a></span>
                                </div>`;
                    }
                }

                if (koe.secretary && koe.secretary.name) {
                    html += `
                                <div class="info-row">
                                    <span class="info-row-label">Sihteeri</span>
                                    <span class="info-row-value">${koe.secretary.name}</span>
                                </div>`;
                    if (koe.secretary.phone) {
                        html += `
                                <div class="info-row">
                                    <span class="info-row-label">Puhelin</span>
                                    <span class="info-row-value"><a href="tel:${koe.secretary.phone}">${koe.secretary.phone}</a></span>
                                </div>`;
                    }
                    if (koe.secretary.email) {
                        html += `
                                <div class="info-row">
                                    <span class="info-row-label">Sähköposti</span>
                                    <span class="info-row-value"><a href="mailto:${koe.secretary.email}">${koe.secretary.email}</a></span>
                                </div>`;
                    }
                }
                html += `
                            </div>
                        </div>`;
            }

            const costValue = getCostValue(koe.cost);
            const costMemberValue = getCostValue(koe.cost_member);
            const optionalCosts = getOptionalCosts(koe.cost);

            if (costValue !== null || costMemberValue !== null) {
                html += `
                        <div class="info-card">
                            <div class="info-card-header">
                                ${icons.euro}
                                <span>Maksut</span>
                            </div>
                            <div class="info-card-content">`;
                if (costValue !== null) {
                    html += `
                                <div class="info-row">
                                    <span class="info-row-label">Osallistumismaksu</span>
                                    <span class="info-row-value">${costValue} €</span>
                                </div>`;
                }
                if (costMemberValue !== null) {
                    html += `
                                <div class="info-row">
                                    <span class="info-row-label">Jäsenhinta</span>
                                    <span class="info-row-value">${costMemberValue} €</span>
                                </div>`;
                }
                if (optionalCosts.length > 0) {
                    optionalCosts.forEach(opt => {
                        const desc = opt.description?.fi || opt.description?.en || opt.description || '';
                        html += `
                                <div class="info-row">
                                    <span class="info-row-label">${desc}</span>
                                    <span class="info-row-value">+${opt.cost} €</span>
                                </div>`;
                    });
                }
                html += `
                            </div>
                        </div>`;
            }

            if (koe.description) {
                html += `
                        <div class="info-card">
                            <div class="info-card-header">
                                ${icons.info}
                                <span>Lisätiedot</span>
                            </div>
                            <div class="info-card-content">
                                <p class="info-text">${koe.description.replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>`;
            }

            const snjLink = window.koetutkaShared.snjLink(koe);
            html += `
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="${snjLink.url}" target="_blank" rel="noopener" class="btn btn-snj">
                        ${snjLink.label}
                    </a>
                </div>`;

            modalBody.innerHTML = html;
            modal.style.display = 'block';
        }

        // Jaa modalista
        async function shareEventFromModal(eventId, buttonEl) {
            // Muodosta siisti URL: origin + pathname + hash
            const shareUrl = window.location.origin + window.location.pathname + '#' + eventId;

            const koe = kokeet.find(k => k.id === eventId);
            const title = koe ? (koe.name || `${koe.type} ${koe.location}`) : 'Noutajakoe';
            const text = koe ? `${title} - ${koe.date}, ${koe.location}` : 'Katso tämä noutajakoe!';

            // Web Share API vain mobiililla (tarkista kosketusnäyttö)
            const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (isMobile && navigator.share) {
                try {
                    await navigator.share({ title, text, url: shareUrl });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            // Desktop: kopioi leikepöydälle
            try {
                await navigator.clipboard.writeText(shareUrl);

                // Vaihda ikoni checkmarkiksi
                buttonEl.classList.add('copied');
                setTimeout(() => buttonEl.classList.remove('copied'), 2000);

                // Näytä toast
                showToast('Linkki kopioitu leikepöydälle!');
            } catch (err) {
                prompt('Kopioi linkki:', shareUrl);
            }
        }

        // Sulje modal
        function closeModal() {
            document.getElementById('infoModal').style.display = 'none';
        }

        // Sulje modal kun klikataan modaalin ulkopuolella
        window.onclick = function(event) {
            const modal = document.getElementById('infoModal');
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }

        // Sulje modal ESC-näppäimellä
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });

        // Lataa ICS kalenteritiedosto
        function downloadICS(index, eventType = 'event') {
            const koe = filteredKokeet[index];
            const icsContent = window.koetutkaShared.generateICS(koe, {
                type: eventType,
                userLocationName: userLocation?.name,
                index,
            });

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const filePrefix = eventType === 'registration' ? 'ilmoittautuminen' : 'koe';
            link.download = `koetutka-${filePrefix}-${koe.location}-${koe.date.replace(/\./g, '-')}.ics`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Event listenerit
        document.getElementById('searchInput').addEventListener('input', sortAndRender);

        // Alustus tapahtuu module-scriptissä (window.loadData()) shared-moduulin latauduttua.
