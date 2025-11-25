let selectedReport = null;
let selectedId = null;

function renderInstructions(route) {

    const instructionListDiv = document.querySelector(".reports_list");
    const report_message_enter = document.querySelector(".report_message");
    const report_title = document.querySelector(".report_title");
    const report_message_container = document.querySelector(".report_message_view");

    if (route.length == 0){
        report_message_container.style.display = "none";
        return;
    } else {
        report_message_container.style.display = "block";
    }

    instructionListDiv.innerHTML = "";
    const steps = [];

    route.forEach((reportObj, index) => {

        const stepDiv = document.createElement("div");
        stepDiv.textContent = `Report #${reportObj.report_id}`;
        stepDiv.classList.add("report_item");

        stepDiv.addEventListener("click", () => {
            if (selectedReport && selectedReport !== stepDiv) {
                selectedReport.classList.remove("selected");
            }
            report_message_enter.innerText = reportObj.content;
            report_title.innerText = `Report #${reportObj.report_id}`;
            stepDiv.classList.add("selected");
            selectedReport = stepDiv;
            selectedId = reportObj.report_id;
        });

        instructionListDiv.appendChild(stepDiv);
        steps.push(stepDiv);
    });

    if (steps.length > 0) {
        steps[0].classList.add("selected");
        selectedReport = steps[0];
        selectedId = route[0].report_id;
        report_message_enter.innerText = route[0].content;
        report_title.innerText = `Report #${route[0].report_id}`;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    
    let reportData = [];

    fetch("https://accessibility-map-team3-production.up.railway.app/reports", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to fetch reports");
        }
        return response.json();
    })
    .then(data => {
        reportData = data.reports;
        renderInstructions(reportData);

    });

});

const resolveBtn = document.getElementById("resolve_report_button");

resolveBtn.addEventListener("click", async function () {
    const reportId = selectedId;

    // fetch(`https://accessibility-map-team3-production.up.railway.app/reports/${reportId}/resolve`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json"
    //     }
    // })

    // fetch("https://accessibility-map-team3-production.up.railway.app/reports", {
    //     method: "GET",
    //     headers: {
    //         "Content-Type": "application/json"
    //     }
    // })
    // .then(response => {
    //     if (!response.ok) {
    //         throw new Error("Failed to fetch reports");
    //     }
    //     return response.json();
    // })
    // .then(data => {
    //     reportData = data.reports;
    //     renderInstructions(reportData);
    // });

    const resolveResponse = await fetch(
        `https://accessibility-map-team3-production.up.railway.app/reports/${reportId}/resolve`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    if (!resolveResponse.ok) {
        console.error("Failed to resolve report");
        return;
    }

    // Now fetch the updated list
    const reportsResponse = await fetch(
        "https://accessibility-map-team3-production.up.railway.app/reports",
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    const data = await reportsResponse.json();
    renderInstructions(data.reports);
});
