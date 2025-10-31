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

// Normalize input for comparison
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

const container = document.getElementById('map-container');
const wrapper = document.getElementById('map-wrapper');

let scale = 1;
let posX = 0, posY = 0;
let isPanning = false;
let startX, startY;
let currentPopUp = '';
let popUpStatus = '';
let flag_array = ['PAHB_FLAG', 'PAHB_d1', 'greenint_10', 'greenint_11', 'ENG_d3', 'ENG_FLAG', 'ENG_d1', 'greenint_17',  'UC_d1', 'UC_FLAG', 'uc_d9', 'blueint_13', 'blueint_6', 'blueint_5', 'mathpsych_d1', 'MATHPSYCH_FLAG', 'PHYSICS_FLAG'];

function showPath(flag_array) {
    let svg = document.getElementById("path-lines");
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", "path-lines");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.pointerEvents = "none";
        document.body.appendChild(svg);
    }

    svg.innerHTML = "";

    for (let i = 0; i < flag_array.length - 1; i++) {
        const startFlag = document.getElementById(flag_array[i]);
        const endFlag = document.getElementById(flag_array[i + 1]);
        if (!startFlag || !endFlag) continue;

        const startX = parseFloat(startFlag.style.left);
        const startY = parseFloat(startFlag.style.top);
        const endX = parseFloat(endFlag.style.left);
        const endY = parseFloat(endFlag.style.top);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", startX + startFlag.offsetWidth / 2);
        line.setAttribute("y1", startY + startFlag.offsetHeight / 2);
        line.setAttribute("x2", endX + endFlag.offsetWidth / 2);
        line.setAttribute("y2", endY + endFlag.offsetHeight / 2);
        line.setAttribute("stroke", "#5294ff");
        line.setAttribute("stroke-width", "4");

        svg.appendChild(line);

        startFlag.style.visibility = "visible";
        endFlag.style.visibility = "visible";
        wrapper.appendChild(svg);
    }
}
/*
function showPath(flag_array){

    for(let i = 0; i < (flag_array.length - 1); i++){

        const createSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        createSVG.style.position = "absolute";
        createSVG.style.width = "100%";
        createSVG.style.height = "100%";
        svg.style.pointerEvents = "none";

        const startFlag = document.getElementById(flag_array[i]);
        const endFlag = document.getElementById(flag_array[i+1]);
        const startName = startFlag.id;
        const endName = endFlag.id;
        const startXCoord = startFlag.style.left;
        const startYCoord = startFlag.style.top;
        const endXCoord = endFlag.style.left;
        const endYCoord = endFlag.style.top;
        console.log("Start Node: " + startName + " (" + startXCoord, startYCoord + ") End Node: " + endName + " (" + endXCoord, endYCoord + ")");
        startFlag.style.visibility = 'visible';
        endFlag.style.visibility = 'visible';

        const createLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        //createLine.setAttribute("x1", startX + startFlag.offsetWidth / 2);
        //createLine.setAttribute("y1", startY + startFlag.offsetHeight / 2);
        //createLine.setAttribute("x2", endX + endFlag.offsetWidth / 2);
        //createLine.setAttribute("y2", endY + endFlag.offsetHeight / 2);

        createLine.setAttribute("x1", startXCoord);
        createLine.setAttribute("y1", startYCoord);
        createLine.setAttribute("x2", endXCoord);
        createLine.setAttribute("y2", endYCoord);
        createSVG.appendChild(createLine);

        container.appendChild(createSVG);

    }

}
*/
// Handle mouse drag (panning)
container.addEventListener('mousedown', e => {
isPanning = true;
startX = e.clientX - posX;
startY = e.clientY - posY;
container.style.cursor = 'grabbing';
});

container.addEventListener('mouseup', () => {
isPanning = false;
container.style.cursor = 'grab';
});

container.addEventListener('mousemove', e => {
if (!isPanning) return;
posX = e.clientX - startX;
posY = e.clientY - startY;
updateTransform();
});
// Handle scroll wheel zoom
container.addEventListener('wheel', e => {
e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? 1 : -1;
    scale += delta * zoomIntensity;
    scale = Math.min(Math.max(0.5, scale), 3);
    updateTransform();
});

