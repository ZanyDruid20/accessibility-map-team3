document.addEventListener("DOMContentLoaded", function() {
    // Get the container where instructions will appear
    const instructionListDiv = document.querySelector(".instruction_list");

    // Mock route data
    const mockRoute = ["testint1" , "testint2", "testdoor1", "testelvtr1", "testdoor2", "testint3", "testdoor3"];

    // Render instructions
function renderInstructions(route) {

    // Clear any previous instructions
    instructionListDiv.innerHTML = "";

    // Loop through each node in the route and create a step
    route.forEach((node, index) => {
        const stepDiv = document.createElement("div");
            stepDiv.textContent = `Step ${index + 1}: Go to ${node}`;
            stepDiv.classList.add("step_item"); // For easier CSS styling later
            instructionListDiv.appendChild(stepDiv);
        });
    }
   
// Render the mock route
renderInstructions(mockRoute);

// TODO: Replace mockRoute with actual route returned by backend


});