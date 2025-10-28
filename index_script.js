// index_script.js

// List of valid building names and alternate names
const buildings = {
    "ADMIN": ["administration building", "admin", "admin building", "administration"],
    "BioSci": ["biological sciences building", "bio sci", "biology", "biological sciences"],
    "Commons": ["the commons", "commons building"],
    "ENG": ["engineering building", "engineering"],
    "FINE ARTS": ["fa", "fine arts building", "fine arts"],
    "ITE": ["information and technology/engineering building", "it", "ite", "information and technology"],
    "ILSB": ["interdisciplinary life sciences building", "interdisciplinary life sciences", "ilsb"],
    "Lecture Hall 1": ["lecture hall 1", "lh1"],
    "AOKLib": ["library & gallery, albin o. kuhn", "library", "aok", "aok library"],
    "MathandPsych": ["math and psychology building", "math and psychology", "math and psych"],
    "MEYER": ["meyerhoff chemistry building", "meyerhoff", "chemistry"],
    "PAHB": ["performing arts and humanities building", "performing arts", "humanities", "pahb"],
    "PHYSICS": ["physics building", "physics"],
    "PUBPOL": ["public policy building", "public policy", "pb"],
    "RAC": ["retriever activities center", "rac", "gym"],
    "Sondheim": ["sondheim hall", "sondheim"],
    "CWB": ["the center for well-being", "center for well-being", "rih", "wellbeing center"],
    "DHALL": ["true grit’s", "dining hall", "true grits"],
    "UC": ["university center", "uc"]
};

// Normalize input
function normalize(input) {
    return input.toLowerCase().replace(/\s/g, "");
}

// Get the canonical building name if valid (to help with same location validation), otherwise null
function getCanonicalBuildingName(input) {
    const normInput = normalize(input);
    for (const [mainName, aliases] of Object.entries(buildings)) {
        if (normalize(mainName) === normInput) return mainName;
        if (aliases.some(alias => normalize(alias) === normInput)) return mainName;
    }
    return null;
}

document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector("form");
    const startInput = document.getElementById("start_dest");
    const endInput = document.getElementById("end_destination");

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const start = startInput.value.trim();
        const end = endInput.value.trim();
        const startCanonical = getCanonicalBuildingName(start);
        const endCanonical = getCanonicalBuildingName(end);
        let errors = [];

        if (!start) errors.push("Starting location is required.");
        else if (!startCanonical) errors.push(`"${start}" is not a valid building.`);

        if (!end) errors.push("Ending location is required.");
        else if (!endCanonical) errors.push(`"${end}" is not a valid building.`);

        // Check if both map to the same canonical building
        if (startCanonical && endCanonical && startCanonical === endCanonical) {
            errors.push("Starting and ending locations cannot be the same building.");
        }

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return false;
        }

        // Log to console for now. 
        console.log("Start:", startCanonical);
        console.log("End:", endCanonical);
        
        // TODO: Connect to backend

    });
});
