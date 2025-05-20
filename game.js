// 게임 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI 요소
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesContainer = document.getElementById('lives');
const levelSelect = document.getElementById('levelSelect');
const easyButton = document.getElementById('easyButton');
const normalButton = document.getElementById('normalButton');
const hardButton = document.getElementById('hardButton');
const levelUpMessage = document.getElementById('levelUpMessage');
const failMessage = document.getElementById('failMessage');
const versionSelect = document.getElementById('versionSelect');
const pcButton = document.getElementById('pcButton');
const mobileButton = document.getElementById('mobileButton');
const shareButton = document.getElementById('shareButton');

// 게임 상태
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    level: 'Easy',
    lives: 3,
    isLevelingUp: false,
    isFailing: false,
    isMobileVersion: false
};

// 게임 객체
const game = {
    paddle: {
        width: 100,
        height: 20,
        x: 0,
        y: 0,
        speed: 8,
        dx: 0
    },
    ball: {
        x: 0,
        y: 0,
        radius: 8,
        speed: 4,
        dx: 4,
        dy: -4
    },
    bricks: {
        rows: 7,
        columns: 9,
        width: 75,
        height: 20,
        padding: 10,
        offsetTop: 60,
        offsetLeft: 35,
        array: []
    },
    animationId: null
};

// 사운드 효과
const sounds = {
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'),
    paddle: new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'),
    levelUp: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    gameOver: new Audio('https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3')
};

// 무지개 색상
const rainbowColors = [
    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
    '#0000FF', '#4B0082', '#9400D3'
];

// 게임 초기화
function initGame() {
    console.log('게임 초기화 시작');
    
    // 이전 게임 루프가 있다면 중지
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
        game.animationId = null;
    }
    
    // 게임 상태 초기화
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.isLevelingUp = false;
    gameState.isFailing = false;
    
    // UI 업데이트
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
    updateLivesDisplay();
    
    // 게임 요소 초기화
    initBricks();
    setLevelSettings();
    resetGameElements();
    
    // 게임 루프 시작
    console.log('게임 루프 시작 시도');
    gameLoop();
}

// 게임 루프
function gameLoop() {
    if (!gameState.isRunning || gameState.isPaused || gameState.isLevelingUp || gameState.isFailing) {
        console.log('게임 루프 중지 조건 충족:', { 
            isRunning: gameState.isRunning, 
            isPaused: gameState.isPaused, 
            isLevelingUp: gameState.isLevelingUp, 
            isFailing: gameState.isFailing 
        });
        return;
    }

    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 게임 요소 그리기
    drawBricks();
    drawBall();
    drawPaddle();
    
    // 게임 로직
    movePaddle();
    moveBall();
    checkCollisions();
    checkGameOver();
    
    // 다음 프레임
    game.animationId = requestAnimationFrame(gameLoop);
}

// 패들 이동
function movePaddle() {
    if (game.paddle.x + game.paddle.dx > 0 && 
        game.paddle.x + game.paddle.dx + game.paddle.width < canvas.width) {
        game.paddle.x += game.paddle.dx;
    }
}

// 공 이동
function moveBall() {
    game.ball.x += game.ball.dx;
    game.ball.y += game.ball.dy;
}

