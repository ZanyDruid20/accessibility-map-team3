// index_steps.js

document.addEventListener("DOMContentLoaded", function() {
    const instructionListDiv = document.querySelector(".instruction_list");

    // Function to render instructions
// Function to render instructions
function renderInstructions(route, finalFloor) {
    instructionListDiv.innerHTML = "";

    route.forEach((node, index) => {
        let readableText = "";

        const [rawNode, floor] = node.split("-");
        const lowerNode = rawNode.toLowerCase();

        const isIntersection = !lowerNode.includes("_d") && !lowerNode.includes("_e");

        // Intersection instruction
        if (isIntersection) {
            const prevNode = route[index - 1];
            
            if (prevNode) {
                const [prevRaw] = prevNode.split("-");
                const prevLower = prevRaw.toLowerCase();
                const prevIsIntersection = !prevLower.includes("_d") && !prevLower.includes("_e");

                // Skip if previous was also an intersection
                if (prevIsIntersection) {
                    return; 
                }
            }

            readableText = `Step ${index + 1}: Continue along the route`;
        }

        // Door Instruction
        else if (lowerNode.includes("_d")) {
            const buildingName = rawNode.split("_")[0];
            const doorMatch = rawNode.match(/_d(\d+)/);
            const doorNumber = doorMatch ? doorMatch[1] : "?";
            readableText = `Step ${index + 1}: Go to ${buildingName} door ${doorNumber}`;
        }

        // Elevator Instruction
        else if (lowerNode.includes("_e")) {
            const nextNode = route[index + 1];
            const nextFloor = nextNode ? nextNode.split("-")[1] : "?";
            if (nextFloor != "?") {
                readableText = `Step ${index + 1}: Take elevator to floor ${nextFloor}`;
            } else {
                readableText = `Step ${index + 1}: Take elevator to floor ${finalFloor}`;
            }
        }


        const stepDiv = document.createElement("div");
        stepDiv.textContent = readableText;
        stepDiv.classList.add("step_item");
        instructionListDiv.appendChild(stepDiv);
    });
}




    // Function to fetch route and render instructions
    window.loadRouteInstructions = function() {
        const start = window.startCanonical;
        const end = window.endCanonical;

        const startFloor = window.startFloor;
        const endFloor = window.endFloor;


        if (!start || !end) {
            instructionListDiv.innerHTML = "No start or end building provided.";
            return;
        }

        const url = `https://accessibility-map-team3-production.up.railway.app/shortest-path?start_building=${encodeURIComponent(start)}&start_floor=${encodeURIComponent(startFloor)}&end_building=${encodeURIComponent(end)}&end_floor=${encodeURIComponent(endFloor)}`;

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log("Fetched route:", data);
                if (data.path && data.path.length > 0) {
                    renderInstructions(data.path, endFloor);
                } else {
                    instructionListDiv.innerHTML = "No route found.";
                }
            })
            .catch(error => {
                console.error("Error fetching route:", error);
                instructionListDiv.innerHTML = "Error fetching route.";
            });
    }
});
