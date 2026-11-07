/* ==========================================================================
   SOLVESPOT STUDENT TOOLS ENGINE (tools.js)
   1. Interactive Class 9 Periodic Table & Bohr-Bury Atom Visualizer
   2. Instant CBSE Marks, Grade (A1-E), CGPA & Percentage Calculator
   ========================================================================== */

(function () {
    'use strict';

    // ========================================================================
    // PART 1: CLASS 9 INTERACTIVE PERIODIC TABLE DATA & BOHR SHELL VISUALIZER
    // ========================================================================

    var PT_ELEMENTS = [
        {
            z: 1, sym: 'H', name: 'Hydrogen', a: 1, n: 0, shells: [1], valency: '1', ion: 'H⁺ / H⁻',
            cat: 'nonmetal', catLabel: 'Non-Metal (Gas)', group: 1, period: 1, class9Core: true,
            compounds: [
                { f: 'H₂O', n: 'Water' },
                { f: 'HCl', n: 'Hydrochloric Acid' },
                { f: 'NH₃', n: 'Ammonia' },
                { f: 'H₂SO₄', n: 'Sulphuric Acid' }
            ],
            note: 'Lightest element! Has 1 proton and 0 neutrons in Protium (¹H). Needs 1 electron to complete its K-shell duplet (Valency = 1). Three isotopes: Protium (¹H), Deuterium (²H), Tritium (³H).'
        },
        {
            z: 2, sym: 'He', name: 'Helium', a: 4, n: 2, shells: [2], valency: '0 (Stable Duplet)', ion: 'None (Inert)',
            cat: 'noble', catLabel: 'Noble Gas', group: 18, period: 1, class9Core: true,
            compounds: [
                { f: 'He (Mono-atomic)', n: 'Weather Balloons & Diving Gas' }
            ],
            note: 'K-shell is completely full with 2 electrons (Duplet Rule). Hence Valency = 0 and it does not react to form compounds. Used by Rutherford (α-particles are He²⁺ nuclei)!'
        },
        {
            z: 3, sym: 'Li', name: 'Lithium', a: 7, n: 4, shells: [2, 1], valency: '1', ion: 'Li⁺ (Cation)',
            cat: 'alkali', catLabel: 'Alkali Metal', group: 1, period: 2, class9Core: true,
            compounds: [
                { f: 'LiCl', n: 'Lithium Chloride' },
                { f: 'Li₂O', n: 'Lithium Oxide' },
                { f: 'LiOH', n: 'Lithium Hydroxide' }
            ],
            note: 'Loses 1 valence electron from its L-shell to achieve a stable He-like duplet (K=2). Forms monovalent Li⁺ ion.'
        },
        {
            z: 4, sym: 'Be', name: 'Beryllium', a: 9, n: 5, shells: [2, 2], valency: '2', ion: 'Be²⁺ (Cation)',
            cat: 'alkaline', catLabel: 'Alkaline Earth Metal', group: 2, period: 2, class9Core: true,
            compounds: [
                { f: 'BeO', n: 'Beryllium Oxide' },
                { f: 'BeCl₂', n: 'Beryllium Chloride' }
            ],
            note: 'Has 2 electrons in its outermost L-shell. Loses 2 electrons to show a Valency of 2.'
        },
        {
            z: 5, sym: 'B', name: 'Boron', a: 11, n: 6, shells: [2, 3], valency: '3', ion: 'B³⁺ / Covalent',
            cat: 'metalloid', catLabel: 'Metalloid', group: 13, period: 2, class9Core: true,
            compounds: [
                { f: 'B₂O₃', n: 'Boron Trioxide' },
                { f: 'H₃BO₃', n: 'Boric Acid' },
                { f: 'Na₂B₄O₇', n: 'Borax' }
            ],
            note: 'Has 3 valence electrons in the L-shell (2, 3). Shows properties between metals and non-metals (Metalloid).'
        },
        {
            z: 6, sym: 'C', name: 'Carbon', a: 12, n: 6, shells: [2, 4], valency: '4 (Tetravalent)', ion: 'Shares 4 e⁻',
            cat: 'nonmetal', catLabel: 'Non-Metal (Solid)', group: 14, period: 2, class9Core: true,
            compounds: [
                { f: 'CO₂', n: 'Carbon Dioxide' },
                { f: 'CH₄', n: 'Methane' },
                { f: 'CCl₄', n: 'Carbon Tetrachloride' },
                { f: 'CaCO₃', n: 'Calcium Carbonate' }
            ],
            note: 'Carbon-12 (¹²C) is the official IUPAC standard for defining 1 Atomic Mass Unit (1 u = 1/12th mass of C-12 atom). Isotope ¹⁴C is used in Carbon Dating!'
        },
        {
            z: 7, sym: 'N', name: 'Nitrogen', a: 14, n: 7, shells: [2, 5], valency: '3', ion: 'N³⁻ (Nitride)',
            cat: 'nonmetal', catLabel: 'Non-Metal (Gas)', group: 15, period: 2, class9Core: true,
            compounds: [
                { f: 'NH₃', n: 'Ammonia' },
                { f: 'HNO₃', n: 'Nitric Acid' },
                { f: 'NH₄Cl', n: 'Ammonium Chloride' },
                { f: 'NaNO₃', n: 'Sodium Nitrate' }
            ],
            note: 'Has 5 electrons in its L-shell (2, 5). Valency = 8 - 5 = 3 because it gains or shares 3 electrons to complete its octet.'
        },
        {
            z: 8, sym: 'O', name: 'Oxygen', a: 16, n: 8, shells: [2, 6], valency: '2', ion: 'O²⁻ (Oxide)',
            cat: 'nonmetal', catLabel: 'Non-Metal (Gas)', group: 16, period: 2, class9Core: true,
            compounds: [
                { f: 'H₂O', n: 'Water' },
                { f: 'CO₂', n: 'Carbon Dioxide' },
                { f: 'MgO', n: 'Magnesium Oxide' },
                { f: 'Al₂O₃', n: 'Aluminium Oxide' }
            ],
            note: 'Has 6 valence electrons (2, 6). Valency = 8 - 6 = 2. Forms diatomic gas O₂ (Atomicity = 2) and Ozone O₃ (Atomicity = 3).'
        },
        {
            z: 9, sym: 'F', name: 'Fluorine', a: 19, n: 10, shells: [2, 7], valency: '1', ion: 'F⁻ (Fluoride)',
            cat: 'halogen', catLabel: 'Halogen (Gas)', group: 17, period: 2, class9Core: true,
            compounds: [
                { f: 'HF', n: 'Hydrogen Fluoride' },
                { f: 'NaF', n: 'Sodium Fluoride' },
                { f: 'CaF₂', n: 'Calcium Fluoride' }
            ],
            note: '7 valence electrons in L-shell (2, 7). Valency = 8 - 7 = 1. Most electronegative and reactive non-metal!'
        },
        {
            z: 10, sym: 'Ne', name: 'Neon', a: 20, n: 10, shells: [2, 8], valency: '0 (Stable Octet)', ion: 'None (Inert)',
            cat: 'noble', catLabel: 'Noble Gas', group: 18, period: 2, class9Core: true,
            compounds: [
                { f: 'Ne (Mono-atomic)', n: 'Neon Glow Signs & Lamps' }
            ],
            note: 'Complete octet in L-shell (K=2, L=8). Valency = 0. Exists as mono-atomic gas with zero chemical reactivity.'
        },
        {
            z: 11, sym: 'Na', name: 'Sodium (Natrium)', a: 23, n: 12, shells: [2, 8, 1], valency: '1', ion: 'Na⁺ (Cation)',
            cat: 'alkali', catLabel: 'Alkali Metal', group: 1, period: 3, class9Core: true,
            compounds: [
                { f: 'NaCl', n: 'Sodium Chloride' },
                { f: 'NaOH', n: 'Sodium Hydroxide' },
                { f: 'Na₂CO₃', n: 'Sodium Carbonate' },
                { f: 'NaHCO₃', n: 'Baking Soda' }
            ],
            note: 'Latin name: Natrium (symbol Na). Has 1 electron in M-shell (2, 8, 1), which it readily loses to form Na⁺ with a stable (2, 8) octet!'
        },
        {
            z: 12, sym: 'Mg', name: 'Magnesium', a: 24, n: 12, shells: [2, 8, 2], valency: '2', ion: 'Mg²⁺ (Cation)',
            cat: 'alkaline', catLabel: 'Alkaline Earth Metal', group: 2, period: 3, class9Core: true,
            compounds: [
                { f: 'MgCl₂', n: 'Magnesium Chloride' },
                { f: 'MgO', n: 'Magnesium Oxide' },
                { f: 'Mg(OH)₂', n: 'Milk of Magnesia' },
                { f: 'MgSO₄', n: 'Magnesium Sulphate' }
            ],
            note: '2 valence electrons in M-shell (2, 8, 2). Loses 2 electrons to form divalent Mg²⁺ cation (Valency = 2).'
        },
        {
            z: 13, sym: 'Al', name: 'Aluminium', a: 27, n: 14, shells: [2, 8, 3], valency: '3', ion: 'Al³⁺ (Cation)',
            cat: 'postmetal', catLabel: 'Post-Transition Metal', group: 13, period: 3, class9Core: true,
            compounds: [
                { f: 'Al₂O₃', n: 'Aluminium Oxide' },
                { f: 'AlCl₃', n: 'Aluminium Chloride' },
                { f: 'Al₂(SO₄)₃', n: 'Aluminium Sulphate' },
                { f: 'Al(OH)₃', n: 'Aluminium Hydroxide' }
            ],
            note: 'Favorite CBSE Criss-Cross question! Has 3 valence electrons (2, 8, 3) -> Valency = 3 (Al³⁺). With SO₄²⁻, criss-cross gives Al₂(SO₄)₃!'
        },
        {
            z: 14, sym: 'Si', name: 'Silicon', a: 28, n: 14, shells: [2, 8, 4], valency: '4', ion: 'Shares 4 e⁻',
            cat: 'metalloid', catLabel: 'Metalloid', group: 14, period: 3, class9Core: true,
            compounds: [
                { f: 'SiO₂', n: 'Silica (Quartz/Sand)' },
                { f: 'SiCl₄', n: 'Silicon Tetrachloride' }
            ],
            note: '4 valence electrons in M-shell (2, 8, 4). Shares 4 electrons (Valency = 4). Backbone of computer microchips and solar cells.'
        },
        {
            z: 15, sym: 'P', name: 'Phosphorus', a: 31, n: 16, shells: [2, 8, 5], valency: '3, 5', ion: 'P³⁻ (Phosphide)',
            cat: 'nonmetal', catLabel: 'Non-Metal (Polyatomic)', group: 15, period: 3, class9Core: true,
            compounds: [
                { f: 'P₄', n: 'White Phosphorus (Tetra-atomic)' },
                { f: 'PCl₃ / PCl₅', n: 'Phosphorus Chlorides' },
                { f: 'H₃PO₄', n: 'Phosphoric Acid' }
            ],
            note: '5 valence electrons (2, 8, 5). Usually gains 3 electrons (Valency = 8 - 5 = 3) or shares all 5 electrons (Valency = 5). Atomicity of P₄ is 4!'
        },
        {
            z: 16, sym: 'S', name: 'Sulphur', a: 32, n: 16, shells: [2, 8, 6], valency: '2', ion: 'S²⁻ (Sulphide)',
            cat: 'nonmetal', catLabel: 'Non-Metal (Octa-atomic)', group: 16, period: 3, class9Core: true,
            compounds: [
                { f: 'H₂S', n: 'Hydrogen Sulphide' },
                { f: 'SO₂', n: 'Sulphur Dioxide' },
                { f: 'H₂SO₄', n: 'Sulphuric Acid' },
                { f: 'Na₂S', n: 'Sodium Sulphide' }
            ],
            note: '6 valence electrons in M-shell (2, 8, 6). Gains 2 electrons for octet -> Valency = 8 - 6 = 2. Exists as S₈ crown ring (Polyatomic, Atomicity = 8).'
        },
        {
            z: 17, sym: 'Cl', name: 'Chlorine', a: 35.5, n: 18, shells: [2, 8, 7], valency: '1', ion: 'Cl⁻ (Chloride)',
            cat: 'halogen', catLabel: 'Halogen (Gas)', group: 17, period: 3, class9Core: true,
            compounds: [
                { f: 'NaCl', n: 'Sodium Chloride' },
                { f: 'HCl', n: 'Hydrochloric Acid' },
                { f: 'CaCl₂', n: 'Calcium Chloride' },
                { f: 'CCl₄', n: 'Carbon Tetrachloride' }
            ],
            note: '7 valence electrons (2, 8, 7) -> Valency = 8 - 7 = 1. Fractional mass 35.5 u comes from two isotopes: ³⁵Cl (75%) and ³⁷Cl (25%)!'
        },
        {
            z: 18, sym: 'Ar', name: 'Argon', a: 40, n: 22, shells: [2, 8, 8], valency: '0 (Stable Octet)', ion: 'None (Inert)',
            cat: 'noble', catLabel: 'Noble Gas', group: 18, period: 3, class9Core: true,
            compounds: [
                { f: 'Ar (Mono-atomic)', n: 'Incandescent Light Bulbs' }
            ],
            note: '8 valence electrons in M-shell (2, 8, 8) -> Valency = 0. Notice that Argon (⁴⁰₁₈Ar) and Calcium (⁴⁰₂₀Ca) have the same Mass Number (40) — they are ISOBARS!'
        },
        {
            z: 19, sym: 'K', name: 'Potassium (Kalium)', a: 39, n: 20, shells: [2, 8, 8, 1], valency: '1', ion: 'K⁺ (Cation)',
            cat: 'alkali', catLabel: 'Alkali Metal', group: 1, period: 4, class9Core: true,
            compounds: [
                { f: 'KCl', n: 'Potassium Chloride' },
                { f: 'KOH', n: 'Potassium Hydroxide' },
                { f: 'KNO₃', n: 'Potassium Nitrate' },
                { f: 'KMnO₄', n: 'Potassium Permanganate' }
            ],
            note: 'Latin name: Kalium (symbol K). Why (2, 8, 8, 1) and not (2, 8, 9)? Because Bohr-Bury Rule states the outermost shell cannot hold more than 8 electrons!'
        },
        {
            z: 20, sym: 'Ca', name: 'Calcium', a: 40, n: 20, shells: [2, 8, 8, 2], valency: '2', ion: 'Ca²⁺ (Cation)',
            cat: 'alkaline', catLabel: 'Alkaline Earth Metal', group: 2, period: 4, class9Core: true,
            compounds: [
                { f: 'CaO', n: 'Quick Lime (Calcium Oxide)' },
                { f: 'Ca(OH)₂', n: 'Slaked Lime' },
                { f: 'CaCO₃', n: 'Limestone / Marble' },
                { f: 'CaCl₂', n: 'Calcium Chloride' }
            ],
            note: 'Electronic configuration (2, 8, 8, 2) -> Valency = 2. ⁴⁰₂₀Ca and ⁴⁰₁₈Ar are the classic NCERT example of Isobars (different Z, same A = 40).'
        },
        // Key Extra Elements in NCERT Class 9 & 10
        {
            z: 26, sym: 'Fe', name: 'Iron (Ferrum)', a: 56, n: 30, shells: [2, 8, 14, 2], valency: '2, 3', ion: 'Fe²⁺ (Ferrous) / Fe³⁺ (Ferric)',
            cat: 'transition', catLabel: 'Transition Metal', group: 8, period: 4, class9Core: true,
            compounds: [
                { f: 'FeSO₄', n: 'Ferrous Sulphate' },
                { f: 'Fe₂O₃', n: 'Ferric Oxide (Rust)' },
                { f: 'FeS', n: 'Iron(II) Sulphide' }
            ],
            note: 'Latin name: Ferrum (symbol Fe). Shows variable valency: Fe²⁺ (Ferrous, Valency 2) and Fe³⁺ (Ferric, Valency 3).'
        },
        {
            z: 27, sym: 'Co', name: 'Cobalt', a: 59, n: 32, shells: [2, 8, 15, 2], valency: '2, 3', ion: 'Co²⁺',
            cat: 'transition', catLabel: 'Transition Metal', group: 9, period: 4, class9Core: true,
            compounds: [
                { f: 'CoCl₂', n: 'Cobalt Chloride' },
                { f: '⁶⁰Co Isotope', n: 'Cancer Radiotherapy' }
            ],
            note: 'NCERT Isotope Application: An isotope of Cobalt (Cobalt-60) is used in the medical treatment of cancer!'
        },
        {
            z: 29, sym: 'Cu', name: 'Copper (Cuprum)', a: 63.5, n: 35, shells: [2, 8, 18, 1], valency: '1, 2', ion: 'Cu⁺ / Cu²⁺ (Cupric)',
            cat: 'transition', catLabel: 'Transition Metal', group: 11, period: 4, class9Core: true,
            compounds: [
                { f: 'CuSO₄·5H₂O', n: 'Blue Vitriol (Copper Sulphate)' },
                { f: 'CuO', n: 'Copper(II) Oxide' },
                { f: 'CuCl₂', n: 'Copper(II) Chloride' }
            ],
            note: 'Latin name: Cuprum (Cu). Shows Valency 1 (Cuprous, Cu⁺) and Valency 2 (Cupric, Cu²⁺). CuSO₄ is widely used in Class 9 displacement & mass conservation labs!'
        },
        {
            z: 30, sym: 'Zn', name: 'Zinc', a: 65, n: 35, shells: [2, 8, 18, 2], valency: '2', ion: 'Zn²⁺ (Cation)',
            cat: 'transition', catLabel: 'Transition Metal', group: 12, period: 4, class9Core: true,
            compounds: [
                { f: 'ZnSO₄', n: 'Zinc Sulphate' },
                { f: 'ZnO', n: 'Zinc Oxide' },
                { f: 'ZnCl₂', n: 'Zinc Chloride' }
            ],
            note: 'Always exhibits a fixed Valency of 2 (forms Zn²⁺ ion). Used for galvanizing iron to prevent rusting.'
        },
        {
            z: 35, sym: 'Br', name: 'Bromine', a: 80, n: 45, shells: [2, 8, 18, 7], valency: '1', ion: 'Br⁻ (Bromide)',
            cat: 'halogen', catLabel: 'Halogen (Liquid)', group: 17, period: 4, class9Core: true,
            compounds: [
                { f: 'HBr', n: 'Hydrogen Bromide' },
                { f: 'AgBr', n: 'Silver Bromide' },
                { f: 'KBr', n: 'Potassium Bromide' }
            ],
            note: 'The ONLY non-metal that is a liquid at room temperature! Has 7 valence electrons -> Valency = 1.'
        },
        {
            z: 47, sym: 'Ag', name: 'Silver (Argentum)', a: 108, n: 61, shells: [2, 8, 18, 18, 1], valency: '1', ion: 'Ag⁺ (Cation)',
            cat: 'transition', catLabel: 'Transition Metal', group: 11, period: 5, class9Core: true,
            compounds: [
                { f: 'AgNO₃', n: 'Silver Nitrate' },
                { f: 'AgCl', n: 'Silver Chloride' },
                { f: 'Ag₂S', n: 'Silver Sulphide (Tarnish)' }
            ],
            note: 'Latin name: Argentum (Ag). Best conductor of electricity! Forms monovalent Ag⁺ cation (Valency = 1).'
        },
        {
            z: 53, sym: 'I', name: 'Iodine', a: 127, n: 74, shells: [2, 8, 18, 18, 7], valency: '1', ion: 'I⁻ (Iodide)',
            cat: 'halogen', catLabel: 'Halogen (Solid)', group: 17, period: 5, class9Core: true,
            compounds: [
                { f: 'KI', n: 'Potassium Iodide (Iodized Salt)' },
                { f: '¹³¹I Isotope', n: 'Goitre Treatment' }
            ],
            note: 'Lustrous purple-black non-metal that sublimes on heating! NCERT Isotope Application: An isotope of Iodine (I-131) is used in the treatment of Goitre.'
        },
        {
            z: 56, sym: 'Ba', name: 'Barium', a: 137, n: 81, shells: [2, 8, 18, 18, 8, 2], valency: '2', ion: 'Ba²⁺ (Cation)',
            cat: 'alkaline', catLabel: 'Alkaline Earth Metal', group: 2, period: 6, class9Core: true,
            compounds: [
                { f: 'BaCl₂', n: 'Barium Chloride' },
                { f: 'BaSO₄', n: 'Barium Sulphate (White Precipitate)' }
            ],
            note: 'Featured in NCERT Ch 3 Law of Conservation of Mass activity: Barium Chloride (BaCl₂) + Sodium Sulphate (Na₂SO₄) -> White precipitate of BaSO₄!'
        },
        {
            z: 79, sym: 'Au', name: 'Gold (Aurum)', a: 197, n: 118, shells: [2, 8, 18, 32, 18, 1], valency: '1, 3', ion: 'Au⁺ / Au³⁺',
            cat: 'transition', catLabel: 'Transition Metal', group: 11, period: 6, class9Core: true,
            compounds: [
                { f: 'Au Foil', n: 'Rutherford α-Scattering Experiment' }
            ],
            note: 'Latin name: Aurum (Au). Rutherford selected Gold foil for his α-particle scattering experiment because gold is the most malleable metal (1000 atoms thin)!'
        },
        {
            z: 80, sym: 'Hg', name: 'Mercury (Hydrargyrum)', a: 200.6, n: 121, shells: [2, 8, 18, 32, 18, 2], valency: '1, 2', ion: 'Hg²⁺',
            cat: 'transition', catLabel: 'Transition Metal (Liquid)', group: 12, period: 6, class9Core: true,
            compounds: [
                { f: 'HgO', n: 'Mercuric Oxide' },
                { f: 'HgS', n: 'Cinnabar' }
            ],
            note: 'Latin name: Hydrargyrum (Hg). The ONLY metal that is liquid at room temperature! Used in thermometers and barometers.'
        },
        {
            z: 82, sym: 'Pb', name: 'Lead (Plumbum)', a: 207, n: 125, shells: [2, 8, 18, 32, 18, 4], valency: '2, 4', ion: 'Pb²⁺',
            cat: 'postmetal', catLabel: 'Post-Transition Metal', group: 14, period: 6, class9Core: true,
            compounds: [
                { f: 'Pb(NO₃)₂', n: 'Lead Nitrate' },
                { f: 'PbI₂', n: 'Lead Iodide (Yellow Precipitate)' }
            ],
            note: 'Latin name: Plumbum (symbol Pb). Commonly shows Valency = 2 in ionic compounds like Pb(NO₃)₂.'
        },
        {
            z: 92, sym: 'U', name: 'Uranium', a: 235, n: 143, shells: [2, 8, 18, 32, 21, 9, 2], valency: '4, 6', ion: 'U⁴⁺ / UO₂²⁺',
            cat: 'transition', catLabel: 'Actinide (Radioactive)', group: 3, period: 7, class9Core: true,
            compounds: [
                { f: '²³⁵U Isotope', n: 'Nuclear Reactor Fuel' },
                { f: 'UF₆', n: 'Uranium Hexafluoride' }
            ],
            note: 'NCERT Isotope Application: An isotope of Uranium (U-235) is used as a nuclear fuel in nuclear power reactors to generate electricity!'
        }
    ];

    var ptCurrentMode = 'class9'; // 'class9' or 'periodic18'
    var ptSelectedCat = 'all';
    var ptSelectedZ = 11; // Default to Sodium (Na) - iconic Class 9 example!
    var ptBohrAnimId = null;
    var ptBohrAngle = 0;

    function getElementByZ(z) {
        for (var i = 0; i < PT_ELEMENTS.length; i++) {
            if (PT_ELEMENTS[i].z === z) return PT_ELEMENTS[i];
        }
        return PT_ELEMENTS[0];
    }

    function shellLabelsString(shells) {
        var names = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
        var parts = [];
        for (var i = 0; i < shells.length; i++) {
            parts.push(names[i] + '=' + shells[i]);
        }
        return parts.join(', ');
    }

    function drawBohrDiagram() {
        var canvas = document.getElementById('pt-bohr-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var el = getElementByZ(ptSelectedZ);
        if (!el) return;

        var w = canvas.width;
        var h = canvas.height;
        var cx = w / 2;
        var cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        var shells = el.shells;
        var numShells = shells.length;
        var maxRadius = Math.min(cx, cy) - 16;
        var minRadius = 32;
        var step = numShells > 1 ? (maxRadius - minRadius) / (numShells - 1) : 0;
        if (numShells === 1) minRadius = 56;

        var shellNames = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

        // Draw Concentric Bohr Orbit Rings
        for (var s = 0; s < numShells; s++) {
            var r = minRadius + s * step;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = s === numShells - 1 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(148, 163, 184, 0.28)';
            ctx.lineWidth = s === numShells - 1 ? 1.8 : 1.2;
            ctx.stroke();

            // Shell label (K, L, M, N) at top of ring
            if (numShells <= 4) {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
                ctx.font = 'bold 9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(shellNames[s], cx, cy - r + 9);
            }

            // Draw Orbiting Electrons on this shell
            var count = shells[s];
            var speedFactor = (s % 2 === 0 ? 1 : -0.8) * (1 / (s + 1));
            for (var e = 0; e < count; e++) {
                var theta = (Math.PI * 2 * e) / count + ptBohrAngle * speedFactor;
                var ex = cx + Math.cos(theta) * r;
                var ey = cy + Math.sin(theta) * r;

                var isValence = (s === numShells - 1);
                ctx.beginPath();
                ctx.arc(ex, ey, isValence ? 4.8 : 3.6, 0, Math.PI * 2);
                ctx.fillStyle = isValence ? '#38bdf8' : '#94a3b8';
                ctx.shadowColor = isValence ? '#38bdf8' : 'transparent';
                ctx.shadowBlur = isValence ? 8 : 0;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // Draw Central Nucleus
        var nucGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 20);
        nucGrad.addColorStop(0, '#f43f5e');
        nucGrad.addColorStop(1, '#9f1239');
        ctx.beginPath();
        ctx.arc(cx, cy, 19, 0, Math.PI * 2);
        ctx.fillStyle = nucGrad;
        ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.sym, cx, cy - 3);
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillStyle = '#fecdd3';
        ctx.fillText(el.z + 'p⁺', cx, cy + 7);
    }

    function startBohrAnimationLoop() {
        if (ptBohrAnimId) cancelAnimationFrame(ptBohrAnimId);
        function step() {
            var periodicView = document.getElementById('periodic-view');
            if (periodicView && !periodicView.classList.contains('hidden')) {
                ptBohrAngle += 0.015;
                drawBohrDiagram();
            }
            ptBohrAnimId = requestAnimationFrame(step);
        }
        ptBohrAnimId = requestAnimationFrame(step);
    }

    window.selectPeriodicElement = function (z) {
        ptSelectedZ = z;
        var el = getElementByZ(z);
        if (!el) return;

        // Update active highlight on grid cells
        var cells = document.querySelectorAll('.pt-cell');
        for (var i = 0; i < cells.length; i++) {
            var cellZ = parseInt(cells[i].getAttribute('data-z'), 10);
            if (cellZ === z) {
                cells[i].classList.add('active-element');
            } else {
                cells[i].classList.remove('active-element');
            }
        }

        // Update Inspector DOM
        var symEl = document.getElementById('pt-insp-sym');
        var nameEl = document.getElementById('pt-insp-name');
        var catEl = document.getElementById('pt-insp-cat');
        var zEl = document.getElementById('pt-insp-z');
        var aEl = document.getElementById('pt-insp-a');
        var pneEl = document.getElementById('pt-insp-pne');
        var shellsEl = document.getElementById('pt-insp-shells');
        var valEl = document.getElementById('pt-insp-valency');
        var ionEl = document.getElementById('pt-insp-ion');
        var captionEl = document.getElementById('pt-bohr-caption');
        var compList = document.getElementById('pt-insp-compounds');
        var noteEl = document.getElementById('pt-insp-note');

        if (symEl) symEl.innerHTML = '<small>Z=' + el.z + '</small>' + el.sym;
        if (nameEl) nameEl.textContent = el.name + ' (' + el.sym + ')';
        if (catEl) catEl.textContent = el.catLabel;
        if (zEl) zEl.textContent = el.z;
        if (aEl) aEl.textContent = el.a + ' u';
        if (pneEl) pneEl.textContent = el.z + ' p⁺ | ' + el.n + ' n⁰ | ' + el.z + ' e⁻';
        if (shellsEl) shellsEl.textContent = '(' + el.shells.join(', ') + ') → ' + shellLabelsString(el.shells);
        if (valEl) valEl.textContent = el.valency;
        if (ionEl) ionEl.textContent = el.ion;
        if (captionEl) captionEl.textContent = 'Bohr-Bury Shells: ' + shellLabelsString(el.shells);
        if (noteEl) noteEl.textContent = '💡 NCERT Concept Note: ' + el.note;

        if (compList) {
            var html = '';
            for (var c = 0; c < el.compounds.length; c++) {
                html += '<span class="pt-compound-pill"><strong>' + el.compounds[c].f + '</strong> ' + el.compounds[c].n + '</span>';
            }
            compList.innerHTML = html;
        }

        drawBohrDiagram();
    };

    window.setPeriodicMode = function (mode) {
        ptCurrentMode = mode;
        var btnClass9 = document.getElementById('btn-pt-mode-class9');
        var btnFull = document.getElementById('btn-pt-mode-full');
        if (btnClass9) btnClass9.classList.toggle('active', mode === 'class9');
        if (btnFull) btnFull.classList.toggle('active', mode === 'periodic18');
        renderPeriodicGrid();
    };

    window.filterPeriodicCategory = function (cat) {
        ptSelectedCat = (ptSelectedCat === cat && cat !== 'all') ? 'all' : cat;
        renderPeriodicGrid();
    };

    window.renderPeriodicGrid = function () {
        var container = document.getElementById('pt-grid-mount');
        if (!container) return;

        var searchInput = document.getElementById('pt-search-input');
        var query = searchInput ? searchInput.value.trim().toLowerCase() : '';

        if (ptCurrentMode === 'periodic18' && !query && ptSelectedCat === 'all') {
            // Render 18-Column Modern Periodic Table layout for Periods 1 to 6
            container.className = 'pt-18-grid';
            var html = '';
            for (var p = 1; p <= 6; p++) {
                for (var g = 1; g <= 18; g++) {
                    var found = null;
                    for (var i = 0; i < PT_ELEMENTS.length; i++) {
                        if (PT_ELEMENTS[i].period === p && PT_ELEMENTS[i].group === g) {
                            found = PT_ELEMENTS[i];
                            break;
                        }
                    }
                    if (found) {
                        var isAct = found.z === ptSelectedZ ? ' active-element' : '';
                        html += '<div class="pt-cell pt-cat-' + found.cat + isAct + '" data-z="' + found.z + '" onclick="selectPeriodicElement(' + found.z + ')">' +
                            '<div class="pt-cell-top"><span>' + found.z + '</span><span>V:' + String(found.valency).split(' ')[0] + '</span></div>' +
                            '<div class="pt-cell-sym">' + found.sym + '</div>' +
                            '<div class="pt-cell-name">' + found.name.split(' ')[0] + '</div>' +
                            '<div class="pt-cell-shells">' + found.shells.join(',') + '</div>' +
                            '</div>';
                    } else {
                        html += '<div style="pointer-events:none;"></div>';
                    }
                }
            }
            container.innerHTML = html;
        } else {
            // Render Responsive Class 9 Card Grid
            container.className = 'pt-class9-grid';
            var htmlCards = '';
            for (var j = 0; j < PT_ELEMENTS.length; j++) {
                var item = PT_ELEMENTS[j];
                if (ptSelectedCat !== 'all' && item.cat !== ptSelectedCat) continue;
                if (query) {
                    var match = item.name.toLowerCase().indexOf(query) !== -1 ||
                        item.sym.toLowerCase().indexOf(query) !== -1 ||
                        String(item.z) === query ||
                        item.catLabel.toLowerCase().indexOf(query) !== -1;
                    if (!match) continue;
                }
                var activeCls = item.z === ptSelectedZ ? ' active-element' : '';
                htmlCards += '<div class="pt-cell pt-cat-' + item.cat + activeCls + '" data-z="' + item.z + '" onclick="selectPeriodicElement(' + item.z + ')">' +
                    '<div class="pt-cell-top"><span>Z = ' + item.z + '</span><span>A = ' + item.a + '</span></div>' +
                    '<div class="pt-cell-sym">' + item.sym + '</div>' +
                    '<div class="pt-cell-name">' + item.name.split(' ')[0] + '</div>' +
                    '<div class="pt-cell-shells">(' + item.shells.join(', ') + ') • Val: ' + String(item.valency).split(' ')[0] + '</div>' +
                    '</div>';
            }
            if (!htmlCards) {
                htmlCards = '<div style="grid-column: 1 / -1; text-align:center; padding: 2rem; color:#64748b; font-weight:600;">No matching elements found. Try searching "Sodium", "Cl", "11", or "Noble".</div>';
            }
            container.innerHTML = htmlCards;
        }
    };

    // ========================================================================
    // PART 2: INSTANT CBSE MARKS, GRADE (A1 to E) & PERCENTAGE CALCULATOR
    // ========================================================================

    var calcHasOptional6th = false;

    function getCbseGradeInfo(pct) {
        if (pct >= 91) return { grade: 'A1', gp: 10.0, color: '#10b981', remark: 'Outstanding! Topper Aura Unlocked 🔥🏆' };
        if (pct >= 81) return { grade: 'A2', gp: 9.0, color: '#22c55e', remark: 'Excellent Performance! Distinction Star 🌟' };
        if (pct >= 71) return { grade: 'B1', gp: 8.0, color: '#38bdf8', remark: 'Very Good! Strong First Division 💪' };
        if (pct >= 61) return { grade: 'B2', gp: 7.0, color: '#60a5fa', remark: 'Good Job! Above Average Score 👍' };
        if (pct >= 51) return { grade: 'C1', gp: 6.0, color: '#f59e0b', remark: 'Fair Performance — Keep Pushing Higher! 📈' };
        if (pct >= 41) return { grade: 'C2', gp: 5.0, color: '#fb923c', remark: 'Satisfactory — Revise NCERT Key Notes 📚' };
        if (pct >= 33) return { grade: 'D', gp: 4.0, color: '#facc15', remark: 'Passed! Focus on Formula & GK Sheets to Boost Marks 🎯' };
        return { grade: 'E', gp: 0.0, color: '#ef4444', remark: 'Needs Improvement (< 33%) — You Can Bounce Back! 💡' };
    }

    window.setCalcMaxPreset = function (maxVal, btnEl) {
        var btns = document.querySelectorAll('.btn-calc-preset');
        for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
        if (btnEl) btnEl.classList.add('active');

        var maxInputs = document.querySelectorAll('.calc-max-input');
        var markInputs = document.querySelectorAll('.calc-marks-input');
        for (var j = 0; j < maxInputs.length; j++) {
            var oldMax = parseFloat(maxInputs[j].value) || 100;
            maxInputs[j].value = maxVal;
            if (markInputs[j] && markInputs[j].value !== '') {
                var curMark = parseFloat(markInputs[j].value);
                if (!isNaN(curMark)) {
                    var scaled = Math.round((curMark / oldMax) * maxVal);
                    if (scaled > maxVal) scaled = maxVal;
                    markInputs[j].value = scaled;
                }
            }
        }
        window.calculateCbseMarks(false);
    };

    window.toggleSixthSubject = function () {
        calcHasOptional6th = !calcHasOptional6th;
        var row6 = document.getElementById('calc-row-sub6');
        var btn6 = document.getElementById('btn-toggle-sub6');
        if (row6) row6.classList.toggle('hidden', !calcHasOptional6th);
        if (btn6) {
            btn6.textContent = calcHasOptional6th ? '➖ Remove 6th Subject (AI / IT)' : '➕ Add 6th Subject (AI / IT / Sanskrit)';
        }
        window.calculateCbseMarks(false);
    };

    window.fillSampleTopperMarks = function () {
        var maxInputs = document.querySelectorAll('.calc-max-input');
        var markInputs = document.querySelectorAll('.calc-marks-input');
        var samplePcts = [0.95, 0.98, 0.92, 0.94, 0.90, 0.96];
        for (var i = 0; i < markInputs.length; i++) {
            var m = parseFloat(maxInputs[i] ? maxInputs[i].value : 80) || 80;
            markInputs[i].value = Math.round(m * samplePcts[i % samplePcts.length]);
        }
        window.calculateCbseMarks(true);
    };

    window.resetCalculatorMarks = function () {
        var markInputs = document.querySelectorAll('.calc-marks-input');
        for (var i = 0; i < markInputs.length; i++) {
            markInputs[i].value = '';
        }
        window.calculateCbseMarks(false);
    };

    window.calculateCbseMarks = function (triggerConfetti) {
        var rows = document.querySelectorAll('.calc-subject-row');
        var totalScored = 0;
        var totalMax = 0;
        var totalGp = 0;
        var activeCount = 0;
        var enteredAny = false;

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row.classList.contains('hidden')) continue;

            var markInp = row.querySelector('.calc-marks-input');
            var maxInp = row.querySelector('.calc-max-input');
            var gradePill = row.querySelector('.calc-sub-grade-pill');

            var maxVal = parseFloat(maxInp ? maxInp.value : 80);
            if (isNaN(maxVal) || maxVal <= 0) maxVal = 80;

            var rawVal = markInp ? markInp.value.trim() : '';
            if (rawVal === '') {
                if (gradePill) {
                    gradePill.textContent = '—';
                    gradePill.style.background = '#e2e8f0';
                    gradePill.style.color = '#475569';
                }
                continue;
            }

            var scored = parseFloat(rawVal);
            if (isNaN(scored) || scored < 0) scored = 0;
            if (scored > maxVal) {
                scored = maxVal;
                markInp.value = maxVal;
            }

            enteredAny = true;
            activeCount++;
            totalScored += scored;
            totalMax += maxVal;

            var subPct = (scored / maxVal) * 100;
            var gInfo = getCbseGradeInfo(subPct);
            totalGp += gInfo.gp;

            if (gradePill) {
                gradePill.textContent = gInfo.grade;
                gradePill.style.background = gInfo.color;
                gradePill.style.color = '#0f172a';
            }
        }

        var pctNumEl = document.getElementById('calc-res-pct');
        var circleEl = document.getElementById('calc-pct-circle');
        var gradeEl = document.getElementById('calc-res-grade');
        var remarkEl = document.getElementById('calc-res-remark');
        var totalEl = document.getElementById('calc-res-total');
        var cgpaEl = document.getElementById('calc-res-cgpa');
        var statusEl = document.getElementById('calc-res-status');
        var divEl = document.getElementById('calc-res-division');

        if (!enteredAny || totalMax === 0) {
            if (pctNumEl) pctNumEl.textContent = '0%';
            if (circleEl) circleEl.style.setProperty('--calc-pct', '0%');
            if (gradeEl) gradeEl.textContent = 'Enter Marks Above';
            if (remarkEl) remarkEl.textContent = 'Type your marks in Science, Maths, SST, English & Hindi to see your instant CBSE Scorecard!';
            if (totalEl) totalEl.textContent = '0 / 0';
            if (cgpaEl) cgpaEl.textContent = '0.0';
            if (statusEl) statusEl.textContent = 'Waiting...';
            if (divEl) divEl.textContent = '—';
            return;
        }

        var overallPct = (totalScored / totalMax) * 100;
        var pctFormatted = overallPct.toFixed(2).replace(/\.00$/, '');
        var overallInfo = getCbseGradeInfo(overallPct);
        var avgCgpa = (totalGp / activeCount).toFixed(1);

        if (pctNumEl) pctNumEl.textContent = pctFormatted + '%';
        if (circleEl) circleEl.style.setProperty('--calc-pct', Math.min(100, Math.max(0, overallPct)) + '%');
        if (gradeEl) {
            gradeEl.textContent = 'CBSE Grade: ' + overallInfo.grade;
            gradeEl.style.color = overallInfo.color;
        }
        if (remarkEl) remarkEl.textContent = overallInfo.remark;
        if (totalEl) totalEl.textContent = (Math.round(totalScored * 10) / 10) + ' / ' + totalMax;
        if (cgpaEl) cgpaEl.textContent = avgCgpa + ' / 10';
        if (statusEl) {
            statusEl.textContent = overallPct >= 33 ? 'PASSED ✅' : 'NEEDS RETEST ⚠️';
            statusEl.style.color = overallPct >= 33 ? '#34d399' : '#f87171';
        }
        if (divEl) {
            if (overallPct >= 75) divEl.textContent = 'Distinction 🏆';
            else if (overallPct >= 60) divEl.textContent = '1st Division 🥇';
            else if (overallPct >= 45) divEl.textContent = '2nd Division 🥈';
            else if (overallPct >= 33) divEl.textContent = '3rd Division 🥉';
            else divEl.textContent = 'Below 33%';
        }

        if (triggerConfetti && overallPct >= 33) {
            launchConfettiBurst();
        }
    };

    window.copyCbseScorecard = function () {
        var pct = document.getElementById('calc-res-pct') ? document.getElementById('calc-res-pct').textContent : '0%';
        var total = document.getElementById('calc-res-total') ? document.getElementById('calc-res-total').textContent : '0/0';
        var grade = document.getElementById('calc-res-grade') ? document.getElementById('calc-res-grade').textContent : '';
        var cgpa = document.getElementById('calc-res-cgpa') ? document.getElementById('calc-res-cgpa').textContent : '';

        var text = '📊 My CBSE Class 9 Scorecard (via Solvespot.me):\n' +
            '• Percentage: ' + pct + '\n' +
            '• Total Marks: ' + total + '\n' +
            '• ' + grade + ' | CGPA: ' + cgpa + '\n' +
            'Check yours at https://solvespot.me/calculator/';

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                var btn = document.getElementById('btn-copy-scorecard');
                if (btn) {
                    var orig = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    setTimeout(function () { btn.textContent = orig; }, 2000);
                }
            });
        }
    };

    // Celebratory Confetti Animation inside Scorecard
    var confettiAnimId = null;
    function launchConfettiBurst() {
        var canvas = document.getElementById('calc-confetti-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth || 360;
        canvas.height = canvas.offsetHeight || 420;

        var colors = ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a78bfa', '#60a5fa'];
        var particles = [];
        for (var i = 0; i < 65; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height * 0.35,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 8 - 2,
                size: Math.random() * 6 + 4,
                color: colors[i % colors.length],
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.2,
                life: 1.0
            });
        }

        if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
        function step() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var alive = false;
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                if (p.life <= 0) continue;
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.22; // gravity
                p.rot += p.vRot;
                p.life -= 0.014;

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
                ctx.restore();
            }
            if (alive) {
                confettiAnimId = requestAnimationFrame(step);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        confettiAnimId = requestAnimationFrame(step);
    }

    // Initialize tools on DOMContentLoaded
    function initStudentTools() {
        renderPeriodicGrid();
        window.selectPeriodicElement(11); // Default to Sodium (Na)
        startBohrAnimationLoop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStudentTools);
    } else {
        initStudentTools();
    }
})();

