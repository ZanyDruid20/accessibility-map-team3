// index_script.js

// List of valid building names and alternate names
const buildings = {
    "administration building": ["admin", "admin building", "administration"],
    "biological sciences building": ["bio sci", "biology", "biological sciences"],
    "commons": ["the commons"],
    "engineering building": ["engineering"],
    "fine arts building": ["fa", "fine arts"],
    "information and technology/engineering building": ["it", "ite", "information and technology"],
    "interdisciplinary life sciences building": ["interdisciplinary life sciences", "ilsb"],
    "lecture hall 1": ["lh1"],
    "library & gallery, albin o. kuhn": ["library", "aok"],
    "math and psychology building": ["math and psychology", "math and psych"],
    "meyerhoff chemistry building": ["meyrhoff"],
    "performing arts and humanities": ["performing arts", "humanities"],
    "physics building": ["physics"],
    "public policy building": ["public policy", "pb"],
    "retriever activities center": ["rac"],
    "sherman hall": ["sherman"],
    "sondheim hall": ["sondheim"],
    "the center for well-being": ["rih", "the center for wellbeing"],
    "true grit’s": ["dining hall", "true grits"],
    "university center": ["uc"]
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