// 충돌 감지
function checkCollisions() {
    // 벽 충돌
    if (game.ball.x + game.ball.dx > canvas.width - game.ball.radius || 
        game.ball.x + game.ball.dx < game.ball.radius) {
        game.ball.dx = -game.ball.dx;
    }
    if (game.ball.y + game.ball.dy < game.ball.radius) {
        game.ball.dy = -game.ball.dy;
    }
    
    // 패들 충돌
    if (game.ball.y + game.ball.dy > game.paddle.y - game.ball.radius &&
        game.ball.x > game.paddle.x && 
        game.ball.x < game.paddle.x + game.paddle.width) {
        game.ball.dy = -game.ball.dy;
        playSound(sounds.paddle);
    }
    
    // 벽돌 충돌
    for (let c = 0; c < game.bricks.columns; c++) {
        for (let r = 0; r < game.bricks.rows; r++) {
            const brick = game.bricks.array[c][r];
            if (brick.status === 1) {
                if (game.ball.x > brick.x && 
                    game.ball.x < brick.x + game.bricks.width && 
                    game.ball.y > brick.y && 
                    game.ball.y < brick.y + game.bricks.height) {
                    game.ball.dy = -game.ball.dy;
                    brick.status = 0;
                    gameState.score += 10;
                    scoreElement.textContent = gameState.score;
                    playSound(sounds.hit);
                    checkLevelUp();
                }
            }
        }
    }
}

// 레벨업 체크
function checkLevelUp() {
    if (gameState.score >= 200 && gameState.level === 'Easy') {
        gameState.level = 'Normal';
        levelElement.textContent = gameState.level;
        setLevelSettings();
        initBricks();
        showLevelUpMessage();
    } else if (gameState.score >= 400 && gameState.level === 'Normal') {
        gameState.level = 'Hard';
        levelElement.textContent = gameState.level;
        setLevelSettings();
        initBricks();
        showLevelUpMessage();
    }
}

// 게임 오버 체크
function checkGameOver() {
    if (game.ball.y + game.ball.dy > canvas.height - game.ball.radius) {
        gameState.lives--;
        updateLivesDisplay();
        
        if (gameState.lives === 0) {
            gameOver();
        } else {
            showFailMessage();
            resetBall();
        }
    }
}

// 게임 오버
function gameOver() {
    gameState.isRunning = false;
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
    }
    playSound(sounds.gameOver);
    alert('게임 오버!');
    startButton.style.display = 'block';
    resetGame();
}

// 게임 리셋
function resetGame() {
    gameState.score = 0;
    gameState.level = 'Easy';
    gameState.lives = 3;
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
    updateLivesDisplay();
    resetBall();
    initBricks();
}

// 벽돌 초기화
function initBricks() {
    console.log('벽돌 초기화 시작');
    calculateBrickLayout();
    game.bricks.array = [];
    
    for (let c = 0; c < game.bricks.columns; c++) {
        game.bricks.array[c] = [];
        for (let r = 0; r < game.bricks.rows; r++) {
            const brickX = c * (game.bricks.width + game.bricks.padding) + game.bricks.offsetLeft;
            const brickY = r * (game.bricks.height + game.bricks.padding) + game.bricks.offsetTop;
            
            game.bricks.array[c][r] = {
                x: brickX,
                y: brickY,
                status: 1,
                color: rainbowColors[r]
            };
        }
    }
    console.log('벽돌 초기화 완료:', game.bricks.array);
}

// 벽돌 레이아웃 계산
function calculateBrickLayout() {
    console.log('벽돌 레이아웃 계산 시작');
    const availableWidth = canvas.width - 40; // 좌우 여백 20px씩
    const availableHeight = canvas.height * 0.3; // 화면 높이의 30%
    
    // 벽돌 크기 계산
    game.bricks.width = Math.floor((availableWidth - (game.bricks.columns - 1) * game.bricks.padding) / game.bricks.columns);
    game.bricks.height = Math.floor((availableHeight - (game.bricks.rows - 1) * game.bricks.padding) / game.bricks.rows);
    
    // 최소 크기 설정
    game.bricks.width = Math.max(game.bricks.width, 30);
    game.bricks.height = Math.max(game.bricks.height, 10);
    
    // 패딩 조정
    game.bricks.padding = Math.floor(game.bricks.width * 0.1);
    
    // 오프셋 계산
    const totalBricksWidth = (game.bricks.width * game.bricks.columns) + (game.bricks.padding * (game.bricks.columns - 1));
    game.bricks.offsetLeft = Math.floor((canvas.width - totalBricksWidth) / 2);
    game.bricks.offsetTop = Math.floor(canvas.height * 0.1);
    
    console.log('벽돌 레이아웃 계산 완료:', {
        width: game.bricks.width,
        height: game.bricks.height,
        padding: game.bricks.padding,
        offsetLeft: game.bricks.offsetLeft,
        offsetTop: game.bricks.offsetTop
    });
}

