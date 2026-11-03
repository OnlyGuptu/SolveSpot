/**
 * SolveSpot "Test Your GK" - 50 GK Questions & Answers for Classes 6th - 9th
 * Interactive Quiz Game Engine + Full Study Sheet + Category Filters + Instant Search
 */

(function() {
    'use strict';

    const GK_DATABASE = [
        // ==========================================
        // 1. SCIENCE & NATURE (Questions 1 - 10)
        // ==========================================
        {
            id: 1,
            cat: 'science',
            catName: 'Science & Nature',
            q: "Which organelle is universally known as the 'Powerhouse of the Cell'?",
            options: ["Mitochondria", "Ribosome", "Nucleus", "Endoplasmic Reticulum"],
            ans: 0,
            ansText: "Mitochondria",
            fact: "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions, stored in adenosine triphosphate (ATP) molecules."
        },
        {
            id: 2,
            cat: 'science',
            catName: 'Science & Nature',
            q: "Which gas is the most abundant in the Earth's atmosphere?",
            options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"],
            ans: 1,
            ansText: "Nitrogen (~78%)",
            fact: "Nitrogen makes up roughly 78.08% of dry air, followed by Oxygen at 20.95% and Argon at 0.93%."
        },
        {
            id: 3,
            cat: 'science',
            catName: 'Science & Nature',
            q: "Which vitamin is synthesized in the human skin upon exposure to sunlight?",
            options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin B12"],
            ans: 2,
            ansText: "Vitamin D",
            fact: "When human skin is exposed to UVB rays from the sun, 7-dehydrocholesterol is converted into vitamin D3, which strengthens bones and teeth."
        },
        {
            id: 4,
            cat: 'science',
            catName: 'Science & Nature',
            q: "Which is the only metal that remains liquid at standard room temperature?",
            options: ["Mercury (Hg)", "Bromine (Br)", "Gallium (Ga)", "Sodium (Na)"],
            ans: 0,
            ansText: "Mercury (Hg)",
            fact: "Mercury (atomic number 80) is the only metallic element that is liquid at standard conditions. Bromine is also liquid, but it is a non-metal."
        },
        {
            id: 5,
            cat: 'science',
            catName: 'Science & Nature',
            q: "Which planet in our Solar System is famously known as the 'Red Planet'?",
            options: ["Venus", "Mars", "Jupiter", "Saturn"],
            ans: 1,
            ansText: "Mars",
            fact: "Mars appears reddish in the night sky because its surface soil and crust are heavily enriched with iron oxide (rust)."
        },
        {
            id: 6,
            cat: 'science',
            catName: 'Science & Nature',
            q: "What is the green pigment in plant leaves that absorbs sunlight for photosynthesis?",
            options: ["Hemoglobin", "Chlorophyll", "Carotene", "Anthocyanin"],
            ans: 1,
            ansText: "Chlorophyll",
            fact: "Chlorophyll is located in the chloroplasts of plant cells and captures light energy to turn carbon dioxide and water into glucose and oxygen."
        },
        {
            id: 7,
            cat: 'science',
            catName: 'Science & Nature',
            q: "What is the chemical formula for common table salt?",
            options: ["NaCl", "KCl", "CaCO3", "NaHCO3"],
            ans: 0,
            ansText: "NaCl (Sodium Chloride)",
            fact: "Sodium chloride is formed by an ionic bond between sodium (Na+) and chlorine (Cl-) ions in a 1:1 ratio."
        },
        {
            id: 8,
            cat: 'science',
            catName: 'Science & Nature',
            q: "Which is the largest internal organ and gland in the human body?",
            options: ["Heart", "Brain", "Liver", "Pancreas"],
            ans: 2,
            ansText: "Liver",
            fact: "The human liver weighs approximately 1.5 kg and performs over 500 vital functions including bile production, toxin filtration, and glycogen storage."
        },
        {
            id: 9,
            cat: 'science',
            catName: 'Science & Nature',
            q: "What is the speed of light in a vacuum?",
            options: ["300,000 km/s (3 × 10⁸ m/s)", "150,000 km/s", "330 m/s", "1,000 km/s"],
            ans: 0,
            ansText: "Approximately 300,000 km/s (3 × 10⁸ m/s)",
            fact: "Light travels at exactly 299,792,458 m/s in vacuum, making it the fundamental speed limit of the universe."
        },
        {
            id: 10,
            cat: 'science',
            catName: 'Science & Nature',
            q: "Which atmospheric layer contains the Ozone Layer that absorbs harmful ultraviolet rays?",
            options: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"],
            ans: 1,
            ansText: "Stratosphere",
            fact: "The stratosphere extends from about 12 to 50 km above Earth and holds the ozone shield that protects life from solar UV-B and UV-C radiation."
        },

        // ==========================================
        // 2. INDIAN HISTORY & HERITAGE (Questions 11 - 20)
        // ==========================================
        {
            id: 11,
            cat: 'history',
            catName: 'History & Heritage',
            q: "Who was the Chairman of the Drafting Committee of the Indian Constitution?",
            options: ["Mahatma Gandhi", "Dr. B.R. Ambedkar", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel"],
            ans: 1,
            ansText: "Dr. B.R. Ambedkar",
            fact: "Dr. Bhimrao Ramji Ambedkar is recognized as the 'Father and Chief Architect of the Indian Constitution' for steering its comprehensive draft."
        },
        {
            id: 12,
            cat: 'history',
            catName: 'History & Heritage',
            q: "Which ancient bronze-age urban civilization featured the Great Bath at Mohenjo-daro?",
            options: ["Mesopotamian Civilization", "Indus Valley Civilization", "Egyptian Civilization", "Chinese Civilization"],
            ans: 1,
            ansText: "Indus Valley (Harappan) Civilization",
            fact: "The Indus Valley Civilization flourished around 2500 BCE and was world-renowned for baked-brick houses, grid town-planning, and advanced drainage systems."
        },
        {
            id: 13,
            cat: 'history',
            catName: 'History & Heritage',
            q: "Who founded the Maurya Empire with strategic counsel from Chanakya (Kautilya)?",
            options: ["Ashoka the Great", "Chandragupta Maurya", "Bindusara", "Samudragupta"],
            ans: 1,
            ansText: "Chandragupta Maurya",
            fact: "Chandragupta Maurya overthrew the Nanda dynasty in 322 BCE and unified most of the Indian subcontinent into the Maurya Empire."
        },
        {
            id: 14,
            cat: 'history',
            catName: 'History & Heritage',
            q: "In which year did the First War of Indian Independence (Sepoy Mutiny) break out?",
            options: ["1857", "1757", "1942", "1919"],
            ans: 0,
            ansText: "1857",
            fact: "The uprising began on 10 May 1857 in Meerut and marked the end of British East India Company rule, leading to direct administration by the British Crown."
        },
        {
            id: 15,
            cat: 'history',
            catName: 'History & Heritage',
            q: "Who penned India's National Anthem, 'Jana Gana Mana'?",
            options: ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Sarojini Naidu", "Subhas Chandra Bose"],
            ans: 1,
            ansText: "Rabindranath Tagore",
            fact: "Rabindranath Tagore originally composed it in Bengali as 'Bharoto Bhagyo Bidhata' in 1911. The Constituent Assembly adopted it as the National Anthem on 24 Jan 1950."
        },
        {
            id: 16,
            cat: 'history',
            catName: 'History & Heritage',
            q: "Which Mughal Emperor commissioned the construction of the Taj Mahal in Agra?",
            options: ["Akbar", "Jahangir", "Shah Jahan", "Babur"],
            ans: 2,
            ansText: "Shah Jahan",
            fact: "Shah Jahan built the white marble mausoleum between 1631 and 1648 in memory of his beloved wife Mumtaz Mahal."
        },
        {
            id: 17,
            cat: 'history',
            catName: 'History & Heritage',
            q: "What is designated as the National Aquatic Animal of India?",
            options: ["Ganges River Dolphin", "Gharial", "Whale Shark", "Olive Ridley Turtle"],
            ans: 0,
            ansText: "Ganges River Dolphin (Platanista gangetica)",
            fact: "The Ganges river dolphin is practically blind and navigates using echolocation. It was declared the National Aquatic Animal in 2009."
        },
        {
            id: 18,
            cat: 'history',
            catName: 'History & Heritage',
            q: "Which freedom fighter gave the stirring call: 'Give me blood, and I shall give you freedom!'?",
            options: ["Bhagat Singh", "Subhas Chandra Bose", "Bal Gangadhar Tilak", "Lala Lajpat Rai"],
            ans: 1,
            ansText: "Netaji Subhas Chandra Bose",
            fact: "Netaji gave this famous rallying speech in Burma in 1944 to the soldiers of the Indian National Army (Azad Hind Fauj)."
        },
        {
            id: 19,
            cat: 'history',
            catName: 'History & Heritage',
            q: "From which historical structure was India's National Emblem (the Lion Capital) adopted?",
            options: ["Ashoka Pillar at Sarnath", "Sanchi Stupa", "Qutub Minar", "Red Fort"],
            ans: 0,
            ansText: "Ashoka Pillar at Sarnath",
            fact: "Carved out of a single block of polished sandstone, the capital features four Asiatic lions standing back to back, symbolizing courage, power, and confidence."
        },
        {
            id: 20,
            cat: 'history',
            catName: 'History & Heritage',
            q: "Who was the first woman Prime Minister of India?",
            options: ["Sarojini Naidu", "Indira Gandhi", "Pratibha Patil", "Sucheta Kripalani"],
            ans: 1,
            ansText: "Indira Gandhi",
            fact: "Indira Gandhi served as Prime Minister from 1966 to 1977 and again from 1980 until 1984, remaining the only female Prime Minister of India to date."
        },

        // ==========================================
        // 3. GEOGRAPHY & EARTH SCIENCE (Questions 21 - 30)
        // ==========================================
        {
            id: 21,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "Which is the longest river in India by total distance within the country?",
            options: ["Ganga (2,525 km)", "Godavari (1,465 km)", "Brahmaputra", "Indus"],
            ans: 0,
            ansText: "Ganga (2,525 km)",
            fact: "Originating from the Gangotri Glacier as the Bhagirathi, the Ganga flows across northern India into Bangladesh, covering 2,525 km."
        },
        {
            id: 22,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "Which is the largest continent in the world by both surface area and population?",
            options: ["Africa", "Asia", "North America", "Europe"],
            ans: 1,
            ansText: "Asia",
            fact: "Asia covers about 30% of Earth's total land area and is home to roughly 60% of the world's human population."
        },
        {
            id: 23,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "Which special latitude line passes through the center of India, dividing it into two thermal zones?",
            options: ["Equator (0°)", "Tropic of Cancer (23.5° N)", "Tropic of Capricorn (23.5° S)", "Arctic Circle (66.5° N)"],
            ans: 1,
            ansText: "Tropic of Cancer (23.5° N)",
            fact: "The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram."
        },
        {
            id: 24,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "What is the highest mountain peak on Earth above sea level?",
            options: ["K2 (Godwin-Austen)", "Mount Everest (8,848.86 m)", "Kangchenjunga", "Makalu"],
            ans: 1,
            ansText: "Mount Everest (8,848.86 m / 29,031.7 ft)",
            fact: "Located in the Mahalangur Himal sub-range of the Himalayas on the border of Nepal and China, its official revised elevation is 8,848.86 meters."
        },
        {
            id: 25,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "Which Indian state has the longest mainland coastline?",
            options: ["Maharashtra", "Tamil Nadu", "Gujarat", "Andhra Pradesh"],
            ans: 2,
            ansText: "Gujarat (~1,600 km)",
            fact: "Gujarat's coast along the Arabian Sea spans about 1,600 km, representing almost 24% of India's total mainland sea boundary."
        },
        {
            id: 26,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "Which is the deepest oceanic trench on Earth?",
            options: ["Java Trench", "Puerto Rico Trench", "Mariana Trench", "Philippine Trench"],
            ans: 2,
            ansText: "Mariana Trench (Challenger Deep, ~11,034 m)",
            fact: "Situated in the western Pacific Ocean, Challenger Deep plunges nearly 11 kilometers (36,000 feet) down—deep enough to submerge Mount Everest with 2 km to spare."
        },
        {
            id: 27,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "Which is the largest hot desert in the world?",
            options: ["Gobi Desert", "Kalahari Desert", "Sahara Desert", "Thar Desert"],
            ans: 2,
            ansText: "Sahara Desert (Northern Africa)",
            fact: "Covering over 9.2 million square kilometers, the Sahara is nearly comparable in size to the entire landmass of China or the United States."
        },
        {
            id: 28,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "Which lake is the largest freshwater lake in India?",
            options: ["Chilika Lake", "Wular Lake", "Sambhar Lake", "Dal Lake"],
            ans: 1,
            ansText: "Wular Lake (Jammu & Kashmir)",
            fact: "Wular Lake was formed as a result of tectonic activity and is fed by the Jhelum River. Chilika is the largest brackish-water lagoon."
        },
        {
            id: 29,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "What astronomical factor primarily causes the cycle of seasons on Earth?",
            options: ["Distance from the Sun", "Earth's tilted axis (23.5°) & revolution", "Speed of Earth's rotation", "Moon's gravitational pull"],
            ans: 1,
            ansText: "Earth's 23.5° axial tilt and revolution around the Sun",
            fact: "Because Earth's rotational axis is tilted relative to its orbital plane, different hemispheres receive varying solar angles and daylight lengths throughout the year."
        },
        {
            id: 30,
            cat: 'geography',
            catName: 'Geography & Earth',
            q: "Which is the smallest state in India by total geographical area?",
            options: ["Sikkim", "Goa", "Tripura", "Mizoram"],
            ans: 1,
            ansText: "Goa (3,702 km²)",
            fact: "Goa covers an area of just 3,702 km². By population, Sikkim is the least populous state in India."
        },

        // ==========================================
        // 4. CIVICS, POLITY & CITIZENSHIP (Questions 31 - 40)
        // ==========================================
        {
            id: 31,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "What is the legal minimum voting age for Indian citizens in general elections?",
            options: ["21 years", "18 years", "16 years", "25 years"],
            ans: 1,
            ansText: "18 years",
            fact: "The 61st Constitutional Amendment Act of 1988 lowered the voting age from 21 to 18 years under Article 326."
        },
        {
            id: 32,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "How many Fundamental Rights are currently guaranteed to Indian citizens under Part III of the Constitution?",
            options: ["5", "6", "7", "10"],
            ans: 1,
            ansText: "Six Fundamental Rights",
            fact: "Originally there were seven, but the Right to Property was removed as a Fundamental Right by the 44th Amendment in 1978 and made a legal right."
        },
        {
            id: 33,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "Who is designated as the Supreme Commander of the Indian Armed Forces?",
            options: ["Prime Minister", "Chief of Defence Staff (CDS)", "The President of India", "Defence Minister"],
            ans: 2,
            ansText: "The President of India",
            fact: "Under Article 53(2) of the Constitution of India, the supreme command of the Defence Forces of the Union is vested in the President."
        },
        {
            id: 34,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "What is the Upper House of the Parliament of India called?",
            options: ["Lok Sabha", "Rajya Sabha (Council of States)", "Vidhan Sabha", "Supreme Court"],
            ans: 1,
            ansText: "Rajya Sabha (Council of States)",
            fact: "Rajya Sabha is a permanent body and is not subject to dissolution; one-third of its members retire every second year."
        },
        {
            id: 35,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "What is the standard normal tenure of a member elected to the Lok Sabha?",
            options: ["4 years", "5 years", "6 years", "Lifetime"],
            ans: 1,
            ansText: "5 years",
            fact: "Unless dissolved sooner by the President on the advice of the Prime Minister, the Lok Sabha operates for a five-year term from its first meeting."
        },
        {
            id: 36,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "On which date did the Constitution of India come into full legal effect, celebrated as Republic Day?",
            options: ["15 August 1947", "26 November 1949", "26 January 1950", "2 October 1952"],
            ans: 2,
            ansText: "26 January 1950",
            fact: "Although adopted on 26 Nov 1949 (Constitution Day), 26 January was chosen to honor the 1930 declaration of Purna Swaraj (Complete Independence)."
        },
        {
            id: 37,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "Which is the highest judicial court and final court of appeal in India?",
            options: ["High Court of Delhi", "The Supreme Court of India", "National Green Tribunal", "International Court of Justice"],
            ans: 1,
            ansText: "The Supreme Court of India (New Delhi)",
            fact: "Established under Part V, Chapter IV of the Indian Constitution, the Supreme Court is the apex guardian and interpreter of the Constitution."
        },
        {
            id: 38,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "Which Fundamental Right was termed by Dr. B.R. Ambedkar as the 'Heart and Soul' of the Constitution?",
            options: ["Right to Equality (Art 14)", "Right to Freedom of Speech (Art 19)", "Right to Constitutional Remedies (Article 32)", "Right to Education (Art 21A)"],
            ans: 2,
            ansText: "Right to Constitutional Remedies (Article 32)",
            fact: "Article 32 empowers citizens to petition the Supreme Court directly to issue writs (Habeas Corpus, Mandamus, etc.) when any fundamental right is violated."
        },
        {
            id: 39,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "What form of government describes the Indian democratic system?",
            options: ["Absolute Monarchy", "Sovereign Socialist Secular Democratic Republic", "Military Oligarchy", "Theocracy"],
            ans: 1,
            ansText: "Sovereign, Socialist, Secular, Democratic Republic",
            fact: "These solemn words are enshrined in the opening Preamble to the Constitution of India, outlining its core philosophy."
        },
        {
            id: 40,
            cat: 'civics',
            catName: 'Civics & Polity',
            q: "Who administers the oath of office to the newly elected President of India?",
            options: ["Prime Minister", "Chief Justice of India (or senior-most SC Judge)", "Speaker of Lok Sabha", "Vice President"],
            ans: 1,
            ansText: "Chief Justice of India (CJI)",
            fact: "Under Article 60 of the Constitution, the Chief Justice of India, or in his absence, the senior-most judge of the Supreme Court, administers the oath."
        },

        // ==========================================
        // 5. TRIVIA, INVENTIONS & DISCOVERIES (Questions 41 - 50)
        // ==========================================
        {
            id: 41,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "Who was granted the first US patent for the practical telephone in 1876?",
            options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Guglielmo Marconi"],
            ans: 1,
            ansText: "Alexander Graham Bell",
            fact: "Bell transmitted the first audible speech to his assistant Thomas Watson with the immortal line: 'Mr. Watson, come here, I want to see you.'"
        },
        {
            id: 42,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "Who is widely revered as the 'Father of the Computer' for designing the Analytical Engine?",
            options: ["Alan Turing", "Charles Babbage", "Bill Gates", "Blaise Pascal"],
            ans: 1,
            ansText: "Charles Babbage",
            fact: "In the 1830s, English polymath Charles Babbage conceived the Analytical Engine, the first general-purpose mechanical computing machine."
        },
        {
            id: 43,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "Which major sport in India awards the historic 'Ranji Trophy'?",
            options: ["Football", "Field Hockey", "Cricket", "Badminton"],
            ans: 2,
            ansText: "Cricket",
            fact: "The Ranji Trophy is India's premier first-class domestic cricket championship, named after the legendary cricketer Maharaja Ranjitsinhji."
        },
        {
            id: 44,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "Who was the first Indian citizen to fly into space aboard Soyuz T-11 in April 1984?",
            options: ["Kalpana Chawla", "Sunita Williams", "Wing Commander Rakesh Sharma", "Vikram Sarabhai"],
            ans: 2,
            ansText: "Wing Commander Rakesh Sharma",
            fact: "When Prime Minister Indira Gandhi asked him how India looked from space, Rakesh Sharma famously replied: 'Saare Jahan Se Achha' (Better than the entire world)."
        },
        {
            id: 45,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "Which is the largest living mammal and animal species on Earth?",
            options: ["African Bush Elephant", "Blue Whale (Balaenoptera musculus)", "Colossal Squid", "Giraffe"],
            ans: 1,
            ansText: "Blue Whale (Balaenoptera musculus)",
            fact: "A blue whale can reach up to 30 meters (98 ft) in length and weigh over 180 metric tonnes—its tongue alone can weigh as much as an entire elephant."
        },
        {
            id: 46,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "Which scientist formulated the Universal Law of Gravitation after observing a falling apple?",
            options: ["Galileo Galilei", "Sir Isaac Newton", "Albert Einstein", "Johannes Kepler"],
            ans: 1,
            ansText: "Sir Isaac Newton",
            fact: "Newton published his groundbreaking Philosophiæ Naturalis Principia Mathematica in 1687, unifying celestial and terrestrial motion under gravity."
        },
        {
            id: 47,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "How many checkered squares are there on a standard competition chessboard?",
            options: ["48", "64 (8 × 8 grid)", "72", "100"],
            ans: 1,
            ansText: "64 squares (8 rows × 8 columns)",
            fact: "A chessboard consists of 32 light and 32 dark squares. Each player begins with 16 pieces, including 8 pawns, 2 rooks, 2 knights, 2 bishops, 1 queen, and 1 king."
        },
        {
            id: 48,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "Which prominent Indian city is universally nicknamed the 'Silicon Valley of India'?",
            options: ["Hyderabad", "Bengaluru (Bangalore)", "Pune", "Gurugram"],
            ans: 1,
            ansText: "Bengaluru (Karnataka)",
            fact: "Bengaluru is the nation's leading information technology exporter, hosting hundreds of multinational technology enterprises and startups."
        },
        {
            id: 49,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "National Sports Day in India (29th August) commemorates the birthday of which legendary athlete?",
            options: ["Major Dhyan Chand (Field Hockey)", "Milkha Singh (Athletics)", "Kapil Dev (Cricket)", "Sachin Tendulkar (Cricket)"],
            ans: 0,
            ansText: "Major Dhyan Chand (The 'Wizard of Hockey')",
            fact: "Dhyan Chand earned three Olympic gold medals for India (1928, 1932, 1936) and scored over 400 international goals during his illustrious hockey career."
        },
        {
            id: 50,
            cat: 'trivia',
            catName: 'Trivia & Inventions',
            q: "Which historic ISRO lunar mission successfully touched down near the Moon's South Pole in August 2023?",
            options: ["Mangalyaan", "Chandrayaan-1", "Chandrayaan-2", "Chandrayaan-3"],
            ans: 3,
            ansText: "Chandrayaan-3 (Vikram lander & Pragyan rover)",
            fact: "With Chandrayaan-3's soft landing on 23 August 2023, India became the 4th country to land on the Moon and the very 1st to land in the south polar region."
        }
    ];

    // State Variables
    let currentQuizIndex = 0;
    let quizScore = 0;
    let quizStreak = 0;
    let answeredCurrent = false;
    let currentActiveFilter = 'all';

    // Elements
    function getEl(id) { return document.getElementById(id); }

    // =========================================================================
    // 1. QUIZ MODE LOGIC
    // =========================================================================
    function loadQuizQuestion(index) {
        if (index < 0 || index >= GK_DATABASE.length) {
            index = 0;
        }
        currentQuizIndex = index;
        answeredCurrent = false;

        const q = GK_DATABASE[index];
        const pillEl = getEl('gk-q-counter-pill');
        const catEl = getEl('gk-quiz-cat-tag');
        const qTextEl = getEl('gk-quiz-q-text');
        const optGrid = getEl('gk-quiz-options-grid');
        const expBox = getEl('gk-explanation-box');
        const nextBtn = getEl('btn-gk-next');
        const fillBar = getEl('gk-quiz-progress-fill');

        if (pillEl) pillEl.innerText = `Question ${index + 1} of ${GK_DATABASE.length}`;
        if (catEl) catEl.innerText = q.catName;
        if (qTextEl) qTextEl.innerText = q.q;
        if (fillBar) fillBar.style.width = `${((index + 1) / GK_DATABASE.length) * 100}%`;
        if (expBox) {
            expBox.style.display = 'none';
            expBox.innerHTML = '';
        }
        if (nextBtn) {
            nextBtn.innerText = index === GK_DATABASE.length - 1 ? 'Finish & Restart' : 'Next Question →';
            nextBtn.style.opacity = '0.5';
            nextBtn.style.pointerEvents = 'none';
        }

        if (optGrid) {
            optGrid.innerHTML = '';
            const letters = ['A', 'B', 'C', 'D'];
            q.options.forEach((optText, optIdx) => {
                const btn = document.createElement('button');
                btn.className = 'gk-opt-btn';
                btn.innerHTML = `<span class="gk-opt-letter">${letters[optIdx]}</span><span>${optText}</span>`;
                btn.onclick = () => handleOptionClick(optIdx, btn);
                optGrid.appendChild(btn);
            });
        }
    }

    function handleOptionClick(selectedIndex, clickedBtn) {
        if (answeredCurrent) return;
        answeredCurrent = true;

        const q = GK_DATABASE[currentQuizIndex];
        const allBtns = document.querySelectorAll('.gk-opt-btn');
        allBtns.forEach(b => b.disabled = true);

        const expBox = getEl('gk-explanation-box');
        const nextBtn = getEl('btn-gk-next');
        const scoreEl = getEl('gk-current-score');
        const streakEl = getEl('gk-current-streak');

        if (selectedIndex === q.ans) {
            // Correct
            clickedBtn.classList.add('correct');
            quizScore++;
            quizStreak++;
            if (scoreEl) scoreEl.innerText = `${quizScore} / ${GK_DATABASE.length}`;
            if (streakEl) streakEl.innerText = `🔥 ${quizStreak}`;

            if (expBox) {
                expBox.style.display = 'block';
                expBox.style.borderLeftColor = '#10b981';
                expBox.innerHTML = `<strong>✓ Correct!</strong> ${q.fact}`;
            }
        } else {
            // Wrong
            clickedBtn.classList.add('wrong');
            quizStreak = 0;
            if (streakEl) streakEl.innerText = `🔥 0`;

            // Highlight the correct one
            if (allBtns[q.ans]) {
                allBtns[q.ans].classList.add('correct');
            }

            if (expBox) {
                expBox.style.display = 'block';
                expBox.style.borderLeftColor = '#ef4444';
                expBox.innerHTML = `<strong>✗ Not quite!</strong> The correct answer is <strong>${q.ansText}</strong>.<br>${q.fact}`;
            }
        }

        if (nextBtn) {
            nextBtn.style.opacity = '1';
            nextBtn.style.pointerEvents = 'auto';
        }
    }

    window.nextGkQuestion = function() {
        if (currentQuizIndex < GK_DATABASE.length - 1) {
            loadQuizQuestion(currentQuizIndex + 1);
        } else {
            // Finished
            alert(`🎉 Congratulations! You completed the GK Test!\nYour Final Score: ${quizScore} / 50`);
            quizScore = 0;
            quizStreak = 0;
            const scoreEl = getEl('gk-current-score');
            const streakEl = getEl('gk-current-streak');
            if (scoreEl) scoreEl.innerText = `0 / ${GK_DATABASE.length}`;
            if (streakEl) streakEl.innerText = `🔥 0`;
            loadQuizQuestion(0);
        }
    };

    // =========================================================================
    // 2. STUDY SHEET / BROWSE 50 Q&A LOGIC
    // =========================================================================
    function renderGkList(filterCat = 'all', searchQuery = '') {
        const container = getEl('gk-qa-list-container');
        if (!container) return;

        let filtered = GK_DATABASE;
        if (filterCat !== 'all') {
            filtered = filtered.filter(item => item.cat === filterCat);
        }

        if (searchQuery && searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(item =>
                item.q.toLowerCase().includes(query) ||
                item.ansText.toLowerCase().includes(query) ||
                item.fact.toLowerCase().includes(query)
            );
        }

        const countBadge = getEl('gk-filtered-count');
        if (countBadge) {
            countBadge.innerText = `${filtered.length} of ${GK_DATABASE.length} Questions`;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1; color: #64748b;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
                    <p style="font-weight: 600; margin: 0;">No matching GK questions found.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.25rem;">Try searching for a different keyword like 'planet', 'gandhi', 'cell', or 'constitution'.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(item => `
            <div class="gk-qa-card" id="gk-card-${item.id}">
                <div class="gk-qa-header">
                    <span class="gk-qa-number-badge">#${item.id} &bull; ${item.catName}</span>
                    <button class="btn-copy-solution" onclick="copyGkItem(${item.id}, this)" title="Copy question and answer">
                        <span>📋</span> Copy
                    </button>
                </div>
                <div class="gk-qa-question-text">${item.id}. ${item.q}</div>
                <div class="gk-qa-answer-box">
                    <div class="gk-qa-ans-label">Verified Answer:</div>
                    <div class="gk-qa-ans-text">${item.ansText}</div>
                    <div class="gk-qa-explanation">${item.fact}</div>
                </div>
            </div>
        `).join('');
    }

    window.filterGkByCategory = function(category, btnElement) {
        currentActiveFilter = category;
        document.querySelectorAll('.gk-filter-pill').forEach(btn => {
            btn.classList.remove('active');
        });
        if (btnElement) btnElement.classList.add('active');

        const searchInput = getEl('gk-search-input');
        const q = searchInput ? searchInput.value : '';
        renderGkList(category, q);
    };

    window.handleGkSearch = function(query) {
        renderGkList(currentActiveFilter, query);
    };

    window.switchGkMode = function(mode) {
        const quizView = getEl('gk-quiz-mode-container');
        const sheetView = getEl('gk-sheet-mode-container');
        const btnQuiz = getEl('gk-btn-quiz-mode');
        const btnSheet = getEl('gk-btn-sheet-mode');

        if (mode === 'quiz') {
            if (quizView) quizView.classList.remove('hidden');
            if (sheetView) sheetView.classList.add('hidden');
            if (btnQuiz) btnQuiz.classList.add('active');
            if (btnSheet) btnSheet.classList.remove('active');
        } else {
            if (quizView) quizView.classList.add('hidden');
            if (sheetView) sheetView.classList.remove('hidden');
            if (btnQuiz) btnQuiz.classList.remove('active');
            if (btnSheet) btnSheet.classList.add('active');
            renderGkList(currentActiveFilter);
        }
    };

    window.copyGkItem = function(id, btn) {
        const item = GK_DATABASE.find(x => x.id === id);
        if (!item) return;
        const text = `Q: ${item.q}\nAnswer: ${item.ansText}\nExplanation: ${item.fact}\n(Source: SolveSpot - https://solvespot.in/gk/)`;
        navigator.clipboard.writeText(text).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = '<span>✓</span> Copied!';
            setTimeout(() => { btn.innerHTML = original; }, 1800);
        }).catch(() => {});
    };

    // =========================================================================
    // 3. INITIALIZATION
    // =========================================================================
    window.initGkQuiz = function() {
        loadQuizQuestion(currentQuizIndex);
        renderGkList(currentActiveFilter);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { window.initGkQuiz(); });
    } else {
        window.initGkQuiz();
    }

})();

