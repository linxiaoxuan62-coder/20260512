let capture;
let bodyPose;
let poses = [];

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480); // 設定擷取解析度以維持辨識效能
  // 隱藏預設的 HTML 影片元件，只在畫布上繪製
  capture.hide();

  // 初始化 ml5.bodyPose (使用最新 v1 API)
  bodyPose = ml5.bodyPose(capture, modelReady);
}

function modelReady() {
  console.log('Model Loaded!');
  // 確保模型載入後才開始偵測
  bodyPose.detectStart(capture, gotPoses);
}

function gotPoses(results) {
  poses = results;
}

function draw() {
  // 設定背景顏色
  background('#e7c6ff');

  // 繪製置中文字 (位於影像上方，不隨影像鏡像)
  textAlign(CENTER, TOP);
  textSize(24);
  fill(0); // 設定文字顏色為黑色
  text("414730795林瑜萱", width / 2, 30);
  text("作品為影像辨識_耳環臉譜", width / 2, 70); // 確保文字內容正確

  // 如果模型還沒載入，顯示提示
  if (!capture || !capture.loadedmetadata || poses.length === 0) {
    fill(100);
    textSize(16);
    text("正在偵測耳朵中，請確保臉部位於畫面中央...", width / 2, height - 30);
  }

  let vWidth = width * 0.5;
  let vHeight = height * 0.5;

  push();
  // 將原點移動到畫布中心
  translate(width / 2, height / 2);
  // 左右顛倒處理 (鏡像)
  scale(-1, 1);
  // 繪製影像，影像中心對準當前原點 (0,0)
  imageMode(CENTER);
  image(capture, 0, 0, vWidth, vHeight);

  // 繪製耳垂裝飾（耳環）
  drawEarrings(vWidth, vHeight);
  
  pop();
}

function drawEarrings(vWidth, vHeight) {
  // 遍歷所有偵測到的人臉/身體
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];

    // 取得左右耳座標 (ml5 v1 版使用底線命名)
    const parts = ['right_ear', 'left_ear']; // 順序調整，但在鏡像下兩者皆會處理
    
    parts.forEach(part => {
      let ear = pose[part];
      
      // 只在信心值足夠時才繪製（將門檻稍微調低至 0.1 確保容易看到效果）
      if (ear && ear.confidence > 0.1) {
        // 獲取攝影機實際寬高，若尚未載入則預設為 640x480
        let cw = capture.width > 0 ? capture.width : 640;
        let ch = capture.height > 0 ? capture.height : 480;

        // 將偵測點映射到畫布中央顯示區域的相對座標 (-vWidth/2 到 vWidth/2)
        let mappedX = map(ear.x, 0, cw, -vWidth / 2, vWidth / 2);
        let mappedY = map(ear.y, 0, ch, -vHeight / 2, vHeight / 2);

        // 定義圓圈參數
        let circleSize = vWidth * 0.02; // 圓圈大小隨畫面比例縮放
        let spacing = circleSize * 1.5; // 圓圈垂直間距
        
        // 稍微調低 Y 軸座標（約耳朵偵測點下方一點點），模擬耳垂位置
        let lobeY = mappedY + (circleSize * 0.5); 

        // 繪製三個黃色圓圈 (耳環效果)
        push();
        noStroke();
        fill(255, 235, 59); // 黃色
        for (let j = 0; j < 3; j++) {
          // 每個圓圈由耳垂點往下排列
          ellipse(mappedX, lobeY + (j * spacing), circleSize, circleSize);
        }
        pop();
      }
    });
  }
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}