// 레벨 설정
function setLevelSettings() {
    switch(gameState.level) {
        case 'Easy':
            game.ball.speed = 4;
            game.paddle.width = canvas.width * 0.2;
            break;
        case 'Normal':
            game.ball.speed = 6;
            game.paddle.width = canvas.width * 0.15;
            break;
        case 'Hard':
            game.ball.speed = 8;
            game.paddle.width = canvas.width * 0.1;
            break;
    }
    game.ball.dx = game.ball.speed;
    game.ball.dy = -game.ball.speed;
}

// 게임 요소 위치 재조정
function resetGameElements() {
    console.log('게임 요소 위치 재조정');
    game.paddle.width = canvas.width * 0.2;
    game.paddle.height = 20;
    game.paddle.y = canvas.height - 40; // 패들 위치를 약간 위로 조정
    game.paddle.x = (canvas.width - game.paddle.width) / 2;
    game.paddle.dx = 0;
    
    resetBall();
}

// 공 위치 초기화
function resetBall() {
    console.log('공 위치 초기화');
    game.ball.x = canvas.width / 2;
    game.ball.y = game.paddle.y - 30;
    game.ball.dx = game.ball.speed;
    game.ball.dy = -game.ball.speed;
}

// 생명 표시 업데이트
function updateLivesDisplay() {
    livesContainer.innerHTML = '';
    for (let i = 0; i < gameState.lives; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.innerHTML = '❤️';
        livesContainer.appendChild(heart);
    }
}

// 레벨업 메시지 표시
function showLevelUpMessage() {
    gameState.isLevelingUp = true;
    levelUpMessage.textContent = `Level Up! ${gameState.level}`;
    levelUpMessage.style.display = 'block';
    playSound(sounds.levelUp);
    
    setTimeout(() => {
        levelUpMessage.style.display = 'none';
        gameState.isLevelingUp = false;
        game.animationId = requestAnimationFrame(gameLoop);
    }, 1000);
}

// 실패 메시지 표시
function showFailMessage() {
    gameState.isFailing = true;
    failMessage.style.display = 'block';
    
    setTimeout(() => {
        failMessage.style.display = 'none';
        gameState.isFailing = false;
        game.animationId = requestAnimationFrame(gameLoop);
    }, 1000);
}

// 효과음 재생
function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.log('Sound play failed:', e));
}

// 그리기 함수들
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    console.log('벽돌 그리기 시작');
    for (let c = 0; c < game.bricks.columns; c++) {
        for (let r = 0; r < game.bricks.rows; r++) {
            const brick = game.bricks.array[c][r];
            if (brick.status === 1) {
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, game.bricks.width, game.bricks.height);
                ctx.fillStyle = brick.color;
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
    console.log('벽돌 그리기 완료');
}

// 이벤트 핸들러
function handleKeyDown(e) {
    if (e.key === 'ArrowRight') {
        game.paddle.dx = game.paddle.speed;
    } else if (e.key === 'ArrowLeft') {
        game.paddle.dx = -game.paddle.speed;
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        game.paddle.dx = 0;
    }
}

// 이벤트 리스너 초기화
function initEventListeners() {
    // 키보드 이벤트
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 버튼 이벤트
    startButton.addEventListener('click', () => {
        initSounds();
        showVersionSelect();
    });
    
    pcButton.addEventListener('click', () => selectVersion(false));
    mobileButton.addEventListener('click', () => selectVersion(true));
    
    shareButton.addEventListener('click', shareGame);
    
    // 모바일 터치 이벤트
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
        if (gameState.isRunning) {
            resizeCanvas();
        }
    });
}

