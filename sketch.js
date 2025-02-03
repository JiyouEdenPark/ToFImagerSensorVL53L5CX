// Web Serial object
// 웹 시리얼 객체
const serial = new p5.WebSerial();
// 8x8 data array
// 8×8 데이터 배열
let sensorData = new Array(64).fill(0);
let gridSize = 8;
let cellSize = 50;
// Maximum distance (mm)
// 최대 거리(mm)
let maxDistance = 4000;

// Array to accumulate serial data
// 시리얼 데이터를 누적 저장할 배열
let receivedData = [];

function setup() {
    createCanvas(gridSize * cellSize, gridSize * cellSize);

    if (!navigator.serial) {
        alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
    }

    navigator.serial.addEventListener("connect", portConnect);
    navigator.serial.addEventListener("disconnect", portDisconnect);
    serial.getPorts();
    serial.on("noport", makePortButton);
    serial.on("portavailable", openPort);
    serial.on("requesterror", portError);
    serial.on("data", serialEvent);
    serial.on("close", makePortButton);
    makePortButton();
}

function draw() {
    background(0);

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            let index = x + y * gridSize;
            let distance = sensorData[index];

            // 거리 값을 0~255의 밝기 값으로 변환 (가까울수록 밝음)
            let brightness = map(distance, 0, maxDistance, 255, 0);
            fill(brightness);
            stroke(50);
            rect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
}

// Create port selection button
// 포트 선택 버튼 생성
function makePortButton() {
    let portButton = createButton("Choose Port");
    portButton.position(10, 10);
    portButton.mousePressed(choosePort);
}

// Open port selection window
// 포트 선택 창 열기
function choosePort() {
    serial.requestPort();
}

// 포트 열기
async function openPort() {
    try {
        await serial.open({ baudRate: 115200 });
        console.log("✅ Port opened");
        serial.on("data", serialEvent);
    } catch (err) {
        console.error("❌ Port open error:", err);
    }
}

// Port connection
// 포트 연결
function portConnect() {
    console.log("🔗 Port connected");
    serial.getPorts();
}

// Port disconnection
// 포트 연결 해제
function portDisconnect() {
    console.log("❌ Port disconnected. Reconnecting...");
    setTimeout(() => serial.getPorts(), 2000);
}

// Port error handling
// 포트 오류 처리
function portError(err) {
    alert("Serial port error: " + err);
}

// Receive serial data (store until all 64 data points are collected)
// 📡 **시리얼 데이터 수신 (64개 데이터가 다 모일 때까지 저장)**
function serialEvent() {
    let rawData = serial.readLine();
    if (!rawData) return;  // 데이터가 없으면 return

    rawData = rawData.trim();
    console.log("📥 Received:", rawData);

    let values = rawData.split("\t");

    if (values.length === 8) {
        receivedData = receivedData.concat(values.map(v => int(v)));
    }

    if (receivedData.length === 64) {
        sensorData = [...receivedData];
        receivedData = [];
        console.log("✅ Sensor data updated!");
    }
}