function updateTransform() {
    wrapper.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

function showPopUp(bubble) {
    console.log("HI");
    if (currentPopUp == bubble){
        TurnPopUpOff(bubble);
        return;
    }else if(bubble == 'map' && currentPopUp != ''){
        console.log("MAP SELECTED");
        TurnPopUpOff(currentPopUp);
        return;
    }else if(bubble == 'map' && currentPopUp == ''){
        return;
    }else if(currentPopUp == ''){
        const getBubble = document.getElementById(bubble);
        getBubble.style.visibility = 'visible';
        currentPopUp = bubble;
        popUpStatus = "building";
        console.log(currentPopUp);
    }else{
        TurnPopUpOff(currentPopUp);
        const getBubble = document.getElementById(bubble);
        getBubble.style.visibility = 'visible';
        currentPopUp = bubble;
        popUpStatus = "building";
        console.log(currentPopUp);
    }
}

function TurnPopUpOff(bubble) {
    if (popUpStatus == 'building'){
        const getBubble = document.getElementById(bubble);
        getBubble.style.visibility = 'hidden';
        currentPopUp = '';
        popUpStatus = '';
    }else{
        const deleteDiv = document.getElementById('node_info');
        deleteDiv.remove();
        currentPopUp = '';
        popUpStatus = '';
    }
}

/*This code is for allowing you to see the x, y coordinate of where your cursor clicked*/
/*NOTE THOUGH, the coordinates are only accurate from the original map size, like without any zoom. So just refresh the page and DON'T ZOOM IN OR OUT and then the coords will be accurate*/
const mapImage = document.getElementById('map');

mapImage.addEventListener('click', (event) => {
    const rect = mapImage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    console.log(`X: ${x}, Y: ${y}`);
});

function createNodeBubble(x, y, name) {
    //God the structure of this function is ugly
    //This handles the info bubble for the nodes so that I don't have to create a div bubble for each node (no way omg)
    if (currentPopUp == '' && popUpStatus == '' && name != 'map'){
        let newDiv = document.createElement('div');
        newDiv.id = 'node_info'
        newDiv.innerText = name;
        newDiv.classList.add("node_info");
        let newX = (x - 45) + "px";
        let newY = (y - 30) + "px";
        console.log(newX, newY);
        newDiv.style.top = newY;
        newDiv.style.left = newX;
        wrapper.appendChild(newDiv);
        currentPopUp = name;
        popUpStatus = "node";
    }else if(name == 'map' && currentPopUp != ''){
        TurnPopUpOff(currentPopUp);
        return;
    }else if(name == 'map' && currentPopUp == ''){
        return;
    }else if(currentPopUp == name){
        TurnPopUpOff(name);
        return;
    }else{
        TurnPopUpOff(currentPopUp);
        let newDiv = document.createElement('div');
        newDiv.id = 'node_info'
        newDiv.innerText = name;
        newDiv.classList.add("node_info");
        let newX = (x - 40) + "px";
        let newY = (y - 30) + "px";
        console.log(newX, newY);
        newDiv.style.top = newY;
        newDiv.style.left = newX;
        wrapper.appendChild(newDiv);
        currentPopUp = name;
        popUpStatus = "node";
    }
}

/**Real Time Navigation Code*/

async function requestLocationOnce() {
  if (!('permissions' in navigator) || !('geolocation' in navigator)) {
    console.error('Geolocation not supported');
    return;
  }

  const status = await navigator.permissions.query({ name: 'geolocation' });

  if (status.state === 'granted') {
    console.log('Permission already granted!');
    startRepeatingLocation(); // call your existing getLocation() here
  } else if (status.state === 'prompt') {
    console.log('Asking for permission...');
    //getLocation(); // this will trigger the prompt once
    startRepeatingLocation();
  } else {
    console.warn('Permission denied.');
  }

  // Listen for permission changes
  status.onchange = () => console.log('Permission state changed:', status.state);
}

//METHOD 1 (Updates only when detected movement)


var watchId = null;

function startWatchingLocation() {
  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log('Location:', latitude, longitude, 'accuracy (m):', accuracy);
      },
      (err) => {
        console.error('Geolocation error', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    console.error('Geolocation not supported');
  }
}

function stopWatchingLocation() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    console.log('Stopped watching location');
    watchId = null;
  }
}

//METHOD 2 (Updates on regular intervals)

/*
let intervalId = null;

function startRepeatingLocation() {
  intervalId = setInterval(getLocation, 3000); // every 5 seconds
}

function stopRepeatingLocation() {
  clearInterval(intervalId);
  console.log('Stopped repeating location');
}

function getLocation(){
    if ('geolocation' in navigator){ //&& status.status === 'granted') {
        console.log("HI");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            console.log('Location:', latitude, longitude, 'accuracy (m):', accuracy);
            // Send to backend:
            //fetch('/api/location', {
            //  method: 'POST',
            //  headers: { 'Content-Type': 'application/json' },
            //  body: JSON.stringify({ latitude, longitude, accuracy, timestamp: pos.timestamp })
            //});
            }//,
        // (err) => {
        //   console.error('Geolocation error', err);
        //// handle different error.code values (1=permission denied, 2=position unavailable, 3=timeout)
        // },
        //  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        console.error('Geolocation not supported');
    }
}
*/

/*
const watchId = navigator.geolocation.watchPosition(
  (pos) => {
    // called on each update
    console.log(pos.coords);
  },
  (err) => console.error(err),
  { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
);

navigator.geolocation.clearWatch(watchId);
*/

//EXAMPLE OF FETCHING A BACKEND REQUEST

/*
function addToCart(box_id, series_cover, series_price){

    const series_box = {
        name: box_id,
        cover: series_cover,
        price: series_price
    };

    fetch("http://localhost:8000/AddToShoppingCart", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(series_box)
    })

    .then(response => response.json())
    .then(data => {
        console.log("Server Response:", data);

    })
}

*/