// 터치 이벤트 핸들러
function handleTouchStart(e) {
    if (!gameState.isMobileVersion || !gameState.isRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const scaleX = canvas.width / rect.width;
    const scaledTouchX = touchX * scaleX;
    game.paddle.x = scaledTouchX - (game.paddle.width / 2);
    
    // 패들이 화면 밖으로 나가지 않도록 제한
    if (game.paddle.x < 0) {
        game.paddle.x = 0;
    } else if (game.paddle.x + game.paddle.width > canvas.width) {
        game.paddle.x = canvas.width - game.paddle.width;
    }
}

function handleTouchMove(e) {
    if (!gameState.isMobileVersion || !gameState.isRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const scaleX = canvas.width / rect.width;
    const scaledTouchX = touchX * scaleX;
    game.paddle.x = scaledTouchX - (game.paddle.width / 2);
    
    // 패들이 화면 밖으로 나가지 않도록 제한
    if (game.paddle.x < 0) {
        game.paddle.x = 0;
    } else if (game.paddle.x + game.paddle.width > canvas.width) {
        game.paddle.x = canvas.width - game.paddle.width;
    }
}

function handleTouchEnd(e) {
    if (!gameState.isMobileVersion || !gameState.isRunning) return;
    e.preventDefault();
}

// 버전 선택
function selectVersion(isMobile) {
    console.log('버전 선택:', isMobile ? '모바일' : 'PC');
    gameState.isMobileVersion = isMobile;
    versionSelect.style.display = 'none';
    
    // 모바일 버전일 경우 터치 이벤트 활성화
    if (isMobile) {
        canvas.style.touchAction = 'none'; // 기본 터치 동작 방지
    }
    
    resizeCanvas();
    gameState.level = 'Easy';
    levelElement.textContent = gameState.level;
    initGame();
}

// 캔버스 크기 조정
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 20;
    const maxHeight = window.innerHeight * 0.7; // 화면 높이의 70%로 제한
    
    if (gameState.isMobileVersion) {
        canvas.width = containerWidth;
        let calculatedHeight = containerWidth * (16/9);
        
        // 높이가 최대 높이를 초과하면 조정
        if (calculatedHeight > maxHeight) {
            calculatedHeight = maxHeight;
            canvas.width = calculatedHeight * (9/16);
        }
        
        canvas.height = calculatedHeight;
        
        // 컨테이너 중앙 정렬
        const containerHeight = calculatedHeight + 60; // 헤더 높이(50px) + 여백(10px) 고려
        container.style.height = `${containerHeight}px`;
        container.style.maxHeight = `${maxHeight + 60}px`;
    } else {
        canvas.width = containerWidth;
        let calculatedHeight = containerWidth * (9/16);
        
        // 높이가 최대 높이를 초과하면 조정
        if (calculatedHeight > maxHeight) {
            calculatedHeight = maxHeight;
            canvas.width = calculatedHeight * (16/9);
        }
        
        canvas.height = calculatedHeight;
    }
    
    // 게임 요소 위치 재조정
    resetGameElements();
}

// 게임 공유
function shareGame() {
    if (navigator.share) {
        navigator.share({
            title: 'Arkanoid Game',
            text: '내가 만든 아케이드 게임을 플레이해보세요!',
            url: window.location.href
        }).catch(error => console.log('공유 실패:', error));
    } else {
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        alert('게임 URL이 클립보드에 복사되었습니다!');
    }
}

// 사운드 초기화
function initSounds() {
    Object.values(sounds).forEach(sound => {
        sound.volume = 0.2;
        sound.load();
    });
}

// 레벨 선택 화면 표시
function showLevelSelect() {
    levelSelect.style.display = 'block';
}

// 버전 선택 화면 표시
function showVersionSelect() {
    startButton.style.display = 'none';
    versionSelect.style.display = 'block';
}

// 이벤트 리스너 초기화 실행
initEventListeners(); 